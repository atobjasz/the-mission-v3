import { useMemo, type CSSProperties } from 'react';

type Star = {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

type ShootingStar = {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
};

type Streak = {
  id: number;
  angle: number;
  delay: number;
  duration: number;
  length: number;
  opacity: number;
  blue: boolean;
};

function Starfield({ hyperdrive }: { hyperdrive?: boolean }) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 160 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.6 + 0.3,
    }));
  }, []);

  const shootingStars = useMemo<ShootingStar[]>(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      id: i,
      top: Math.random() * 60,
      left: 60 + Math.random() * 40,
      delay: i * 4 + Math.random() * 3,
      duration: 2.5 + Math.random() * 2,
    }));
  }, []);

  const streaks = useMemo<Streak[]>(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      angle: Math.random() * 360,
      delay: Math.random() * 0.6,
      duration: 0.7 + Math.random() * 0.5,
      length: 60 + Math.random() * 220,
      opacity: 0.4 + Math.random() * 0.5,
      blue: Math.random() < 0.18,
    }));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Deep-space gradient backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 30%, #1a0f2e 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, #0f1e2e 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #0a0a1f 0%, #050511 70%)',
        }}
      />

      {/* Distant nebula glow */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 70% 20%, rgba(180,100,60,0.15) 0%, transparent 30%), radial-gradient(circle at 25% 80%, rgba(60,100,180,0.12) 0%, transparent 35%)',
        }}
      />

      {/* Static stars (dimmed during hyperdrive) */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: hyperdrive ? s.opacity * 0.15 : s.opacity,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            boxShadow: '0 0 4px rgba(255,255,255,0.6)',
            transition: 'opacity 0.3s ease',
          }}
        />
      ))}

      {/* Shooting stars (hidden during hyperdrive) */}
      {!hyperdrive &&
        shootingStars.map((s) => (
          <div
            key={s.id}
            className="absolute"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: '120px',
              height: '1px',
              background:
                'linear-gradient(to right, rgba(255,255,255,0.9), transparent)',
              animation: `shoot ${s.duration}s ease-in ${s.delay}s infinite`,
              transformOrigin: 'right center',
            }}
          />
        ))}

      {/* Hyperdrive overlay */}
      {hyperdrive && (
        <div className="absolute inset-0">
          {/* Vignette to focus center */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.5) 100%)',
            }}
          />

          {/* Center bloom */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(180,210,255,0.08) 40%, transparent 70%)',
            }}
          />

          {/* Light-speed streaks */}
          {streaks.map((s) => (
            <div
              key={s.id}
              className="absolute left-1/2 top-1/2"
              style={
                {
                  '--streak-angle': `${s.angle}deg`,
                  animation: `hyperdrive-streak ${s.duration}s linear ${s.delay}s infinite`,
                } as CSSProperties
              }
            >
              <div
                className="w-[1.5px]"
                style={{
                  height: `${s.length}px`,
                  opacity: s.opacity,
                  background: s.blue
                    ? 'linear-gradient(to bottom, transparent, rgba(180,210,255,0.9))'
                    : 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Starfield;
