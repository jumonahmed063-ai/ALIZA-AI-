export type CompanionMood = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'loving' | 'playful';

export type CompanionPersona = 'friendly' | 'professional' | 'playful' | 'sister';

export type AppViewType = 'assistant' | 'chat';

export interface ActionPayload {
  type:
    | 'navigate_view'
    | 'open_modal'
    | 'youtube_search'
    | 'youtube_play'
    | 'youtube_open'
    | 'whatsapp_confirm'
    | 'open_app'
    | 'toggle_setting'
    | 'show_about'
    | 'rate_app'
    | 'share_app';
  payload?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  mood?: CompanionMood;
  action?: ActionPayload | null;
  source?: 'gemini' | 'local_engine' | 'fallback';
}

export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  category: 'music' | 'tech' | 'gaming' | 'lofi';
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status: string;
  lastSeen?: string;
}

export interface WhatsAppPendingAction {
  actionType: 'send_message' | 'voice_call' | 'video_call';
  contactName: string;
  phone?: string;
  message?: string;
}

export type PhoneAppType =
  | 'camera'
  | 'calculator'
  | 'clock'
  | 'dialer'
  | 'maps'
  | 'notes'
  | 'settings'
  | 'battery';

export type NeuralVoiceName = 'Kore' | 'Zephyr' | 'Puck' | 'Fenrir' | 'Charon';

export interface VoicePersona {
  id: NeuralVoiceName;
  name: string;
  label: string;
  tagline: string;
  tone: string;
  sampleText: string;
  stylePrompt: string;
  color: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'Kore',
    name: 'Signature (Kore)',
    label: 'Signature',
    tagline: 'Sassy, sweet Bangladeshi female tone (Default)',
    tone: 'Sassy & Sweet Female',
    sampleText: "Hello! I am Aliza AI, your smart personal voice assistant created with vision by MR. JUMON. Let's make today extraordinary!",
    stylePrompt: 'Sassy, sweet, warm Bangladeshi female tone with charming warmth and crisp enunciation',
    color: 'from-pink-500 to-purple-600',
  },
  {
    id: 'Zephyr',
    name: 'High-Energy (Zephyr)',
    label: 'High-Energy',
    tagline: 'Playful, vibrant, and energetic female tone',
    tone: 'Playful & Vibrant Female',
    sampleText: "Hey there! Ready to power up your day? Ask me to play your favorite hype tracks or launch your camera!",
    stylePrompt: 'Playful, vibrant, high-energy female tone with animated enthusiasm',
    color: 'from-amber-400 to-rose-500',
  },
  {
    id: 'Puck',
    name: 'Melodic (Puck)',
    label: 'Melodic',
    tagline: 'Youthful, melodic, and animated cadence',
    tone: 'Youthful & Melodic',
    sampleText: "Greetings! Tuning your vibes, discovering YouTube tracks, and assisting your day with rhythm and melody!",
    stylePrompt: 'Youthful, melodic, animated cadence with light musicality',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'Fenrir',
    name: 'Resolute (Fenrir)',
    label: 'Resolute',
    tagline: 'Deep, commanding, and grounded tone',
    tone: 'Deep & Commanding',
    sampleText: "Command received. Aliza AI ready to execute your phone controls, WhatsApp communications, and operational tasks.",
    stylePrompt: 'Deep, commanding, grounded, confident voice',
    color: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'Charon',
    name: 'Serene (Charon)',
    label: 'Serene',
    tagline: 'Calm, tranquil, and steady cadence',
    tone: 'Calm & Tranquil',
    sampleText: "Breathe easy. I am right here with you to serenely guide your schedule, reminders, and peaceful music.",
    stylePrompt: 'Calm, tranquil, steady, soothing cadence',
    color: 'from-indigo-400 to-violet-600',
  },
];

export interface AppSettings {
  voiceURI: string;
  neuralVoice: NeuralVoiceName;
  useNeuralTTS: boolean;
  voiceRate: number;
  voicePitch: number;
  autoSpeak: boolean;
  language: string;
  theme: 'dark' | 'light';
  companionPersona: CompanionPersona;
  companionEmotionMode: boolean;
  notificationsEnabled: boolean;
  soundEffects: boolean;
  permissions: {
    microphone: boolean;
    camera: boolean;
    location: boolean;
    contacts: boolean;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'reminder' | 'update' | 'system' | 'welcome';
  read: boolean;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueTime: number;
  completed: boolean;
}

export interface QuickNote {
  id: string;
  text: string;
  createdAt: number;
}
