'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define(
  'Admin',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
  },
  {
    tableName: 'admins',
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Admin;
