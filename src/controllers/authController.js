const jwt = require('jsonwebtoken');
const User = require('../models/User');
const twilioClient = require('../utils/twilioClient');

/**
 * Generate a random 6-digit code
 * @returns {string}
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Request a verification code to be sent to a phone number
 */
const requestVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate code and expiration (2 minutes from now)
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Find user or create a new one
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ phoneNumber });
    }

    // Update code and expiration
    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = expiresAt;
    // user.isVerified = false; // Optionally reset verification status if needed
    await user.save();

    // Send the SMS
    const message = `Your verification code is: ${verificationCode}. It will expire in 2 minutes.`;
    const smsSent = await twilioClient.sendSMS(phoneNumber, message);

    if (!smsSent) {
      return res.status(500).json({ error: 'Failed to send verification SMS. Please try again later.' });
    }

    return res.status(200).json({ message: 'Verification code sent successfully' });

  } catch (error) {
    console.error('Error in requestVerification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verify the code entered by the user
 */
const verifyCode = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      return res.status(400).json({ error: 'No verification request found for this number' });
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if code has expired
    if (Date.now() > user.verificationCodeExpiresAt.getTime()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Verification successful
    user.isVerified = true;
    user.verificationCode = undefined; // Clear the code
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '2m' }
    );

    return res.status(200).json({
      message: 'Phone number verified successfully',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Error in verifyCode:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current user profile (Protected route)
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-verificationCode -verificationCodeExpiresAt');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  requestVerification,
  verifyCode,
  getProfile,
};
