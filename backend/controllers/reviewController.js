'use strict';

const { Review } = require('../models');

// Public: only visible reviews.
exports.listPublic = async (_req, res) => {
  const items = await Review.findAll({
    where: { visible: true },
    order: [['created_at', 'DESC']],
  });
  return res.json(items);
};

// Admin: all reviews.
exports.listAll = async (_req, res) => {
  const items = await Review.findAll({ order: [['created_at', 'DESC']] });
  return res.json(items);
};

exports.create = async (req, res) => {
  const { author_name, rating, content, date_text, visible } = req.body;
  const item = await Review.create({
    author_name,
    rating,
    content,
    date_text,
    visible: visible !== undefined ? visible : true,
  });
  return res.status(201).json(item);
};

exports.toggle = async (req, res) => {
  const item = await Review.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: 'Отзивът не е намерен.' });
  item.visible = !item.visible;
  await item.save();
  return res.json({ ok: true, visible: item.visible });
};

exports.remove = async (req, res) => {
  const n = await Review.destroy({ where: { id: req.params.id } });
  if (!n) return res.status(404).json({ error: 'Отзивът не е намерен.' });
  return res.json({ ok: true });
};
