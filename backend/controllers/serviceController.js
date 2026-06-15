'use strict';

const { Service } = require('../models');

// Public: visible services ordered for display.
exports.listPublic = async (_req, res) => {
  const items = await Service.findAll({
    where: { visible: true },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
  });
  return res.json(items);
};

// Admin: every service (including hidden).
exports.listAll = async (_req, res) => {
  const items = await Service.findAll({ order: [['sort_order', 'ASC'], ['id', 'ASC']] });
  return res.json(items);
};

exports.create = async (req, res) => {
  const { name, category, description, price_min, price_max, icon, visible, sort_order } = req.body;
  const item = await Service.create({
    name,
    category,
    description,
    price_min,
    price_max,
    icon,
    visible: visible !== undefined ? visible : true,
    sort_order: sort_order || 0,
  });
  return res.status(201).json(item);
};

exports.update = async (req, res) => {
  const item = await Service.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Услугата не е намерена.' });
  await item.update(req.body);
  return res.json(item);
};

exports.remove = async (req, res) => {
  const n = await Service.destroy({ where: { id: req.params.id } });
  if (!n) return res.status(404).json({ error: 'Услугата не е намерена.' });
  return res.json({ ok: true });
};
