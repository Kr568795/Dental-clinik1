'use strict';

const rateLimit = require('express-rate-limit');

// Tight limiter for public booking submissions — guards against spam/abuse.
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Твърде много заявки. Опитайте отново след малко.' },
});

// Limiter for admin login attempts — slows brute-force.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Твърде много опити за вход. Опитайте по-късно.' },
});

module.exports = { bookingLimiter, loginLimiter };
