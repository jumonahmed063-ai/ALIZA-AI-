/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIZA AI – Your Smart Voice Assistant
 * Developed with vision by MR. JUMON
 * Tagline: Your Smart Voice, Your Personal Assistant.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Youtube,
  MessageSquare,
  Smartphone,
  Settings,
  Bell,
  Star,
  Share2,
  Info,
  Crown,
  Volume2,
  VolumeX,
  Sparkles,
  MessageCircle,
  Radio,
  Zap,
  Flame,
  AlertTriangle,
  X,
  Compass,
  Bot,
} from 'lucide-react';
import {
  ChatMessage,
  CompanionMood,
  AppSettings,
  NotificationItem,
  ReminderItem,
  WhatsAppPendingAction,
  PhoneAppType,
} from './types';
import { useSpeech } from './hooks/useSpeech';
import { soundFx } from './services/soundFx';
import { CompanionHologram } from './components/CompanionHologram';
import { YouTubeHub } from './components/YouTubeHub';
import { WhatsAppHub } from './components/WhatsAppHub';
import { PhoneControlModal } from './components/PhoneControlModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsCenter } from './components/NotificationsCenter';
import { RateAppModal } from './components/RateAppModal';
import { ShareAppModal } from './components/ShareAppModal';
import { AboutModal } from './components/AboutModal';
import { App as CapApp } from '@capacitor/app';
import { API_BASE } from './config';

const DEFAULT_SETTINGS: AppSettings = {
  voiceURI: '',
  neuralVoice: 'Kore',
  useNeuralTTS: true,
  voiceRate: 1.0,
  voicePitch: 1.05,
  autoSpeak: true,
  language: 'en-US',
  theme: 'dark',
  companionPersona: 'friendly',
  companionEmotionMode: true,
  notificationsEnabled: true,
  soundEffects: true,
  permissions: {
    microphone: true,
    camera: true,
    location: true,
    contacts: true,
  },
};

const OFFICIAL_WELCOME_TEXT =
  "Hello! I am Aliza AI, your smart personal voice assistant. I am here to help you with phone activities, YouTube, WhatsApp, everyday tasks, and intelligent conversations. Just speak, and let's get started!";

