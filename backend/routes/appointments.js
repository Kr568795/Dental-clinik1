'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimit');
const ctrl = require('../controllers/appointmentController');

const router = express.Router();

// Public — create a booking request.
router.post(
  '/',
  bookingLimiter,
  [
    body('full_name').trim().isLength({ min: 2, max: 200 }).withMessage('Въведете вашите имена.'),
    body('phone').trim().isLength({ min: 5, max: 20 }).withMessage('Въведете валиден телефон.'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Невалиден имейл.'),
    body('service').trim().notEmpty().withMessage('Изберете услуга.'),
    body('preferred_date').isISO8601().withMessage('Изберете дата.'),
    body('preferred_time').trim().notEmpty().withMessage('Изберете час.'),
    body('note').optional({ checkFalsy: true }).isLength({ max: 1000 }),
  ],
  validate,
  ctrl.create
);

// Public: booked slots for a date (so the calendar can grey them out).
router.get('/availability', ctrl.availability);

// Admin only.
router.get('/', requireAuth, ctrl.list);
router.patch('/:id', requireAuth, ctrl.updateStatus);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
