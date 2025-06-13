// middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const ApiError = require('../utils/apiError');

// Determine storage type from environment
const storageType = process.env.STORAGE_TYPE || 'local';

// Initialize S3 client if using S3
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

// Helper function to determine upload directory based on field name
const getUploadDirectory = (fieldname) => {
  const dirMap = {
    'avatar': 'avatars',
    'image': 'categories', // Single image field for categories
    'images': 'products',  // Multiple images field for products
    'optionImages': 'customizations',
    'variantImages': 'variants',
    'reviewImages': 'reviews',
    'bannerImage': 'banners'
  };

  // Check if fieldname contains specific keywords
  if (fieldname.includes('product')) return 'products';
  if (fieldname.includes('variant')) return 'variants';
  if (fieldname.includes('category')) return 'categories';
  if (fieldname.includes('review')) return 'reviews';
  if (fieldname.includes('banner')) return 'banners';
  if (fieldname.includes('customization') || fieldname.includes('option')) return 'customizations';

  return dirMap[fieldname] || 'others';
};

// Configure multer storage based on storage type
let storage;

if (storageType === 's3') {
  // S3 storage configuration
  storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, { 
        fieldName: file.fieldname,
        uploadedAt: new Date().toISOString()
      });
    },
    key: function (req, file, cb) {
      try {
        const uploadDir = getUploadDirectory(file.fieldname);
        const randomName = crypto.randomBytes(16).toString('hex');
        const fileExt = path.extname(file.originalname).toLowerCase();
        const filename = `${uploadDir}/${Date.now()}-${randomName}${fileExt}`;
        
        console.log(`S3 Upload - Field: ${file.fieldname}, Key: ${filename}`);
        cb(null, filename);
      } catch (error) {
        console.error('S3 key generation error:', error);
        cb(error);
      }
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  });
} else {
  // Local storage configuration
  storage = multer.diskStorage({
    destination: function(req, file, cb) {
      try {
        const uploadDir = getUploadDirectory(file.fieldname);
        const fullPath = path.join(__dirname, '..', 'uploads', uploadDir);
        
        // Create directory if it doesn't exist
        fs.mkdirSync(fullPath, { recursive: true });
        
        const relativePath = `uploads/${uploadDir}`;
        console.log(`Local Upload - Field: ${file.fieldname}, Dir: ${relativePath}`);
        cb(null, relativePath);
      } catch (error) {
        console.error('Local destination error:', error);
        cb(error);
      }
    },
    filename: function(req, file, cb) {
      try {
        const randomName = crypto.randomBytes(16).toString('hex');
        const fileExt = path.extname(file.originalname).toLowerCase();
        const filename = `${Date.now()}-${randomName}${fileExt}`;
        
        console.log(`Local Upload - Original: ${file.originalname}, New: ${filename}`);
        cb(null, filename);
      } catch (error) {
        console.error('Local filename generation error:', error);
        cb(error);
      }
    }
  });
}

