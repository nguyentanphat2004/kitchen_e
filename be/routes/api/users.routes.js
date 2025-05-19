// routes/api/users.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const { protect, authorize, authorizeOwnerOrAdmin } = require('../../middlewares/auth.middleware');
const { uploadSingle } = require('../../middlewares/upload.middleware');

// Public routes
// (none)

// Protected routes
router.get('/profile', protect, userController.getUserProfile);

// User routes (accessible by owner or admin)
router.get('/:id', protect, authorizeOwnerOrAdmin(), userController.getUserById);
router.put('/:id', protect, authorizeOwnerOrAdmin(), uploadSingle('avatar'), userController.updateUser);

// Address management
router.get('/:id/addresses', protect, authorizeOwnerOrAdmin(), userController.getUserAddresses);
router.post('/:id/addresses', protect, authorizeOwnerOrAdmin(), userController.addUserAddress);
router.put('/:id/addresses/:addressId', protect, authorizeOwnerOrAdmin(), userController.updateUserAddress);
router.delete('/:id/addresses/:addressId', protect, authorizeOwnerOrAdmin(), userController.deleteUserAddress);
router.put('/:id/addresses/:addressId/default', protect, authorizeOwnerOrAdmin(), userController.setDefaultAddress);

// Order summary for user
router.get('/:id/orders-summary', protect, authorizeOwnerOrAdmin(), userController.getUserOrdersSummary);

// Admin-only routes
router.get('/', protect, authorize('admin'), userController.getUsers);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);
router.put('/:id/restore', protect, authorize('admin'), userController.restoreUser);
router.put('/:id/role', protect, authorize('admin'), userController.changeUserRole);
router.get('/search', protect, authorize('admin'), userController.searchUsers);
router.get('/stats', protect, authorize('admin'), userController.getUserStats);

module.exports = router;