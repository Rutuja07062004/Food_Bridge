const express = require('express');
const router = express.Router();
const {
  loginAdmin, getDashboardStats, getUsers, getUserById, updateUserStatus, deleteUser,
  getNGOs, approveNGO, rejectNGO, getFoodListings, deleteFoodListing,
  getClaims, updateClaimStatus, getNotifications, getActivityLogs, getAnalytics,
  markNotificationRead, deleteNotification
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route
router.post('/login', loginAdmin);

// Protected Admin-only routes
router.use(protect);
router.use(authorize('Admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/logs', getActivityLogs);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.delete('/notifications/:id', deleteNotification);

// User Management
router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUserById)
  .delete(deleteUser);

router.put('/users/:id/status', updateUserStatus);

// NGO Management
router.get('/ngos', getNGOs);
router.put('/ngos/:id/approve', approveNGO);
router.put('/ngos/:id/reject', rejectNGO);

// Food Management
router.get('/food', getFoodListings);
router.delete('/food/:id', deleteFoodListing);

// Claims Management
router.get('/claims', getClaims);
router.put('/claims/:id/status', updateClaimStatus);

module.exports = router;
