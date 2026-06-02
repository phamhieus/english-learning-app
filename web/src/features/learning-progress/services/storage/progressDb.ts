// Minimal promise-based IndexedDB wrapper for the Learning Progress feature.
// Kept self-contained (mirrors the pattern in video-shadowing/indexedDbRepository)
// so the feature owns its own database and stays decoupled from other modules.

export const DB_NAME = 'lingua-learning-progress';
export const DB_VERSION = 1;

export const STORES = {
  practiceSessions: 'practiceSessions',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.practiceSessions)) {
        const s = db.createObjectStore(STORES.practiceSessions, { keyPath: 'id' });
        s.createIndex('byProgram', 'program', { unique: false });
        s.createIndex('byCompletedAt', 'completedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
  return dbPromise;
}

function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        transaction.onerror = () => reject(transaction.error);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function idbPut<T>(store: StoreName, value: T): Promise<T> {
  return tx<IDBValidKey>(store, 'readwrite', (s) => s.put(value)).then(() => value);
}

export function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  return tx<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
}

export function idbGetAll<T>(store: StoreName): Promise<T[]> {
  return tx<T[]>(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>);
}

export function idbCount(store: StoreName): Promise<number> {
  return tx<number>(store, 'readonly', (s) => s.count() as IDBRequest<number>);
}

export function idbDelete(store: StoreName, key: string): Promise<void> {
  return tx<undefined>(store, 'readwrite', (s) => s.delete(key) as IDBRequest<undefined>).then(
    () => undefined,
  );
}

export function idbClear(store: StoreName): Promise<void> {
  return tx<undefined>(store, 'readwrite', (s) => s.clear() as IDBRequest<undefined>).then(
    () => undefined,
  );
}
