import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Asterisk,
  CheckCircle,
  Cloud,
  Download,
  HardDrive,
  LoaderCircle,
  LogIn,
  Play,
  RefreshCw,
  Settings2,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import { Select } from '../../../components/Select';
import { useSettings } from '../../../components/useSettings';
import { useToast } from '../../../components/useToast';
import {
  fetchInstalledAiTools,
  getReadyTools,
  isToolReady,
  type InstalledAiAvailability,
  type InstalledAiTool,
} from '../../../services/local-ai-helper';

const TOOL_ICON: Record<string, typeof Terminal> = {
  'codex-cli': Terminal,
  'gemini-cli': Sparkles,
  'claude-code': Asterisk,
};

const STATUS_META: Record<InstalledAiTool['status'], { label: string; tone: string; icon: typeof CheckCircle }> = {
  ready: { label: 'Ready', tone: 'text-green-600 dark:text-green-400', icon: CheckCircle },
  login_required: { label: 'Sign in required', tone: 'text-amber-600 dark:text-amber-400', icon: LogIn },
  not_installed: { label: 'Not installed', tone: 'text-slate-400', icon: Download },
  installed: { label: 'Installed', tone: 'text-slate-500 dark:text-slate-400', icon: Download },
  checking: { label: 'Checking…', tone: 'text-slate-400', icon: LoaderCircle },
  disabled: { label: 'Disabled', tone: 'text-slate-400', icon: AlertTriangle },
  error: { label: 'Error', tone: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
};

function StatusBadge({ status }: { status: InstalledAiTool['status'] }) {
  const meta = STATUS_META[status] ?? STATUS_META.error;
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold shrink-0', meta.tone)}>
      <Icon className={cn('w-4 h-4', status === 'checking' && 'animate-spin')} /> {meta.label}
    </span>
  );
}

function GhostBtn({
  icon: Icon,
  children,
  onClick,
  primary,
}: {
  icon: typeof RefreshCw;
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors',
        primary
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-100 bg-white dark:bg-slate-900'
      )}
    >
      <Icon className="w-3.5 h-3.5" /> {children}
    </button>
  );
}

// One row of the runtime radio group. Footer actions render OUTSIDE the
// clickable header so buttons are never nested inside the radio target.
function RuntimeRadioRow({
  selected,
  disabled,
  onSelect,
  icon: Icon,
  iconClass,
  title,
  badge,
  description,
  footer,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  icon: typeof Cloud;
  iconClass: string;
  title: string;
  badge?: ReactNode;
  description: string;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'p-5 transition-colors',
        disabled
          ? 'bg-slate-50/60 dark:bg-slate-900/40'
          : selected
            ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
      )}
    >
      <div
        role="radio"
        aria-checked={selected}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onSelect}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn('flex gap-4 items-start outline-none', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
      >
        <span
          className={cn(
            'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
            disabled
              ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
              : selected
                ? 'border-indigo-500'
                : 'border-slate-300 dark:border-slate-600'
          )}
        >
          {selected && !disabled && <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'flex items-center gap-2 font-bold',
                disabled ? 'text-slate-500' : 'text-slate-800 dark:text-slate-100'
              )}
            >
              <Icon className={cn('w-4 h-4', disabled ? 'text-slate-400' : iconClass)} /> {title}
            </span>
            {badge}
          </div>
          <p className={cn('text-sm mt-1.5 leading-snug', disabled ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400')}>
            {description}
          </p>
        </div>
      </div>
      {footer && <div className="mt-4 pl-9">{footer}</div>}
    </div>
  );
}

function unavailableReason(tool: InstalledAiTool | undefined, availability: InstalledAiAvailability): string {
  if (availability === 'helper_unavailable') return 'The local AI service is not running.';
  if (!tool) return 'No installed AI tool is ready on this computer.';
  switch (tool.status) {
    case 'login_required':
      return `${tool.name} requires sign-in before it can be used.`;
    case 'not_installed':
      return `${tool.name} is not installed on this computer.`;
    case 'disabled':
      return `${tool.name} has been disabled.`;
    case 'error':
      return tool.errorMessage ? `${tool.name}: ${tool.errorMessage}` : `${tool.name} reported an error.`;
    default:
      return `${tool.name} is currently not ready.`;
  }
}

/**
 * AI Runtime picker — Cloud AI vs Installed AI, per the availability spec:
 * Installed AI is only selectable while >= 1 local tool reports `ready`,
 * and the runtime is never switched automatically without user confirmation.
 */
