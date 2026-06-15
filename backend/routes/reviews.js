'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

const router = express.Router();

router.get('/', ctrl.listPublic);
router.get('/all', requireAuth, ctrl.listAll);
router.post(
  '/',
  requireAuth,
  [
    body('author_name').trim().notEmpty().withMessage('Въведете име.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Оценка 1–5.'),
    body('content').trim().notEmpty().withMessage('Въведете текст.'),
  ],
  validate,
  ctrl.create
);
router.patch('/:id/toggle', requireAuth, ctrl.toggle);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
