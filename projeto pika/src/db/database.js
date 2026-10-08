const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'escola.sqlite');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

let db;

async function getDb() {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const SQL = await initSqlJs({ locateFile: file => path.join(path.dirname(require.resolve('sql.js')), file) });
  db = fs.existsSync(DB_FILE) ? new SQL.Database(fs.readFileSync(DB_FILE)) : new SQL.Database();
  db.run(fs.readFileSync(SCHEMA_FILE, 'utf8'));
  // Migração automática para bancos criados em versões anteriores.
  const colunasUsuarios = query('PRAGMA table_info(usuarios)');
  if (!colunasUsuarios.some(c => c.name === 'disciplina')) {
    db.run("ALTER TABLE usuarios ADD COLUMN disciplina TEXT DEFAULT ''");
  }
  save();
  return db;
}

function save() {
  if (!db) return;
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return query(sql, params)[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  const id = get('SELECT last_insert_rowid() AS id').id;
  save();
  return id;
}

module.exports = { getDb, query, get, run, save, DB_FILE };
