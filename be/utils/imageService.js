// utils/imageService.js
const { deleteFile, getFileUrl, getFallbackImageUrl } = require('../middlewares/upload.middleware');
const sharp = require('sharp'); // Optional: for image processing
const path = require('path');

/**
 * Enhanced Image Service with comprehensive error handling
 */
class ImageService {
  constructor() {
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.processingOptions = {
      quality: 85,
      format: 'jpeg',
      progressive: true
    };
  }

  /**
   * Process uploaded image from multer (primary method)
   * @param {Object} file - Multer file object
   * @param {String} folder - Folder name (for logging/categorization)
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processed image info
   */
  async uploadImage(file, folder = 'uploads', options = {}) {
    try {
      console.log(`ImageService: Processing upload for folder: ${folder}`);
      
      if (!file) {
        throw new Error('No file provided to uploadImage');
      }

      // Validate the file before processing
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        throw new Error(`Image validation failed: ${validation.errors.join(', ')}`);
      }

      // File has already been uploaded by multer middleware
      // Extract information and return structured result
      const result = {
        url: this.getImageUrl(file),
        path: this.getImagePath(file),
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        folder: folder
      };

      // Validate that we have required fields
      if (!result.url || !result.path) {
        throw new Error('Failed to generate image URL or path from uploaded file');
      }

      console.log('ImageService: Upload processed successfully:', {
        folder,
        url: result.url,
        path: result.path,
        size: result.size
      });

      return result;
      
    } catch (error) {
      console.error('ImageService: Upload error:', error);
      
      // Clean up file if it was uploaded but processing failed
      if (file && (file.path || file.key)) {
        await this.deleteImage(file.path || file.key);
      }
      
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Get image URL from uploaded file
   * @param {Object} file - Multer file object
   * @returns {String|null} - Image URL
   */
  getImageUrl(file) {
    try {
      if (!file) {
        console.log('ImageService: No file provided to getImageUrl');
        return null;
      }

      // For S3 uploads, file.location contains the full URL
      if (file.location) {
        console.log('ImageService: Using S3 location URL:', file.location);
        return file.location;
      }

      // For local uploads, use the upload middleware's getFileUrl function
      if (file.path) {
        const url = getFileUrl(file.path);
        console.log('ImageService: Generated URL from path:', { path: file.path, url });
        return url;
      }

      // Fallback to filename
      if (file.filename) {
        const url = getFileUrl(file.filename);
        console.log('ImageService: Generated URL from filename:', { filename: file.filename, url });
        return url;
      }

      // Use S3 key if available
      if (file.key) {
        const url = getFileUrl(file.key);
        console.log('ImageService: Generated URL from S3 key:', { key: file.key, url });
        return url;
      }

      console.log('ImageService: No valid path found in file object:', Object.keys(file));
      return null;
    } catch (error) {
      console.error('ImageService: Error generating image URL:', error);
      return null;
    }
  }

  /**
   * Get image storage path from uploaded file
   * @param {Object} file - Multer file object  
   * @returns {String|null} - Storage path/key
   */
  getImagePath(file) {
    try {
      if (!file) {
        console.log('ImageService: No file provided to getImagePath');
        return null;
      }

      // Priority order: key (S3) > path (local) > filename (fallback)
      const pathOptions = [file.key, file.path, file.filename];
      
      for (const pathOption of pathOptions) {
        if (pathOption) {
          console.log('ImageService: Using path option:', pathOption);
          return pathOption;
        }
      }

      console.log('ImageService: No valid path found in file object');
      return null;
    } catch (error) {
      console.error('ImageService: Error getting image path:', error);
      return null;
    }
  }

  /**
   * Delete image using the upload middleware's deleteFile function
   * @param {String} imagePath - Image path/URL to delete
   * @returns {Promise<Boolean>} - Success status
   */
  async deleteImage(imagePath) {
    try {
      if (!imagePath) {
        console.log('ImageService: No image path provided for deletion');
        return true; // Consider it successful if no path provided
      }

      console.log('ImageService: Attempting to delete image:', imagePath);
      const result = await deleteFile(imagePath);
      
      if (result) {
        console.log('ImageService: Successfully deleted image:', imagePath);
      } else {
        console.log('ImageService: Failed to delete image:', imagePath);
      }
      
      return result;
    } catch (error) {
      console.error('ImageService: Delete image error:', error);
      return false;
    }
  }

  /**
   * Validate uploaded image file
   * @param {Object} file - Multer file object
   * @returns {Object} - Validation result
   */
  validateImage(file) {
    const errors = [];

    try {
      if (!file) {
        errors.push('No file provided');
        return { isValid: false, errors };
      }

      // Check file type
      if (!this.allowedTypes.includes(file.mimetype)) {
        errors.push(`Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedTypes.join(', ')}`);
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        errors.push(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
      }

      // Check filename
      if (!file.originalname || file.originalname.trim() === '') {
        errors.push('Invalid filename');
      }

      // Check for dangerous file extensions
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      if (!allowedExtensions.includes(ext)) {
        errors.push(`Invalid file extension: ${ext}. Allowed extensions: ${allowedExtensions.join(', ')}`);
      }

      const result = {
        isValid: errors.length === 0,
        errors,
        fileInfo: {
          originalName: file.originalname,
          size: file.size,
          type: file.mimetype,
          extension: ext
        }
      };

      if (result.isValid) {
        console.log('ImageService: File validation passed:', result.fileInfo);
      } else {
        console.log('ImageService: File validation failed:', { errors, fileInfo: result.fileInfo });
      }

      return result;
    } catch (error) {
      console.error('ImageService: Validation error:', error);
      return {
        isValid: false,
        errors: ['Validation error occurred'],
        fileInfo: null
      };
    }
  }

  /**
   * Get display URL for an image path from database
   * @param {String} imagePath - Image path stored in database
   * @returns {String|null} - Full image URL for display
   */
  getDisplayUrl(imagePath) {
    try {
      if (!imagePath) {
        console.log('ImageService: No image path provided to getDisplayUrl');
        return null;
      }

      // If already a complete URL, return as is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }

      // Use the upload middleware's getFileUrl function
      const url = getFileUrl(imagePath);
      console.log('ImageService: Generated display URL:', { path: imagePath, url });
      return url;
    } catch (error) {
      console.error('ImageService: Error generating display URL:', error);
      return getFallbackImageUrl();
    }
  }

  /**
   * Get fallback image URL when image is not available
   * @returns {String} - Fallback image URL
   */
  getFallbackUrl() {
    return getFallbackImageUrl();
  }

  /**
   * Process multiple uploaded images
   * @param {Array} files - Array of multer file objects
   * @param {String} folder - Folder name
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} - Array of processed image info
   */
  async uploadMultipleImages(files, folder = 'uploads', options = {}) {
    try {
      if (!files || !Array.isArray(files) || files.length === 0) {
        console.log('ImageService: No files provided to uploadMultipleImages');
        return [];
      }

      console.log(`ImageService: Processing ${files.length} images for folder: ${folder}`);

      const results = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        try {
          const result = await this.uploadImage(files[i], folder, options);
          results.push({
            ...result,
            index: i,
            isDefault: i === 0 // First image is default
          });
        } catch (error) {
          console.error(`ImageService: Failed to process image ${i}:`, error);
          errors.push({
            index: i,
            filename: files[i]?.originalname || 'unknown',
            error: error.message
          });
        }
      }

      if (errors.length > 0) {
        console.log('ImageService: Some images failed to process:', errors);
        
        // If all images failed, throw an error
        if (results.length === 0) {
          throw new Error(`All images failed to process: ${errors.map(e => e.error).join(', ')}`);
        }
        
        // If some images failed, log warning but continue
        console.warn(`ImageService: ${errors.length} out of ${files.length} images failed to process`);
      }

      console.log(`ImageService: Successfully processed ${results.length} out of ${files.length} images`);
      return results;
    } catch (error) {
      console.error('ImageService: Multiple upload error:', error);
      throw new Error(`Multiple image upload failed: ${error.message}`);
    }
  }

  /**
   * Process image with Sharp (optional image optimization)
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Buffer>} - Processed image buffer
   */
  async processImageBuffer(buffer, options = {}) {
    try {
      // Only process if Sharp is available
      if (!sharp) {
        console.log('ImageService: Sharp not available, returning original buffer');
        return buffer;
      }

      const {
        width = 1200,
        height = 1200,
        quality = this.processingOptions.quality,
        format = this.processingOptions.format,
        progressive = this.processingOptions.progressive
      } = options;

      console.log('ImageService: Processing image buffer with Sharp');

      const processedBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality,
          progressive 
        })
        .toBuffer();

      console.log('ImageService: Image buffer processed successfully');
      return processedBuffer;
    } catch (error) {
      console.error('ImageService: Image processing error:', error);
      return buffer; // Return original buffer if processing fails
    }
  }

  /**
   * Generate thumbnail URL (placeholder for future implementation)
   * @param {String} imagePath - Original image path
   * @param {Number} size - Thumbnail size
   * @returns {String} - Thumbnail URL (currently returns original)
   */
  getThumbnailUrl(imagePath, size = 150) {
    try {
      // For now, return the original image URL
      // In the future, this could generate actual thumbnails
      return this.getDisplayUrl(imagePath);
    } catch (error) {
      console.error('ImageService: Thumbnail generation error:', error);
      return this.getFallbackUrl();
    }
  }

  /**
   * Cleanup multiple images
   * @param {Array} imagePaths - Array of image paths to delete
   * @returns {Promise<Object>} - Cleanup results
   */
  async cleanupImages(imagePaths) {
    try {
      if (!imagePaths || !Array.isArray(imagePaths)) {
        return { success: 0, failed: 0, total: 0 };
      }

      console.log(`ImageService: Cleaning up ${imagePaths.length} images`);

      let success = 0;
      let failed = 0;

      for (const imagePath of imagePaths) {
        try {
          const result = await this.deleteImage(imagePath);
          if (result) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`ImageService: Failed to cleanup image ${imagePath}:`, error);
          failed++;
        }
      }

      const results = { success, failed, total: imagePaths.length };
      console.log('ImageService: Cleanup completed:', results);
      return results;
    } catch (error) {
      console.error('ImageService: Cleanup error:', error);
      return { success: 0, failed: imagePaths?.length || 0, total: imagePaths?.length || 0 };
    }
  }
}

// Create singleton instance
const imageService = new ImageService();

module.exports = imageService;