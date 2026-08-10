import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '@/game/sound';

type Props = {
  onComplete: (time: number) => void;
  onAbort: () => void;
};

type Target = { x: number; y: number; id: number };

const TOTAL_TARGETS = 5;    // number of targets to lock in sequence
const LOCK_ZONE = 8;        // distance (%) to start locking
const LOCK_TIME = 2200;     // ms holding in-zone to fully lock
const DRIFT_INTERVAL = 120; // ms between drift steps
const DRIFT_SPEED = 0.35;   // max % per step

export default function NavigationMinigame({ onComplete, onAbort }: Props) {
  const [target, setTarget] = useState<Target>(() => ({
    x: 25 + Math.random() * 50,
    y: 25 + Math.random() * 50,
    id: 0,
  }));
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const [lockProgress, setLockProgress] = useState(0); // 0–100
  const [locked, setLocked] = useState(false);
  const [lockedCount, setLockedCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const startTimeRef = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  // Refs for the drift + lock interval so it always sees fresh values
  const targetRef = useRef(target);
  useEffect(() => { targetRef.current = target; }, [target]);
  const cursorRef = useRef(cursor);
  useEffect(() => { cursorRef.current = cursor; }, [cursor]);
  const lockedRef = useRef(locked);
  useEffect(() => { lockedRef.current = locked; }, [locked]);
  const completedRef = useRef(false);
  const lockedCountRef = useRef(0);
  useEffect(() => { lockedCountRef.current = lockedCount; }, [lockedCount]);

  const spawnTarget = useCallback((id: number): Target => ({
    x: 25 + Math.random() * 50,
    y: 25 + Math.random() * 50,
    id,
  }), []);

  // Track cursor position across the entire nav field
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = document.getElementById('nav-field');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setCursor({ x, y });
    };
    const el = document.getElementById('nav-field');
    el?.addEventListener('pointermove', onMove);
    return () => el?.removeEventListener('pointermove', onMove);
  }, []);

  // Drift + lock loop: target wanders slightly, lock progress accrues while
  // the reticle stays inside the zone and decays when it leaves
  useEffect(() => {
    const t = setInterval(() => {
      if (lockedRef.current) return;

      // Drift target in a random walk, clamped to the field
      setTarget((tg) => {
        const nx = Math.max(12, Math.min(88, tg.x + (Math.random() - 0.5) * DRIFT_SPEED * 2));
        const ny = Math.max(12, Math.min(88, tg.y + (Math.random() - 0.5) * DRIFT_SPEED * 2));
        return { ...tg, x: nx, y: ny };
      });

      // Evaluate lock using the latest cursor vs latest target
      const dx = cursorRef.current.x - targetRef.current.x;
      const dy = cursorRef.current.y - targetRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      setLockProgress((p) => {
        if (dist < LOCK_ZONE) {
          if (p === 0) sfx.navTracking();
          const next = p + (DRIFT_INTERVAL / LOCK_TIME) * 100;
          if (next >= 100) {
            const count = lockedCountRef.current + 1;
            sfx.navLocked();
            if (count >= TOTAL_TARGETS) {
              if (!completedRef.current) {
                completedRef.current = true;
                setLocked(true);
                const elapsed = Date.now() - startTimeRef.current;
                setTimeout(() => onCompleteRef.current(elapsed), 600);
              }
              return 100;
            }
            // Cycle to next target
            lockedCountRef.current = count;
            setLockedCount(count);
            setLockProgress(0);
            setTarget(spawnTarget(count));
            return 0;
          }
          return next;
        }
        // Decay when out of zone
        return Math.max(0, p - (DRIFT_INTERVAL / LOCK_TIME) * 150);
      });
    }, DRIFT_INTERVAL);
    return () => clearInterval(t);
  }, []);

  // Manual lock button — still works but requires being close
  const handleLockClick = useCallback(() => {
    if (locked) return;
    const dx = cursor.x - target.x;
    const dy = cursor.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 12 && !completedRef.current) {
      const count = lockedCount + 1;
      sfx.navLocked();
      if (count >= TOTAL_TARGETS) {
        completedRef.current = true;
        setLocked(true);
        setLockProgress(100);
        const elapsed = Date.now() - startTimeRef.current;
        setTimeout(() => onCompleteRef.current(elapsed), 600);
      } else {
        lockedCountRef.current = count;
        setLockedCount(count);
        setLockProgress(0);
        setTarget(spawnTarget(count));
      }
    } else {
      setAttempts((a) => a + 1);
    }
  }, [cursor, target, locked, lockedCount]);

  const inZone = Math.sqrt(
    (cursor.x - target.x) ** 2 + (cursor.y - target.y) ** 2,
  ) < LOCK_ZONE;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-coffee-100/60">
          Track each drifting target and hold steady to lock. Lock all
          {` ${TOTAL_TARGETS} `} targets to complete navigation.
        </p>
        <span className="font-mono text-[11px] text-amber-300/80 whitespace-nowrap ml-3">
          {locked ? `${TOTAL_TARGETS}/${TOTAL_TARGETS}` : `${lockedCount + 1}/${TOTAL_TARGETS}`}
        </span>
      </div>
      <div
        id="nav-field"
        className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-coffee-400/20 bg-gradient-to-br from-coffee-900/40 to-black/40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(196,164,132,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(196,164,132,0.06) 1px, transparent 1px)',
          backgroundSize: '10% 10%',
        }}
      >
        {/* Target */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${target.x}%`,
            top: `${target.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-full border-2 border-amber-400/50"
              style={{ animation: 'pulse-ring 1.8s ease-out infinite' }}
            />
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
          </div>
        </div>

        {/* Cursor reticle */}
        <div
          className="absolute pointer-events-none transition-all duration-75"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`w-8 h-8 rounded-full border-2 transition-colors ${
              locked ? 'border-emerald-400' : inZone ? 'border-amber-300' : 'border-coffee-300/60'
            }`}
          >
            <div
              className={`absolute inset-0 m-auto w-1 h-1 rounded-full ${
                locked ? 'bg-emerald-400' : inZone ? 'bg-amber-300' : 'bg-coffee-300'
              }`}
            />
          </div>
        </div>

        {/* Scan line */}
        <div
          className="absolute left-0 right-0 h-px bg-coffee-300/20"
          style={{ animation: 'scan-line 4s linear infinite' }}
        />
      </div>

      {/* Lock progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className={inZone ? 'text-amber-300' : 'text-coffee-200/40'}>
            {locked ? 'ALL TARGETS LOCKED' : inZone ? 'TRACKING…' : 'OUT OF RANGE'}
          </span>
          <span className="text-coffee-200/40">{Math.round(lockProgress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              locked ? 'bg-emerald-400' : inZone ? 'bg-amber-400' : 'bg-coffee-300/50'
            }`}
            style={{ width: `${lockProgress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-coffee-200/40">
          Recalibrations: {attempts}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleLockClick}
            disabled={locked}
            className="px-4 py-1.5 rounded-lg font-display text-xs font-medium tracking-wide bg-coffee-400/80 hover:bg-coffee-300 text-coffee-900 transition-all disabled:opacity-40"
          >
            {locked ? 'LOCKED' : 'LOCK'}
          </button>
          <button
            onClick={onAbort}
            className="font-mono text-[11px] text-coffee-200/40 hover:text-red-300 transition-colors px-2"
          >
            [ abort ]
          </button>
        </div>
      </div>
    </div>
  );
}
