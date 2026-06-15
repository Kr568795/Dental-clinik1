'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

const COOKIE_NAME = 'token';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ where: { username } });
  if (!admin) {
    return res.status(401).json({ error: 'Грешно потребителско име или парола.' });
  }
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Грешно потребителско име или парола.' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return res.json({ ok: true, username: admin.username });
};

exports.logout = async (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  return res.json({ ok: true });
};

exports.me = async (req, res) => {
  return res.json({ username: req.admin.username });
};
