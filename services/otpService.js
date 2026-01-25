const OTP = require('../models/OTP');

/**
 * Verify OTP
 * @param {string} email - User's email
 * @param {string} otp - OTP code to verify
 * @param {string} purpose - Purpose of OTP (login, register, etc.)
 * @returns {Promise<Object>} - Verification result { success, message, otpDoc, attemptsRemaining }
 */
const verifyOTP = async (email, otp, purpose) => {
    try {
        // Find the OTP
        const otpDoc = await OTP.findOne({
            email,
            purpose,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 }); // Get the most recent OTP

        if (!otpDoc) {
            return {
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.'
            };
        }

        // Check attempts
        if (otpDoc.attempts >= 5) {
            // Mark as used if attempts exceeded to prevent further spam
            await OTP.updateOne({ _id: otpDoc._id }, { isUsed: true });
            return {
                success: false,
                message: 'Maximum verification attempts exceeded. Please request a new OTP.'
            };
        }

        // Verify OTP code
        if (otpDoc.otp !== otp) {
            otpDoc.attempts += 1;
            await otpDoc.save();

            return {
                success: false,
                message: 'Invalid OTP',
                attemptsRemaining: 5 - otpDoc.attempts
            };
        }

        // Mark OTP as used
        otpDoc.isUsed = true;
        await otpDoc.save();

        return {
            success: true,
            message: 'OTP verified successfully',
            otpDoc // Return the document in case caller needs it (e.g. for extra checks)
        };
    } catch (error) {
        console.error('Error in verifyOTP service:', error);
        throw error; // Let caller handle server errors
    }
};

module.exports = {
    verifyOTP
};
