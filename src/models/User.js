const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
  },
  verificationCodeExpiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
