'use strict';

// Wires the four editable collections (team, gallery, faq, why) using the
// generic CRUD controller. Each exposes the same REST shape as /api/services.
const express = require('express');
const requireAuth = require('../middleware/auth');
const makeCrud = require('../controllers/crudController');
const { TeamMember, GalleryImage, FaqItem, WhyReason } = require('../models');

function crudRouter(Model, fields) {
  const ctrl = makeCrud(Model, fields);
  const r = express.Router();
  r.get('/', ctrl.listPublic);
  r.get('/all', requireAuth, ctrl.listAll);
  r.post('/', requireAuth, ctrl.create);
  r.put('/:id', requireAuth, ctrl.update);
  r.delete('/:id', requireAuth, ctrl.remove);
  return r;
}

module.exports = {
  team: crudRouter(TeamMember, ['name', 'role', 'bio', 'image', 'visible', 'sort_order']),
  gallery: crudRouter(GalleryImage, ['image', 'caption', 'visible', 'sort_order']),
  faq: crudRouter(FaqItem, ['question', 'answer', 'visible', 'sort_order']),
  why: crudRouter(WhyReason, ['title', 'text', 'visible', 'sort_order']),
};
