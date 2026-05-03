const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
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

    // Generate code
    const verificationCode = generateVerificationCode();

    // Find user or create a new one
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ phoneNumber });
      await user.save();
    }

    // Delete any existing OTP for this number
    await Otp.deleteMany({ phoneNumber });

    // Create a new OTP (ttl index will automatically delete it after 2 mins)
    const otp = new Otp({
      phoneNumber,
      code: verificationCode,
    });
    await otp.save();

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

    // Check if OTP exists for this phone number
    const otpRecord = await Otp.findOne({ phoneNumber });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new one.' });
    }

    // Check if code matches
    if (otpRecord.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Verification successful
    user.isVerified = true;
    await user.save();

    // Delete the used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
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
    const user = await User.findById(req.user.userId);
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
