const Notification = require('../models/Notification');
const socketManager = require('./socketManager');
const emailService = require('./emailService');

const notificationService = {
  /**
   * Unified dispatcher for database log + real-time push + email alert
   */
  createNotification: async ({
    userId,
    title,
    message,
    type = 'INFO',
    eventType,
    relatedEntityId = '',
    sendEmail = false,
    emailData = {}
  }) => {
    try {
      let notification = null;

      // 1. Persist to MongoDB if userId is provided
      if (userId) {
        notification = await Notification.create({
          userId,
          title,
          message,
          type,
          eventType,
          relatedEntityId
        });
      }

      // 2. Push real-time Socket.io updates
      const payload = {
        _id: notification ? notification._id : Date.now().toString(),
        userId,
        title,
        message,
        type,
        eventType,
        relatedEntityId,
        read: false,
        createdAt: new Date()
      };

      if (userId) {
        // Emit to user room (room:userId)
        socketManager.emitToUser(userId, eventType, payload);
      } else {
        // Broadcast to all (system alerts / admin announcements)
        socketManager.emitToAll(eventType, payload);
      }

      // If this is a global listing event or admin event, also notify general role rooms
      if (eventType === 'food_listed') {
        socketManager.emitToRole('NGO', eventType, payload);
      } else if (eventType === 'ngo_registration' || eventType === 'claim_requested') {
        socketManager.emitToRole('Admin', eventType, payload);
      }

      // 3. Send transactional email in background (don't block response)
      if (sendEmail && emailData) {
        setImmediate(async () => {
          try {
            switch (eventType) {
              case 'food_listed':
                await emailService.sendFoodListed(
                  emailData.ngoEmails,
                  emailData.foodName,
                  emailData.donorName,
                  emailData.category,
                  emailData.servings,
                  emailData.address,
                  relatedEntityId
                );
                break;
              case 'claim_requested':
                await emailService.sendClaimRequested(
                  emailData.donorEmail,
                  emailData.foodName,
                  emailData.ngoName,
                  emailData.notes,
                  relatedEntityId
                );
                break;
              case 'claim_approved':
                await emailService.sendClaimApproved(
                  emailData.ngoEmail,
                  emailData.foodName,
                  emailData.donorName,
                  relatedEntityId
                );
                break;
              case 'claim_rejected':
                await emailService.sendClaimRejected(
                  emailData.ngoEmail,
                  emailData.foodName,
                  emailData.donorName
                );
                break;
              case 'pickup_scheduled':
                await emailService.sendPickupScheduled(
                  emailData.ngoEmail,
                  emailData.foodName,
                  emailData.donorName,
                  emailData.pickupDate,
                  emailData.pickupTime,
                  emailData.instructions,
                  relatedEntityId
                );
                break;
              case 'donation_completed':
                await emailService.sendDonationCompleted(
                  emailData.email,
                  emailData.foodName,
                  emailData.partnerName,
                  emailData.isDonor,
                  relatedEntityId
                );
                break;
              case 'ngo_approved':
                await emailService.sendNgoApproved(
                  emailData.ngoEmail,
                  emailData.ngoName
                );
                break;
              case 'account_suspended':
                await emailService.sendAccountSuspended(
                  emailData.email,
                  emailData.name
                );
                break;
              default:
                console.log(`[NotificationService]: No specific email handler for eventType '${eventType}'`);
            }
          } catch (mailErr) {
            console.error('[NotificationService] Email delivery failure:', mailErr);
          }
        });
      }

      return { success: true, data: notification };
    } catch (err) {
      console.error('[NotificationService] Failed to create notification:', err);
      return { success: false, error: err.message };
    }
  }
};

module.exports = notificationService;
