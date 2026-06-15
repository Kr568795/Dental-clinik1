'use strict';

const path = require('path');
const { Sequelize } = require('sequelize');
const { DATA_DIR } = require('./paths');

// On Vercel (serverless) a managed Postgres is required. We auto-detect it:
// if a Postgres connection string is present, use Postgres even without
// DB_DIALECT being set explicitly.
const PG_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  '';
const dialect = process.env.DB_DIALECT || (PG_URL ? 'postgres' : 'sqlite');

let sequelize;

if (dialect === 'postgres') {
  // Production path: managed Postgres (Neon / Vercel Postgres / Railway).
  sequelize = new Sequelize(PG_URL, {
    dialect: 'postgres',
    logging: false,
    // Small pool — serverless functions are short-lived and many-instanced.
    pool: { max: 3, min: 0, idle: 10000, acquire: 30000 },
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
