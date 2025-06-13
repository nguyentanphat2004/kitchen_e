// middlewares/static.middleware.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const { getFileUrl, getFallbackImageUrl } = require('./upload.middleware');

/**
 * Enhanced static file serving middleware with better error handling and security
 */
const createStaticMiddleware = () => {
  const router = express.Router();

  // Serve uploaded files with proper headers and error handling
  router.use('/uploads', (req, res, next) => {
    // Security: validate file path to prevent directory traversal
    const filePath = req.path;
    
    // Check for suspicious patterns
    if (filePath.includes('..') || filePath.includes('~') || filePath.startsWith('/etc/')) {
      console.log('Static middleware: Suspicious file path blocked:', filePath);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Log file access for debugging
    console.log('Static middleware: Serving file:', filePath);

    next();
  });

  // Configure static file serving with proper options
  const staticOptions = {
    // Enable dot files serving (for .htaccess, etc.)
    dotfiles: 'deny',
    
    // Set appropriate headers
    setHeaders: (res, filePath, stat) => {
      // Set cache headers for images
      if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
        res.set('X-Content-Type-Options', 'nosniff');
      }
      
      // Set CORS headers for cross-origin requests
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET');
      
      // Log file serving
      console.log('Static middleware: Headers set for:', path.basename(filePath));
    },
    
    // Handle errors gracefully
    fallthrough: true,
    
    // Set index file
    index: false,
    
    // Redirect to trailing slash
    redirect: false
  };

  // Serve static files from uploads directory
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsPath)) {
    console.log('Static middleware: Creating uploads directory:', uploadsPath);
    fs.mkdirSync(uploadsPath, { recursive: true });
    
    // Create subdirectories
    const subdirs = ['products', 'categories', 'variants', 'reviews', 'avatars', 'banners', 'fallback'];
    subdirs.forEach(subdir => {
      const subdirPath = path.join(uploadsPath, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
      }
    });
    
    // Create fallback image if it doesn't exist
    createFallbackImage(path.join(uploadsPath, 'fallback'));
  }

  router.use('/uploads', express.static(uploadsPath, staticOptions));

  // Handle 404 for missing files with fallback
  router.use('/uploads', (req, res, next) => {
    const filePath = req.path;
    
    console.log('Static middleware: File not found:', filePath);
    
    // If it's an image request, serve fallback image
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      const fallbackPath = path.join(uploadsPath, 'fallback', 'no-image.png');
      
      if (fs.existsSync(fallbackPath)) {
        console.log('Static middleware: Serving fallback image');
        return res.sendFile(fallbackPath);
      }
    }
    
    // Return 404 for other files
    res.status(404).json({
      error: 'File not found',
      path: filePath,
      message: 'The requested file could not be found'
    });
  });

  return router;
};

/**
 * Create fallback image if it doesn't exist
 * @param {string} fallbackDir - Fallback directory path
 */
const createFallbackImage = (fallbackDir) => {
  try {
    const fallbackImagePath = path.join(fallbackDir, 'no-image.png');
    
    if (!fs.existsSync(fallbackImagePath)) {
      console.log('Static middleware: Creating fallback image...');
      
      // Create a simple fallback image using Canvas (if available) or copy from assets
      const assetsPath = path.join(__dirname, '..', 'assets', 'no-image.png');
      
      if (fs.existsSync(assetsPath)) {
        fs.copyFileSync(assetsPath, fallbackImagePath);
        console.log('Static middleware: Fallback image copied from assets');
      } else {
        // Create a simple SVG fallback
        const svgContent = `
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#999">
              No Image
            </text>
          </svg>
        `;
        
        fs.writeFileSync(fallbackImagePath.replace('.png', '.svg'), svgContent);
        console.log('Static middleware: SVG fallback image created');
      }
    }
  } catch (error) {
    console.error('Static middleware: Error creating fallback image:', error);
  }
};

/**
 * Middleware to handle file downloads with proper headers
 */
const createDownloadMiddleware = () => {
  return (req, res, next) => {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    // Security: validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(403).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    // Set appropriate headers for download
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileSize,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache'
    });
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Download middleware: Stream error:', error);
      res.status(500).json({ error: 'Error reading file' });
    });
    
    fileStream.pipe(res);
  };
};

/**
 * Middleware to provide file information
 */
const createFileInfoMiddleware = () => {
  return (req, res, next) => {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    // Security: validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(403).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    try {
      // Get file stats
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      // Determine file type
      let fileType = 'unknown';
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
        fileType = 'image';
      } else if (['.pdf'].includes(ext)) {
        fileType = 'document';
      }
      
      const fileInfo = {
        filename: filename,
        size: stats.size,
        type: fileType,
        extension: ext,
        created: stats.birthtime,
        modified: stats.mtime,
        url: getFileUrl(filename),
        downloadUrl: `/api/files/download/${filename}`
      };
      
      res.json({
        success: true,
        data: fileInfo
      });
    } catch (error) {
      console.error('File info middleware: Error getting file stats:', error);
      res.status(500).json({ error: 'Error getting file information' });
    }
  };
};

/**
 * Initialize static file serving
 * @param {Express} app - Express application
 */
const initializeStaticFiles = (app) => {
  console.log('Initializing static file serving...');
  
  // Mount static file middleware
  app.use('/api/files', createStaticMiddleware());
  
  // Mount download middleware
  app.get('/api/files/download/:filename', createDownloadMiddleware());
  
  // Mount file info middleware
  app.get('/api/files/info/:filename', createFileInfoMiddleware());
  
  // Mount legacy uploads route for backward compatibility
  app.use('/uploads', createStaticMiddleware());
  
  console.log('Static file serving initialized');
};

module.exports = {
  createStaticMiddleware,
  createDownloadMiddleware,
  createFileInfoMiddleware,
  initializeStaticFiles,
  createFallbackImage
};