import { useState, useRef } from 'react';
import { Image, Clock, Sparkles, RefreshCw, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../components/classNames';
import { OptimizedImage } from '../components/OptimizedImage';
import { thumbnailUrl, preloadImage } from '../components/imageUrl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useSettings } from '../components/useSettings';
import { useToast } from '../components/useToast';
import { generatePictureDescriptions } from '../services/ai';
import {
  PICTURE_CATEGORIES,
  PICTURE_LEVELS,
  getFilteredPictures,
  samplePictures,
} from '../features/picture-description/data/sample-images';
import type { PictureDescriptionPractice } from '../features/picture-description/types/picture-description.types';

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shrink-0 whitespace-nowrap',
      active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    )}
  >
    {label}
  </button>
);

// AI picture generation is hidden for now — flip to re-enable the toolbar button.
const SHOW_AI_GENERATE = false;

const PictureDescriptionList = () => {
  const navigate = useNavigate();
  const settings = useSettings();
  const { error: showError } = useToast();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLevel, setActiveLevel] = useState('All');
  const [practices, setPractices] = useState<PictureDescriptionPractice[]>(samplePictures);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Warm the full-size image the moment a card shows intent to be opened,
  // so the practice screen can paint it instantly (cache hit).
  const prefetchFull = (practice: PictureDescriptionPractice) => preloadImage(practice.imageUrl);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.gs-pd-header', { y: 28, autoAlpha: 0, duration: 0.55, ease: 'power3.out' });
    gsap.from('.gs-pd-filters', { y: 16, autoAlpha: 0, duration: 0.45, ease: 'power3.out', delay: 0.15 });
  }, { scope: containerRef });

  useGSAP(() => {
    if (!practices.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.gs-pd-card', {
      y: 32, autoAlpha: 1, scale: 0.97,
      stagger: { amount: 0.4, from: 'start' },
      duration: 0.45, ease: 'back.out(1.4)',
    });
  }, { scope: containerRef, dependencies: [practices, activeCategory, activeLevel] });

  const filtered = getFilteredPictures(activeCategory, activeLevel);
  const displayPractices = activeCategory === 'All' && activeLevel === 'All' ? practices : filtered;

  const handleGenerateAI = async () => {
    setLoading(true);
    try {
      const result = await generatePictureDescriptions(settings, activeCategory === 'All' ? 'mixed everyday scenes' : activeCategory);
      if (result.length > 0) {
        setPractices(result as PictureDescriptionPractice[]);
      }
    } catch {
      showError('Failed to generate AI pictures. Using sample images.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="animate-in fade-in duration-300">
      <div className="gs-pd-header flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              TOEIC
            </span>
            <span className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Speaking · Q3</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Describe a Picture</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Look at the photo, prepare for 45 seconds, then describe it for 30 seconds.
          </p>
        </div>
        {SHOW_AI_GENERATE && (
          <button
            onClick={handleGenerateAI}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            {loading ? 'Generating...' : 'Generate with AI'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="gs-pd-filters space-y-4 mb-8">
        <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible no-scrollbar">
          <FilterChip label="All scenes" active={activeCategory === 'All'} onClick={() => setActiveCategory('All')} />
          {PICTURE_CATEGORIES.map((c) => (
            <FilterChip key={c} label={c} active={activeCategory === c} onClick={() => setActiveCategory(c)} />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible no-scrollbar">
          <FilterChip label="Any difficulty" active={activeLevel === 'All'} onClick={() => setActiveLevel('All')} />
          {PICTURE_LEVELS.map((l) => (
            <FilterChip key={l} label={l} active={activeLevel === l} onClick={() => setActiveLevel(l)} />
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Generating pictures...</h3>
          <p className="text-slate-500 dark:text-slate-400">AI is crafting new practice materials.</p>
        </div>
      ) : displayPractices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayPractices.map((practice) => (
            <div
              key={practice.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/speaking/picture/practice', { state: { practice } })}
              onMouseEnter={() => prefetchFull(practice)}
              onFocus={() => prefetchFull(practice)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate('/speaking/picture/practice', { state: { practice } });
                }
              }}
              className="gs-pd-card glass-card rounded-2xl shadow group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 flex flex-col overflow-hidden cursor-pointer"
            >
              {/* Image — list cards only ever load the small thumbnail, lazily. */}
              <div className="relative aspect-video overflow-hidden">
                <OptimizedImage
                  src={practice.thumbnailUrl ?? thumbnailUrl(practice.imageUrl)}
                  alt={practice.title}
                  width={320}
                  height={180}
                  className="h-full w-full"
                />
                <span
                  className={cn(
                    'absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider',
                    practice.level === 'Easy'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : practice.level === 'Medium'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}
                >
                  {practice.level}
                </span>
                <span className="absolute top-3 right-3 bg-white/85 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
                  {practice.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold mb-3 line-clamp-2 leading-snug">{practice.title}</h3>

                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4 mt-auto">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {practice.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> TOEIC vocab
                  </span>
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate('/speaking/picture/practice', { state: { practice } });
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 py-3 rounded-xl font-semibold transition-colors"
                >
                  <Mic className="w-4 h-4" /> Describe
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Image className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No pictures found</h3>
          <p className="text-slate-500 dark:text-slate-400">Try a different filter or generate new pictures with AI.</p>
        </div>
      )}
    </div>
  );
};

export default PictureDescriptionList;
