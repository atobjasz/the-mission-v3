import { useCallback, useEffect, useRef, useState } from 'react';
import { Rocket, Power, RotateCcw, Terminal, Target, Shield, Volume2, VolumeX, FlaskConical, ChevronRight, AlertTriangle } from 'lucide-react';
import Starfield from '@/components/Starfield';
import ConsoleLine from '@/components/ConsoleLine';
import ConsolePanel from '@/components/ConsolePanel';
import DialogueBox from '@/components/DialogueBox';
import { STAGES, stageIndex, type StageId } from '@/game/stages';
import { useTypewriterLog } from '@/game/useTypewriterLog';
import ReactorMinigame from '@/game/ReactorMinigame';
import NavigationMinigame from '@/game/NavigationMinigame';
import AsteroidMinigame from '@/game/AsteroidMinigame';
import QuizMinigame from '@/game/QuizMinigame';
import ConnectionsMinigame from '@/game/ConnectionsMinigame';
import WordleMinigame from '@/game/WordleMinigame';
import TimelineCarousel from '@/game/TimelineCarousel';
import ProposalSequence from '@/game/ProposalSequence';
import {
  HIJACK_INTRO,
  POST_QUIZ_ALL_CORRECT,
  POST_QUIZ_SOME_WRONG,
  POST_QUIZ_DIALOGUE,
  POST_WORDLE_DIALOGUE,
  POST_REVEAL_DIALOGUE,
  type DialogueLine,
} from '@/game/dialogue';
import { resumeAudio, setMuted, isMuted, startEngineHum, stopLoop, sfx, explosion, whoosh, type LoopHandle } from '@/game/sound';

type GameState = 'title' | 'playing' | 'failed';
type HijackPhase = 'idle' | 'popup' | 'shattering';

type ScoreRecord = {
  stage: StageId;
  metric: number;
  unit: string;
};

