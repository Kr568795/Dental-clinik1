'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WhyReason = sequelize.define(
  'WhyReason',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: true },
    visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: 'why_reasons', timestamps: false }
);

module.exports = WhyReason;
