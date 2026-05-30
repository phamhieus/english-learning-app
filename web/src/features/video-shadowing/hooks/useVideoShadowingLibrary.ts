// Loads library content: curated VOA lessons (from the static manifest) and the
// user's own imported lessons (from IndexedDB).

import { useCallback, useEffect, useState } from 'react';
import { getRandomVoaLessons } from '../services/video-source/builtInVoaResolver';
import { lessonRepo, deleteLessonCompletely } from '../services/storage/videoShadowingRepository';
import type { VideoShadowingLesson } from '../models/lesson';

interface UseVideoShadowingLibrary {
  voaLessons: VideoShadowingLesson[];
  myLessons: VideoShadowingLesson[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  removeLesson: (id: string) => Promise<void>;
}

export function useVideoShadowingLibrary(): UseVideoShadowingLibrary {
  // Random 10 picked once per mount → fresh selection each visit to the list.
  const [voaLessons] = useState<VideoShadowingLesson[]>(() => getRandomVoaLessons(10));
  const [myLessons, setMyLessons] = useState<VideoShadowingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    lessonRepo
      .getAll()
      .then((all) =>
        setMyLessons(
          all
            .filter((l) => l.sourceType !== 'BuiltInVoa')
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        ),
      )
      .catch(() => setError('Không tải được danh sách video của bạn.'))
      .finally(() => setLoading(false));
  }, []);

  // Initial + manual reload from IndexedDB (external-system sync).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(reload, [reload]);

  const removeLesson = useCallback(
    async (id: string) => {
      await deleteLessonCompletely(id);
      reload();
    },
    [reload],
  );

  return { voaLessons, myLessons, loading, error, reload, removeLesson };
}
