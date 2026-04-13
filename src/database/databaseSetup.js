import sqlite3 from "sqlite3";
import path from 'node:path';
import fs from 'node:fs/promises';

// read the sql file content
async function readFileContent() {
  const filePath = path.resolve(process.cwd(), 'src', 'database', 'Calendar.sql');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data;

  } catch (err) {
    console.error("Error reading file:", err.message);
    throw new Error(`Cant find Calendar.sql at ${filePath}`);
  }
}

// Connect to the database and apply the schema from Calendar.sql.
async function setupDatabase(dbPath = process.env.DB_NAME || './src/database/calendar.db') {
  const sqlSetup = await readFileContent();

  if (!sqlSetup) {
    throw new Error("SQL setup string is empty or undefined.");
  }

  const db = await new Promise((resolve, reject) => {
    const connection = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Connection error:", err.message);
        reject(err);
        return;
      }

      console.log(`Connected to the SQLite database at: ${dbPath}`);
      resolve(connection);
    });
  });

  await new Promise((resolve, reject) => {
    db.exec(sqlSetup, (err) => {
      if (err) {
        console.error("Error executing SQL setup:", err.message);
        reject(err);
        return;
      }

      console.log("Database setup completed successfully.");
      resolve();
    });
  });

  await new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log("Tables actually created:", rows);
      resolve();
    });
  });

  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }

      console.log('Close the database connection.');
      resolve();
    });
  });
}

async function executeSetup() {
  try {
    await setupDatabase();
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  executeSetup();
}

export { readFileContent, setupDatabase };
