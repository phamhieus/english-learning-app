// Binary file storage for large blobs (video, extracted audio, thumbnails,
// recordings). Prefers the Origin Private File System; falls back to storing
// Blobs in IndexedDB when OPFS is unavailable. Never uses localStorage.

import { idbDelete, idbGet, idbPut, STORES } from './indexedDbRepository';

const ROOT_DIR = 'video-shadowing';

interface StoredBlobRecord {
  id: string;
  blob: Blob;
  createdAt: string;
}

function hasOpfs(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
}

async function opfsRoot(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(ROOT_DIR, { create: true });
}

/** Split "a/b/c.bin" into directory segments + filename. */
function pathParts(fileId: string): { dirs: string[]; name: string } {
  const parts = fileId.split('/').filter(Boolean);
  const name = parts.pop() ?? fileId;
  return { dirs: parts, name };
}

async function resolveDir(create: boolean, dirs: string[]): Promise<FileSystemDirectoryHandle> {
  let dir = await opfsRoot();
  for (const d of dirs) dir = await dir.getDirectoryHandle(d, { create });
  return dir;
}

export interface FileStorage {
  readonly backend: 'opfs' | 'indexeddb';
  put(fileId: string, blob: Blob): Promise<void>;
  get(fileId: string): Promise<Blob | undefined>;
  /** Object URL for playback. Caller MUST revoke it when done. */
  getObjectUrl(fileId: string): Promise<string | undefined>;
  delete(fileId: string): Promise<void>;
}

const opfsStorage: FileStorage = {
  backend: 'opfs',
  async put(fileId, blob) {
    const { dirs, name } = pathParts(fileId);
    const dir = await resolveDir(true, dirs);
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  },
  async get(fileId) {
    try {
      const { dirs, name } = pathParts(fileId);
      const dir = await resolveDir(false, dirs);
      const handle = await dir.getFileHandle(name);
      return await handle.getFile();
    } catch {
      return undefined;
    }
  },
  async getObjectUrl(fileId) {
    const blob = await this.get(fileId);
    return blob ? URL.createObjectURL(blob) : undefined;
  },
  async delete(fileId) {
    try {
      const { dirs, name } = pathParts(fileId);
      const dir = await resolveDir(false, dirs);
      await dir.removeEntry(name);
    } catch {
      /* already gone */
    }
  },
};

const idbBlobStorage: FileStorage = {
  backend: 'indexeddb',
  async put(fileId, blob) {
    const record: StoredBlobRecord = { id: fileId, blob, createdAt: new Date().toISOString() };
    await idbPut(STORES.files, record);
  },
  async get(fileId) {
    const rec = await idbGet<StoredBlobRecord>(STORES.files, fileId);
    return rec?.blob;
  },
  async getObjectUrl(fileId) {
    const blob = await this.get(fileId);
    return blob ? URL.createObjectURL(blob) : undefined;
  },
  async delete(fileId) {
    await idbDelete(STORES.files, fileId);
  },
};

export const fileStorage: FileStorage = hasOpfs() ? opfsStorage : idbBlobStorage;

/** Logical file-id builders mirroring the spec's storage layout (§9). */
export const filePaths = {
  video: (lessonId: string) => `lessons/${lessonId}/source/original-video`,
  audio: (lessonId: string) => `lessons/${lessonId}/audio/normalized-audio.wav`,
  thumbnail: (lessonId: string) => `lessons/${lessonId}/thumbnail/cover.jpg`,
  attempt: (lessonId: string, sessionId: string, segmentId: string, attemptId: string) =>
    `lessons/${lessonId}/attempts/${sessionId}/${segmentId}/${attemptId}.webm`,
  temp: (jobId: string, name: string) => `temp/${jobId}/${name}`,
};
