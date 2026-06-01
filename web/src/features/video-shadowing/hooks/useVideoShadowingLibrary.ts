// Filter-driven library data. Each filter change triggers an async API call
// (fetchVoaLessons / fetchMyLessons) — the UI shows the returned videos.

import { useCallback, useEffect, useState } from 'react';
import { fetchVoaLessons, fetchMyLessons, type LibraryFilters } from '../services/video-source/videoLibraryApi';
import { deleteLessonCompletely } from '../services/storage/videoShadowingRepository';
import type { BuiltInVoaLesson } from '../services/video-source/builtInVoaResolver';
import type { VideoShadowingLesson } from '../models/lesson';

interface UseVideoShadowingLibrary {
  voaLessons: BuiltInVoaLesson[];
  myLessons: VideoShadowingLesson[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  removeLesson: (id: string) => Promise<void>;
}

export function useVideoShadowingLibrary(filters: LibraryFilters): UseVideoShadowingLibrary {
  const [voaLessons, setVoaLessons] = useState<BuiltInVoaLesson[]>([]);
  const [myLessons, setMyLessons] = useState<VideoShadowingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { level, category, search } = filters;

  useEffect(() => {
    let cancelled = false;
    // Data-loading effect: fetch matching videos from the (local) library API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const query: LibraryFilters = { level, category, search };
    Promise.all([fetchVoaLessons(query), fetchMyLessons(query)])
      .then(([voa, mine]) => {
        if (cancelled) return;
        setVoaLessons(voa);
        setMyLessons(mine);
      })
      .catch(() => {
        if (!cancelled) setError('Không tải được danh sách video.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level, category, search, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const removeLesson = useCallback(
    async (id: string) => {
      await deleteLessonCompletely(id);
      reload();
    },
    [reload],
  );

  return { voaLessons, myLessons, loading, error, reload, removeLesson };
}
