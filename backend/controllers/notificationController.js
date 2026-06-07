const Notification = require('../models/Notification');

/**
 * @desc    Get user-specific notifications (with search, filter, and pagination)
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const { search, type, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user.id };

    // Filter by alert level type
    if (type && type !== 'ALL') {
      query.type = type.toUpperCase();
    }

    // Keyword search on title or message
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get unread notifications and total count
 * @route   GET /api/notifications/unread
 * @access  Private
 */
exports.getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id, read: false })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
