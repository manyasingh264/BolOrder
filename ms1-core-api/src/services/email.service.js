// email.service.js — AWS SES integration for sending emails.
//
// Responsibility: Send emails using AWS Simple Email Service (SES).
//
// Usage:
//   const emailService = require('./email.service');
//   await emailService.sendOTPEmail('user@example.com', '123456');

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const AppError = require('../utils/AppError');

// Initialize SES client with credentials from environment
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Send OTP email to a user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (email, otp) => {
  if (!process.env.AWS_SES_FROM_EMAIL) {
    throw new AppError('AWS_SES_FROM_EMAIL not configured in environment', 500);
  }

  const params = {
    Source: process.env.AWS_SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: 'Your OTP Verification Code',
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: `Your OTP code is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
          Charset: 'UTF-8',
        },
        Html: {
          Data: `
            <h2>Your OTP Verification Code</h2>
            <p style="font-size: 24px; font-weight: bold; color: #333;">${otp}</p>
            <p>This code expires in 5 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
          `,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log(`✅ OTP email sent to ${email} | MessageId: ${response.MessageId}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending email via SES:', error);
    throw new AppError('Failed to send OTP email. Please try again.', 500);
  }
};

module.exports = { sendOTPEmail };
