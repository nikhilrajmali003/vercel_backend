const nodemailer = require('nodemailer');

// Create reusable transporter
// Create reusable transporter
// Create reusable transporter
const createTransporter = () => {
  // Debug log to see what is actually being used (masking password)
  console.log('📧 Email Config:', {
    host: process.env.SMTP_HOST || 'gmail (service)',
    port: process.env.SMTP_PORT || 'default',
    user: process.env.SMTP_USER,
    passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
  });

  const config = {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // Add timeouts
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    logger: true,
    debug: true
  };

  // Use explicit host/port if defined, otherwise fallback to 'service: gmail'
  if (process.env.SMTP_HOST) {
    config.host = process.env.SMTP_HOST;
    config.port = parseInt(process.env.SMTP_PORT || '587');
    config.secure = config.port === 465; // true for 465, false for other ports
  } else {
    // Default to Port 587 (STARTTLS) for better reliability on cloud hosting (Render, AWS, etc.)
    // 'service: gmail' defaults to 465 (SSL) which often times out
    config.host = 'smtp.gmail.com';
    config.port = 587;
    config.secure = true; // true for 465, false for other ports
  }

  return nodemailer.createTransport(config);
};

// Generate OTP email HTML template
const generateOTPEmailTemplate = (otp, purpose = 'login') => {
  const purposeText = {
    login: 'login to your account',
    register: 'complete your registration',
    'password-reset': 'reset your password',
    'email-verification': 'verify your email address'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">OTP Verification</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Your OTP to ${purposeText[purpose] || 'verify'} is:</p>
        <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h2>
        </div>
        <p style="font-size: 14px; color: #666;">This OTP is valid for <strong>10 minutes</strong> and can only be used once.</p>
        <p style="font-size: 14px; color: #666;">If you didn't request this OTP, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
};

// Send OTP email
exports.sendOTPEmail = async (email, otp, purpose = 'login') => {
  try {
    // Check if email service is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  Email service not configured. OTP:', otp);
      // In development, you might want to log the OTP instead of sending
      return {
        success: true,
        message: 'OTP generated (email service not configured)',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Your App'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your OTP for ${purpose === 'login' ? 'Login' : 'Verification'}`,
      html: generateOTPEmailTemplate(otp, purpose),
      text: `Your OTP is: ${otp}. This OTP is valid for 10 minutes.`
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent:', info.messageId);

    return {
      success: true,
      message: 'OTP email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Verify email transporter (test connection)
exports.verifyEmailConfig = async () => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    const transporter = createTransporter();
    await transporter.verify();

    return {
      success: true,
      message: 'Email service configured correctly'
    };
  } catch (error) {
    return {
      success: false,
      message: `Email configuration error: ${error.message}`
    };
  }
};
