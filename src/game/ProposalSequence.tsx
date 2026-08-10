import { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { sfx } from '@/game/sound';

type Phase = 'choose' | 'hug' | 'yes' | 'finale';

type Props = {
  onComplete: () => void;
};

export default function ProposalSequence({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('choose');

  useEffect(() => {
    if (phase !== 'hug' || document.querySelector('script[src="https://tenor.com/embed.js"]')) return;
    const script = document.createElement('script');
    script.src = 'https://tenor.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }, [phase]);

  const chooseYes = () => {
    sfx.success();
    setPhase('yes');
  };

  const chooseHug = () => {
    sfx.boot();
    setPhase('hug');
  };

  const afterHug = () => {
    sfx.success();
    setPhase('yes');
  };

  if (phase === 'choose') {
    return (
      <div className="w-full max-w-lg mx-auto animate-fade-in text-center">
        <div className="border-2 border-pink-300/40 bg-pink-950/40 backdrop-blur-md crt-scanlines p-8">
          <Sparkles className="w-10 h-10 text-pink-300 mx-auto mb-4 animate-float-slow" />
          <p className="font-display text-lg font-bold text-pink-100 mb-1 tracking-wide">
            What do you say?
          </p>
          <p className="font-mono text-xs text-pink-200/60 mb-6">
            Start a new mission together?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={chooseYes}
              className="px-8 py-3 border-2 border-pink-300/50 bg-pink-500/25 hover:bg-pink-500/40 text-pink-100 font-display text-base font-black tracking-widest transition-all hover:-translate-y-0.5 shadow-lg shadow-pink-500/20"
            >
              YES!
            </button>
            <button
              onClick={chooseHug}
              className="px-8 py-3 border-2 border-pink-300/30 bg-pink-950/40 hover:bg-pink-500/15 text-pink-200/70 font-display text-base font-bold tracking-widest transition-all"
            >
              I need a hug first
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'hug') {
    return (
      <div className="w-full max-w-lg mx-auto animate-fade-in text-center">
        <div className="border-2 border-pink-300/40 bg-pink-950/40 backdrop-blur-md crt-scanlines p-6">
          <h3 className="font-display text-sm font-bold text-pink-200/80 tracking-widest mb-4">
            A HUG FOR YOU
          </h3>
          <div className="relative border-2 border-pink-300/30 overflow-hidden crt-scanlines mb-5 bg-black/20">
            <div
              className="tenor-gif-embed min-h-64"
              data-postid="16899029469483761674"
              data-share-method="host"
              data-aspect-ratio="1"
              data-width="100%"
            >
              <a href="https://tenor.com/view/cat-kiss-catkiss-cat-kiss-cat-kissing-gif-16899029469483761674">
                Cat Kiss GIF
              </a>{' '}from <a href="https://tenor.com/search/cat-gifs">Cat GIFs</a>
            </div>
          </div>
          <p className="font-mono text-sm text-pink-100/90 italic mb-6">
            ...how about now?
          </p>
          <button
            onClick={afterHug}
            className="px-8 py-3 border-2 border-pink-300/50 bg-pink-500/25 hover:bg-pink-500/40 text-pink-100 font-display text-base font-black tracking-widest transition-all hover:-translate-y-0.5 shadow-lg shadow-pink-500/20"
          >
            YES!
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'yes') {
    return (
      <div className="w-full max-w-lg mx-auto animate-fade-in text-center">
        <div
          className="border-2 border-pink-300/50 bg-pink-950/50 backdrop-blur-md crt-scanlines p-10 relative overflow-hidden"
          onAnimationEnd={undefined}
        >
          <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4 animate-float-slow fill-pink-400/30" />
          <h2 className="font-display text-2xl sm:text-3xl font-black text-pink-100 tracking-widest mb-3">
            MISSION COMPLETE
          </h2>
          <p className="font-mono text-sm text-pink-200/80 mb-1">
            And so begins a new mission...
          </p>
          <p className="font-mono text-xs text-pink-200/60 italic mb-8">
            together. ♡
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-2.5 border-2 border-pink-300/40 bg-pink-500/15 hover:bg-pink-500/25 text-pink-100 font-display text-sm font-bold tracking-wide transition-all"
          >
            Return to title
          </button>
        </div>
      </div>
    );
  }

  return null;
}
