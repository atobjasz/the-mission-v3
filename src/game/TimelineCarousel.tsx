import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { sfx } from '@/game/sound';

type TimelineChapter = {
  caption: string;
  images: string[];
};

const CHAPTERS: TimelineChapter[] = [
  {
    caption: 'it started with our group gaming sessions...',
    images: ['/group_gaming1.webp', '/group_gaming2.jpg', '/group_gaming3.jpg'],
  },
  {
    caption: 'and then we connected over music and school',
    images: ['/music1.jpg', '/music2.jpg', '/music3.webp', '/music4.jpg'],
  },
  {
    caption: 'and then we had a group hangout',
    images: ['/group_hangout.jpeg'],
  },
  {
    caption: 'and then we went on a date',
    images: [
      '/date_(1).jpeg',
      '/date_(2).jpeg',
      '/date_(3).jpeg',
      '/date_(4).jpeg',
      '/date_(5).jpeg',
      '/date_(6).jpeg',
    ],
  },
];

type GridLayout = {
  cols: string;
  rows: string;
  tiles: string[];
};

// Each layout fills its grid completely — every cell is covered, no gaps.
const LAYOUTS: Record<number, GridLayout> = {
  1: { cols: 'grid-cols-1', rows: 'grid-rows-1', tiles: ['col-span-1 row-span-1'] },
  2: { cols: 'grid-cols-2', rows: 'grid-rows-1', tiles: ['col-span-1 row-span-1', 'col-span-1 row-span-1'] },
  3: {
    cols: 'grid-cols-2',
    rows: 'grid-rows-2',
    tiles: [
      'col-span-1 row-span-2',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
    ],
  },
  4: {
    cols: 'grid-cols-2',
    rows: 'grid-rows-2',
    tiles: [
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
    ],
  },
  5: {
    cols: 'grid-cols-3',
    rows: 'grid-rows-2',
    tiles: [
      'col-span-1 row-span-2',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
    ],
  },
  6: {
    cols: 'grid-cols-3',
    rows: 'grid-rows-2',
    tiles: [
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
      'col-span-1 row-span-1',
    ],
  },
};

const ROTATIONS = [
  'rotate(-2deg)',
  'rotate(1.5deg)',
  'rotate(-1deg)',
  'rotate(2deg)',
  'rotate(-1.5deg)',
  'rotate(1deg)',
];

function layoutFor(count: number): GridLayout {
  if (LAYOUTS[count]) return LAYOUTS[count];
  return { cols: 'grid-cols-2', rows: 'grid-rows-2', tiles: Array.from({ length: count }, () => 'col-span-1 row-span-1') };
}

type Props = {
  onComplete: () => void;
};

export default function TimelineCarousel({ onComplete }: Props) {
  const [chapterIdx, setChapterIdx] = useState(0);

  const chapter = CHAPTERS[chapterIdx];
  const isLastChapter = chapterIdx === CHAPTERS.length - 1;
  const layout = layoutFor(chapter.images.length);

  const goNext = () => {
    sfx.boot();
    if (isLastChapter) {
      onComplete();
    } else {
      setChapterIdx(chapterIdx + 1);
    }
  };

  const goPrev = () => {
    sfx.boot();
    if (chapterIdx > 0) setChapterIdx(chapterIdx - 1);
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <h3 className="font-display text-sm sm:text-base font-bold tracking-wide text-pink-200/80 text-center mb-4">
        OUR STORY
      </h3>

      {/* Collage frame */}
      <div className="relative border-2 border-pink-300/30 bg-black/80 crt-scanlines overflow-hidden shadow-2xl shadow-black/50 p-4 sm:p-6">
        <div
          key={chapterIdx}
          className={`grid ${layout.cols} ${layout.rows} gap-3 sm:gap-5 animate-fade-in h-[340px] sm:h-[440px]`}
        >
          {chapter.images.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-lg border-2 border-pink-300/25 shadow-lg shadow-black/40 ${layout.tiles[i]}`}
              style={{ transform: `${ROTATIONS[i % ROTATIONS.length]}` }}
            >
              <img
                src={src}
                alt={`${chapter.caption} ${i + 1}`}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        {/* Caption overlay */}
        <div className="bg-black/80 backdrop-blur-sm px-4 py-3 mt-1.5 border-t-2 border-pink-300/20">
          <p className="font-mono text-sm text-pink-100/90 text-center italic">
            {chapter.caption}
          </p>
        </div>
      </div>

      {/* Chapter progress dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {CHAPTERS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              sfx.boot();
              setChapterIdx(i);
            }}
            className={`h-2 transition-all ${
              i === chapterIdx ? 'bg-pink-300 w-6' : 'bg-pink-300/30 w-2 hover:bg-pink-300/50'
            }`}
          />
        ))}
      </div>

      {/* Back / Forward controls */}
      <div className="flex items-center justify-between mt-5">
        {chapterIdx > 0 ? (
          <button
            onClick={goPrev}
            className="px-4 py-2 border-2 border-pink-300/30 bg-black/50 hover:bg-pink-500/15 text-pink-200/80 font-display text-xs font-bold tracking-wide transition-all flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            BACK
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={goNext}
          className="px-6 py-2.5 border-2 border-pink-300/40 bg-pink-500/15 hover:bg-pink-500/25 text-pink-100 font-display text-sm font-bold tracking-wide transition-all flex items-center gap-2"
        >
          {isLastChapter ? (
            <>
              <Heart className="w-4 h-4" />
              CONTINUE
            </>
          ) : (
            <>
              NEXT
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
