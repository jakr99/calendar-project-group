import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { readFileContent, setupDatabase } from '../../src/database/databaseSetup.js';

const configuredDbName = process.env.DB_NAME;
const ownsSharedRoot = !configuredDbName;
const sharedRoot = ownsSharedRoot
  ? fs.mkdtempSync(path.join(os.tmpdir(), 'calendar-project-group-'))
  : path.dirname(path.resolve(process.cwd(), configuredDbName));
const sharedDbPath = ownsSharedRoot
  ? path.join(sharedRoot, 'shared-test.db')
  : path.resolve(process.cwd(), configuredDbName);

function configureSharedTestEnvironment() {
  fs.mkdirSync(path.dirname(sharedDbPath), { recursive: true });
  process.env.DB_NAME = sharedDbPath;
  return sharedDbPath;
}

async function resetSharedTestDatabase() {
  configureSharedTestEnvironment();
  const schema = await readFileContent();
  const { db } = await import('../../src/database/databaseAggregateFunctions');
  await db.exec(schema);
}

async function cleanupSharedTestDatabase() {
  const { db } = await import('../../src/database/databaseAggregateFunctions');
  await db.close();

  if (ownsSharedRoot) {
    await fsPromises.rm(sharedRoot, { recursive: true, force: true });
    return;
  }

  await fsPromises.rm(sharedDbPath, { force: true });
}

async function createIsolatedTestDatabase(prefix = 'isolated') {
  const dir = await fsPromises.mkdtemp(path.join(os.tmpdir(), `calendar-project-group-${prefix}-`));
  const dbPath = path.join(dir, 'test.db');

  await setupDatabase(dbPath);

  const { createDatabase } = await import('../../src/database/databaseAggregateFunctions');
  const db = createDatabase(dbPath);

  return {
    db,
    dbPath,
    async cleanup() {
      await db.close();
      await fsPromises.rm(dir, { recursive: true, force: true });
    },
  };
}

export {
  configureSharedTestEnvironment,
  createIsolatedTestDatabase,
  cleanupSharedTestDatabase,
  resetSharedTestDatabase,
  sharedDbPath,
};
