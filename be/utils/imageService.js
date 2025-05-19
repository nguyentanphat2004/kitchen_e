// utils/imageService.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { deleteFile, getFileUrl } = require('../middlewares/upload.middleware');
const { Readable } = require('stream');

// Kiểm tra loại lưu trữ từ biến môi trường
const storageType = process.env.STORAGE_TYPE || 'local';

// Khởi tạo S3 client nếu dùng S3
let s3;
if (storageType === 's3') {
  s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}

/**
 * Service xử lý hình ảnh upload - hỗ trợ S3 và local
 */
const imageService = {
  /**
   * Xử lý và tối ưu hóa hình ảnh
   * @param {Object} file - Multer file
   * @param {String} destination - Thư mục đích
   * @param {Object} options - Tùy chọn xử lý ảnh
   * @returns {Promise<Object>} - Thông tin file đã xử lý
   */
  async processImage(file, destination = 'uploads', options = {}) {
    try {
      // Tạo tên file ngẫu nhiên
      const filename = `${Date.now()}-${uuidv4()}.webp`;
      
      // Cấu hình xử lý ảnh
      const {
        width,
        height,
        quality = 80,
        fit = 'cover',
        background = { r: 255, g: 255, b: 255, alpha: 1 }
      } = options;
      
      // Xử lý và tối ưu hóa ảnh
      const processedImageBuffer = await sharp(file.path || file.buffer)
        .resize({
          width,
          height,
          fit,
          background
        })
        .webp({ quality })
        .toBuffer();
      
      // Đường dẫn để lưu file
      const storagePath = `${destination}/${filename}`.replace(/\/\//g, '/');
      
      let fileInfo;
      
      if (storageType === 's3') {
        // Upload lên S3
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET,
          Key: storagePath,
          Body: processedImageBuffer,
          ContentType: 'image/webp'
        };
        
        await s3.send(new PutObjectCommand(uploadParams));
        
        fileInfo = {
          url: getFileUrl(storagePath),
          path: storagePath,
          originalname: file.originalname,
          filename,
          mimetype: 'image/webp',
          size: processedImageBuffer.length,
          width: width || null,
          height: height || null
        };
      } else {
        // Lưu vào local storage
        const uploadDir = path.join(__dirname, '..', destination);
        fs.mkdirSync(uploadDir, { recursive: true });
        
        const outputPath = path.join(uploadDir, filename);
        fs.writeFileSync(outputPath, processedImageBuffer);
        
        fileInfo = {
          url: getFileUrl(`${destination}/${filename}`),
          path: `${destination}/${filename}`,
          originalname: file.originalname,
          filename,
          mimetype: 'image/webp',
          size: fs.statSync(outputPath).size,
          width: width || null,
          height: height || null
        };
      }
      
      // Xóa file tạm nếu có
      if (file.path) {
        await deleteFile(file.path);
      }
      
      return fileInfo;
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      if (file.path) {
        await deleteFile(file.path);
      }
      throw error;
    }
  },
  
  /**
   * Xử lý nhiều hình ảnh cùng lúc
   * @param {Array} files - Danh sách Multer files
   * @param {String} destination - Thư mục đích
   * @param {Object} options - Tùy chọn xử lý ảnh
   * @returns {Promise<Array>} - Thông tin các file đã xử lý
   */
  async processMultipleImages(files, destination = 'uploads', options = {}) {
    const results = [];
    
    for (const file of files) {
      const result = await this.processImage(file, destination, options);
      results.push(result);
    }
    
    return results;
  },
  
  /**
   * Upload hình ảnh (đơn giản không qua xử lý)
   * @param {Object} file - Multer file
   * @param {String} folder - Thư mục lưu trữ
   * @returns {Promise<Object>} - Thông tin file
   */
  async uploadImage(file, folder = 'products') {
    try {
      const destination = `uploads/${folder}`;
      
      if (storageType === 's3') {
        // Nếu sử dụng multer-s3, file.location đã có URL đầy đủ
        if (file.location) {
          return {
            url: file.location,
            path: file.key,
            originalname: file.originalname,
            filename: path.basename(file.key),
            mimetype: file.mimetype,
            size: file.size
          };
        } else {
          // Nếu không, tạo URL từ key
          return {
            url: getFileUrl(file.key || `${destination}/${file.filename}`),
            path: file.key || `${destination}/${file.filename}`,
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size
          };
        }
      } else {
        // Local storage
        const dbPath = `${destination}/${file.filename}`.replace(/\/\//g, '/');
        
        return {
          url: getFileUrl(dbPath),
          path: dbPath,
          originalname: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size
        };
      }
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Xóa hình ảnh
   * @param {String} imageUrl - Đường dẫn hình ảnh cần xóa
   * @returns {Promise<void>}
   */
  async deleteImage(imageUrl) {
    await deleteFile(imageUrl);
  },
  
  /**
   * Tạo thumbnail từ hình ảnh
   * @param {String} imagePath - Đường dẫn hình ảnh gốc
   * @param {Object} options - Tùy chọn kích thước thumbnail
   * @returns {Promise<Object>} - Thông tin thumbnail
   */
  async createThumbnail(imagePath, options = { width: 200, height: 200 }) {
    try {
      const ext = path.extname(imagePath);
      const baseName = path.basename(imagePath, ext);
      const dirName = path.dirname(imagePath);
      const thumbnailName = `${baseName}-thumb.webp`;
      const thumbnailPath = `${dirName}/${thumbnailName}`.replace(/\/\//g, '/');
      
      let imageBuffer;
      
      if (storageType === 's3') {
        // Lấy hình ảnh từ S3
        const getParams = {
          Bucket: process.env.AWS_BUCKET,
          Key: imagePath
        };
        
        const { Body } = await s3.send(new GetObjectCommand(getParams));
        const chunks = [];
        
        if (Body instanceof Readable) {
          for await (const chunk of Body) {
            chunks.push(chunk);
          }
        }
        
        imageBuffer = Buffer.concat(chunks);
      } else {
        // Lấy hình ảnh từ local
        const fullPath = path.join(__dirname, '..', imagePath);
        imageBuffer = fs.readFileSync(fullPath);
      }
      
      // Xử lý hình ảnh thumbnail
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize({
          width: options.width,
          height: options.height,
          fit: 'cover'
        })
        .webp({ quality: 70 })
        .toBuffer();
      
      // Lưu thumbnail vào storage
      if (storageType === 's3') {
        // Upload thumbnail lên S3
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET,
          Key: thumbnailPath,
          Body: thumbnailBuffer,
          ContentType: 'image/webp'
        };
        
        await s3.send(new PutObjectCommand(uploadParams));
        
        return {
          url: getFileUrl(thumbnailPath),
          path: thumbnailPath,
          filename: thumbnailName,
          mimetype: 'image/webp',
          size: thumbnailBuffer.length,
          width: options.width,
          height: options.height
        };
      } else {
        // Lưu vào local storage
        const localDir = path.join(__dirname, '..', dirName);
        fs.mkdirSync(localDir, { recursive: true });
        
        const outputPath = path.join(localDir, thumbnailName);
        fs.writeFileSync(outputPath, thumbnailBuffer);
        
        return {
          url: getFileUrl(thumbnailPath),
          path: thumbnailPath,
          filename: thumbnailName,
          mimetype: 'image/webp',
          size: fs.statSync(outputPath).size,
          width: options.width,
          height: options.height
        };
      }
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Tạo URL ký tên tạm thời cho file từ S3
   * @param {String} filePath - Đường dẫn file
   * @param {Number} expiresIn - Thời gian hết hạn (giây)
   * @returns {Promise<String>} - URL ký tên tạm thời
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    if (storageType !== 's3') {
      return getFileUrl(filePath);
    }
    
    try {
      const getParams = {
        Bucket: process.env.AWS_BUCKET,
        Key: filePath
      };
      
      const command = new GetObjectCommand(getParams);
      const signedUrl = await getSignedUrl(s3, command, { expiresIn });
      
      return signedUrl;
    } catch (error) {
      console.error(`Lỗi khi tạo URL ký tên cho ${filePath}:`, error);
      return null;
    }
  }
};

module.exports = imageService;