'use strict';

// Manual, DESTRUCTIVE reseed: `npm run seed`.
// ⚠️  Drops ALL tables and recreates the demo data — never run this in
// production after real data has been entered. First boot seeds automatically
// (non-destructively) via seedIfEmpty(), so you normally do NOT need this.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { sequelize } = require('../models');
const { seedFresh, counts } = require('./seed-core');

(async () => {
  try {
    const { username, password } = await seedFresh();
    console.log('🗃️  Таблиците са създадени и заредени:');
    console.log(`    ✅ ${counts.services} услуги · ${counts.reviews} отзива · ${counts.settings} настройки`);
    console.log(`    ✅ ${counts.team} екип · ${counts.gallery} галерия · ${counts.why} причини · ${counts.faq} FAQ`);
    console.log('\n👤  Admin акаунт:');
    console.log(`    Потребител: ${username}`);
    console.log(`    Парола:     ${password}`);
    console.log('    (сменете ADMIN_PASSWORD за production)\n');
    await sequelize.close();
    console.log('🌱  Seed завършен успешно.');
  } catch (err) {
    console.error('Seed грешка:', err);
    process.exit(1);
  }
})();
