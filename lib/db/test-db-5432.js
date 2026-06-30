import pg from 'pg';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('../../.env', 'utf-8');
let dbUrl = '';
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)?\s*$/);
  if (match) {
    dbUrl = match[1];
    if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) dbUrl = dbUrl.slice(1, -1);
    if (dbUrl.startsWith("'") && dbUrl.endsWith("'")) dbUrl = dbUrl.slice(1, -1);
  }
}

// Replace port 6543 with 5432
dbUrl = dbUrl.replace(':6543', ':5432');

console.log("Connecting to", dbUrl.replace(/:[^:]*@/, ':***@'));
const client = new pg.Client({ connectionString: dbUrl });
client.connect()
  .then(() => {
    console.log("Connected successfully to 5432!");
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log(res.rows);
    client.end();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit(1);
  });