// File filter function
const fileFilter = (req, file, cb) => {
  try {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
    
    console.log(`File filter - Name: ${file.originalname}, Type: ${file.mimetype}`);
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`, 400), false);
    }
  } catch (error) {
    console.error('File filter error:', error);
    cb(error, false);
  }
};

// File size and count limits
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  files: 15 // Maximum 15 files per request
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Enhanced upload middleware wrapper
const handleUpload = (fileOptions) => {
  return (req, res, next) => {
    let uploadMiddleware;
    
    try {
      if (typeof fileOptions === 'string') {
        // Single file upload
        uploadMiddleware = upload.single(fileOptions);
      } else if (Array.isArray(fileOptions)) {
        // Multiple field upload
        uploadMiddleware = upload.fields(fileOptions);
      } else if (fileOptions.name && fileOptions.maxCount) {
        // Array upload with max count
        uploadMiddleware = upload.array(fileOptions.name, fileOptions.maxCount);
      } else {
        throw new Error('Invalid upload configuration');
      }
      
      uploadMiddleware(req, res, (err) => {
        if (err) {
          console.error('Upload middleware error:', err);
          
          // Handle specific multer errors
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(`File too large. Maximum size: ${limits.fileSize / (1024 * 1024)}MB`, 400));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new ApiError(`Too many files. Maximum: ${limits.files} files`, 400));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new ApiError('Unexpected file field', 400));
          }
          if (err.code === 'LIMIT_FIELD_KEY') {
            return next(new ApiError('Field name too long', 400));
          }
          if (err.code === 'LIMIT_FIELD_VALUE') {
            return next(new ApiError('Field value too long', 400));
          }
          if (err.code === 'LIMIT_FIELD_COUNT') {
            return next(new ApiError('Too many fields', 400));
          }
          
          return next(err);
        }
        
        // Log successful upload
        if (req.file) {
          console.log('Single file uploaded:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            size: req.file.size,
            path: req.file.path || req.file.key
          });
        }
        
        if (req.files) {
          if (Array.isArray(req.files)) {
            console.log(`${req.files.length} files uploaded as array`);
          } else {
            const fileCount = Object.values(req.files).flat().length;
            console.log(`${fileCount} files uploaded as fields`);
          }
        }
        
        next();
      });
    } catch (error) {
      console.error('Upload handler setup error:', error);
      next(new ApiError('Upload configuration error', 500));
    }
  };
};

// Enhanced file deletion function
const deleteFile = async (filePath) => {
  if (!filePath) {
    console.log('No file path provided for deletion');
    return false;
  }
  
  try {
    console.log(`Attempting to delete file: ${filePath}`);
    
    if (storageType === 's3') {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      
      // Extract key from file path/URL
      let key = filePath;
      if (filePath.startsWith('http')) {
        const url = new URL(filePath);
        key = url.pathname.substring(1); // Remove leading slash
      }
      
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET,
        Key: key
      };
      
      console.log(`Deleting S3 object with key: ${key}`);
      await s3.send(new DeleteObjectCommand(deleteParams));
      console.log(`Successfully deleted S3 object: ${key}`);
    } else {
      // Local file deletion
      let absolutePath;
      
      if (path.isAbsolute(filePath)) {
        absolutePath = filePath;
      } else {
        absolutePath = path.join(__dirname, '..', filePath);
      }
      
      // Check if file exists before deletion
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`Successfully deleted local file: ${absolutePath}`);
      } else {
        console.log(`Local file not found: ${absolutePath}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    return false;
  }
};

// Enhanced URL generation function
const getFileUrl = (filePath) => {
  if (!filePath) {
    console.log('No file path provided for URL generation');
    return null;
  }
  
  try {
    // If already a complete URL, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    if (storageType === 's3') {
      // Generate S3 URL
      const bucket = process.env.AWS_BUCKET;
      const region = process.env.AWS_REGION;
      
      // Clean the file path (remove any leading slashes)
      const cleanPath = filePath.replace(/^\/+/, '');
      
      return `https://${bucket}.s3.${region}.amazonaws.com/${cleanPath}`;
    } else {
      // Generate local URL
      const baseUrl = process.env.API_URL || 'http://localhost:5000';
      
      // Clean the file path
      let cleanPath = filePath.replace(/^\/+/, '');
      
      // Ensure the path starts with uploads/ for local files
      if (!cleanPath.startsWith('uploads/')) {
        cleanPath = `uploads/${cleanPath}`;
      }
      
      return `${baseUrl}/${cleanPath}`;
    }
  } catch (error) {
    console.error(`Error generating URL for file ${filePath}:`, error);
    return null;
  }
};

// Get fallback image URL
const getFallbackImageUrl = () => {
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/fallback/no-image.png`;
};

// Predefined upload middleware functions
const uploadSingle = (fieldName) => handleUpload(fieldName);
const uploadAvatar = handleUpload('avatar');
const uploadProductImages = handleUpload({ name: 'images', maxCount: 10 });
const uploadVariantImages = handleUpload({ name: 'images', maxCount: 5 });
const uploadCustomizationImages = handleUpload({ name: 'optionImages', maxCount: 10 });
const uploadReviewImages = handleUpload({ name: 'images', maxCount: 5 });
const uploadCategoryImage = handleUpload('image');
const uploadBannerImage = handleUpload('image');

module.exports = {
  upload,
  handleUpload,
  deleteFile,
  getFileUrl,
  getFallbackImageUrl,
  
  // Predefined middleware
  uploadSingle,
  uploadAvatar,
  uploadProductImages,
  uploadVariantImages,
  uploadCustomizationImages,
  uploadReviewImages,
  uploadCategoryImage,
  uploadBannerImage,
  
  // Utility functions
  getUploadDirectory,
  storageType
};