const HYPERDRIVE_DURATION = 2600;
const HIJACK_DELAY = 5000; // 5 seconds after mission complete

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [currentStage, setCurrentStage] = useState<StageId>('boot');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [overallStatus, setOverallStatus] = useState<'nominal' | 'warning' | 'critical'>('nominal');
  const [hyperdrive, setHyperdrive] = useState(false);
  const [muted, setMutedState] = useState(false);
  // Hijack sequence state
  const [hijackPhase, setHijackPhase] = useState<HijackPhase>('idle');
  const engineHumRef = useRef<LoopHandle | null>(null);
  const hijackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hijackDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMute = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);
  }, []);

  const { typedLog, addLog, addLogBatch, clearLog } = useTypewriterLog();

  const currentIdx = stageIndex(currentStage);
  const stage = STAGES[currentIdx];

  const updateStatus = useCallback(() => {
    if (scores.some((s) => s.unit === 'shield' && s.metric < 30)) {
      setOverallStatus('critical');
    } else if (scores.length > 1) {
      setOverallStatus('warning');
    }
  }, [scores]);

  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

  // ── Hijack sequence ───────────────────────────────────────────────
  const triggerHijack = useCallback(() => {
    if (hijackTimerRef.current) clearTimeout(hijackTimerRef.current);
    setHijackPhase('popup');
    sfx.fail();
    hijackTimerRef.current = setTimeout(() => {
      setHijackPhase('shattering');
      explosion(0.5);
      whoosh(2.0, 0.4);
      hijackTimerRef.current = setTimeout(() => {
        setCurrentStage('hijack-intro');
        setHijackPhase('idle');
      }, 1200);
    }, 1500);
  }, []);

  // Start hijack timer when mission complete screen shows
  useEffect(() => {
    if (currentStage === 'complete' && hijackPhase === 'idle') {
      hijackDelayRef.current = setTimeout(() => {
        triggerHijack();
      }, HIJACK_DELAY);
      return () => {
        if (hijackDelayRef.current) clearTimeout(hijackDelayRef.current);
      };
    }
  }, [currentStage, hijackPhase, triggerHijack]);

  // Boot sequence
  const startGame = useCallback(() => {
    resumeAudio();
    sfx.boot();
    setTimeout(() => sfx.boot(), 200);
    if (engineHumRef.current) stopLoop(engineHumRef.current, 0.3);
    engineHumRef.current = startEngineHum(52, 0.10);
    setGameState('playing');
    setCurrentStage('boot');
    setScores([]);
    setHijackPhase('idle');
    clearLog();
    addLogBatch([
      { text: 'STELLAR-OS v3.1.4 — booting flight computer...', type: 'system', delay: 0 },
      { text: 'Loading navigation modules... OK', type: 'system', delay: 600 },
      { text: 'Calibrating gyroscopes... OK', type: 'system', delay: 1100 },
      { text: 'Mounting fuel tanks... OK', type: 'system', delay: 1600 },
      { text: 'Communications array... OK', type: 'system', delay: 2100 },
      { text: 'Mission: Reach the Antennae Galaxies. 3 stages ahead. Stay sharp, pilot.', type: 'narration', delay: 2700 },
      { text: 'Reactor is cold. Begin Stage 1: reactor power-up.', type: 'alert', delay: 3400 },
    ]);
    setTimeout(() => { sfx.boot(); setCurrentStage('reactor'); }, 4200);
  }, [addLogBatch, clearLog]);

  const jumpToStage = useCallback(
    (nextId: StageId, logEntries: { text: string; type?: 'system' | 'alert' | 'success' | 'error' | 'input' | 'narration' }[]) => {
      sfx.hyperdrive();
      setHyperdrive(true);
      addLogBatch(logEntries.map((e, i) => ({ ...e, delay: i * 400 })));
      setTimeout(() => {
        setHyperdrive(false);
        setCurrentStage(nextId);
      }, HYPERDRIVE_DURATION);
    },
    [addLogBatch],
  );

  const failMission = useCallback(
    (reason: string) => {
      sfx.fail();
      if (engineHumRef.current) { stopLoop(engineHumRef.current, 0.8); engineHumRef.current = null; }
      setGameState('failed');
      addLog(reason, 'error');
      addLogBatch([
        { text: 'Mission aborted. The ship drifts into the void...', type: 'narration', delay: 400 },
        { text: 'Select RESTART to try again.', type: 'alert', delay: 1000 },
      ]);
    },
    [addLog, addLogBatch],
  );

  // ── Original minigame completion handlers ──────────────────────────
  const handleReactorComplete = useCallback(
    (time: number) => {
      const seconds = (time / 1000).toFixed(1);
      setScores((s) => [...s, { stage: 'reactor', metric: Math.round(time), unit: 'ms' }]);
      addLog(`Reactor online in ${seconds}s. Core at full capacity.`, 'success');
      sfx.reactorComplete();
      addLog('Engaging FTL drive...', 'system');
      jumpToStage('navigation', [
        { text: 'Stage 2: Navigation lock. Plot a course through deep space.', type: 'alert' },
        { text: 'Move your cursor to the marker and lock coordinates.', type: 'system' },
      ]);
    },
    [addLog, jumpToStage],
  );

  const handleNavComplete = useCallback(
    (time: number) => {
      const seconds = (time / 1000).toFixed(1);
      setScores((s) => [...s, { stage: 'navigation', metric: Math.round(time), unit: 'ms' }]);
      addLog(`Coordinates locked in ${seconds}s. Jump vector confirmed.`, 'success');
      sfx.navLocked();
      addLog('Something ahead — asteroid field detected!', 'alert');
      jumpToStage('asteroids', [
        { text: 'Stage 3: Asteroid field. Defend the ship!', type: 'alert' },
        { text: 'Click incoming asteroids to destroy them. Don\'t let them hit the hull.', type: 'system' },
      ]);
    },
    [addLog, jumpToStage],
  );

  const handleAsteroidComplete = useCallback(
    (score: number) => {
      const shield = Math.max(0, 100 - Math.round((1 - score / 200) * 60));
      setScores((s) => [...s, { stage: 'asteroids', metric: shield, unit: 'shield' }]);
      if (shield <= 0) {
        failMission('Shield failure! Hull breached in the asteroid field.');
        return;
      }
      addLog(`Field cleared. Shield integrity at ${shield}%.`, 'success');
      sfx.asteroidComplete();
      addLog('The Antennae Galaxies are in visual range. Making final approach.', 'narration');
      addLogBatch([
        { text: 'Atmosphere of stars and dust surrounds the ship.', type: 'narration', delay: 600 },
        { text: 'Mission complete. Welcome to the Antennae Galaxies, pilot.', type: 'success', delay: 1300 },
      ]);
      setTimeout(() => {
        sfx.hyperdrive();
        setHyperdrive(true);
        setTimeout(() => {
          setHyperdrive(false);
          sfx.success();
          if (engineHumRef.current) { stopLoop(engineHumRef.current, 1.0); engineHumRef.current = null; }
          setCurrentStage('complete');
        }, HYPERDRIVE_DURATION);
      }, 1600);
    },
    [addLog, addLogBatch, failMission],
  );

  // ── Post-hijack challenge handlers ────────────────────────────────
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);

  const handleQuizComplete = useCallback(
    (score: number, total: number) => {
      setQuizScore(score);
      setQuizTotal(total);
      setCurrentStage('post-quiz');
    },
    [],
  );

  const handlePostQuizDialogue = useCallback(() => {
    // Show appropriate feedback dialogue, then the transition dialogue
    // We'll handle this via a composite: first show result, then transition
    setCurrentStage('connections');
  }, []);

  const handleConnectionsComplete = useCallback(() => {
    setCurrentStage('wordle');
  }, []);

  const handleWordleComplete = useCallback(() => {
    setCurrentStage('post-wordle');
  }, []);

  const handlePostWordleDialogue = useCallback(() => {
    setCurrentStage('timeline');
  }, []);

  const handleTimelineComplete = useCallback(() => {
    setCurrentStage('reveal');
  }, []);

  const handleRevealComplete = useCallback(() => {
    setCurrentStage('proposal');
  }, []);

  const handleProposalComplete = useCallback(() => {
    // Back to title
    if (engineHumRef.current) { stopLoop(engineHumRef.current, 0.3); engineHumRef.current = null; }
    setGameState('title');
    setCurrentStage('boot');
    setScores([]);
    setOverallStatus('nominal');
    setHyperdrive(false);
    setHijackPhase('idle');
    clearLog();
  }, [clearLog]);

  // Determine which dialogue to show for post-quiz
  const postQuizLines: DialogueLine[] = [
    ...(quizScore === quizTotal ? POST_QUIZ_ALL_CORRECT : POST_QUIZ_SOME_WRONG),
    ...POST_QUIZ_DIALOGUE,
  ];

  const restart = useCallback(() => {
    if (engineHumRef.current) { stopLoop(engineHumRef.current, 0.3); engineHumRef.current = null; }
    if (hijackTimerRef.current) clearTimeout(hijackTimerRef.current);
    if (hijackDelayRef.current) clearTimeout(hijackDelayRef.current);
    setGameState('title');
    setCurrentStage('boot');
    setScores([]);
    setOverallStatus('nominal');
    setHyperdrive(false);
    setHijackPhase('idle');
    clearLog();
  }, [clearLog]);

  // Dev shortcut: jump straight into any stage
  const skipToStage = useCallback((id: StageId) => {
    resumeAudio();
    if (engineHumRef.current) { stopLoop(engineHumRef.current, 0.3); engineHumRef.current = null; }
    if (hijackTimerRef.current) clearTimeout(hijackTimerRef.current);
    if (hijackDelayRef.current) clearTimeout(hijackDelayRef.current);
    engineHumRef.current = startEngineHum(52, 0.10);
    setHyperdrive(false);
    setOverallStatus('nominal');
    setHijackPhase('idle');
    clearLog();
    setScores([]);
    if (id === 'complete' || id === 'hijack' || id === 'hijack-intro' || id === 'quiz' || id === 'post-quiz' || id === 'connections' || id === 'wordle' || id === 'post-wordle' || id === 'timeline' || id === 'reveal' || id === 'proposal') {
      setScores([
        { stage: 'reactor', metric: 4200, unit: 'ms' },
        { stage: 'navigation', metric: 11000, unit: 'ms' },
        { stage: 'asteroids', metric: 75, unit: 'shield' },
      ]);
    }
    setGameState('playing');
    setCurrentStage(id);
  }, [clearLog]);

  // ── Title screen ──────────────────────────────────────────────────
  if (gameState === 'title') {
    return (
      <>
        <Starfield />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-coffee-400/15 border border-coffee-400/30 mb-4 animate-float-slow">
                <Rocket className="w-8 h-8 text-coffee-300" />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-black tracking-[0.2em] text-coffee-100 text-shadow-glow">
                STELLAR
              </h1>
              <p className="font-mono text-xs text-coffee-200/50 tracking-[0.3em] mt-1">
                M I S S I O N
              </p>
            </div>

            <div className="relative rounded-2xl border border-coffee-400/25 overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-md">
              <div className="absolute inset-0 opacity-90" style={{ background: 'linear-gradient(135deg, rgba(74,50,34,0.45) 0%, rgba(46,31,21,0.65) 100%)' }} />
              <div className="absolute left-0 right-0 h-16 pointer-events-none opacity-20" style={{ background: 'linear-gradient(to bottom, transparent, rgba(196,164,132,0.3), transparent)', animation: 'scan-line 5s linear infinite' }} />
              <div className="relative p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-coffee-400/15 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-coffee-300" />
                    <span className="font-mono text-xs text-coffee-200/60 tracking-wider">FLIGHT-CONSOLE</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-coffee-300/40" />
                    <div className="w-2 h-2 rounded-full bg-coffee-300/40" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                  </div>
                </div>
                <ConsolePanel
                  title="MISSION BRIEFING"
                  subtitle="Antennae Galaxies Expedition"
                  actions={[{ label: 'INITIATE LAUNCH', onClick: startGame, icon: <Power className="w-4 h-4" />, variant: 'primary' }]}
                >
                  <div className="space-y-2">
                    <p>Pilot, your mission is to fly the SS Stellar to the Antennae Galaxies, a pair of colliding spiral galaxies 45 million light-years away.</p>
                    <p className="text-coffee-200/50">Three stages stand between you and your destination:</p>
                    <ul className="space-y-1 text-coffee-200/70 pl-3">
                      <li className="flex items-center gap-2"><Power className="w-3 h-3" /> Reactor Power-Up</li>
                      <li className="flex items-center gap-2"><Target className="w-3 h-3" /> Navigation Lock</li>
                      <li className="flex items-center gap-2"><Shield className="w-3 h-3" /> Asteroid Field</li>
                    </ul>
                  </div>
                </ConsolePanel>
                <p className="font-mono text-[11px] text-center text-coffee-200/30">All systems standby. Awaiting your command.</p>
              </div>
            </div>
          </div>
        </div>
        <DevMenu currentStage={currentStage} onSkip={skipToStage} onRestart={restart} />
      </>
    );
  }

  // ── Failed screen ─────────────────────────────────────────────────
  if (gameState === 'failed') {
    return (
      <>
        <Starfield />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="relative rounded-2xl border border-red-500/20 overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-md">
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(74,30,30,0.5) 0%, rgba(40,20,20,0.7) 100%)' }} />
              <div className="relative p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-red-500/15 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-red-400/70" />
                    <span className="font-mono text-xs text-red-300/60 tracking-wider">FLIGHT-CONSOLE</span>
                  </div>
                  <span className="font-mono text-[10px] text-red-400/50 animate-blink">● CRITICAL</span>
                </div>
                <h3 className="font-display text-2xl font-black tracking-wider text-red-300">MISSION FAILED</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {typedLog.map((e) => (
                    <ConsoleLine key={e.id} line={e.text} type={e.type} />
                  ))}
                </div>
                <button onClick={restart} className="w-full py-3 rounded-lg font-display text-sm font-bold tracking-wide bg-coffee-400/90 hover:bg-coffee-300 text-coffee-900 transition-all hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> RESTART MISSION
                </button>
              </div>
            </div>
          </div>
        </div>
        <DevMenu currentStage={currentStage} onSkip={skipToStage} onRestart={restart} />
      </>
    );
  }

  // ── Playing: main game console ────────────────────────────────────
  const isComplete = currentStage === 'complete';
  const isPostHijack =
    currentStage === 'hijack-intro' ||
    currentStage === 'quiz' ||
    currentStage === 'post-quiz' ||
    currentStage === 'connections' ||
    currentStage === 'wordle' ||
    currentStage === 'post-wordle' ||
    currentStage === 'timeline' ||
    currentStage === 'reveal' ||
    currentStage === 'proposal';

  const renderMinigame = () => {
    switch (currentStage) {
      case 'reactor':
        return <ReactorMinigame onComplete={handleReactorComplete} onAbort={() => failMission('Reactor sequence aborted by pilot.')} />;
      case 'navigation':
        return <NavigationMinigame onComplete={handleNavComplete} onAbort={() => failMission('Navigation abandoned. Ship lost in deep space.')} />;
      case 'asteroids':
        return <AsteroidMinigame onComplete={handleAsteroidComplete} onAbort={() => failMission('Pilot bailed during asteroid field. Ship destroyed.')} />;
      default:
        return null;
    }
  };

  // ── Post-hijack view ──────────────────────────────────────────────
  // After the hijack, the console/minigame panels are replaced by a dialogue box
  // occupying the bottom half of the screen, with challenge stages in the top half.
  const renderPostHijackContent = () => {
    switch (currentStage) {
      case 'hijack-intro':
        return null; // dialogue only, no top content
      case 'quiz':
        return <QuizMinigame onComplete={handleQuizComplete} />;
      case 'post-quiz':
        return null; // dialogue only
      case 'connections':
        return <ConnectionsMinigame onComplete={handleConnectionsComplete} />;
      case 'wordle':
        return <WordleMinigame onComplete={handleWordleComplete} />;
      case 'post-wordle':
        return null; // dialogue only
      case 'timeline':
        return <TimelineCarousel onComplete={handleTimelineComplete} />;
      case 'reveal':
        return null; // dialogue only
      case 'proposal':
        return <ProposalSequence onComplete={handleProposalComplete} />;
      default:
        return null;
    }
  };

  const renderPostHijackDialogue = (): { lines: DialogueLine[]; onComplete: () => void; revealed?: boolean } | null => {
    switch (currentStage) {
      case 'hijack-intro':
        return { lines: HIJACK_INTRO, onComplete: () => setCurrentStage('quiz') };
      case 'post-quiz':
        return { lines: postQuizLines, onComplete: handlePostQuizDialogue };
      case 'connections':
        return null; // game-only stage — dialogue was shown in post-quiz
      case 'post-wordle':
        return { lines: POST_WORDLE_DIALOGUE, onComplete: handlePostWordleDialogue };
      case 'reveal':
        return { lines: POST_REVEAL_DIALOGUE, onComplete: handleRevealComplete, revealed: true };
      default:
        return null;
    }
  };

  // ── Hijack popup overlay ──────────────────────────────────────────
  if (hijackPhase === 'popup') {
    return (
      <>
        <Starfield hyperdrive={false} />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="animate-fade-in text-center px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-red-500/50 bg-red-950/40 mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400 animate-pulse" />
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-widest text-red-400 animate-blink mb-3">
              SYSTEM HIJACKED
            </h2>
            <p className="font-mono text-sm text-red-300/60 tracking-wider">
              UNAUTHORIZED ACCESS DETECTED
            </p>
            <p className="font-mono text-xs text-red-300/40 mt-2">
              Flight controls compromised...
            </p>
          </div>
        </div>
        <DevMenu currentStage={currentStage} onSkip={skipToStage} onRestart={restart} />
      </>
    );
  }

  // ── Post-hijack view (dialogue + challenge) ───────────────────────
  if (isPostHijack) {
    const dialogue = renderPostHijackDialogue();
    const topContent = renderPostHijackContent();
    // For connections stage, we show the game first, then dialogue after completion.
    // But the script says dialogue comes BEFORE connections. Let's handle that:
    // After post-quiz dialogue ends, we go to connections (game only, no dialogue).
    // After connections completes, we go to wordle directly.
    // After wordle completes, we show post-wordle dialogue.
    // So connections stage should NOT have dialogue — let's fix:
    const showDialogue = dialogue && currentStage !== 'connections';

    return (
      <>
        <Starfield />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl flex flex-col gap-4 py-4 justify-center">
            {/* Top half — challenge content */}
            {topContent && (
              <div className="flex-1 flex items-center justify-center min-h-0 py-2">
                {topContent}
              </div>
            )}

            {/* Bottom half — dialogue box */}
            {showDialogue && dialogue && (
              <div className="flex-shrink-0">
                <DialogueBox
                  lines={dialogue.lines}
                  onComplete={dialogue.onComplete}
                  revealed={dialogue.revealed}
                />
              </div>
            )}
          </div>
        </div>
        <DevMenu currentStage={currentStage} onSkip={skipToStage} onRestart={restart} />
      </>
    );
  }

  // ── Standard playing view (console + minigame / complete screen) ──
  return (
    <>
      <Starfield hyperdrive={hyperdrive} />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-5xl">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-coffee-300" />
              <span className="font-display text-xs sm:text-sm tracking-widest text-coffee-100">SS STELLAR</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleMute} className="text-coffee-200/40 hover:text-coffee-200/80 transition-colors" aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${overallStatus === 'nominal' ? 'bg-emerald-400' : overallStatus === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`} />
                <span className="font-mono text-[10px] uppercase tracking-widest text-coffee-200/50">{overallStatus}</span>
              </div>
            </div>
          </div>

          {/* Two-column layout with shatter animation */}
          <div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 h-[420px] lg:h-[calc(100vh-200px)] ${
              hijackPhase === 'shattering' ? 'shatter-container' : ''
            }`}
          >
            {/* Left — console */}
            <div className={`relative rounded-2xl border border-coffee-400/25 overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-md flex flex-col ${hijackPhase === 'shattering' ? 'shatter-left' : ''}`}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(74,50,34,0.50) 0%, rgba(46,31,21,0.68) 100%)' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-coffee-300/40 to-transparent" />
              <div className="absolute left-0 right-0 h-20 pointer-events-none opacity-15" style={{ background: 'linear-gradient(to bottom, transparent, rgba(196,164,132,0.4), transparent)', animation: 'scan-line 6s linear infinite' }} />
              <div className="relative p-5 sm:p-6 flex flex-col flex-1 min-h-0 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-coffee-400/15 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-coffee-300" />
                    <span className="font-mono text-xs text-coffee-200/60 tracking-wider">FLIGHT-CONSOLE</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-coffee-300/40" />
                    <div className="w-2 h-2 rounded-full bg-coffee-300/40" />
                    <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-400/70' : 'bg-amber-400/60 animate-pulse'}`} />
                  </div>
                </div>
                {!isComplete && (
                  <ConsolePanel title={stage.name} subtitle={stage.subtitle} progress={{ current: currentIdx, total: STAGES.length - 1, label: 'Stage' }} />
                )}
                {typedLog.length > 0 && (
                  <div className="border-t border-coffee-400/15 pt-3 flex flex-col flex-1 min-h-0 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-coffee-200/40">Event Log</span>
                    </div>
                    <div className="space-y-1 overflow-y-auto pr-1 flex-1 min-h-0">
                      {typedLog.map((e) => (
                        <ConsoleLine key={e.id} line={e.text} type={e.type} />
                      ))}
                      <div className="font-mono text-sm text-coffee-300/60 animate-blink">_</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right — mission / minigame */}
            <div className={`relative rounded-2xl border border-coffee-400/25 overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-md flex flex-col ${hijackPhase === 'shattering' ? 'shatter-right' : ''}`}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(74,50,34,0.50) 0%, rgba(46,31,21,0.68) 100%)' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-coffee-300/40 to-transparent" />
              <div className="relative p-5 sm:p-6 flex flex-col flex-1 min-h-0 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-coffee-400/15 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-coffee-300" />
                    <span className="font-mono text-xs text-coffee-200/60 tracking-wider">{isComplete ? 'MISSION REPORT' : 'ACTIVE MISSION'}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-coffee-300/40" />
                    <div className="w-2 h-2 rounded-full bg-coffee-300/40" />
                    <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-400/70' : 'bg-amber-400/60 animate-pulse'}`} />
                  </div>
                </div>
                <div className="min-h-0">
                  {renderMinigame()}
                  {isComplete && (
                    <div className="space-y-5 animate-fade-in">
                      <ConsolePanel title="MISSION COMPLETE" subtitle="SS Stellar — arrived at the Antennae Galaxies">
                        <div className="space-y-3">
                          <p className="text-coffee-100/80">You guided the SS Stellar safely across 45 million light-years. Here are your results:</p>
                          <div className="space-y-2">
                            {scores.map((s, i) => {
                              const st = STAGES.find((st) => st.id === s.stage);
                              if (!st) return null;
                              const display = s.unit === 'ms' ? `${(s.metric / 1000).toFixed(1)}s` : s.unit === 'shield' ? `${s.metric}%` : `${s.metric}%`;
                              return (
                                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-coffee-700/30 border border-coffee-400/10">
                                  <span className="font-mono text-xs text-coffee-100/70">{st.name}</span>
                                  <span className="font-mono text-sm font-bold text-coffee-200">{display}</span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="font-mono text-[11px] text-coffee-200/40 text-center mt-4 animate-blink">
                            Awaiting transmission...
                          </p>
                        </div>
                      </ConsolePanel>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center font-mono text-[10px] text-coffee-200/25 mt-3 tracking-widest">
            STELLAR-OS v3.1.4 — ANTENNAE EXPEDITION
          </p>
        </div>
      </div>
      <DevMenu currentStage={currentStage} onSkip={skipToStage} onRestart={restart} />
    </>
  );
}

// ── Dev Menu ──────────────────────────────────────────────────────────
function DevMenu({
  currentStage,
  onSkip,
  onRestart,
}: {
  currentStage: StageId;
  onSkip: (id: StageId) => void;
  onRestart: () => void;
}) {
  const [open, setOpen] = useState(false);
  const targets: StageId[] = [
    'reactor', 'navigation', 'asteroids', 'complete',
    'hijack-intro', 'quiz', 'post-quiz', 'connections', 'wordle', 'post-wordle', 'timeline', 'reveal', 'proposal',
  ];
  return (
    <div className="fixed bottom-3 right-3 z-50 font-mono">
      {open ? (
        <div className="rounded-lg border border-amber-400/30 bg-black/85 backdrop-blur-md p-2 shadow-xl shadow-black/50 space-y-1 w-52 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-amber-400/15">
            <span className="text-[10px] text-amber-300/70 tracking-widest">DEV MENU</span>
            <button onClick={() => setOpen(false)} className="text-amber-300/50 hover:text-amber-300 text-xs" aria-label="Close dev menu">✕</button>
          </div>
          {targets.map((id) => {
            const st = STAGES.find((s) => s.id === id)!;
            const active = currentStage === id;
            return (
              <button
                key={id}
                onClick={() => onSkip(id)}
                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5 ${
                  active ? 'text-amber-300 bg-amber-400/10' : 'text-coffee-200/60 hover:text-coffee-100 hover:bg-white/5'
                }`}
              >
                <ChevronRight className="w-3 h-3 shrink-0" />
                {st.name}
              </button>
            );
          })}
          <button
            onClick={onRestart}
            className="w-full text-left px-2 py-1 rounded text-[11px] text-red-300/60 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
          >
            <ChevronRight className="w-3 h-3 shrink-0" />
            Back to title
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/20 bg-black/70 text-amber-300/60 hover:text-amber-300 hover:border-amber-400/40 transition-all backdrop-blur-sm"
          aria-label="Open dev menu"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span className="text-[10px] tracking-widest">DEV</span>
        </button>
      )}
    </div>
  );
}
