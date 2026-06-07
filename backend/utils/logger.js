const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, details = '', req = null) => {
  try {
    let ipAddress = 'unknown';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    }
    
    await ActivityLog.create({
      userId,
      action,
      details,
      ipAddress
    });
    console.log(`[Activity Log]: User ${userId || 'SYSTEM'} performed '${action}' - ${details}`);
  } catch (error) {
    console.error(`[Activity Log Error]: ${error.message}`);
  }
};

module.exports = { logActivity };
