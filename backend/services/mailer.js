import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';
const from = process.env.EMAIL_FROM || `CV Craft <${user}>`;

// Helper check to see if email is set up
const isConfigured = user && user !== 'your_gmail@gmail.com' && pass && pass !== 'your_app_password_here';

let transporter = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

export const sendOTPEmail = async (email, otp) => {
  const subject = 'CV Craft — Your 2FA OTP Code';
  const text = `Your CV Craft verification code is: ${otp}. It is valid for 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #7c3aed; border-radius: 8px; background-color: #050510; color: #ffffff;">
      <h2 style="color: #7c3aed; text-align: center;">CV Craft 2FA Code</h2>
      <hr style="border: 0; border-top: 1px solid #3b82f6; margin-bottom: 20px;" />
      <p>Hello,</p>
      <p>You requested a 2FA code to login to your CV Craft account.</p>
      <div style="background-color: #111827; padding: 15px; border-radius: 4px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3b82f6; margin: 20px 0;">
        ${otp}
      </div>
      <p>This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #3b82f6; margin-top: 20px;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">Powered by CV Craft</p>
    </div>
  `;

  console.log(`\n--- [MAIL SIMULATION] ---`);
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`-------------------------\n`);

  if (!isConfigured || !transporter) {
    return { mock: true, otp };
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('[Mailer] Error sending OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendLoginAlertEmail = async (email, ip, userAgent) => {
  const subject = 'CV Craft — Security Alert: New Login Detected';
  const cleanIp = ip === '::1' || ip === '127.0.0.1' ? '127.0.0.1 (Localhost)' : ip;
  const text = `Security Alert: We detected a login to your CV Craft account from a new device/IP: ${cleanIp}. User Agent: ${userAgent}. If this wasn't you, change your password immediately.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ef4444; border-radius: 8px; background-color: #050510; color: #ffffff;">
      <h2 style="color: #ef4444; text-align: center;">Security Alert: New Login</h2>
      <hr style="border: 0; border-top: 1px solid #ef4444; margin-bottom: 20px;" />
      <p>Hello,</p>
      <p>We detected a new login to your CV Craft account from a device or location we don't recognize:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #9ca3af; width: 120px;">IP Address:</td>
          <td style="padding: 8px; color: #ffffff;">${cleanIp}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #9ca3af;">Device / Agent:</td>
          <td style="padding: 8px; color: #ffffff;">${userAgent}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; color: #9ca3af;">Timestamp:</td>
          <td style="padding: 8px; color: #ffffff;">${new Date().toISOString()}</td>
        </tr>
      </table>
      <div style="background-color: #ef444415; padding: 15px; border-radius: 4px; border: 1px solid #ef4444; margin: 20px 0;">
        <p style="margin: 0; color: #f87171; font-weight: bold;">If this was not you, please log in to your account and change your password immediately to protect your data.</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #ef4444; margin-top: 20px;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">Security alert from CV Craft</p>
    </div>
  `;

  console.log(`\n--- [MAIL SIMULATION] ---`);
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Alert Body: ${text}`);
  console.log(`-------------------------\n`);

  if (!isConfigured || !transporter) {
    return { mock: true };
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('[Mailer] Error sending login alert email:', error.message);
    return { success: false, error: error.message };
  }
};
