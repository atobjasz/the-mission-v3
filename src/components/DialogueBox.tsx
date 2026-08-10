import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SPEAKERS, type DialogueLine } from '@/game/dialogue';
import { sfx } from '@/game/sound';

type Props = {
  lines: DialogueLine[];
  onComplete: () => void;
  /** When true, the "??? -> ANTONI" reveal happens (switches speaker theme) */
  revealed?: boolean;
};

export default function DialogueBox({ lines, onComplete, revealed = false }: Props) {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const line = lines[idx];
  const speaker = line.speaker;
  const theme = SPEAKERS[speaker === 'unknown' && revealed ? 'antoni' : speaker];

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const typewriter = useCallback(
    (text: string) => {
      clearTimers();
      setTyped('');
      setDone(false);
      let i = 0;
      const step = () => {
        i += Math.ceil(Math.random() * 2);
        const partial = text.slice(0, i);
        setTyped(partial);
        if (i % 3 === 0) sfx.reactorBeep();
        if (i < text.length) {
          const t = setTimeout(step, 28 + Math.random() * 20);
          timersRef.current.push(t);
        } else {
          setDone(true);
        }
      };
      const startTimer = setTimeout(step, 100);
      timersRef.current.push(startTimer);
    },
    [clearTimers],
  );

  useEffect(() => {
    typewriter(line.text);
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const advance = useCallback(() => {
    if (!done) {
      // Skip typewriter — reveal full line
      clearTimers();
      setTyped(line.text);
      setDone(true);
      return;
    }
    sfx.boot();
    if (idx + 1 < lines.length) {
      setIdx(idx + 1);
    } else {
      onComplete();
    }
  }, [done, idx, lines.length, line.text, onComplete, clearTimers]);

  const showSprite = speaker !== 'narration';

  return (
    <div className="w-full animate-fade-in" onClick={advance}>
      <div
        className={`relative border-2 ${theme.borderClass} ${theme.boxClass} backdrop-blur-md shadow-2xl shadow-black/50 crt-scanlines`}
      >
        {/* Name plate + sprite — top left corner */}
        {showSprite && (
          <div className="absolute -top-px -left-px flex items-stretch z-10">
            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 border-r-2 border-b-2 ${theme.borderClass} bg-black overflow-hidden`}>
              <img
                src={theme.sprite}
                alt={theme.name}
                className="w-full h-full object-cover pixelated"
              />
            </div>
            <div className={`flex items-center px-3 ${theme.boxClass} border-r-2 border-b-2 ${theme.borderClass}`}>
              <span className={`font-display text-xs sm:text-sm font-bold tracking-widest ${theme.nameClass}`}>
                {theme.name}
              </span>
            </div>
          </div>
        )}

        {/* Dialogue body — offset to clear the name plate */}
        <div className={`px-4 pt-20 sm:pt-24 pb-4 min-h-[120px] sm:min-h-[140px] flex items-center`}>
          <p className={`font-mono text-sm sm:text-base leading-relaxed ${theme.textClass} whitespace-pre-wrap`}>
            {typed}
            {!done && <span className="animate-blink">▋</span>}
          </p>
        </div>

        {/* Advance indicator */}
        {done && (
          <div className="absolute bottom-2 right-3 flex items-center gap-1 animate-pulse">
            <span className={`font-mono text-[10px] tracking-widest ${theme.nameClass}/60`}>
              {idx + 1 < lines.length ? 'NEXT' : 'END'}
            </span>
            <ChevronRight className={`w-3.5 h-3.5 ${theme.nameClass}/60`} />
          </div>
        )}
      </div>

      {/* CRT overlay */}
      <div className="absolute inset-0 pointer-events-none crt-flicker" />
    </div>
  );
}
