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
  const [fired, setFired] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setFired(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dist = size * 1.4;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    };
  });

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${size * 0.4}px`,
            height: `${size * 0.4}px`,
            left: 0,
            top: 0,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            transform: fired
              ? `translate(-50%, -50%) translate(${p.dx}px, ${p.dy}px) scale(0.2)`
              : 'translate(-50%, -50%) translate(0px, 0px) scale(1)',
            opacity: fired ? 0 : 1,
            transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
          }}
        />
      ))}
      <span
        className="absolute rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: 0,
          top: 0,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(239,68,68,0.5) 50%, transparent 70%)',
          opacity: fired ? 0 : 1,
          transition: 'opacity 0.45s ease-out, transform 0.45s ease-out',
          ...(fired ? { transform: 'translate(-50%, -50%) scale(2)', opacity: 0 } : {}),
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
  let x = 0, y = 0, vx = 0, vy = 0;
  const speed = 0.04 + Math.random() * 0.05;
  if (side === 0) { x = Math.random() * 100; y = -5; vx = (Math.random() - 0.5) * 0.03; vy = speed; }
  else if (side === 1) { x = 105; y = Math.random() * 100; vx = -speed; vy = (Math.random() - 0.5) * 0.03; }
  else if (side === 2) { x = Math.random() * 100; y = 105; vx = (Math.random() - 0.5) * 0.03; vy = -speed; }
  else { x = -5; y = Math.random() * 100; vx = speed; vy = (Math.random() - 0.5) * 0.03; }
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
    let destroyed: Asteroid | null = null;
    setAsteroids((a) => {
      const survivors: Asteroid[] = [];
      for (const ast of a) {
        if (ast.id === id) {
          if (ast.hp - 1 <= 0) (destroyed as Asteroid | null) = ast;
          else survivors.push({ ...ast, hp: ast.hp - 1 });
        } else {
          survivors.push(ast);
        }
      }
      return survivors;
    });
    sfx.asteroidDestroy();
    setScore((s) => s + 10);
    if (destroyed) {
      const d: Asteroid = destroyed;
      const ex: Explosion = { id: nextExplosionId++, x: d.x, y: d.y, size: d.size, born: performance.now() };
      setExplosions((prev) => [...prev, ex]);
      setTimeout(() => {
        setExplosions((prev) => prev.filter((p) => p.id !== ex.id));
      }, 600);
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
    <div className="space-y-3">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-coffee-100/70">Score: <span className="text-emerald-300 font-bold">{score}</span></span>
        <span className="text-coffee-100/70">Time: <span className={timeLeft <= 5 ? 'text-red-400 font-bold' : 'text-coffee-100'}>{timeLeft}s</span></span>
        <span className="text-coffee-100/70">Shield: <span className={shield <= 30 ? 'text-red-400 font-bold' : 'text-amber-300'}>{shield}%</span></span>
      </div>

      <div
        className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-coffee-400/20 bg-gradient-radial from-coffee-900/30 to-black/50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(196,164,132,0.08) 0%, transparent 60%)',
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
        {explosions.map((ex) => (
          <ExplosionBurst key={ex.id} x={ex.x} y={ex.y} size={ex.size} />
        ))}

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
