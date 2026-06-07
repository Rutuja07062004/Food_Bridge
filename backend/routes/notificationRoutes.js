const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes require JWT authentication
router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/unread')
  .get(getUnreadNotifications);

router.route('/read-all')
  .put(markAllNotificationsRead);

router.route('/:id/read')
  .put(markNotificationRead);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;
