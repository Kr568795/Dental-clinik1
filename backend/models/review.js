'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Review = sequelize.define(
  'Review',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    author_name: { type: DataTypes.STRING(200), allowNull: false },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    content: { type: DataTypes.TEXT, allowNull: false },
    date_text: { type: DataTypes.STRING(100), allowNull: true },
    visible: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'reviews',
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Review;
