import { ReactNode } from 'react';

type ActionButton = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  icon?: ReactNode;
  disabled?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  actions?: ActionButton[];
  progress?: { current: number; total: number; label: string };
};

function ConsolePanel({ title, subtitle, children, actions, progress }: Props) {
  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg sm:text-xl font-bold tracking-wider text-coffee-100">
            {title}
          </h3>
          {subtitle && (
            <p className="font-mono text-xs text-coffee-200/50 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {progress && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-widest text-coffee-200/50">
              {progress.label}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: progress.total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-4 rounded-full transition-colors ${
                    i < progress.current ? 'bg-coffee-300' : 'bg-coffee-700/40'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {children && (
        <div className="font-mono text-sm text-coffee-100/70 leading-relaxed">
          {children}
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((a, i) => {
            const base =
              'px-4 py-2 rounded-lg font-display text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed';
            const variants = {
              primary:
                'bg-coffee-400/90 hover:bg-coffee-300 text-coffee-900 shadow-lg shadow-coffee-500/20 hover:shadow-coffee-400/30 hover:-translate-y-0.5',
              danger:
                'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-400/50',
              ghost:
                'bg-white/5 hover:bg-white/10 text-coffee-100/80 border border-coffee-400/20 hover:border-coffee-300/40',
            };
            return (
              <button
                key={i}
                onClick={a.onClick}
                disabled={a.disabled}
                className={`${base} ${variants[a.variant ?? 'primary']}`}
              >
                {a.icon}
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ConsolePanel;
export type { ActionButton };
