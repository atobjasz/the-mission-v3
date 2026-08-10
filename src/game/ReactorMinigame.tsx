import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '@/game/sound';

const ALIEN_SYMBOLS = ['◈', '◉', '⬡', '⬢', '⬣', '⬠', '⟁', '⟐', '◆'];
const TILE_COLORS = [
  '#e8a87c', '#c38d9e', '#85c1b8', '#a8d5e2', '#f6c177',
  '#d4a373', '#b5c99a', '#e9c46a', '#a4c3d9',
];
const NUM_TILES = 9;
const TARGET_LENGTH = NUM_TILES;
const SHOW_DELAY = 620;
const SHOW_DURATION = 480;

type Phase = 'intro' | 'showing' | 'input' | 'wrong' | 'done';

type Props = {
  onComplete: (time: number) => void;
  onAbort: () => void;
};

export default function ReactorMinigame({ onComplete, onAbort }: Props) {
  const fullSequenceRef = useRef<number[]>([]);
  const [visibleLen, setVisibleLen] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const startTimeRef = useRef(Date.now());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const playSequence = useCallback((seq: number[]) => {
    clearTimers();
    setPhase('showing');
    setActiveTile(null);
    setInputIndex(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    seq.forEach((tileIdx, i) => {
      const showAt = 200 + i * SHOW_DELAY;
      const hideAt = showAt + SHOW_DURATION;
      timers.push(
        setTimeout(() => {
          setActiveTile(tileIdx);
          sfx.reactorTile(tileIdx);
        }, showAt),
      );
      timers.push(setTimeout(() => setActiveTile(null), hideAt));
    });

    const totalDuration = 200 + seq.length * SHOW_DELAY + 250;
    timers.push(
      setTimeout(() => {
        setPhase('input');
        if (seq.length === 1) startTimeRef.current = Date.now();
      }, totalDuration),
    );
    timeoutsRef.current = timers;
  }, [clearTimers]);

  // Build the full shuffled sequence once (each tile exactly once), then start round 1
  useEffect(() => {
    const indices = Array.from({ length: NUM_TILES }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    fullSequenceRef.current = indices;
    const firstSlice = indices.slice(0, 1);
    setVisibleLen(1);
    const t = setTimeout(() => playSequence(firstSlice), 700);
    return () => {
      clearTimeout(t);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNextRound = useCallback(() => {
    const nextLen = Math.min(visibleLen + 1, TARGET_LENGTH);
    const nextSlice = fullSequenceRef.current.slice(0, nextLen);
    setVisibleLen(nextLen);
    setTimeout(() => playSequence(nextSlice), 700);
  }, [visibleLen, playSequence]);

  const handlePress = useCallback(
    (tileIdx: number) => {
      if (phase !== 'input') return;

      const currentSlice = fullSequenceRef.current.slice(0, visibleLen);
      const expected = currentSlice[inputIndex];

      if (tileIdx === expected) {
        sfx.reactorTile(tileIdx);
        setActiveTile(tileIdx);
        setTimeout(() => setActiveTile(null), 180);

        if (inputIndex + 1 >= currentSlice.length) {
          // Round complete
          if (visibleLen >= TARGET_LENGTH) {
            if (!completedRef.current) {
              completedRef.current = true;
              setPhase('done');
              const elapsed = Date.now() - startTimeRef.current;
              setTimeout(() => onCompleteRef.current(elapsed), 800);
            }
          } else {
            setPhase('showing');
            setInputIndex(0);
            setActiveTile(null);
            startNextRound();
          }
        } else {
          setInputIndex(inputIndex + 1);
        }
      } else {
        sfx.reactorWrong();
        setPhase('wrong');
        setActiveTile(null);
        setInputIndex(0);
        setTimeout(() => playSequence(currentSlice), 1000);
      }
    },
    [phase, inputIndex, visibleLen, playSequence, startNextRound],
  );

  const phaseLabel =
    phase === 'intro'
      ? 'Memorize the alien sequence...'
      : phase === 'showing'
        ? `Round ${visibleLen} — watch closely...`
        : phase === 'wrong'
          ? 'Wrong tile! Replaying sequence...'
          : phase === 'done'
            ? 'Reactor online!'
            : `Round ${visibleLen} — repeat the sequence (${inputIndex} / ${visibleLen})`;

  return (
    <div className="space-y-2 sm:space-y-3 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-coffee-100/60">{phaseLabel}</p>
        <span className="font-mono text-[11px] text-coffee-200/40">
          Round {Math.min(visibleLen, TARGET_LENGTH)} / {TARGET_LENGTH}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 place-content-center h-[240px] sm:h-[300px] lg:flex-1 lg:h-auto lg:min-h-0">
        {Array.from({ length: NUM_TILES }, (_, i) => {
          const isActive = activeTile === i;
          const canPress = phase === 'input';
          const symbol = ALIEN_SYMBOLS[i];
          const color = TILE_COLORS[i];
          return (
            <button
              key={i}
              onClick={() => handlePress(i)}
              disabled={!canPress}
              className={`
                relative aspect-square rounded-xl font-display font-bold text-2xl sm:text-3xl
                transition-all duration-150 select-none flex items-center justify-center
                ${isActive ? 'scale-105 shadow-lg' : canPress ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
              `}
              style={{
                background: isActive ? color : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? '#1a1208' : color,
                boxShadow: isActive ? `0 0 24px ${color}80` : 'none',
                textShadow: !isActive ? `0 0 12px ${color}40` : 'none',
              }}
            >
              {symbol}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="font-mono text-[11px] text-coffee-200/40">
          {phase === 'input' ? `Input: ${inputIndex} / ${visibleLen}` : ''}
        </span>
        <button
          onClick={onAbort}
          className="font-mono text-[11px] text-coffee-200/40 hover:text-red-300 transition-colors"
        >
          [ abort ]
        </button>
      </div>
    </div>
  );
}
