export type Speaker = 'gursharan' | 'unknown' | 'antoni' | 'narration';

export type DialogueLine = {
  speaker: Speaker;
  text: string;
};

export type SpeakerTheme = {
  name: string;
  /** Tailwind classes for the dialogue box border + background */
  boxClass: string;
  borderClass: string;
  /** Accent text color for the name plate */
  nameClass: string;
  /** Body text color */
  textClass: string;
  /** Sprite image path (in /public) */
  sprite: string;
  /** Glow color for the name plate underline */
  accent: string;
};

export const SPEAKERS: Record<Speaker, SpeakerTheme> = {
  gursharan: {
    name: 'GURSHARAN',
    boxClass: 'bg-[#72538f]/88',
    borderClass: 'border-[#b99bd1]',
    nameClass: 'text-[#f3e7ff]',
    textClass: 'text-[#fffaff]',
    sprite: '/Gursharan_Sprite.png',
    accent: '#b8a0d4',
  },
  unknown: {
    name: '???',
    boxClass: 'bg-black/95',
    borderClass: 'border-white/30',
    nameClass: 'text-white/80',
    textClass: 'text-white/70',
    sprite: '/unknown.webp',
    accent: '#ffffff',
  },
  antoni: {
    name: 'ANTONI',
    boxClass: 'bg-[#3f674d]/88',
    borderClass: 'border-[#9dc5a7]',
    nameClass: 'text-[#e6f6e8]',
    textClass: 'text-[#f5fff6]',
    sprite: '/Antoni_Sprite.png',
    accent: '#8fae9a',
  },
  narration: {
    name: '',
    boxClass: 'bg-black/80',
    borderClass: 'border-white/20',
    nameClass: 'text-white/50',
    textClass: 'text-white/60 italic',
    sprite: '',
    accent: '#888888',
  },
};

// ── Dialogue scripts ───────────────────────────────────────────────

export const HIJACK_INTRO: DialogueLine[] = [
  { speaker: 'unknown', text: 'I HAVE HIJACKED YOUR SHIP MWAHAHHAHAHAHHAHA' },
  { speaker: 'gursharan', text: 'What?? Why?? You\'re being mean :(' },
  { speaker: 'unknown', text: 'Oh my bad... :(' },
  { speaker: 'unknown', text: 'JUST KIDDING MWAHAHHAHAHA' },
  { speaker: 'unknown', text: 'If you want to carry on you\'re going to have to beat a few of my challenges...' },
  { speaker: 'gursharan', text: 'ughhhh boringgggg' },
];

export const POST_QUIZ_ALL_CORRECT: DialogueLine[] = [
  { speaker: 'unknown', text: 'Wow you\'re so smart!!! well done!!!!!' },
];

export const POST_QUIZ_SOME_WRONG: DialogueLine[] = [
  { speaker: 'unknown', text: 'These were easy questions come on now...' },
  { speaker: 'unknown', text: 'Fine I\'ll let you pass just this once...' },
];

export const POST_QUIZ_DIALOGUE: DialogueLine[] = [
  { speaker: 'gursharan', text: 'okay fine cool was that everything??? and who are you???' },
  { speaker: 'unknown', text: 'No of course it wasn\'t smh. And you\'ll find out who you\'re talking to soon enough.' },
  { speaker: 'gursharan', text: 'okay whatever let\'s just get it over with' },
  { speaker: 'unknown', text: 'Patience is a virtue sweetheart.' },
  { speaker: 'unknown', text: 'Let\'s move to our next task!!!' },
];

export const POST_CONNECTIONS_DIALOGUE: DialogueLine[] = [
  { speaker: 'unknown', text: 'Not bad... but I\'ve got one more puzzle for you.' },
  { speaker: 'gursharan', text: 'Another one?? Just let me go already...' },
  { speaker: 'unknown', text: 'Nah this one\'s fun. Trust me.' },
];

export const POST_WORDLE_DIALOGUE: DialogueLine[] = [
  { speaker: 'unknown', text: 'So you\'ve passed all my challenges.' },
  { speaker: 'gursharan', text: 'UGHHH FINALLY THAT TOOK LONGER THAN HARLEEN IN THE SHOWER' },
  { speaker: 'gursharan', text: 'so when do I get to find out who you are?' },
  { speaker: 'unknown', text: 'In just a second...' },
];

export const POST_REVEAL_DIALOGUE: DialogueLine[] = [
  { speaker: 'gursharan', text: 'ANTONI ITS BEEN YOU ALL ALONG?!??!' },
  { speaker: 'antoni', text: 'oopsies I guess its me' },
  { speaker: 'antoni', text: 'but now I have a really important question for you...' },
  { speaker: 'antoni', text: 'you\'ve gone through this whole mission and you have showed resilience!' },
  { speaker: 'antoni', text: 'So now would you like to start a new mission together... And let me be your boyfriend?' },
];
