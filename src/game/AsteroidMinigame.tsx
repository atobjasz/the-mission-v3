import { useCallback, useEffect, useRef, useState } from 'react';
import { sfx } from '@/game/sound';

type Asteroid = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hp: number;
};

type Explosion = {
  id: number;
  x: number;
  y: number;
  size: number;
  born: number;
};

let nextExplosionId = 0;

const PARTICLE_COLORS = ['#f59e0b', '#ef4444', '#fbbf24', '#f97316'];

function ExplosionBurst({ x, y, size }: { x: number; y: number; size: number }) {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + (i * 0.731) % 0.5;
    const dist = size * (1.2 + ((i * 0.37) % 0.8));
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      sz: size * (0.25 + ((i * 0.41) % 0.25)),
      delay: (i * 16) % 80,
    };
  });

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', zIndex: 60 }}
    >
      {/* Shockwave ring */}
      <span
        className="absolute rounded-full border-2 border-amber-400/80"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: 0,
          top: 0,
          marginLeft: `-${size / 2}px`,
          marginTop: `-${size / 2}px`,
          animation: 'explosion-ring 0.5s ease-out forwards',
        }}
      />
      {/* Particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${p.sz}px`,
            height: `${p.sz}px`,
            left: 0,
            top: 0,
            background: p.color,
            boxShadow: `0 0 10px ${p.color}`,
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            animation: `explosion-particle 0.6s ease-out ${p.delay}ms forwards`,
          }}
        />
      ))}
      {/* Flash core */}
      <span
        className="absolute rounded-full"
        style={{
          width: `${size * 1.3}px`,
          height: `${size * 1.3}px`,
          left: 0,
          top: 0,
          marginLeft: `-${(size * 1.3) / 2}px`,
          marginTop: `-${(size * 1.3) / 2}px`,
          background: 'radial-gradient(circle, rgba(255,235,150,1) 0%, rgba(251,191,36,0.8) 30%, rgba(239,68,68,0.4) 60%, transparent 75%)',
          animation: 'explosion-flash 0.35s ease-out forwards',
        }}
      />
    </div>
  );
}

type Props = {
  onComplete: (score: number) => void;
  onAbort: () => void;
};

let nextId = 0;

function spawnAsteroid(): Asteroid {
  const side = Math.floor(Math.random() * 4);
  let x = 0, y = 0;
  if (side === 0) { x = Math.random() * 100; y = -5; }
  else if (side === 1) { x = 105; y = Math.random() * 100; }
  else if (side === 2) { x = Math.random() * 100; y = 105; }
  else { x = -5; y = Math.random() * 100; }
  // Aim toward ship at center (50,50) with slight scatter
  const dx = 50 - x;
  const dy = 50 - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = 0.05 + Math.random() * 0.05;
  const jitter = (Math.random() - 0.5) * 0.02;
  const vx = (dx / dist) * speed + jitter;
  const vy = (dy / dist) * speed + jitter;
  const size = 18 + Math.random() * 22;
  return { id: nextId++, x, y, vx, vy, size, hp: Math.ceil(size / 16) };
}

