'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FaqItem = sequelize.define(
  'FaqItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    question: { type: DataTypes.STRING(300), allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: false },
    visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: 'faq_items', timestamps: false }
);

module.exports = FaqItem;
