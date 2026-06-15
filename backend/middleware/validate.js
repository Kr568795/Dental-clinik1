'use strict';

const { validationResult } = require('express-validator');

// Collects express-validator errors and returns 422 with a clean payload.
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Невалидни данни.',
      details: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  return next();
};
