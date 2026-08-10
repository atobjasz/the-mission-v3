import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '@/game/sound';

type Props = {
  onComplete: (points: number, time: number) => void;
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
  const [inZone, setInZone] = useState(false);
  const [lockProgress, setLockProgress] = useState(0); // 0–100
  const [locked, setLocked] = useState(false);
  const [lockedCount, setLockedCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const startTimeRef = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const targetRef = useRef(target);
  useEffect(() => { targetRef.current = target; }, [target]);
  const cursorRef = useRef({ x: 50, y: 50 });
  const reticleRef = useRef<HTMLDivElement>(null);
  const inZoneRef = useRef(false);
  const lockedRef = useRef(locked);
  useEffect(() => { lockedRef.current = locked; }, [locked]);
  const completedRef = useRef(false);
  const lockedCountRef = useRef(0);
  const lockProgressRef = useRef(0);
  useEffect(() => { lockedCountRef.current = lockedCount; }, [lockedCount]);

  const spawnTarget = useCallback((id: number): Target => ({
    x: 25 + Math.random() * 50,
    y: 25 + Math.random() * 50,
    id,
  }), []);

  // Track cursor position directly via DOM — no React re-render per mouse move
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = document.getElementById('nav-field');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      cursorRef.current = { x, y };
      if (reticleRef.current) {
        reticleRef.current.style.left = `${x}%`;
        reticleRef.current.style.top = `${y}%`;
      }
      // Only trigger a re-render when zone-entry status changes
      const dx = x - targetRef.current.x;
      const dy = y - targetRef.current.y;
      const inside = Math.sqrt(dx * dx + dy * dy) < LOCK_ZONE;
      if (inside !== inZoneRef.current) {
        inZoneRef.current = inside;
        setInZone(inside);
      }
    };
    const el = document.getElementById('nav-field');
    el?.addEventListener('pointermove', onMove);
    return () => el?.removeEventListener('pointermove', onMove);
  }, []);

  // Drift + lock loop: target wanders slightly, lock progress accrues while
  // the reticle stays inside the zone and decays when it leaves.
  // All side effects live in the interval body — never inside setState updaters,
  // which React StrictMode double-invokes in dev.
  useEffect(() => {
    const t = setInterval(() => {
      if (lockedRef.current || completedRef.current) return;

      // Drift target in a random walk, clamped to the field
      const nx = Math.max(12, Math.min(88, targetRef.current.x + (Math.random() - 0.5) * DRIFT_SPEED * 2));
      const ny = Math.max(12, Math.min(88, targetRef.current.y + (Math.random() - 0.5) * DRIFT_SPEED * 2));
      setTarget((tg) => ({ ...tg, x: nx, y: ny }));
      targetRef.current = { ...targetRef.current, x: nx, y: ny };

      // Evaluate lock using the latest cursor vs latest target
      const dx = cursorRef.current.x - nx;
      const dy = cursorRef.current.y - ny;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inside = dist < LOCK_ZONE;

      if (inside !== inZoneRef.current) {
        inZoneRef.current = inside;
        setInZone(inside);
      }

      if (inside) {
        if (lockProgressRef.current === 0) sfx.navTracking();
        const next = lockProgressRef.current + (DRIFT_INTERVAL / LOCK_TIME) * 100;
        if (next >= 100) {
          const count = lockedCountRef.current + 1;
          sfx.navLocked();
          if (count >= TOTAL_TARGETS) {
            completedRef.current = true;
            lockedRef.current = true;
            setLocked(true);
            lockProgressRef.current = 100;
            setLockProgress(100);
            const elapsed = Date.now() - startTimeRef.current;
            const points = count * 2;
            setTimeout(() => onCompleteRef.current(points, elapsed), 600);
          } else {
            lockedCountRef.current = count;
            setLockedCount(count);
            lockProgressRef.current = 0;
            setLockProgress(0);
            const newTarget = spawnTarget(count);
            setTarget(newTarget);
            targetRef.current = newTarget;
          }
        } else {
          lockProgressRef.current = next;
          setLockProgress(next);
        }
      } else {
        // Decay when out of zone
        const decayed = Math.max(0, lockProgressRef.current - (DRIFT_INTERVAL / LOCK_TIME) * 150);
        lockProgressRef.current = decayed;
        setLockProgress(decayed);
      }
    }, DRIFT_INTERVAL);
    return () => clearInterval(t);
  }, [spawnTarget]);

  // Manual lock button — still works but requires being close
  const handleLockClick = useCallback(() => {
    if (locked || completedRef.current) return;
    const dx = cursorRef.current.x - target.x;
    const dy = cursorRef.current.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 12) {
      const count = lockedCountRef.current + 1;
      sfx.navLocked();
      if (count >= TOTAL_TARGETS) {
        completedRef.current = true;
        lockedRef.current = true;
        setLocked(true);
        lockProgressRef.current = 100;
        setLockProgress(100);
        const elapsed = Date.now() - startTimeRef.current;
        const points = count * 2;
        setTimeout(() => onCompleteRef.current(points, elapsed), 600);
      } else {
        lockedCountRef.current = count;
        setLockedCount(count);
        lockProgressRef.current = 0;
        setLockProgress(0);
        const newTarget = spawnTarget(count);
        setTarget(newTarget);
        targetRef.current = newTarget;
      }
    } else {
      setAttempts((a) => a + 1);
    }
  }, [target, locked, spawnTarget]);

  return (
    <div className="space-y-2 sm:space-y-3 flex flex-col h-full">
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
        className="relative w-full flex-1 min-h-0 rounded-xl overflow-hidden border border-coffee-400/20 bg-gradient-to-br from-coffee-900/40 to-black/40"
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

        {/* Cursor reticle — positioned directly via DOM ref, no React re-render */}
        <div
          ref={reticleRef}
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
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
