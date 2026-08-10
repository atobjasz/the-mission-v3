import { useState } from 'react';
import { Check, X, ChevronRight } from 'lucide-react';
import { sfx } from '@/game/sound';

export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number; // index
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Which planet in Interstellar has huge waves?",
    options: ["Miller", "Mann", "Earth"],
    correct: 0,
  },
  {
    question: "What format should you watch Christopher Nolan's The Odyssey in?",
    options: ["70mm IMax", "IMax", "Samsung Smart Fridge"],
    correct: 2,
  },
  {
    question: "Which of these are most likely to kill you?",
    options: ["A shark attack", "A Leo attack", "A fly entering your mouth"],
    correct: 1,
  },
  {
    question: "What was the name of the planet where Rocky and Grace went fishing?",
    options: ["Adrian", "Adam", "Erid"],
    correct: 0,
  },
  {
    question: "Who is the goat?",
    options: ["Antoni", "Antoni", "Antoni"],
    correct: 0, // all correct
  },
];

type Props = {
  onComplete: (score: number, total: number) => void;
};

export default function QuizMinigame({ onComplete }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  const q = QUIZ_QUESTIONS[qIdx];
  const isLast = qIdx === QUIZ_QUESTIONS.length - 1;
  const allCorrectQ = q.options.every((o) => o === q.options[q.correct]);

  const select = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    // For the "all correct" question, any answer is correct
    const correct = allCorrectQ || i === q.correct;
    if (correct) {
      setScore((s) => s + 1);
      sfx.success();
    } else {
      sfx.fail();
    }
  };

  const next = () => {
    if (isLast) {
      onComplete(score, QUIZ_QUESTIONS.length);
    } else {
      setQIdx(qIdx + 1);
      setSelected(null);
      setRevealed(false);
      sfx.boot();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          Question {qIdx + 1} / {QUIZ_QUESTIONS.length}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          Score: {score}
        </span>
      </div>

      {/* Question */}
      <div className="border-2 border-white/20 bg-black/90 backdrop-blur-md crt-scanlines p-6 mb-4">
        <h3 className="font-display text-base sm:text-lg font-bold tracking-wide text-white/90 mb-1">
          {q.question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = allCorrectQ || i === q.correct;
          let cls = 'border-white/20 bg-black/60 text-white/70 hover:border-white/40 hover:bg-white/5';
          if (revealed) {
            if (isCorrect) {
              cls = 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200';
            } else if (isSelected && !isCorrect) {
              cls = 'border-red-400/60 bg-red-500/15 text-red-200';
            } else {
              cls = 'border-white/10 bg-black/40 text-white/40';
            }
          }
          return (
            <button
              key={i}
              onClick={() => select(i)}
              disabled={revealed}
              className={`w-full text-left px-4 py-3 border-2 ${cls} font-mono text-sm transition-all flex items-center justify-between`}
            >
              <span>{opt}</span>
              {revealed && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
              {revealed && isSelected && !isCorrect && <X className="w-4 h-4 text-red-400" />}
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
      {revealed && (
        <div className="mt-4 animate-fade-in">
          <div className="border-2 border-white/20 bg-black/80 p-4 mb-3">
            {(allCorrectQ || selected === q.correct) ? (
              <p className="font-mono text-sm text-emerald-300">Correct! Well done.</p>
            ) : (
              <p className="font-mono text-sm text-red-300">
                Wrong! The correct answer was: <span className="text-emerald-300">{q.options[q.correct]}</span>
              </p>
            )}
          </div>
          <button
            onClick={next}
            className="px-6 py-2.5 border-2 border-white/30 bg-white/5 hover:bg-white/10 text-white/80 font-display text-sm font-bold tracking-wide transition-all flex items-center gap-2 mx-auto"
          >
            {isLast ? 'FINISH' : 'NEXT'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
