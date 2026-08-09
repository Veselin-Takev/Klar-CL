import { openDB } from 'idb';

const DB_NAME = 'klar-offline-db';
const STORE_NAME = 'action-queue';
const LOG_STORE = 'sync-logs';

export async function initDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(LOG_STORE)) {
        db.createObjectStore(LOG_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function queueAction(action: { type: string; payload: any; timestamp: number }) {
  const db = await initDB();
  await db.add(STORE_NAME, action);
}

export async function getQueuedActions() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function clearQueue() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}

export async function removeQueuedAction(id: number) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function logSyncEvent(log: { type: string; queuedAt: number; syncedAt: number; latencyMs: number; status: 'success' | 'error' }) {
  try {
    const db = await initDB();
    await db.add(LOG_STORE, log);
  } catch(e) {
    console.error("Failed to log sync event", e);
  }
}

export async function getSyncLogs() {
  try {
    const db = await initDB();
    return await db.getAll(LOG_STORE);
  } catch(e) {
    return [];
  }
}

export async function clearSyncLogs() {
  try {
    const db = await initDB();
    await db.clear(LOG_STORE);
  } catch(e) {}
}
