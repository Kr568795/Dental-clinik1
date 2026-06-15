'use strict';

// Generic CRUD controller for simple "collection" models that all share
// `visible` and `sort_order` (team, gallery, faq, why). Mirrors the pattern
// used by serviceController / reviewController.
module.exports = function makeCrud(Model, allowedFields) {
  const pick = (body) => {
    const out = {};
    allowedFields.forEach((f) => {
      if (body[f] !== undefined) out[f] = body[f];
    });
    return out;
  };

  return {
    // Public: only visible, ordered for display.
    listPublic: async (_req, res) => {
      const items = await Model.findAll({
        where: { visible: true },
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      });
      res.json(items);
    },
    // Admin: everything.
    listAll: async (_req, res) => {
      const items = await Model.findAll({ order: [['sort_order', 'ASC'], ['id', 'ASC']] });
      res.json(items);
    },
    create: async (req, res) => {
      const item = await Model.create(pick(req.body));
      res.status(201).json(item);
    },
    update: async (req, res) => {
      const item = await Model.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: 'Записът не е намерен.' });
      await item.update(pick(req.body));
      res.json(item);
    },
    remove: async (req, res) => {
      const n = await Model.destroy({ where: { id: req.params.id } });
      if (!n) return res.status(404).json({ error: 'Записът не е намерен.' });
      res.json({ ok: true });
    },
  };
};
