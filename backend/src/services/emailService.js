const nodemailer = require('nodemailer');

const isSmtpConfigured = () => Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());

const createTransporter = () => {
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = process.env.SMTP_PORT || '587';
  const SMTP_USER = process.env.SMTP_USER?.trim();
  const configuredPassword = process.env.SMTP_PASS?.trim();
  if (!isSmtpConfigured()) {
    const error = new Error('Password recovery email is not configured. Set SMTP_USER and SMTP_PASS in backend/.env.');
    error.statusCode = 503;
    throw error;
  }

  const port = Number(SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error('SMTP_PORT must be a valid port number.');
    error.statusCode = 500;
    throw error;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_HOST.toLowerCase() === 'smtp.gmail.com'
        ? configuredPassword.replace(/\s+/g, '')
        : configuredPassword
    }
  });
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Reset your Sentinel Protocol password',
      text: `Hello ${name},\n\nUse this link to reset your password. It expires in one hour:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Hello,</p><p>Use the link below to reset your password. It expires in one hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
    });
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('[MAIL] Password reset email delivery failed.', {
      code: error.code || 'UNKNOWN',
      responseCode: Number.isInteger(error.responseCode) ? error.responseCode : undefined,
      command: typeof error.command === 'string' ? error.command : undefined
    });
    const deliveryError = new Error('Password recovery email could not be delivered. Check the SMTP configuration.');
    deliveryError.statusCode = 503;
    throw deliveryError;
  }
};

module.exports = { sendPasswordResetEmail, isSmtpConfigured };
