const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Helper to log mail locally when SMTP is disabled/failing
const logMailToFile = (to, subject, html) => {
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'emails.log');
    const logEntry = `[${new Date().toISOString()}] TO: ${to} | SUBJECT: ${subject}\nHTML:\n${html}\n==================================================\n`;
    fs.appendFileSync(logFile, logEntry);
    console.log(`[Mailer Mock]: Email to ${to} logged to backend/logs/emails.log`);
  } catch (err) {
    console.error('Failed to write mock email log:', err);
  }
};

const sendEmail = async ({ to, subject, html }) => {
  // Check if credentials are mock/default
  if (!process.env.EMAIL_HOST || process.env.EMAIL_USER === 'mock_user' || !process.env.EMAIL_USER) {
    logMailToFile(to, subject, html);
    return { success: true, mocked: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"FoodBridge Platform" <noreply@foodbridge.org>',
      to,
      subject,
      html
    });

    console.log(`[Email Sent]: Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error]: ${error.message}. Falling back to logging.`);
    logMailToFile(to, subject, html);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
