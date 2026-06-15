'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Service = sequelize.define(
  'Service',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    category: { type: DataTypes.STRING(120), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    price_min: { type: DataTypes.INTEGER, allowNull: true },
    price_max: { type: DataTypes.INTEGER, allowNull: true },
    icon: { type: DataTypes.STRING(100), allowNull: true },
    visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: 'services',
    timestamps: false,
  }
);

module.exports = Service;
