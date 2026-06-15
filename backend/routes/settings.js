'use strict';

const express = require('express');
const requireAuth = require('../middleware/auth');
const ctrl = require('../controllers/settingController');

const router = express.Router();

router.get('/', ctrl.getAll);
router.put('/', requireAuth, ctrl.update);

module.exports = router;
