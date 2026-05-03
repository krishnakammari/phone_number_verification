const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }
};

module.exports = {
  requireAuth
};
