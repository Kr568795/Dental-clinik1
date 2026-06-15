'use strict';

const express = require('express');
const requireAuth = require('../middleware/auth');
const ctrl = require('../controllers/statsController');

const router = express.Router();

router.get('/', requireAuth, ctrl.summary);

module.exports = router;
