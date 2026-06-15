'use strict';

const { Op, fn, col } = require('sequelize');
const { Appointment } = require('../models');

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Admin: dashboard metrics — week/month counts, status breakdown, top services.
exports.summary = async (_req, res) => {
  const [week, month, total, byStatus, topServices] = await Promise.all([
    Appointment.count({ where: { created_at: { [Op.gte]: startOfWeek() } } }),
    Appointment.count({ where: { created_at: { [Op.gte]: startOfMonth() } } }),
    Appointment.count(),
    Appointment.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    Appointment.findAll({
      attributes: ['service', [fn('COUNT', col('id')), 'count']],
      group: ['service'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 3,
      raw: true,
    }),
  ]);

  const statusCounts = { new: 0, confirmed: 0, cancelled: 0 };
  byStatus.forEach((r) => {
    statusCounts[r.status] = Number(r.count);
  });

  return res.json({
    week,
    month,
    total,
    statusCounts,
    topServices: topServices.map((r) => ({ service: r.service, count: Number(r.count) })),
  });
};
