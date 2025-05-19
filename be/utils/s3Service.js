// utils/s3Service.js
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    CopyObjectCommand
  } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const { Readable } = require('stream');
  
  // Khởi tạo S3 client
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  
  /**
   * Service riêng xử lý các thao tác với AWS S3
   */
  const s3Service = {
    /**
     * Upload file lên S3
     * @param {Buffer|Stream} fileData - Dữ liệu file
     * @param {String} key - Đường dẫn và tên file trên S3
     * @param {String} contentType - MIME type của file
     * @returns {Promise<Object>} - Thông tin file đã upload
     */
    async uploadFile(fileData, key, contentType) {
      try {
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET,
          Key: key,
          Body: fileData,
          ContentType: contentType || 'application/octet-stream'
        };
        
        const result = await s3.send(new PutObjectCommand(uploadParams));
        
        return {
          key,
          url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
          etag: result.ETag,
          contentType
        };
      } catch (error) {
        throw new Error(`Lỗi khi upload file lên S3: ${error.message}`);
      }
    },
    
    /**
     * Download file từ S3
     * @param {String} key - Đường dẫn file trên S3
     * @returns {Promise<Buffer>} - Dữ liệu file
     */
    async downloadFile(key) {
      try {
        const getParams = {
          Bucket: process.env.AWS_BUCKET,
          Key: key
        };
        
        const { Body, ContentType } = await s3.send(new GetObjectCommand(getParams));
        
        // Chuyển đổi stream thành buffer
        const chunks = [];
        
        if (Body instanceof Readable) {
          for await (const chunk of Body) {
            chunks.push(chunk);
          }
        }
        
        return {
          data: Buffer.concat(chunks),
          contentType: ContentType
        };
      } catch (error) {
        throw new Error(`Lỗi khi download file từ S3: ${error.message}`);
      }
    },
    
    /**
     * Xóa file trên S3
     * @param {String} key - Đường dẫn file cần xóa
     * @returns {Promise<Boolean>} - Kết quả xóa
     */
    async deleteFile(key) {
      try {
        if (!key) return false;
        
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET,
          Key: key
        };
        
        await s3.send(new DeleteObjectCommand(deleteParams));
        return true;
      } catch (error) {
        console.error(`Lỗi khi xóa file ${key} từ S3:`, error);
        return false;
      }
    },
    
    /**
     * Liệt kê files trong một thư mục trên S3
     * @param {String} prefix - Tiền tố đường dẫn (thư mục)
     * @param {Number} maxKeys - Số lượng kết quả tối đa
     * @returns {Promise<Array>} - Danh sách files
     */
    async listFiles(prefix = '', maxKeys = 1000) {
      try {
        const listParams = {
          Bucket: process.env.AWS_BUCKET,
          Prefix: prefix,
          MaxKeys: maxKeys
        };
        
        const result = await s3.send(new ListObjectsV2Command(listParams));
        
        if (!result.Contents) {
          return [];
        }
        
        return result.Contents.map(item => ({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`
        }));
      } catch (error) {
        throw new Error(`Lỗi khi liệt kê files từ S3: ${error.message}`);
      }
    },
    
    /**
     * Di chuyển/đổi tên file trên S3
     * @param {String} sourceKey - Đường dẫn file nguồn
     * @param {String} destinationKey - Đường dẫn file đích
     * @returns {Promise<Object>} - Thông tin file sau khi di chuyển
     */
    async moveFile(sourceKey, destinationKey) {
      try {
        // Copy file đến vị trí mới
        const copyParams = {
          Bucket: process.env.AWS_BUCKET,
          CopySource: `${process.env.AWS_BUCKET}/${sourceKey}`,
          Key: destinationKey
        };
        
        await s3.send(new CopyObjectCommand(copyParams));
        
        // Xóa file nguồn
        await this.deleteFile(sourceKey);
        
        return {
          key: destinationKey,
          url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${destinationKey}`
        };
      } catch (error) {
        throw new Error(`Lỗi khi di chuyển file trên S3: ${error.message}`);
      }
    },
    
    /**
     * Tạo URL ký tên tạm thời
     * @param {String} key - Đường dẫn file
     * @param {Number} expiresIn - Thời gian hết hạn (giây)
     * @returns {Promise<String>} - URL ký tên tạm thời
     */
    async getSignedUrl(key, expiresIn = 3600) {
      try {
        const getParams = {
          Bucket: process.env.AWS_BUCKET,
          Key: key
        };
        
        const command = new GetObjectCommand(getParams);
        const signedUrl = await getSignedUrl(s3, command, { expiresIn });
        
        return signedUrl;
      } catch (error) {
        throw new Error(`Lỗi khi tạo URL ký tên: ${error.message}`);
      }
    },
    
    /**
     * Kiểm tra xem file có tồn tại trên S3 không
     * @param {String} key - Đường dẫn file
     * @returns {Promise<Boolean>} - File có tồn tại không
     */
    async fileExists(key) {
      try {
        const getParams = {
          Bucket: process.env.AWS_BUCKET,
          Key: key
        };
        
        await s3.send(new GetObjectCommand(getParams));
        return true;
      } catch (error) {
        if (error.name === 'NoSuchKey') {
          return false;
        }
        throw error;
      }
    }
  };
  
  module.exports = s3Service;