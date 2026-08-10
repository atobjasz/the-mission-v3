export type StageId =
  | 'boot'
  | 'reactor'
  | 'navigation'
  | 'asteroids'
  | 'complete'
  | 'hijack'
  | 'hijack-intro'
  | 'quiz'
  | 'post-quiz'
  | 'connections'
  | 'wordle'
  | 'post-wordle'
  | 'timeline'
  | 'reveal'
  | 'proposal';

export type Stage = {
  id: StageId;
  name: string;
  subtitle: string;
};

export const STAGES: Stage[] = [
  { id: 'boot', name: 'System Boot', subtitle: 'Initializing flight computer...' },
  { id: 'reactor', name: 'Reactor Power-Up', subtitle: 'Bring the core online' },
  { id: 'navigation', name: 'Navigation Lock', subtitle: 'Find the destination star' },
  { id: 'asteroids', name: 'Asteroid Field', subtitle: 'Brace for impact' },
  { id: 'complete', name: 'Mission Complete', subtitle: 'You arrived at the Antennae Galaxies' },
  { id: 'hijack', name: 'System Hijack', subtitle: 'Something is wrong...' },
  { id: 'hijack-intro', name: 'The Hijacker', subtitle: 'Who took control?' },
  { id: 'quiz', name: 'Challenge 1: Quiz', subtitle: 'Answer the hijacker\'s questions' },
  { id: 'post-quiz', name: 'Post-Quiz', subtitle: 'The hijacker responds...' },
  { id: 'connections', name: 'Challenge 2: Connections', subtitle: 'Sort the words into groups' },
  { id: 'wordle', name: 'Challenge 3: Wordle', subtitle: 'Guess the 5-letter word' },
  { id: 'post-wordle', name: 'Final Words', subtitle: 'The hijacker has one more thing...' },
  { id: 'timeline', name: 'Our Story', subtitle: 'How it all began' },
  { id: 'reveal', name: 'The Reveal', subtitle: 'Who is the hijacker?' },
  { id: 'proposal', name: 'A New Mission', subtitle: 'A question for you' },
];

export function stageIndex(id: StageId): number {
  return STAGES.findIndex((s) => s.id === id);
}
