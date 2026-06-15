'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post(
  '/login',
  loginLimiter,
  [
    body('username').trim().notEmpty().withMessage('Въведете потребителско име.'),
    body('password').notEmpty().withMessage('Въведете парола.'),
  ],
  validate,
  ctrl.login
);

router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
