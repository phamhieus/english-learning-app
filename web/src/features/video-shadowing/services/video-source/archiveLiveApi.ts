// Live Internet Archive library — queried directly from the browser.
//
// archive.org's advancedsearch + metadata endpoints send `Access-Control-Allow-
// Origin: *`, so the browser can call them with no backend. (The /download files
// — including subtitles — are NOT CORS-enabled, so per-segment captions still
// have to be prepared by the curate script; live items here are browse/stream.)

import { classifyCefr, type CefrLevel } from '../../utils/cefr';

const SEARCH_ENDPOINT = 'https://archive.org/advancedsearch.php';

// Default landing query: public-domain educational shorts that carry captions —
// neutral, English, safe for an English-learning audience.
const DEFAULT_QUERY =
  'collection:(prelinger) AND mediatype:(movies) AND format:(SubRip)';

export interface ArchiveLibraryItem {
  identifier: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  sourcePageUrl: string;
  /** e.g. "0:09:45" when the item reports it. */
  runtime?: string;
  topic?: string;
  /** Quick CEFR estimate from the title + description (refined from the full
   *  transcript by the proxy when the lesson is opened). 'Auto' = unknown. */
  level: CefrLevel | 'Auto';
}

interface ArchiveSearchDoc {
  identifier: string;
  title?: string;
  description?: string | string[];
  runtime?: string;
  subject?: string | string[];
}

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

function toItem(doc: ArchiveSearchDoc): ArchiveLibraryItem {
  const title = doc.title?.trim() || doc.identifier;
  const description = first(doc.description);
  return {
    identifier: doc.identifier,
    title,
    description,
    thumbnailUrl: `https://archive.org/services/img/${doc.identifier}`,
    sourcePageUrl: `https://archive.org/details/${doc.identifier}`,
    runtime: doc.runtime,
    topic: first(doc.subject),
    level: classifyCefr(`${title}. ${description ?? ''}`),
  };
}

// Search the Archive live. Empty query → the curated default landing set.
export async function searchArchiveItems(
  query: string,
  rows = 30,
  signal?: AbortSignal,
): Promise<ArchiveLibraryItem[]> {
  const trimmed = query.trim();
  // Always require a SubRip caption track so every listed item is actually
  // shadowable (the proxy needs captions to build segments); the empty state
  // uses the safe educational default above.
  const q = trimmed
    ? `(${trimmed}) AND mediatype:(movies) AND format:(SubRip)`
    : DEFAULT_QUERY;

  const params = new URLSearchParams();
  params.set('q', q);
  for (const fl of ['identifier', 'title', 'description', 'runtime', 'subject']) {
    params.append('fl[]', fl);
  }
  params.set('rows', String(rows));
  params.set('page', '1');
  params.set('output', 'json');
  // Bias toward popular (better-quality) items for the default set.
  if (!trimmed) params.append('sort[]', 'downloads desc');

  const res = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Archive search failed (${res.status})`);
  const data: { response?: { docs?: ArchiveSearchDoc[] } } = await res.json();
  return (data.response?.docs ?? [])
    .filter((d) => d.identifier)
    .map(toItem);
}
