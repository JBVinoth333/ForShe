const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'forshe_super_secret_jwt_key_change_in_production_2024';

/**
 * Express middleware - verifies JWT in Authorization header.
 * Attaches decoded user payload to req.user on success.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

/**
 * Verify a Socket.IO handshake token.
 * Returns decoded payload or throws.
 */
function verifySocketToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Sign a new JWT for a user.
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { authenticateToken, verifySocketToken, signToken };