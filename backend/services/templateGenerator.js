/**
 * Reusable Responsive HTML Email Template Generator
 */
exports.generateEmailTemplate = ({ eventTitle, description, ctaText, ctaUrl }) => {
  const primaryColor = '#10b981'; // emerald-500
  const secondaryColor = '#0f766e'; // teal-700
  const darkSlate = '#0f172a'; // slate-900
  const lightSlate = '#f8fafc'; // slate-50

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: ${lightSlate};
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, ${darkSlate} 0%, ${secondaryColor} 100%);
      padding: 30px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 14px;
      color: ${primaryColor};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 40px 30px;
      color: #334155;
    }
    .content h2 {
      margin-top: 0;
      font-size: 20px;
      font-weight: 700;
      color: ${darkSlate};
    }
    .content p {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 30px;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      font-weight: 700;
      font-size: 14px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
    }
    .footer {
      background-color: ${lightSlate};
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>FoodBridge</h1>
      <p>Surplus Food Platform</p>
    </div>
    <div class="content">
      <h2>${eventTitle}</h2>
      <p>${description}</p>
      ${ctaUrl && ctaText ? `
        <div class="cta-container">
          <a href="${ctaUrl}" class="cta-button" target="_blank">${ctaText}</a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>&copy; 2026 FoodBridge Redistribution Network. All rights reserved.</p>
      <p>Connecting Donors and NGOs to fight hunger and waste.</p>
    </div>
  </div>
</body>
</html>
  `;
};
