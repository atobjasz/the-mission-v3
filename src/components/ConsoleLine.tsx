import { useEffect, useRef } from 'react';

type Props = {
  line: string;
  type: 'system' | 'alert' | 'success' | 'error' | 'input' | 'narration';
};

const TYPE_STYLES: Record<Props['type'], string> = {
  system: 'text-coffee-100/80',
  alert: 'text-amber-300',
  success: 'text-emerald-300',
  error: 'text-red-400',
  input: 'text-coffee-100 font-bold',
  narration: 'text-sky-300/90 italic',
};

const TYPE_PREFIX: Record<Props['type'], string> = {
  system: '› ',
  alert: '! ',
  success: '✓ ',
  error: '✗ ',
  input: '» ',
  narration: '  ',
};

function ConsoleLine({ line, type }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  return (
    <div
      ref={ref}
      className={`font-mono text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap animate-fade-in ${TYPE_STYLES[type]}`}
    >
      <span className="opacity-50 select-none">{TYPE_PREFIX[type]}</span>
      {line}
    </div>
  );
}

export default ConsoleLine;
