const { sendEmail } = require('../utils/mailer');
const { generateEmailTemplate } = require('./templateGenerator');

const APP_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const emailService = {
  /**
   * Notify NGOs of a new food listing
   */
  sendFoodListed: async (ngoEmails, foodName, donorName, category, servings, address, foodId) => {
    const eventTitle = `Alert: New Food Available`;
    const description = `Donor <strong>${donorName}</strong> has listed surplus food: <strong>${foodName}</strong> (${category}). It feeds approximately ${servings} people. <br/><br/><strong>Pickup Location:</strong> ${address}`;
    const html = generateEmailTemplate({
      eventTitle,
      description,
      ctaText: 'Claim This Listing',
      ctaUrl: `${APP_URL}/food/${foodId}`
    });

    return sendEmail({
      to: ngoEmails,
      subject: `FoodBridge Alert: ${foodName} is available`,
      html
    });
  },

  /**
   * Notify Donor of a new claim request
   */
  sendClaimRequested: async (donorEmail, foodName, ngoName, notes, claimId) => {
    const eventTitle = `New Claim Request Submitted`;
    const description = `NGO <strong>${ngoName}</strong> has requested to claim your listing: <strong>${foodName}</strong>.<br/><br/><strong>NGO Note:</strong> "${notes || 'No special instructions'}"`;
    const html = generateEmailTemplate({
      eventTitle,
      description,
      ctaText: 'Review Claim Request',
      ctaUrl: `${APP_URL}/claims/${claimId}`
    });

    return sendEmail({
      to: donorEmail,
      subject: `FoodBridge: Claim request for ${foodName}`,
      html
    });
  },

  /**
   * Notify NGO of claim approval
   */
  sendClaimApproved: async (ngoEmail, foodName, donorName, claimId) => {
    const eventTitle = `Claim Request Approved`;
    const description = `Your claim request for <strong>${foodName}</strong> has been approved by <strong>${donorName}</strong>. Please wait for them to schedule a pickup window.`;
    const html = generateEmailTemplate({
      eventTitle,
      description,
      ctaText: 'View Claim Timeline',
      ctaUrl: `${APP_URL}/claims/${claimId}`
    });

    return sendEmail({
      to: ngoEmail,
      subject: `FoodBridge: Claim Approved - ${foodName}`,
      html
    });
  },

  /**
   * Notify NGO of claim rejection
   */
  sendClaimRejected: async (ngoEmail, foodName, donorName) => {
    const eventTitle = `Claim Request Update`;
    const description = `We regret to inform you that your claim request for <strong>${foodName}</strong> has been declined by the donor. The food listing is now available for other claims.`;
    const html = generateEmailTemplate({
      eventTitle,
      description,
      ctaText: 'Browse Available Food',
      ctaUrl: `${APP_URL}/ngo`
    });

    return sendEmail({
      to: ngoEmail,
      subject: `FoodBridge: Claim Status - ${foodName}`,
      html
    });
  },

  /**
   * Notify NGO of scheduled pickup details
   */
  sendPickupScheduled: async (ngoEmail, foodName, donorName, pickupDate, pickupTime, instructions, claimId) => {
    const formattedDate = new Date(pickupDate).toLocaleDateString();
    const eventTitle = `Pickup Scheduled & Ready`;
    const description = `Donor <strong>${donorName}</strong> has scheduled a pickup window for your claimed listing: <strong>${foodName}</strong>.<br/><br/><strong>Date:</strong> ${formattedDate}<br/><strong>Time Window:</strong> ${pickupTime}<br/><strong>Instructions:</strong> ${instructions || 'None'}`;
    const html = generateEmailTemplate({
      eventTitle,
      description,
      ctaText: 'View Pickup Details',
      ctaUrl: `${APP_URL}/claims/${claimId}`
    });

    return sendEmail({
      to: ngoEmail,
      subject: `FoodBridge: Pickup Ready for ${foodName}`,
      html
    });
  },

  /**
   * Notify NGO / Donor of completed donation
   */
  sendDonationCompleted: async (email, foodName, partnerName, isDonor, claimId) => {
    const eventTitle = `Donation Successfully Completed`;
    const description = isDonor
      ? `Thank you! NGO <strong>${partnerName}</strong> has collected the food, and your contribution of <strong>${foodName}</strong> is verified as completed. Thank you for saving food from waste!`
      : `Success! Handover verification is complete. The donor <strong>${partnerName}</strong> confirmed your collection of <strong>${foodName}</strong>. Thank you for your redistribution efforts!`;
    
    const html = generateEmailTemplate({
      eventTitle,
      description,
      ctaText: 'View Summary',
      ctaUrl: `${APP_URL}/claims/${claimId}`
    });

    return sendEmail({
      to: email,
      subject: `FoodBridge: Donation Completed - ${foodName}`,
      html
    });
  },

  /**
   * Notify NGO of registration approval
   */
  sendNgoApproved: async (ngoEmail, ngoName) => {
    const eventTitle = `NGO Registration Approved`;
    const description = `Congratulations, <strong>${ngoName}</strong>! Your organization profile has been reviewed and approved by our administrators. You can now log in and claim food listings.`;
    const html = generateEmailTemplate({
      eventTitle,
      description,
      ctaText: 'Log In to FoodBridge',
      ctaUrl: `${APP_URL}/login`
    });

    return sendEmail({
      to: ngoEmail,
      subject: 'FoodBridge NGO Account Activated!',
      html
    });
  },

  /**
   * Notify user of account suspension
   */
  sendAccountSuspended: async (userEmail, userName) => {
    const eventTitle = `Account Suspended`;
    const description = `Dear <strong>${userName}</strong>, your FoodBridge account has been suspended by an administrator. Please contact our support team if you believe this is a mistake.`;
    const html = generateEmailTemplate({
      eventTitle,
      description
    });

    return sendEmail({
      to: userEmail,
      subject: 'FoodBridge: Account Status Alert',
      html
    });
  }
};

module.exports = emailService;
