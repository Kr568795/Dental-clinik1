'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TeamMember = sequelize.define(
  'TeamMember',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    role: { type: DataTypes.STRING(200), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    image: { type: DataTypes.STRING(300), allowNull: true },
    visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: 'team_members', timestamps: false }
);

module.exports = TeamMember;
