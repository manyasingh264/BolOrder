// otp.service.js — OTP generation, storage, and verification.
//
// Responsibility: Generate OTP codes, store them in database,
// and verify them during authentication.
//
// Usage:
//   const otpService = require('./otp.service');
//   const otp = otpService.generateOTP();
//   await otpService.storeOTP('user@example.com', otp);
//   const isValid = await otpService.verifyOTP('user@example.com', otp);

const crypto = require('crypto');
const { db } = require('../database/db');
const { otpCodes } = require('../database/schema');
const { eq, and, lt } = require('drizzle-orm');
const AppError = require('../utils/AppError');

/**
 * Generate a 6-digit OTP code
 * @returns {string} 6-digit OTP as string
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Store OTP in database with 5-minute expiry
 * @param {string} email - User's email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<void>}
 */
const storeOTP = async (email, otp) => {
  // Calculate expiry time (5 minutes from now)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Delete any existing unused OTPs for this email
  await db
    .delete(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.used, false)
      )
    );

  // Insert new OTP
  await db.insert(otpCodes).values({
    email,
    otp,
    expiresAt,
    used: false,
  });

  console.log(`✅ OTP stored for ${email} | expires at ${expiresAt.toISOString()}`);
};

/**
 * Verify OTP code for a given email
 * @param {string} email - User's email address
 * @param {string} otp - OTP code to verify
 * @returns {Promise<boolean>} True if OTP is valid and not expired/used
 */
const verifyOTP = async (email, otp) => {
  // Find the most recent unused OTP for this email
  const records = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.otp, otp),
        eq(otpCodes.used, false)
      )
    )
    .orderBy(otpCodes.createdAt)
    .limit(1);

  if (records.length === 0) {
    console.log(`❌ OTP verification failed: No matching OTP found for ${email}`);
    return false;
  }

  const record = records[0];

  // Check if OTP has expired
  if (new Date() > new Date(record.expiresAt)) {
    console.log(`❌ OTP verification failed: OTP expired for ${email}`);
    return false;
  }

  // Mark OTP as used
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(eq(otpCodes.id, record.id));

  console.log(`✅ OTP verified successfully for ${email}`);
  return true;
};

/**
 * Clean up expired OTPs (should be run periodically)
 * @returns {Promise<number>} Number of records deleted
 */
const cleanupExpiredOTPs = async () => {
  const result = await db
    .delete(otpCodes)
    .where(lt(otpCodes.expiresAt, new Date()));

  console.log(`🧹 Cleaned up expired OTPs`);
  return result;
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  cleanupExpiredOTPs,
};
