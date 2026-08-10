import { useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { sfx } from '@/game/sound';

const WORD = 'CUTIE';
const MAX_ROWS = 6;

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

function evaluateGuess(guess: string): LetterState[] {
  const result: LetterState[] = new Array(5).fill('absent');
  const wordLetters = WORD.split('');
  const used = new Array(5).fill(false);

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (guess[i] === wordLetters[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }
  // Second pass: present but wrong position
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === wordLetters[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

type Props = {
  onComplete: (won: boolean) => void;
};

export default function WordleMinigame({ onComplete }: Props) {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);

  const submitGuess = useCallback(() => {
    if (current.length !== 5) return;
    if (guesses.length >= MAX_ROWS) return;

    const newGuesses = [...guesses, current];
    setGuesses(newGuesses);
    setCurrent('');

    if (current === WORD) {
      setWon(true);
      setFinished(true);
      setMessage('Congratulations! You got it!');
      sfx.success();
      return;
    }

    sfx.reactorBeep();

    if (newGuesses.length >= MAX_ROWS) {
      setFinished(true);
      setMessage(`Nice try! The word was: ${WORD}`);
      sfx.fail();
    }
  }, [current, guesses]);

  const handleKey = useCallback(
    (key: string) => {
      if (finished) return;
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACK') {
        setCurrent((c) => c.slice(0, -1));
      } else if (current.length < 5 && /^[A-Z]$/.test(key)) {
        setCurrent((c) => c + key);
      }
    },
    [current, finished, submitGuess],
  );

  // Keyboard state for coloring
  const keyState: Record<string, LetterState> = {};
  guesses.forEach((g) => {
    const states = evaluateGuess(g);
    g.split('').forEach((letter, i) => {
      const s = states[i];
      if (s === 'correct') keyState[letter] = 'correct';
      else if (s === 'present' && keyState[letter] !== 'correct') keyState[letter] = 'present';
      else if (s === 'absent' && !keyState[letter]) keyState[letter] = 'absent';
    });
  });

  const letterClass = (state: LetterState) => {
    switch (state) {
      case 'correct':
        return 'border-emerald-400/60 bg-emerald-500/25 text-emerald-200';
      case 'present':
        return 'border-amber-400/60 bg-amber-500/25 text-amber-200';
      case 'absent':
        return 'border-white/10 bg-black/50 text-white/30';
      default:
        return 'border-white/25 bg-black/60 text-white/80';
    }
  };

  const keyClass = (state?: LetterState) => {
    switch (state) {
      case 'correct':
        return 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40';
      case 'present':
        return 'bg-amber-500/30 text-amber-200 border-amber-400/40';
      case 'absent':
        return 'bg-black/60 text-white/30 border-white/10';
      default:
        return 'bg-black/60 text-white/70 border-white/20 hover:bg-white/10';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <h3 className="font-display text-sm sm:text-base font-bold tracking-wide text-white/80 text-center mb-1">
        WORDLE
      </h3>
      <p className="font-mono text-[11px] text-white/40 text-center mb-4">
        Guess the 5-letter word.
      </p>

      {/* Grid */}
      <div className="grid grid-rows-6 gap-1.5 mb-4 justify-center">
        {Array.from({ length: MAX_ROWS }).map((_, row) => {
          const guess = guesses[row];
          const states = guess ? evaluateGuess(guess) : null;
          return (
            <div key={row} className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }).map((_, col) => {
                const letter = guess ? guess[col] : row === guesses.length ? current[col] ?? '' : '';
                const state = states ? states[col] : (letter ? 'empty' : 'empty');
                return (
                  <div
                    key={col}
                    className={`w-12 h-12 sm:w-14 sm:h-14 border-2 flex items-center justify-center font-display text-lg font-bold ${letterClass(state)}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Message */}
      {message && (
        <div className="text-center mb-3 animate-fade-in">
          <p className={`font-mono text-sm ${won ? 'text-emerald-300' : 'text-amber-300'}`}>
            {message}
          </p>
        </div>
      )}

      {/* Next button when finished */}
      {finished && (
        <div className="text-center mb-4 animate-fade-in">
          <button
            onClick={() => onComplete(won)}
            className="px-6 py-2.5 border-2 border-white/30 bg-white/5 hover:bg-white/10 text-white/80 font-display text-sm font-bold tracking-wide transition-all flex items-center gap-2 mx-auto"
          >
            NEXT
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Keyboard */}
      {!finished && (
        <div className="space-y-1.5">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1">
              {row.map((key) => {
                const isSpecial = key === 'ENTER' || key === 'BACK';
                const state = keyState[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className={`px-2 py-3 border font-mono text-[10px] sm:text-xs font-bold rounded-sm transition-all ${keyClass(state)} ${
                      isSpecial ? 'flex-1 max-w-[60px]' : 'w-8 sm:w-9'
                    }`}
                  >
                    {key === 'BACK' ? '⌫' : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
