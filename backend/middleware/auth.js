'use strict';

const jwt = require('jsonwebtoken');

// Verifies the JWT carried in the HTTP-only "token" cookie.
// Attaches the decoded payload to req.admin and blocks otherwise.
module.exports = function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Не сте удостоверени.' });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Невалидна или изтекла сесия.' });
  }
};
