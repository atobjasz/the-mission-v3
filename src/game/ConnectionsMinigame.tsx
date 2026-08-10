import { useState } from 'react';
import { Check, X, ChevronRight } from 'lucide-react';
import { sfx } from '@/game/sound';

type WordItem = {
  word: string;
  category: number; // 0-3
};

type Category = {
  name: string;
  color: string; // tailwind border/bg
  text: string;
};

const CATEGORIES: Category[] = [
  { name: 'Interstellar', color: 'border-amber-400/60 bg-amber-500/15 text-amber-200', text: 'text-amber-200' },
  { name: 'You', color: 'border-pink-400/60 bg-pink-500/15 text-pink-200', text: 'text-pink-200' },
  { name: 'Space', color: 'border-sky-400/60 bg-sky-500/15 text-sky-200', text: 'text-sky-200' },
  { name: 'Yum!', color: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200', text: 'text-emerald-200' },
];

const WORDS: WordItem[] = [
  { word: 'Cooper', category: 0 },
  { word: 'Murph', category: 0 },
  { word: 'TARS', category: 0 },
  { word: 'CASE', category: 0 },
  { word: 'Leo', category: 1 },
  { word: 'Reeses', category: 1 },
  { word: 'Palworld', category: 1 },
  { word: 'Concerts', category: 1 },
  { word: 'Stars', category: 2 },
  { word: 'Black hole', category: 2 },
  { word: 'Gravity', category: 2 },
  { word: 'Time', category: 2 },
  { word: 'Sushi', category: 3 },
  { word: 'McNuggets', category: 3 },
  { word: 'Matcha', category: 3 },
  { word: 'McFlurry', category: 3 },
];

// Shuffle helper
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  onComplete: (solved: number) => void;
};

export default function ConnectionsMinigame({ onComplete }: Props) {
  const [items] = useState<WordItem[]>(() => shuffle(WORDS));
  const [selected, setSelected] = useState<number[]>([]); // indices into items
  const [solvedCats, setSolvedCats] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const maxMistakes = 4;

  const isSolved = (cat: number) => solvedCats.includes(cat);

  const toggle = (i: number) => {
    if (solvedCats.includes(items[i].category)) return;
    setFeedback(null);
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length < 4 ? [...prev, i] : prev,
    );
  };

  const submit = () => {
    if (selected.length !== 4) return;
    const cats = selected.map((i) => items[i].category);
    const allSame = cats.every((c) => c === cats[0]);

    if (allSame) {
      const cat = cats[0];
      setSolvedCats((prev) => [...prev, cat]);
      setSelected([]);
      setFeedback(`Correct! ${CATEGORIES[cat].name}`);
      sfx.success();
      if (solvedCats.length + 1 === 4) {
        setTimeout(() => onComplete(4 - mistakes), 800);
      }
    } else {
      setMistakes((m) => m + 1);
      // Check if one away
      const counts: Record<number, number> = {};
      cats.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1));
      const maxCount = Math.max(...Object.values(counts));
      setFeedback(maxCount === 3 ? 'One away...' : 'Not quite.');
      sfx.fail();
      if (mistakes + 1 >= maxMistakes) {
        // Reveal all remaining and finish
        const remaining = [0, 1, 2, 3].filter((c) => !solvedCats.includes(c));
        setTimeout(() => {
          setSolvedCats((prev) => [...prev, ...remaining]);
          setSelected([]);
          setTimeout(() => onComplete(4 - mistakes), 1200);
        }, 1000);
      } else {
        setTimeout(() => setFeedback(null), 1500);
      }
    }
  };

  const deselect = () => setSelected([]);

  // Build grid: solved categories on top, then unsolved items
  const unsolvedItems = items
    .map((item, i) => ({ ...item, idx: i }))
    .filter((item) => !solvedCats.includes(item.category));

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <h3 className="font-display text-sm sm:text-base font-bold tracking-wide text-white/80 text-center mb-1">
        CONNECTIONS
      </h3>
      <p className="font-mono text-[11px] text-white/40 text-center mb-4">
        Find groups of 4 that share something in common.
      </p>

      {/* Solved categories */}
      <div className="space-y-2 mb-3">
        {solvedCats.sort().map((cat) => (
          <div
            key={cat}
            className={`border-2 ${CATEGORIES[cat].color} px-4 py-2.5 text-center crt-scanlines`}
          >
            <div className="font-display text-xs font-bold tracking-widest">
              {CATEGORIES[cat].name.toUpperCase()}
            </div>
            <div className="font-mono text-[11px] mt-0.5 opacity-80">
              {WORDS.filter((w) => w.category === cat).map((w) => w.word).join(', ')}
            </div>
          </div>
        ))}
      </div>

      {/* Grid of unsolved words */}
      {solvedCats.length < 4 && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {unsolvedItems.map((item) => {
              const isSel = selected.includes(item.idx);
              return (
                <button
                  key={item.idx}
                  onClick={() => toggle(item.idx)}
                  className={`px-2 py-4 border-2 font-mono text-xs sm:text-sm font-bold transition-all text-center break-words ${
                    isSel
                      ? 'border-white/60 bg-white/15 text-white'
                      : 'border-white/20 bg-black/60 text-white/70 hover:border-white/40'
                  }`}
                >
                  {item.word}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="text-center mb-3 animate-fade-in">
              <span className="font-mono text-sm text-white/60">{feedback}</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-[11px] text-white/40">
              Mistakes: {Math.max(0, maxMistakes - mistakes)}
            </span>
            <button
              onClick={deselect}
              disabled={selected.length === 0}
              className="px-4 py-2 border-2 border-white/20 bg-black/60 text-white/60 hover:bg-white/5 font-mono text-xs tracking-wide disabled:opacity-30"
            >
              Deselect
            </button>
            <button
              onClick={submit}
              disabled={selected.length !== 4}
              className="px-5 py-2 border-2 border-white/40 bg-white/10 text-white/80 hover:bg-white/15 font-display text-xs font-bold tracking-wide disabled:opacity-30 flex items-center gap-1.5"
            >
              SUBMIT
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      {/* Completion button */}
      {solvedCats.length === 4 && (
        <div className="text-center mt-4 animate-fade-in">
          <button
            onClick={() => onComplete(4 - mistakes)}
            className="px-6 py-2.5 border-2 border-white/30 bg-white/5 hover:bg-white/10 text-white/80 font-display text-sm font-bold tracking-wide transition-all flex items-center gap-2 mx-auto"
          >
            NEXT
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
