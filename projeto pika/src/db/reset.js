const fs = require('fs');
const { DB_FILE } = require('./database');
if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
console.log('Banco apagado. Execute npm start para recriar e depois use o seed automático.');
