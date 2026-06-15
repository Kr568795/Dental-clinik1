'use strict';

const { Op } = require('sequelize');
const { Appointment } = require('../models');
const { sendAppointmentToClinic, sendAppointmentToPatient } = require('../utils/mailer');

// Public: which time slots are already taken on a given date (no personal data).
exports.availability = async (req, res) => {
  const date = req.query.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Невалидна дата.' });
  }
  const items = await Appointment.findAll({
    where: { preferred_date: date, status: { [Op.ne]: 'cancelled' } },
    attributes: ['preferred_time'],
  });
  res.json({ booked: items.map((i) => i.preferred_time) });
};

// Public: create a new appointment request, then fire notification emails.
exports.create = async (req, res) => {
  const { full_name, phone, email, service, note, preferred_date, preferred_time } = req.body;
  const appt = await Appointment.create({
    full_name,
    phone,
    email: email || null,
    service,
    note: note || null,
    preferred_date,
    preferred_time,
  });

  // Email is best-effort — never fail the booking if mail is unavailable.
  Promise.allSettled([
    sendAppointmentToClinic(appt),
    sendAppointmentToPatient(appt),
  ]).catch(() => {});

  return res.status(201).json({ ok: true, id: appt.id });
};

// Admin: list all, optionally filtered by status / date.
exports.list = async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.date) where.preferred_date = req.query.date;
  const items = await Appointment.findAll({ where, order: [['created_at', 'DESC']] });
  return res.json(items);
};

// Admin: update status.
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['new', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(422).json({ error: 'Невалиден статус.' });
  }
  const appt = await Appointment.findByPk(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Заявката не е намерена.' });
  appt.status = status;
  await appt.save();
  return res.json({ ok: true });
};

// Admin: delete.
exports.remove = async (req, res) => {
  const n = await Appointment.destroy({ where: { id: req.params.id } });
  if (!n) return res.status(404).json({ error: 'Заявката не е намерена.' });
  return res.json({ ok: true });
};