export default function AsteroidMinigame({ onComplete, onAbort }: Props) {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(100);
  const [timeLeft, setTimeLeft] = useState(15);
  const [finished, setFinished] = useState(false);
  const asteroidsRef = useRef(asteroids);
  const shieldRef = useRef(shield);
  const scoreRef = useRef(score);
  const finishedRef = useRef(finished);

  useEffect(() => { asteroidsRef.current = asteroids; }, [asteroids]);
  useEffect(() => { shieldRef.current = shield; }, [shield]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { finishedRef.current = finished; }, [finished]);

  const endGame = useCallback((finalScore: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    setTimeout(() => onComplete(Math.max(0, finalScore)), 800);
  }, [onComplete]);

  // Game loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let spawnTimer = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      if (finishedRef.current) return;

      spawnTimer += dt;
      if (spawnTimer > 45 && asteroidsRef.current.length < 8) {
        spawnTimer = 0;
        setAsteroids((a) => [...a, spawnAsteroid()]);
      }

      setAsteroids((a) =>
        a
          .map((ast) => ({ ...ast, x: ast.x + ast.vx * dt, y: ast.y + ast.vy * dt }))
          .filter((ast) => ast.x > -15 && ast.x < 115 && ast.y > -15 && ast.y < 115),
      );

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Timer — does NOT depend on score, so destroying asteroids never adds time
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          endGame(scoreRef.current);
          return 0;
        }
        if (tl <= 5) sfx.asteroidTimerTick();
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished, endGame]);

  const handleHit = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (finishedRef.current) return;
    const ast = asteroidsRef.current.find((a) => a.id === id);
    if (!ast) return;
    const isDestroyed = ast.hp - 1 <= 0;
    setAsteroids((a) => {
      const survivors: Asteroid[] = [];
      for (const item of a) {
        if (item.id === id) {
          if (item.hp - 1 > 0) survivors.push({ ...item, hp: item.hp - 1 });
        } else {
          survivors.push(item);
        }
      }
      return survivors;
    });
    setScore((s) => s + 10);
    if (isDestroyed) {
      sfx.asteroidDestroy();
      const ex: Explosion = { id: nextExplosionId++, x: ast.x, y: ast.y, size: ast.size, born: performance.now() };
      setExplosions((prev) => [...prev, ex]);
      setTimeout(() => {
        setExplosions((prev) => prev.filter((p) => p.id !== ex.id));
      }, 700);
    } else {
      sfx.asteroidHit();
    }
  }, []);

  // Collision with ship (center) damages shield
  useEffect(() => {
    const t = setInterval(() => {
      if (finishedRef.current) return;
      setAsteroids((a) => {
        const survivors: Asteroid[] = [];
        let damage = 0;
        for (const ast of a) {
          const dx = ast.x - 50;
          const dy = ast.y - 50;
          if (Math.sqrt(dx * dx + dy * dy) < 8 + ast.size / 6) {
            damage += 15;
          } else {
            survivors.push(ast);
          }
        }
        if (damage > 0) {
          sfx.asteroidHitShield();
          setShield((s) => {
            const ns = Math.max(0, s - damage);
            if (ns <= 0) endGame(scoreRef.current);
            return ns;
          });
        }
        return survivors;
      });
    }, 200);
    return () => clearInterval(t);
  }, [endGame]);

  return (
    <div className="space-y-2 sm:space-y-3 flex flex-col h-full">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-coffee-100/70">Score: <span className="text-emerald-300 font-bold">{score}</span></span>
        <span className="text-coffee-100/70">Time: <span className={timeLeft <= 5 ? 'text-red-400 font-bold' : 'text-coffee-100'}>{timeLeft}s</span></span>
        <span className="text-coffee-100/70">Shield: <span className={shield <= 30 ? 'text-red-400 font-bold' : 'text-amber-300'}>{shield}%</span></span>
      </div>

      <div
        className="relative w-full flex-1 min-h-0 rounded-xl overflow-hidden border border-coffee-400/20 bg-gradient-radial from-coffee-900/30 to-black/50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(196,164,132,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(196,164,132,0.07) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(196,164,132,0.08) 0%, transparent 60%)',
          backgroundSize: '10% 10%, 10% 10%, 100% 100%',
        }}
      >
        {/* Ship in center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className={`w-10 h-10 rounded-full border-2 ${shield <= 30 ? 'border-red-400/60' : 'border-coffee-300/60'} flex items-center justify-center`}>
            <div className={`w-2 h-2 rounded-full ${shield <= 30 ? 'bg-red-400' : 'bg-coffee-300'} animate-pulse`} />
          </div>
          {shield > 0 && (
            <div
              className="absolute -inset-2 rounded-full border border-coffee-300/20"
              style={{ animation: 'pulse-ring 2s ease-out infinite' }}
            />
          )}
        </div>

        {/* Explosions */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          {explosions.map((ex) => (
            <ExplosionBurst key={ex.id} x={ex.x} y={ex.y} size={ex.size} />
          ))}
        </div>

        {/* Asteroids */}
        {asteroids.map((ast) => (
          <button
            key={ast.id}
            onClick={(e) => handleHit(ast.id, e)}
            className="absolute rounded-full bg-stone-600/80 border border-stone-500/60 hover:bg-red-500/60 transition-colors cursor-crosshair"
            style={{
              left: `${ast.x}%`,
              top: `${ast.y}%`,
              width: `${ast.size}px`,
              height: `${ast.size}px`,
              transform: 'translate(-50%, -50%)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.4)',
            }}
          >
            {ast.hp > 1 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-stone-200">
                {ast.hp}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-coffee-200/40">Click asteroids to destroy them</span>
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