export function AiRuntimeSection({ cloudConfig }: { cloudConfig: ReactNode }) {
  const toast = useToast();
  const {
    aiRuntimeType, setAiRuntimeType,
    selectedInstalledToolId, setSelectedInstalledToolId,
  } = useSettings();

  const [availability, setAvailability] = useState<InstalledAiAvailability>('checking');
  const [tools, setTools] = useState<InstalledAiTool[]>([]);
  // Bumping the sequence re-runs the helper check effect below.
  const [checkSeq, setCheckSeq] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const detected = await fetchInstalledAiTools();
        if (cancelled) return;
        setTools(detected);
        setAvailability(getReadyTools(detected).length > 0 ? 'available' : 'unavailable');
      } catch {
        if (cancelled) return;
        setTools([]);
        setAvailability('helper_unavailable');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [checkSeq]);

  // "Check again" — flips back to the checking state before re-querying.
  const runCheck = useCallback(() => {
    setAvailability('checking');
    setCheckSeq((seq) => seq + 1);
  }, []);

  const readyTools = getReadyTools(tools);
  const canSelectInstalled = availability === 'available' && readyTools.length > 0;
  const savedTool = tools.find((t) => t.id === selectedInstalledToolId);
  const isSavedToolReady = !!savedTool && isToolReady(savedTool);
  const checkDone = availability !== 'checking';

  // Spec §6: the previously selected Installed AI runtime is no longer usable.
  // Warn and wait for explicit confirmation — never switch silently.
  const showSelectedToolWarning =
    checkDone && aiRuntimeType === 'installed' && (!canSelectInstalled || (!!selectedInstalledToolId && !isSavedToolReady));

  const notReadyAction = (label: string) => () =>
    toast.info(`${label} is not available yet — the Install AI screen ships in a later update.`);

  let installedBadge: ReactNode = null;
  let installedDesc: string;
  let installedFooter: ReactNode = null;

  if (availability === 'checking') {
    installedDesc = 'Checking installed AI tools…';
    installedBadge = (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> Checking…
      </span>
    );
  } else if (availability === 'available') {
    installedDesc = 'Use an AI tool installed on this computer.';
    installedBadge = (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3.5 h-3.5" /> {readyTools.length} {readyTools.length === 1 ? 'tool' : 'tools'} ready
      </span>
    );
  } else if (availability === 'helper_unavailable') {
    installedDesc = 'The local AI service is not running. Start it to detect installed AI tools.';
    installedFooter = (
      <div className="flex flex-wrap gap-2">
        <GhostBtn icon={Play} primary onClick={notReadyAction('Setup')}>Start setup</GhostBtn>
        <GhostBtn icon={RefreshCw} onClick={runCheck}>Check again</GhostBtn>
      </div>
    );
  } else {
    installedDesc = 'No installed AI tool is ready. Install or sign in to an AI tool before using this option.';
    installedFooter = (
      <div className="flex flex-wrap gap-2">
        <GhostBtn icon={Settings2} onClick={notReadyAction('Manage installed AI')}>Manage installed AI</GhostBtn>
        <GhostBtn icon={RefreshCw} onClick={runCheck}>Check again</GhostBtn>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">Choose where AI requests run.</p>

      {/* Single radio group — exactly one runtime is active. */}
      <div
        role="radiogroup"
        aria-label="AI Runtime"
        className="rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden"
      >
        <RuntimeRadioRow
          selected={aiRuntimeType === 'cloud'}
          onSelect={() => setAiRuntimeType('cloud')}
          icon={Cloud}
          iconClass="text-indigo-500"
          title="Cloud AI"
          description="Use an API provider configured in the application."
        />
        <RuntimeRadioRow
          selected={aiRuntimeType === 'installed'}
          disabled={!canSelectInstalled}
          onSelect={() => {
            if (!canSelectInstalled) return;
            setAiRuntimeType('installed');
            if (!isSavedToolReady && readyTools[0]) setSelectedInstalledToolId(readyTools[0].id);
          }}
          icon={HardDrive}
          iconClass="text-sky-500"
          title="Installed AI"
          badge={installedBadge}
          description={installedDesc}
          footer={installedFooter}
        />
      </div>

      {/* Saved Installed AI runtime is no longer usable — ask, don't switch. */}
      {showSelectedToolWarning && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 p-5">
          <p className="font-bold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Your selected Installed AI tool is currently unavailable.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1.5">
            {unavailableReason(savedTool, availability)}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <GhostBtn icon={Cloud} primary onClick={() => setAiRuntimeType('cloud')}>Switch to Cloud AI</GhostBtn>
            <GhostBtn icon={RefreshCw} onClick={runCheck}>Check again</GhostBtn>
            <GhostBtn icon={Settings2} onClick={notReadyAction('Manage installed AI')}>Manage installed AI</GhostBtn>
          </div>
        </div>
      )}

      {/* Cloud AI provider config — only while Cloud AI is the active runtime. */}
      {aiRuntimeType === 'cloud' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Cloud className="w-4 h-4" /> Cloud AI provider
          </p>
          {cloudConfig}
        </div>
      )}

      {/* Installed AI config — only when the runtime is active and usable. */}
      {aiRuntimeType === 'installed' && canSelectInstalled && (
        <div className="rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/40 dark:bg-sky-950/20 p-5 space-y-5">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-500 flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> Installed AI runtime
          </p>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Installed Tool</label>
            <Select
              value={isSavedToolReady ? selectedInstalledToolId : ''}
              onChange={(e) => setSelectedInstalledToolId(e.target.value)}
            >
              {readyTools.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <p className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Available tools</p>
            <ul className="space-y-2">
              {tools.map((t) => {
                const ToolIcon = TOOL_ICON[t.id] ?? Terminal;
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <ToolIcon className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">{t.name}</span>
                      {t.version && <span className="text-xs text-slate-400">v{t.version}</span>}
                    </span>
                    <StatusBadge status={t.status} />
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Only tools reporting <span className="font-semibold text-slate-600 dark:text-slate-300">Ready</span> can be
              selected as a runtime.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