export default function App() {
  // Settings with localStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aliza_settings');
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch (_) {}
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aliza_settings', JSON.stringify(settings));
    }
    soundFx.enabled = settings.soundEffects;
  }, [settings]);

  // Messages / Chat Transcript
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: OFFICIAL_WELCOME_TEXT,
      timestamp: Date.now(),
      mood: 'happy',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [companionMood, setCompanionMood] = useState<CompanionMood>('happy');
  const [activeView, setActiveView] = useState<'assistant' | 'chat'>('assistant');
  const [navNotice, setNavNotice] = useState<{ text: string; icon?: string } | null>(null);

  useEffect(() => {
    if (navNotice) {
      const timer = setTimeout(() => setNavNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [navNotice]);

  // Modals state
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [youtubeQuery, setYoutubeQuery] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | undefined>(undefined);

  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappAction, setWhatsappAction] = useState<WhatsAppPendingAction | null>(null);

  const [phoneControlOpen, setPhoneControlOpen] = useState(false);
  const [phoneApp, setPhoneApp] = useState<PhoneAppType>('settings');

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isServerOffline, setIsServerOffline] = useState(false);

  // Monitor backend health
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
        if (isMounted) {
          setIsServerOffline(!res.ok);
        }
      } catch (_) {
        if (isMounted) {
          setIsServerOffline(true);
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Hardware back button handler for Android Capacitor
  useEffect(() => {
    let removeListener: (() => void) | null = null;
    try {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (youtubeOpen) { setYoutubeOpen(false); return; }
        if (whatsappOpen) { setWhatsappOpen(false); return; }
        if (phoneControlOpen) { setPhoneControlOpen(false); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (notificationsOpen) { setNotificationsOpen(false); return; }
        if (rateOpen) { setRateOpen(false); return; }
        if (shareOpen) { setShareOpen(false); return; }
        if (aboutOpen) { setAboutOpen(false); return; }
        if (activeView === 'chat') {
          setActiveView('assistant');
          return;
        }
        if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      }).then((handle) => {
        removeListener = () => { handle.remove(); };
      }).catch(() => {});
    } catch (_) {}

    return () => {
      if (removeListener) removeListener();
    };
  }, [
    youtubeOpen,
    whatsappOpen,
    phoneControlOpen,
    settingsOpen,
    notificationsOpen,
    rateOpen,
    shareOpen,
    aboutOpen,
    activeView,
  ]);

  // Notifications & Reminders
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Welcome to ALIZA AI!',
      message: 'Created with vision by MR. JUMON. Try asking "Open YouTube" or "Message on WhatsApp".',
      timestamp: Date.now() - 600000,
      type: 'welcome',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'New Update v2.6 Neural Voice Active',
      message: 'Gemini 3.8 Flash Neural Speech (gemini-3.8-flash-lite-tts) with 5 voice personas now live.',
      timestamp: Date.now() - 3600000,
      type: 'update',
      read: true,
    },
  ]);

  const [reminders, setReminders] = useState<ReminderItem[]>([
    {
      id: 'rem-1',
      title: 'Check YouTube trending songs with Aliza',
      dueTime: Date.now() + 1800000,
      completed: false,
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Voice speech hook with Gemini 3.8 Flash Neural Speech & Sample Audition
  const {
    voices,
    isSpeaking,
    isListening,
    transcript,
    audioLevel,
    playingVoiceId,
    micError,
    setMicError,
    recognitionSupported,
    startListening,
    stopListening,
    speak,
    playVoiceSample,
    stopSpeaking,
  } = useSpeech({
    language: settings.language,
    voiceURI: settings.voiceURI,
    neuralVoice: settings.neuralVoice,
    useNeuralTTS: settings.useNeuralTTS,
    voiceRate: settings.voiceRate,
    voicePitch: settings.voicePitch,
    autoSpeak: settings.autoSpeak,
    onTranscript: (finalVoiceText) => {
      if (finalVoiceText.trim()) {
        handleSendMessage(finalVoiceText.trim());
      }
    },
  });

  // Handle incoming reminder timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach((r) => {
        if (!r.completed && r.dueTime <= now) {
          // Mark completed
          setReminders((prev) =>
            prev.map((item) => (item.id === r.id ? { ...item, completed: true } : item))
          );
          // Trigger notification & voice
          soundFx.playAlert();
          const alertMsg = `Aliza AI Reminder: It is time to ${r.title}!`;
          setNotifications((prev) => [
            {
              id: 'rem-notif-' + Date.now(),
              title: 'Reminder Alert',
              message: alertMsg,
              timestamp: Date.now(),
              type: 'reminder',
              read: false,
            },
            ...prev,
          ]);
          if (settings.autoSpeak) {
            speak(alertMsg);
          }
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [reminders, settings.autoSpeak, speak]);

  // Scroll chat to bottom when updated
  useEffect(() => {
    if (activeView === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeView]);

  // Speak welcome message on user request or first load
  const handleSpeakWelcome = useCallback(() => {
    setCompanionMood('happy');
    soundFx.playSuccess();
    speak(OFFICIAL_WELCOME_TEXT);
  }, [speak]);

  // Process assistant action returned from server or intent engine
  const executeAssistantAction = useCallback(
    (action: any) => {
      if (!action || !action.type) return;

      switch (action.type) {
        case 'navigate_view':
          const targetView = action.payload?.view;
          if (targetView === 'chat' || targetView === 'assistant') {
            setActiveView(targetView);
            soundFx.playSuccess();
            setNavNotice({
              text: targetView === 'chat' ? 'Switched to Chat Log view' : 'Switched to Assistant view',
              icon: targetView === 'chat' ? '💬' : '🤖',
            });
          }
          break;

        case 'open_modal':
          const modalName = action.payload?.modal;
          if (modalName === 'settings') {
            setSettingsOpen(true);
            setNavNotice({ text: 'Opened Settings', icon: '⚙️' });
          } else if (modalName === 'notifications') {
            setNotificationsOpen(true);
            setNavNotice({ text: 'Opened Notifications', icon: '🔔' });
          }
          soundFx.playTap();
          break;

        case 'youtube_open':
          setYoutubeQuery('');
          setYoutubeVideoId(undefined);
          setYoutubeOpen(true);
          break;

        case 'youtube_search':
          setYoutubeQuery(action.payload?.query || '');
          setYoutubeOpen(true);
          break;

        case 'youtube_play':
          setYoutubeQuery(action.payload?.query || '');
          setYoutubeVideoId(action.payload?.videoId);
          setYoutubeOpen(true);
          break;

        case 'whatsapp_confirm':
          setWhatsappAction({
            actionType: action.payload?.actionType || 'send_message',
            contactName: action.payload?.contactName || 'Friend',
            phone: action.payload?.phone || '',
            message: action.payload?.message || '',
          });
          setWhatsappOpen(true);
          break;

        case 'open_app':
          const targetApp = (action.payload?.app as PhoneAppType) || 'settings';
          setPhoneApp(targetApp);
          setPhoneControlOpen(true);
          break;

        case 'toggle_setting':
          setPhoneApp('settings');
          setPhoneControlOpen(true);
          break;

        case 'show_about':
          setAboutOpen(true);
          break;

        case 'rate_app':
          setRateOpen(true);
          break;

        case 'share_app':
          setShareOpen(true);
          break;

        default:
          break;
      }
    },
    []
  );

  // Send message to server backend (Gemini API with fallback engine)
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    soundFx.playTap();
    setInputText('');
    setCompanionMood('thinking');
    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Fast zero-latency Voice Navigation intent handling
    const lower = text.toLowerCase().trim();
    const isNavToChat =
      lower.includes('switch to chat') ||
      lower.includes('open chat') ||
      lower.includes('show chat') ||
      lower.includes('go to chat') ||
      lower.includes('view chat') ||
      lower.includes('chat log') ||
      lower.includes('chat view') ||
      lower.includes('open conversation') ||
      lower.includes('show messages') ||
      lower.includes('see messages') ||
      lower === 'chat';

    const isNavToAssistant =
      lower.includes('switch to assistant') ||
      lower.includes('open assistant') ||
      lower.includes('show assistant') ||
      lower.includes('go to assistant') ||
      lower.includes('assistant view') ||
      lower.includes('avatar view') ||
      lower.includes('show avatar') ||
      lower.includes('show hologram') ||
      lower.includes('back to assistant') ||
      lower.includes('go home') ||
      lower.includes('home screen') ||
      lower.includes('companion view') ||
      lower === 'assistant';

    if (isNavToChat) {
      setActiveView('chat');
      setNavNotice({ text: 'Voice Nav: Switched to Chat Log', icon: '💬' });
      soundFx.playSuccess();
    } else if (isNavToAssistant) {
      setActiveView('assistant');
      setNavNotice({ text: 'Voice Nav: Switched to Assistant View', icon: '🤖' });
      soundFx.playSuccess();
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          companionPersona: settings.companionPersona,
          language: settings.language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      setIsServerOffline(false);
      const data = await response.json();
      const replyText = data.reply || data.speech || "I'm here for you!";
      const responseMood: CompanionMood = data.mood || 'happy';

      const assistantMsg: ChatMessage = {
        id: 'reply-' + Date.now(),
        role: 'assistant',
        text: replyText,
        timestamp: Date.now(),
        mood: responseMood,
        action: data.action || null,
        source: data.source || 'gemini',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setCompanionMood(responseMood);

      // Auto speak aloud
      if (settings.autoSpeak) {
        speak(replyText);
      }

      // Execute structured phone / app action if provided
      if (data.action) {
        executeAssistantAction(data.action);
      }
    } catch (err) {
      console.warn('Backend unavailable, falling back to local assistant engine:', err);
      setIsServerOffline(true);
      const fallbackText =
        "I'm right here with you! What would you like to do on your phone today?";
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: fallbackText,
          timestamp: Date.now(),
          mood: 'loving',
        },
      ]);
      if (settings.autoSpeak) {
        speak(fallbackText);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle mic listening
  const handleMicToggle = () => {
    soundFx.playTap();
    if (isListening) {
      stopListening();
    } else {
      setMicError(null);
      startListening();
    }
  };

  // Add reminder helper
  const handleAddReminder = (title: string, minutes: number) => {
    const due = Date.now() + minutes * 60 * 1000;
    const newRem: ReminderItem = {
      id: 'rem-' + Date.now(),
      title,
      dueTime: due,
      completed: false,
    };
    setReminders((prev) => [newRem, ...prev]);
    const conf = `Reminder set: "${title}" in ${minutes} minutes.`;
    if (settings.autoSpeak) {
      speak(conf);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const latestAssistantMessage =
    [...messages].reverse().find((m) => m.role === 'assistant')?.text ||
    OFFICIAL_WELCOME_TEXT;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        settings.theme === 'dark'
          ? 'bg-slate-950 text-slate-100 selection:bg-purple-600 selection:text-white'
          : 'bg-slate-50 text-slate-900 selection:bg-purple-200 selection:text-purple-900'
      }`}
    >
      {/* Ambient Cyber Neon Background Grid */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-700/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-pink-700/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-cyan-700/10 rounded-full blur-[100px]" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 px-4 py-3 border-b border-purple-500/20 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between shadow-lg">
        {/* Brand identity matching the poster */}
        <div
          onClick={() => setAboutOpen(true)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            <img
              src="/assets/aistudio/file_000000007234821199c3208d804a0535_3dac4304.png"
              alt="Aliza AI"
              className="w-10 h-10 rounded-xl object-cover border-2 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:scale-105 transition"
            />
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400 absolute -top-2 -left-1 drop-shadow" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300">
                ALIZA AI
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v2.5
              </span>
            </div>
            <p className="text-[10px] text-purple-300 font-medium tracking-tight">
              Developed by <span className="text-white font-semibold">MR. JUMON</span>
            </p>
          </div>
        </div>

        {/* Top Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Voice Model Badge displaying active voice persona */}
          <button
            onClick={() => setSettingsOpen(true)}
            title="Active Neural Voice: Click to audition or change voice persona"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pink-950/60 hover:bg-pink-900/70 border border-pink-500/40 text-pink-300 hover:text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] transition text-xs font-semibold"
          >
            <div className="flex items-center gap-0.5 h-3">
              <span className={`w-0.5 bg-pink-400 rounded-full transition-all ${isSpeaking || playingVoiceId ? 'animate-pulse h-3' : 'h-1.5'}`} />
              <span className={`w-0.5 bg-purple-400 rounded-full transition-all ${isSpeaking || playingVoiceId ? 'animate-pulse delay-75 h-2.5' : 'h-2'}`} />
              <span className={`w-0.5 bg-cyan-400 rounded-full transition-all ${isSpeaking || playingVoiceId ? 'animate-pulse delay-150 h-3.5' : 'h-1'}`} />
            </div>
            <span className="text-[11px] font-bold">
              Voice: {settings.neuralVoice || 'Kore'}
            </span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setNotificationsOpen(true)}
            title="Notifications & Reminders"
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Rate App Button */}
          <button
            onClick={() => setRateOpen(true)}
            title="Rate Aliza AI"
            className="p-2 rounded-xl text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-1 text-xs font-semibold"
          >
            <Star className="w-4 h-4 fill-amber-400" />
            <span className="hidden md:inline">Rate</span>
          </button>

          {/* Share App Button */}
          <button
            onClick={() => setShareOpen(true)}
            title="Share Aliza AI"
            className="p-2 rounded-xl text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition flex items-center gap-1 text-xs font-semibold"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden md:inline">Share</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            title="Voice & App Settings"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Server Offline Banner */}
      {isServerOffline && (
        <div className="mx-4 mt-2 px-3.5 py-2 rounded-2xl bg-amber-950/90 border border-amber-500/50 text-amber-200 flex items-center justify-between gap-2 text-xs shadow-lg backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">Aliza is offline – basic commands only</span>
          </div>
          <span className="text-[10px] text-amber-300/80 uppercase tracking-wider font-mono">Local Engine</span>
        </div>
      )}

      {/* Mic Diagnostic / Permission Banner if error encountered */}
      {micError && (
        <div className="mx-4 mt-2 px-3.5 py-2.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 flex items-center justify-between gap-3 text-xs shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px] sm:text-xs">
              <span className="font-bold text-amber-300">
                {micError === 'permission_denied' && 'Microphone Access Blocked: '}
                {micError === 'unsupported' && 'Browser Support Notice: '}
                {micError === 'no_speech' && 'No Speech Detected: '}
                {micError === 'audio_capture' && 'Microphone Device Busy: '}
                {micError === 'network' && 'Speech Connection Issue: '}
                {micError === 'start_failed' && 'Microphone Notice: '}
              </span>
              <span>
                {micError === 'permission_denied' &&
                  'Please click the lock or camera/mic icon in your browser address bar to allow microphone access, then tap Try Again.'}
                {micError === 'unsupported' &&
                  'Voice speech recognition requires Chrome, Edge, or Android. You can also tap any quick command chip or type below!'}
                {micError === 'no_speech' &&
                  'No voice was detected before timeout. Tap the microphone when you are ready to speak.'}
                {micError === 'audio_capture' &&
                  'Microphone is unavailable or locked by another application. Please check your mic device and retry.'}
                {micError === 'network' &&
                  'Voice recognition network error. Please check your connection or use the text box.'}
                {micError === 'start_failed' &&
                  'Could not start speech recognition. Please tap Try Again or use the text input.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setMicError(null);
                startListening();
              }}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
            >
              Try Again
            </button>
            <button
              onClick={() => setMicError(null)}
              className="p-1 rounded-lg text-amber-400 hover:text-white cursor-pointer"
              title="Dismiss Notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QUICK FEATURE BADGES (Directly from poster: YouTube, WhatsApp, Phone, AI Assistant) */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-purple-500/10 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          {/* YouTube Control Quick Pill */}
          <button
            onClick={() => {
              soundFx.playTap();
              setYoutubeOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 text-xs font-semibold shadow-[0_0_15px_rgba(239,68,68,0.2)] transition shrink-0"
          >
            <Youtube className="w-4 h-4 text-red-500" />
            <span>YouTube Control</span>
          </button>

          {/* WhatsApp Control Quick Pill */}
          <button
            onClick={() => {
              soundFx.playTap();
              setWhatsappOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)] transition shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>WhatsApp Assistant</span>
          </button>

          {/* Quick Tools Pill */}
          <button
            onClick={() => {
              soundFx.playTap();
              setPhoneControlOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/40 text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)] transition shrink-0"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Quick Tools</span>
          </button>
        </div>

        {/* View Toggle: Assistant Orb vs Full Transcript */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[10px] text-purple-300 font-medium">
            <Compass className="w-3 h-3 text-pink-400" />
            <span>Voice: "Switch to Chat" / "Switch to Assistant"</span>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            <button
              onClick={() => {
                soundFx.playTap();
                setActiveView('assistant');
                setNavNotice({ text: 'Switched to Assistant Avatar', icon: '🤖' });
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'assistant'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Assistant</span>
            </button>
            <button
              onClick={() => {
                soundFx.playTap();
                setActiveView('chat');
                setNavNotice({ text: 'Switched to Chat Log', icon: '💬' });
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'chat'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat Log ({messages.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Voice Navigation Toast */}
      {navNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-900/95 via-pink-900/95 to-slate-900/95 border border-pink-400/50 shadow-[0_0_30px_rgba(236,72,153,0.5)] backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold text-white animate-fadeIn">
          <span className="text-base">{navNotice.icon || '🧭'}</span>
          <span>{navNotice.text}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-purple-500/30 text-purple-200 border border-purple-400/40">
            Voice Command
          </span>
          <button
            onClick={() => setNavNotice(null)}
            className="ml-1 p-0.5 rounded text-purple-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MAIN INTERFACE */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 space-y-4">
        {/* VIEW 1: ASSISTANT HOLOGRAM & HERO STAGE */}
        {activeView === 'assistant' ? (
          <div className="flex-1 flex flex-col justify-center items-center py-2 space-y-4">
            {/* Holographic Interactive Avatar */}
            <CompanionHologram
              mood={companionMood}
              isListening={isListening}
              isSpeaking={isSpeaking}
              audioLevel={audioLevel}
              latestSpeech={latestAssistantMessage}
              transcript={transcript}
              micError={micError}
              onClearMicError={() => setMicError(null)}
              onMicToggle={handleMicToggle}
              onStopSpeaking={stopSpeaking}
              onMoodSelect={(m) => {
                setCompanionMood(m);
                soundFx.playTap();
                speak(`Companion emotion set to ${m}.`);
              }}
              activeNeuralVoice={settings.neuralVoice}
              onSelectNeuralVoice={(v) => {
                setSettings((prev) => ({ ...prev, neuralVoice: v }));
              }}
              onPlayVoiceSample={playVoiceSample}
              playingVoiceId={playingVoiceId}
            />

            {/* Live voice speech transcription display */}
            {transcript && (
              <div className="w-full max-w-md p-3 rounded-2xl bg-cyan-950/60 border border-cyan-400/50 text-center animate-fadeIn shadow-lg shadow-cyan-500/20">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block mb-1">
                  Hearing You:
                </span>
                <p className="text-sm font-semibold text-white">"{transcript}"</p>
              </div>
            )}

            {/* Fast Voice Command Suggestions */}
            <div className="w-full max-w-xl text-center space-y-2 pt-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-purple-300/80 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Try Speaking to Aliza:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { text: 'Switch to Chat Log', icon: '💬' },
                  { text: 'Switch to Assistant', icon: '🤖' },
                  { text: 'Play Lo-Fi on YouTube', icon: '🎵' },
                  { text: 'Message Mom on WhatsApp', icon: '💬' },
                  { text: 'Start WhatsApp Call', icon: '📞' },
                  { text: 'Open Settings', icon: '⚙️' },
                  { text: 'Open Camera', icon: '📸' },
                  { text: 'Open Calculator', icon: '🧮' },
                  { text: 'Who created you?', icon: '👑' },
                ].map((chip) => (
                  <button
                    key={chip.text}
                    onClick={() => {
                      soundFx.playTap();
                      handleSendMessage(chip.text);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-purple-900/40 text-xs text-slate-300 hover:text-white border border-purple-500/20 hover:border-purple-500/50 transition flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <span>{chip.icon}</span>
                    <span>"{chip.text}"</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: SCROLLABLE CHAT TRANSCRIPT */
          <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-900/30 border border-slate-800 flex flex-col">
            {/* Quick Voice Navigation Banner in Chat View */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900/80 to-pink-950/40 border border-purple-500/40 text-xs shadow-md shrink-0">
              <div className="flex items-center gap-2 text-purple-200">
                <Compass className="w-4 h-4 text-pink-400 shrink-0 animate-pulse" />
                <span className="text-[11px] sm:text-xs">
                  Voice Navigation: Say <strong>"Switch to Assistant"</strong> or <strong>"Show Avatar"</strong> to return.
                </span>
              </div>
              <button
                onClick={() => {
                  soundFx.playTap();
                  setActiveView('assistant');
                  setNavNotice({ text: 'Switched to Assistant Avatar', icon: '🤖' });
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shrink-0 transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Return to Avatar</span>
              </button>
            </div>

            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <img
                      src="/assets/aistudio/file_000000007234821199c3208d804a0535_3dac4304.png"
                      alt="Aliza"
                      className="w-8 h-8 rounded-full object-cover border border-purple-500/40 shrink-0 self-end mb-1"
                    />
                  )}
                  <div
                    className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow ${
                      isAssistant
                        ? 'bg-slate-900 border border-purple-500/30 text-slate-100 rounded-bl-none'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[11px] text-purple-300">
                        {isAssistant ? 'ALIZA AI' : 'You'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {isAssistant && (
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 capitalize">
                          Mood: {msg.mood || 'happy'}
                        </span>
                        <button
                          onClick={() => speak(msg.text)}
                          title="Speak Again"
                          className="p-1 rounded text-purple-400 hover:text-purple-300 hover:bg-slate-800 transition flex items-center gap-1 text-[10px]"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Re-play
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
        )}
      </main>

      {/* BOTTOM INPUT & VOICE COMMAND CONTROLLER */}
      <footer className="sticky bottom-0 z-40 p-3 sm:p-4 bg-slate-950/90 border-t border-purple-500/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
          {/* Glowing Voice Mic Button */}
          <button
            onClick={handleMicToggle}
            title={
              isListening
                ? transcript
                  ? 'Tap to send what you said'
                  : 'Listening... Tap to stop'
                : 'Speak to Aliza AI'
            }
            className={`p-3.5 sm:p-4 rounded-full transition-all duration-300 shadow-xl shrink-0 cursor-pointer ${
              isListening
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white animate-pulse ring-4 ring-red-500/40 shadow-red-500/50 scale-105'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white hover:scale-105 shadow-purple-600/40'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>

          {/* Text Input Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder={
                isListening
                  ? transcript
                    ? `Hearing: "${transcript}" (Tap mic to send)`
                    : 'Listening to your voice... Speak your command clearly now'
                  : 'Ask Aliza: "Play music on YouTube", "Message Alex", "Open Camera"...'
              }
              className={`w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-900 border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner ${
                isListening
                  ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                  : 'border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40'
              }`}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isProcessing}
              title="Send Command"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Audio Auto-Speak Toggle */}
          <button
            onClick={() => {
              const nextVal = !settings.autoSpeak;
              setSettings((prev) => ({ ...prev, autoSpeak: nextVal }));
              soundFx.playTap();
              if (nextVal) {
                speak('Voice audio enabled.');
              } else {
                stopSpeaking();
              }
            }}
            title={settings.autoSpeak ? 'Mute AI Spoken Replies' : 'Enable AI Spoken Replies'}
            className={`p-3 rounded-2xl border transition shrink-0 ${
              settings.autoSpeak
                ? 'bg-purple-950/50 border-purple-500/40 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {settings.autoSpeak ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>
      </footer>

      {/* MODAL 1: YOUTUBE HUB */}
      <YouTubeHub
        isOpen={youtubeOpen}
        onClose={() => setYoutubeOpen(false)}
        initialQuery={youtubeQuery}
        autoplayVideoId={youtubeVideoId}
        onSpeak={(t) => {
          if (settings.autoSpeak) speak(t);
        }}
      />

      {/* MODAL 2: WHATSAPP HUB */}
      <WhatsAppHub
        isOpen={whatsappOpen}
        onClose={() => {
          setWhatsappOpen(false);
          setWhatsappAction(null);
        }}
        pendingAction={whatsappAction}
        onClearPendingAction={() => setWhatsappAction(null)}
        onSpeak={(t) => {
          if (settings.autoSpeak) speak(t);
        }}
      />

      {/* MODAL 3: PHONE CONTROL & APPS */}
      <PhoneControlModal
        isOpen={phoneControlOpen}
        onClose={() => setPhoneControlOpen(false)}
        activeApp={phoneApp}
        onSpeak={(t) => {
          if (settings.autoSpeak) speak(t);
        }}
      />

      {/* MODAL 4: SETTINGS */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        availableVoices={voices}
        onTestVoice={() => {
          speak(
            `Hello! I am Aliza AI, developed by MR. JUMON. My active neural voice is tested and working perfectly.`
          );
        }}
        onPlaySampleVoice={playVoiceSample}
        playingVoiceId={playingVoiceId}
      />

      {/* MODAL 5: NOTIFICATIONS & REMINDERS */}
      <NotificationsCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        reminders={reminders}
        onAddReminder={handleAddReminder}
        onToggleReminder={(id) =>
          setReminders((prev) =>
            prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
          )
        }
        onDeleteReminder={(id) =>
          setReminders((prev) => prev.filter((r) => r.id !== id))
        }
      />

      {/* MODAL 6: RATE APP */}
      <RateAppModal
        isOpen={rateOpen}
        onClose={() => setRateOpen(false)}
        onSpeak={(t) => {
          if (settings.autoSpeak) speak(t);
        }}
      />

      {/* MODAL 7: SHARE APP */}
      <ShareAppModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        onSpeak={(t) => {
          if (settings.autoSpeak) speak(t);
        }}
      />

      {/* MODAL 8: ABOUT ALIZA AI & MR. JUMON */}
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onSpeakWelcome={handleSpeakWelcome}
      />
    </div>
  );
}
