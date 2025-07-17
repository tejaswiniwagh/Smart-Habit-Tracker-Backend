const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('Auth Header:', authHeader);

  if (!authHeader) {
    console.log('❌ No Authorization header');
    return res.status(403).send('Access denied');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('❌ Token missing in header');
    return res.status(403).send('Access denied');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token Verified:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token Invalid:', err.message);
    res.status(401).send('Invalid token');
  }
};
