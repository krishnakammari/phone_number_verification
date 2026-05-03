const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120, // TTL index
  },
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
