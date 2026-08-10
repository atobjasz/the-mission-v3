import { useCallback, useEffect, useRef, useState } from 'react';

export type LogEntry = {
  id: number;
  text: string;
  type: 'system' | 'alert' | 'success' | 'error' | 'input' | 'narration';
};

let counter = 0;

export function useTypewriterLog() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [typedLog, setTypedLog] = useState<{ id: number; text: string; type: LogEntry['type'] }[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fullTextRef = useRef<Map<number, string>>(new Map());

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'system') => {
    const id = ++counter;
    const entry: LogEntry = { id, text, type };
    setLog((prev) => [...prev, entry]);
    fullTextRef.current.set(id, text);
    setTypedLog((prev) => [...prev, { id, text: '', type }]);

    // Typewriter effect
    let i = 0;
    const step = () => {
      i += Math.ceil(Math.random() * 3);
      const partial = text.slice(0, i);
      setTypedLog((prev) =>
        prev.map((e) => (e.id === id ? { ...e, text: partial } : e)),
      );
      if (i < text.length) {
        const t = setTimeout(step, 18 + Math.random() * 22);
        timersRef.current.push(t);
      }
    };
    const startTimer = setTimeout(step, 50);
    timersRef.current.push(startTimer);
  }, []);

  const addLogBatch = useCallback(
    (entries: { text: string; type?: LogEntry['type']; delay: number }[]) => {
      entries.forEach((e) => {
        const t = setTimeout(() => addLog(e.text, e.type ?? 'system'), e.delay);
        timersRef.current.push(t);
      });
    },
    [addLog],
  );

  const clearLog = useCallback(() => {
    clearTimers();
    setLog([]);
    setTypedLog([]);
    fullTextRef.current.clear();
  }, [clearTimers]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return { log, typedLog, addLog, addLogBatch, clearLog };
}
