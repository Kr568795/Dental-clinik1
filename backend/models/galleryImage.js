'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GalleryImage = sequelize.define(
  'GalleryImage',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    image: { type: DataTypes.STRING(300), allowNull: false },
    caption: { type: DataTypes.STRING(200), allowNull: true },
    visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: 'gallery_images', timestamps: false }
);

module.exports = GalleryImage;
