// middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const ApiError = require('../utils/apiError');

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

// Cấu hình multer storage dựa trên loại lưu trữ
let storage;

if (storageType === 's3') {
  // S3 storage
  storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Xác định thư mục lưu file dựa trên loại file
      let uploadDir = '';
      
      if (file.fieldname === 'avatar') {
        uploadDir = 'avatars/';
      } else if (file.fieldname.includes('product') || file.fieldname === 'images') {
        uploadDir = 'products/';
      } else if (file.fieldname.includes('option') || file.fieldname.includes('customization')) {
        uploadDir = 'customizations/';
      } else if (file.fieldname.includes('variant')) {
        uploadDir = 'variants/';
      } else if (file.fieldname.includes('review')) {
        uploadDir = 'reviews/';
      } else if (file.fieldname.includes('category')) {
        uploadDir = 'categories/';
      } else if (file.fieldname.includes('banner')) {
        uploadDir = 'banners/';
      } else {
        uploadDir = 'others/';
      }
      
      // Tạo tên file ngẫu nhiên để tránh trùng lặp
      const randomName = crypto.randomBytes(8).toString('hex');
      // Lấy phần mở rộng của file
      const fileExt = path.extname(file.originalname);
      // Tạo tên file mới: timestamp + random name + extension
      const filename = `${uploadDir}${Date.now()}-${randomName}${fileExt}`;
      
      cb(null, filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  });
} else {
  // Local storage
  storage = multer.diskStorage({
    destination: function(req, file, cb) {
      // Xác định thư mục lưu file dựa trên loại file
      let uploadDir = 'uploads/';
      
      if (file.fieldname === 'avatar') {
        uploadDir += 'avatars/';
      } else if (file.fieldname.includes('product') || file.fieldname === 'images') {
        uploadDir += 'products/';
      } else if (file.fieldname.includes('option') || file.fieldname.includes('customization')) {
        uploadDir += 'customizations/';
      } else if (file.fieldname.includes('variant')) {
        uploadDir += 'variants/';
      } else if (file.fieldname.includes('review')) {
        uploadDir += 'reviews/';
      } else if (file.fieldname.includes('category')) {
        uploadDir += 'categories/';
      } else if (file.fieldname.includes('banner')) {
        uploadDir += 'banners/';
      } else {
        uploadDir += 'others/';
      }
      
      // Tạo thư mục nếu chưa tồn tại
      const absolutePath = path.join(__dirname, '..', uploadDir);
      fs.mkdirSync(absolutePath, { recursive: true });
      
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      // Tạo tên file ngẫu nhiên để tránh trùng lặp
      const randomName = crypto.randomBytes(8).toString('hex');
      // Lấy phần mở rộng của file
      const fileExt = path.extname(file.originalname);
      // Tạo tên file mới: timestamp + random name + extension
      const filename = `${Date.now()}-${randomName}${fileExt}`;
      cb(null, filename);
    }
  });
}

// Filter file dựa trên loại
const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận hình ảnh và các file được phép
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(`Loại file không được phép: ${file.mimetype}. Chỉ chấp nhận: ${allowedMimeTypes.join(', ')}`, 400), false);
  }
};

// Giới hạn kích thước file
const limits = {
  fileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 5 * 1024 * 1024, // 5MB mặc định
  files: 10 // Tối đa 10 file mỗi lần
};

// Tạo multer upload
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Middleware wrapper để bắt lỗi từ multer
const handleUpload = (fileOptions) => {
  return (req, res, next) => {
    const uploadMiddleware = typeof fileOptions === 'string' 
      ? upload.single(fileOptions) 
      : Array.isArray(fileOptions) 
        ? upload.fields(fileOptions) 
        : upload.array(fileOptions.name, fileOptions.maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        // Xử lý lỗi từ multer
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(`File quá lớn. Kích thước tối đa: ${limits.fileSize / (1024 * 1024)}MB`, 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApiError('Số lượng file vượt quá giới hạn cho phép', 400));
        }
        return next(err);
      }
      next();
    });
  };
};

// Hàm xóa file (hỗ trợ cả local và S3)
const deleteFile = async (filePath) => {
  if (!filePath) return;
  
  try {
    if (storageType === 's3') {
      // Xóa file từ S3
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      
      // Lấy key từ filePath
      const key = filePath.startsWith('http') 
        ? new URL(filePath).pathname.substring(1) // Bỏ dấu / ở đầu
        : filePath;
      
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET,
        Key: key
      };
      
      await s3.send(new DeleteObjectCommand(deleteParams));
    } else {
      // Xóa file từ local
      const absolutePath = path.join(__dirname, '..', filePath);
      // Kiểm tra file tồn tại
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }
  } catch (error) {
    console.error(`Lỗi khi xóa file ${filePath}:`, error);
  }
};

// Lấy URL đầy đủ của file
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  if (storageType === 's3') {
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;
  } else {
    // Đối với local, trả về đường dẫn tương đối
    return `${process.env.API_URL}/${filePath}`;
  }
};

module.exports = {
  upload,
  handleUpload,
  deleteFile,
  getFileUrl,
  // Các middleware upload thông dụng
  uploadSingle: (fieldName) => handleUpload(fieldName),
  uploadAvatar: handleUpload('avatar'),
  uploadProductImages: handleUpload({ name: 'images', maxCount: 10 }),
  uploadVariantImages: handleUpload({ name: 'images', maxCount: 5 }),
  uploadCustomizationImages: handleUpload({ name: 'optionImages', maxCount: 10 }),
  uploadReviewImages: handleUpload({ name: 'images', maxCount: 5 }),
  uploadCategoryImage: handleUpload('image'),
  uploadBannerImage: handleUpload('image')
};