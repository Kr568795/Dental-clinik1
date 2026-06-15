'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Appointment = sequelize.define(
  'Appointment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    full_name: { type: DataTypes.STRING(200), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(200), allowNull: true },
    service: { type: DataTypes.STRING(100), allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
    preferred_date: { type: DataTypes.DATEONLY, allowNull: false },
    preferred_time: { type: DataTypes.STRING(10), allowNull: false },
    status: {
      type: DataTypes.ENUM('new', 'confirmed', 'cancelled'),
      defaultValue: 'new',
    },
  },
  {
    tableName: 'appointments',
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Appointment;
