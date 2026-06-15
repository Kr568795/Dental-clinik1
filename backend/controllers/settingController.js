'use strict';

const { Setting } = require('../models');

// Returns settings as a flat key→value object for easy front-end consumption.
exports.getAll = async (_req, res) => {
  const rows = await Setting.findAll();
  const obj = {};
  rows.forEach((r) => {
    obj[r.key] = r.value;
  });
  return res.json(obj);
};

// Admin: upsert any provided keys.
exports.update = async (req, res) => {
  const updates = req.body || {};
  const entries = Object.entries(updates);
  for (const [key, value] of entries) {
    await Setting.upsert({ key, value: value == null ? null : String(value) });
  }
  return res.json({ ok: true, updated: entries.length });
};
