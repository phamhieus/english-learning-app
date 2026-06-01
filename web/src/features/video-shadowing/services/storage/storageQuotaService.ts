// Storage quota helpers + temp cleanup. Used before heavy imports to warn the
// user, and after jobs finish/fail to remove temporary files.

import { fileStorage } from './opfsFileStorage';
import { VideoShadowingError } from '../../utils/errorCodes';

export interface StorageEstimate {
  quotaBytes?: number;
  usageBytes?: number;
  /** Bytes free, when both quota + usage are known. */
  availableBytes?: number;
}

export async function estimateStorage(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return {};
  try {
    const { quota, usage } = await navigator.storage.estimate();
    const availableBytes = quota != null && usage != null ? quota - usage : undefined;
    return { quotaBytes: quota, usageBytes: usage, availableBytes };
  } catch {
    return {};
  }
}

/** Throw if the projected write clearly won't fit (leaves a safety margin). */
export async function assertSpaceFor(bytes: number): Promise<void> {
  const { availableBytes } = await estimateStorage();
  if (availableBytes != null && bytes > availableBytes * 0.9) {
    throw new VideoShadowingError('STORAGE_QUOTA_EXCEEDED');
  }
}

/** Remove all temp artifacts for a job (call on completion AND on failure). */
export async function cleanupJobTemp(jobId: string, fileNames: string[]): Promise<void> {
  await Promise.all(fileNames.map((name) => fileStorage.delete(`temp/${jobId}/${name}`)));
}
