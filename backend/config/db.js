'use strict';

const path = require('path');
const { Sequelize } = require('sequelize');
const { DATA_DIR } = require('./paths');

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'postgres') {
  // Production path: switch DB_DIALECT=postgres and provide DATABASE_URL.
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions:
      process.env.NODE_ENV === 'production'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  });
} else {
  // Default path: file-based SQLite stored in DATA_DIR (a persistent Volume
  // in production, backend/data locally).
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(DATA_DIR, 'mnl.sqlite'),
    logging: false,
  });
}

module.exports = sequelize;
