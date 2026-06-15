'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const ctrl = require('../controllers/serviceController');

const router = express.Router();

const serviceValidators = [
  body('name').trim().notEmpty().withMessage('Въведете име на услугата.'),
  body('price_min').optional({ nullable: true }).isInt({ min: 0 }),
  body('price_max').optional({ nullable: true }).isInt({ min: 0 }),
];

router.get('/', ctrl.listPublic);
router.get('/all', requireAuth, ctrl.listAll);
router.post('/', requireAuth, serviceValidators, validate, ctrl.create);
router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
