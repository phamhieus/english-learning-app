// Minimal promise-based IndexedDB wrapper (no external dependency). One database
// holds all Video Shadowing metadata object stores. Binary files are stored
// separately via opfsFileStorage (OPFS preferred, IndexedDB-blob fallback).

import { VideoShadowingError } from '../../utils/errorCodes';

export const DB_NAME = 'lingua-video-shadowing';
export const DB_VERSION = 1;

export const STORES = {
  lessons: 'lessons',
  segments: 'segments',
  sessions: 'sessions',
  attempts: 'attempts',
  jobs: 'jobs',
  files: 'files', // IndexedDB-blob fallback store
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new VideoShadowingError('INDEXED_DB_FAILED'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.lessons)) {
        db.createObjectStore(STORES.lessons, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.segments)) {
        const s = db.createObjectStore(STORES.segments, { keyPath: 'id' });
        s.createIndex('byLesson', 'lessonId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.sessions)) {
        const s = db.createObjectStore(STORES.sessions, { keyPath: 'id' });
        s.createIndex('byLesson', 'lessonId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.attempts)) {
        const s = db.createObjectStore(STORES.attempts, { keyPath: 'id' });
        s.createIndex('bySession', 'sessionId', { unique: false });
        s.createIndex('bySegment', 'segmentId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.jobs)) {
        const s = db.createObjectStore(STORES.jobs, { keyPath: 'id' });
        s.createIndex('byLesson', 'lessonId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.files)) {
        db.createObjectStore(STORES.files, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(new VideoShadowingError('INDEXED_DB_FAILED', req.error));
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
        transaction.onerror = () => reject(new VideoShadowingError('INDEXED_DB_FAILED', transaction.error));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new VideoShadowingError('INDEXED_DB_FAILED', request.error));
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

export function idbGetAllByIndex<T>(
  store: StoreName,
  indexName: string,
  key: string,
): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const transaction = db.transaction(store, 'readonly');
        const idx = transaction.objectStore(store).index(indexName);
        const request = idx.getAll(key) as IDBRequest<T[]>;
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new VideoShadowingError('INDEXED_DB_FAILED', request.error));
      }),
  );
}

export function idbDelete(store: StoreName, key: string): Promise<void> {
  return tx<undefined>(store, 'readwrite', (s) => s.delete(key) as IDBRequest<undefined>).then(() => undefined);
}
