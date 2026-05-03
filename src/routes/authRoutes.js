const express = require('express');
const router = express.Router();
const { requestVerification, verifyCode, getProfile } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Route to request SMS verification
router.post('/request-verification', requestVerification);

// Route to verify the code
router.post('/verify-code', verifyCode);

// Protected route to test JWT authorization
router.get('/profile', requireAuth, getProfile);

module.exports = router;
