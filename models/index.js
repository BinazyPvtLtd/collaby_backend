import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import sequelize from '../config/database.js';
import { Sequelize } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const basename = __filename;

const db = {};
const files = readdirSync(__dirname).filter(file => {
  return (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    file.indexOf('.test.js') === -1
  );
});

// Dynamic imports are avoided for simplicity; models are loaded via direct imports elsewhere.
// This index exists for compatibility only.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;