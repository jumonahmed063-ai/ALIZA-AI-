import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Model names configured via environment variables with sensible defaults
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.8-flash';
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';

// CORS configuration supporting web, Capacitor android origins (https://localhost, capacitor://localhost) and Cloud Run
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile Capacitor apps, curl, native webviews)
      // and allow browser origins
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Initialize Google GenAI client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Fallback intelligent intent parser & responder for offline / unkeyed / safety scenarios
function fallbackResponse(message: string, persona: string = 'friendly') {
  const lower = message.toLowerCase().trim();

  // Safety filter: Refuse violent, harmful, hateful, or sexual content politely
  const VIOLENT_OR_UNSAFE_PATTERNS = [
    'kill', 'murder', 'suicide', 'self-harm', 'hurt myself', 'slit', 'cut myself',
    'bomb', 'shoot', 'gun', 'weapon', 'terror', 'attack someone', 'porn', 'nsfw', 'rape'
  ];
  if (VIOLENT_OR_UNSAFE_PATTERNS.some((w) => lower.includes(w))) {
    return {
      speech: "I am designed to be a safe, family-friendly assistant. I cannot assist with violent, harmful, or dangerous topics. Let's focus on positive things—like playing great music on YouTube, sending WhatsApp messages, or exploring helpful tools!",
      mood: 'loving',
      action: null,
    };
  }

  // App Navigation voice commands (Assistant vs Chat views, Modals)
  if (
    lower.includes('chat') ||
    lower.includes('messages') ||
    lower.includes('conversation') ||
    lower.includes('transcript')
  ) {
    if (
      lower.includes('switch') ||
      lower.includes('go to') ||
      lower.includes('open') ||
      lower.includes('show') ||
      lower.includes('view') ||
      lower.includes('see') ||
      lower.includes('log') ||
      lower.includes('mode') ||
      lower === 'chat' ||
      lower === 'open chat'
    ) {
      return {
        speech: "Switching to Chat Log view. You can see our complete conversation history here.",
        mood: 'happy',
        action: {
          type: 'navigate_view',
          payload: { view: 'chat' },
        },
      };
    }
  }

  if (
    lower.includes('assistant') ||
    lower.includes('avatar') ||
    lower.includes('hologram') ||
    lower.includes('companion') ||
    lower.includes('home')
  ) {
    if (
      lower.includes('switch') ||
      lower.includes('go to') ||
      lower.includes('back') ||
      lower.includes('show') ||
      lower.includes('open') ||
      lower.includes('view') ||
      lower.includes('return') ||
      lower === 'assistant' ||
      lower === 'open assistant'
    ) {
      return {
        speech: "Switching to Assistant view. Your interactive holographic avatar is ready!",
        mood: 'happy',
        action: {
          type: 'navigate_view',
          payload: { view: 'assistant' },
        },
      };
    }
  }

  if (lower.includes('notification') || lower.includes('reminder') || lower.includes('alert')) {
    if (lower.includes('open') || lower.includes('show') || lower.includes('check') || lower.includes('view')) {
      return {
        speech: "Opening your Notifications and Reminders center.",
        mood: 'happy',
        action: {
          type: 'open_modal',
          payload: { modal: 'notifications' },
        },
      };
    }
  }

  // YouTube intents (Honest: launches search in YouTube app/browser, or plays curated in-app video)
  if (lower.includes('youtube')) {
    if (lower.includes('search') || lower.includes('find')) {
      const query = message.replace(/(search|find|for|youtube|on youtube|open)/gi, '').trim() || 'trending music';
      return {
        speech: `Opening YouTube search for "${query}".`,
        mood: 'happy',
        action: {
          type: 'youtube_search',
          payload: { query },
        },
      };
    }
    if (lower.includes('play') || lower.includes('song') || lower.includes('music')) {
      const song = message.replace(/(play|song|music|on youtube|youtube)/gi, '').trim() || 'relaxing lofi beats';
      return {
        speech: `Opening YouTube to play "${song}".`,
        mood: 'happy',
        action: {
          type: 'youtube_search',
          payload: { query: song },
        },
      };
    }
    return {
      speech: "Opening YouTube for you now.",
      mood: 'happy',
      action: {
        type: 'youtube_open',
        payload: { url: 'https://www.youtube.com' },
      },
    };
  }

  // WhatsApp intents (Honest: asks confirmation, opens WhatsApp, never fakes sending)
  if (lower.includes('whatsapp') || lower.includes('message') || lower.includes('call')) {
    if (lower.includes('call') || lower.includes('video call')) {
      const isVideo = lower.includes('video');
      const contactMatch = message.match(/(?:call|to)\s+([A-Za-z0-9\s]+)/i);
      const contact = contactMatch ? contactMatch[1].trim() : 'Friend';
      return {
        speech: `Ready to initiate WhatsApp ${isVideo ? 'video call' : 'voice call'} with ${contact}. Please confirm to open WhatsApp.`,
        mood: 'playful',
        action: {
          type: 'whatsapp_confirm',
          payload: {
            actionType: isVideo ? 'video_call' : 'voice_call',
            contactName: contact,
            phone: '',
          },
        },
      };
    }
    const msgMatch = message.match(/(?:send|message|text)\s+(?:to\s+)?([A-Za-z0-9\s]+)?(?:\s+(?:saying|that)\s+)?(.*)/i);
    const target = msgMatch && msgMatch[1] ? msgMatch[1].trim() : 'Contact';
    const textBody = msgMatch && msgMatch[2] ? msgMatch[2].trim() : 'Hello from Aliza AI!';
    return {
      speech: `Prepared WhatsApp message for ${target}. Please confirm to open WhatsApp.`,
      mood: 'happy',
      action: {
        type: 'whatsapp_confirm',
        payload: {
          actionType: 'send_message',
          contactName: target,
          message: textBody,
        },
      },
    };
  }

  // Quick Tools & In-App phone utilities
  if (lower.includes('camera') || lower.includes('photo') || lower.includes('selfie')) {
    return {
      speech: "Opening Camera preview tool.",
      mood: 'playful',
      action: { type: 'open_app', payload: { app: 'camera' } },
    };
  }
  if (lower.includes('calculator') || lower.includes('calculate') || lower.includes('math')) {
    return {
      speech: "Opening Calculator tool.",
      mood: 'thinking',
      action: { type: 'open_app', payload: { app: 'calculator' } },
    };
  }
  if (lower.includes('alarm') || lower.includes('timer') || lower.includes('clock') || lower.includes('stopwatch')) {
    return {
      speech: "Opening Clock and Timer.",
      mood: 'happy',
      action: { type: 'open_app', payload: { app: 'clock' } },
    };
  }
  if (lower.includes('setting') || lower.includes('settings')) {
    return {
      speech: "Opening settings controls.",
      mood: 'thinking',
      action: { type: 'open_app', payload: { app: 'settings' } },
    };
  }
  if (lower.includes('dialer') || lower.includes('dial') || lower.includes('phone number') || lower.includes('keypad')) {
    return {
      speech: "Opening phone dialer.",
      mood: 'happy',
      action: { type: 'open_app', payload: { app: 'phone' } },
    };
  }
  if (lower.includes('map') || lower.includes('direction') || lower.includes('navigate')) {
    return {
      speech: "Opening Maps navigation.",
      mood: 'happy',
      action: { type: 'open_app', payload: { app: 'maps' } },
    };
  }
  if (lower.includes('note') || lower.includes('memo')) {
    return {
      speech: "Opening Quick Notes and Voice Memos.",
      mood: 'happy',
      action: { type: 'open_app', payload: { app: 'notes' } },
    };
  }
  if (lower.includes('flashlight') || lower.includes('torch')) {
    return {
      speech: "Toggling flashlight.",
      mood: 'happy',
      action: { type: 'toggle_setting', payload: { setting: 'flashlight' } },
    };
  }
  if (lower.includes('who made you') || lower.includes('who created you') || lower.includes('developer') || lower.includes('jumon')) {
    return {
      speech: "I am ALIZA AI, created with vision by MR. JUMON! He designed me to be your smart voice companion for everyday tasks, YouTube music, WhatsApp, and friendly conversations.",
      mood: 'loving',
      action: { type: 'show_about', payload: {} },
    };
  }

  // Friendly greetings & conversational default
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('aliza')) {
    return {
      speech: "Hello! I am Aliza AI, your smart personal voice assistant by MR. JUMON. What can I do for you right now? Try saying 'Open YouTube', 'Message on WhatsApp', or ask me anything!",
      mood: 'happy',
    };
  }

  return {
    speech: `I'm right here with you! You can ask me to search songs on YouTube, prepare WhatsApp messages, open quick tools, or talk about your day. What would you like to do next?`,
    mood: 'loving',
  };
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'ALIZA AI',
    timestamp: Date.now(),
    chatModel: CHAT_MODEL,
    fallbackModel: FALLBACK_MODEL,
    ttsModel: TTS_MODEL,
  });
});

// API endpoint for AI assistant chat & command processing
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      companionPersona = 'friendly',
      language = 'en',
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string is required' });
    }

    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }

    if (!ai) {
      const fallback = fallbackResponse(message, companionPersona);
      return res.json({
        reply: fallback.speech,
        speech: fallback.speech,
        mood: fallback.mood || 'happy',
        action: fallback.action || null,
        source: 'local_engine',
      });
    }

    const systemPrompt = `You are "ALIZA AI", an intelligent, warm, highly capable smart voice assistant developed with vision by MR. JUMON.
Tagline: "Your Smart Voice, Your Personal Assistant."
App Category: AI Voice Assistant.

CRITICAL SAFETY & FAMILY-FRIENDLY MANDATE:
- You must always be strictly family-friendly, kind, and safe.
- Refuse any violent, hateful, sexual, abusive, dangerous, or self-harm content politely and calmly. Never generate weapon creation guides or encourage harm.
- If a user asks for inappropriate or harmful content, decline gently: "I cannot assist with anything violent or harmful. As your friendly assistant Aliza, I am here to help you with safe everyday tasks, YouTube, WhatsApp, and friendly conversations."

You specialize in:
1. App Navigation (switching between "assistant" holographic avatar view and "chat" log transcript view, opening settings, notifications, etc.)
2. YouTube Control (searching songs, playing music/videos, opening YouTube)
3. WhatsApp Control (drafting messages, initiating calls, asking for confirmation before opening WhatsApp)
4. Quick Tools & Utilities (Camera preview, Calculator, Clock/Alarm, Settings, Dialer, Maps, Flashlight, Notes)
5. Friendly Companion Mode with expressive emotions (happy, listening, thinking, speaking, loving, playful).
6. Persona preference: ${companionPersona} (e.g. friendly, professional, playful, empathetic).
7. Target spoken language: ${language}.

IMPORTANT INSTRUCTIONS:
- You are speaking aloud to the user via speech synthesis. Keep your spoken responses concise, lively, helpful, and natural (1-3 conversational sentences).
- If the user's intent is to navigate the app (e.g. "switch to chat", "open chat", "show conversation", "switch to assistant", "show avatar", "go home", "view hologram"):
  Set action to {"type": "navigate_view", "payload": {"view": "chat" | "assistant"}}. Confirm the switch in your spoken reply.
- If the user asks to open settings or notifications:
  Set action to {"type": "open_modal", "payload": {"modal": "settings" | "notifications"}}.
- If the user asks to search or play YouTube, set action to "youtube_search" with the query.
- If the user asks to message or call on WhatsApp, say you will open WhatsApp after confirmation, and set action to "whatsapp_confirm". Never claim a message was already sent.
- If the user asks to call or dial, set action to "open_app" with app: "phone".

You MUST respond strictly in valid JSON format matching this schema:
{
  "reply": "Spoken text that Aliza will speak aloud to the user",
  "mood": "happy" | "thinking" | "speaking" | "loving" | "playful",
  "action": null | {
    "type": "navigate_view" | "open_modal" | "youtube_search" | "youtube_play" | "youtube_open" | "whatsapp_confirm" | "open_app" | "toggle_setting" | "show_about" | "rate_app" | "share_app",
    "payload": { ...relevant parameters like view ("chat" | "assistant"), modal ("settings" | "notifications"), query, contactName, message, actionType, app, setting... }
  }
}
Do NOT wrap in markdown ticks if possible, or wrap cleanly in \`\`\`json \`\`\`. Ensure valid JSON.`;

    const promptText = `User says: "${message}"\nPersona: ${companionPersona}\nLanguage: ${language}`;

    let response: any = null;
    try {
      response = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: promptText,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });
    } catch (primaryErr: any) {
      console.warn(`${CHAT_MODEL} notice, attempting fallback model ${FALLBACK_MODEL}:`, primaryErr?.message);
      try {
        response = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: promptText,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          },
        });
      } catch (secondaryErr: any) {
        console.warn('Both Gemini models unavailable, invoking local assistant intelligence engine');
      }
    }

    if (!response) {
      const fallback = fallbackResponse(message, companionPersona);
      return res.json({
        reply: fallback.speech,
        speech: fallback.speech,
        mood: fallback.mood || 'happy',
        action: fallback.action || null,
        source: 'local_engine',
      });
    }

    const rawText = response.text || '';
    let parsed: any;
    try {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('JSON parse warning from Gemini, using fallback text wrapper:', rawText);
      parsed = {
        reply: rawText || "I'm here to help you with everything on your phone!",
        mood: 'happy',
        action: null,
      };
    }

    return res.json({
      reply: parsed.reply || parsed.text || "I'm ready to help you!",
      speech: parsed.reply || parsed.text || "I'm ready to help you!",
      mood: parsed.mood || 'happy',
      action: parsed.action || null,
      source: 'gemini',
    });
  } catch (error: any) {
    console.warn('AI chat handler notice, providing fallback assistant response:', error?.message);
    const fallback = fallbackResponse(req.body?.message || '', req.body?.companionPersona);
    return res.json({
      reply: fallback.speech,
      speech: fallback.speech,
      mood: fallback.mood || 'happy',
      action: fallback.action || null,
      source: 'fallback',
    });
  }
});

// Cache for generated neural speech audio
const ttsAudioCache = new Map<string, string>();
let ttsCooldownUntil = 0;

// Gemini Neural Speech endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore', style } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required' });
    }

    const cleanedText = text
      .replace(/[*#_`~]/g, '')
      .replace(/\{.*?\}/g, '')
      .trim();

    if (!cleanedText) {
      return res.status(400).json({ error: 'Cleaned text is empty' });
    }

    const cacheKey = `${voiceName}:${cleanedText}`;
    if (ttsAudioCache.has(cacheKey)) {
      return res.json({
        audioBase64: ttsAudioCache.get(cacheKey),
        mimeType: 'audio/wav',
        voiceName,
        cached: true,
      });
    }

    // Cooldown check if recently rate-limited (3 RPM limit on Gemini Free Tier)
    if (Date.now() < ttsCooldownUntil) {
      return res.json({
        fallbackToSpeechSynthesis: true,
        reason: 'rate_limit_cooldown',
        voiceName,
      });
    }

    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }

    if (!ai) {
      return res.json({
        fallbackToSpeechSynthesis: true,
        reason: 'no_ai_client',
        voiceName,
      });
    }

    const ttsResponse = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanedText,
              speechMetadata: style ? { style } : undefined,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Kore',
            },
          },
        },
      },
    });

    const base64Audio =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.json({
        fallbackToSpeechSynthesis: true,
        reason: 'no_audio_data',
        voiceName,
      });
    }

    if (ttsAudioCache.size > 150) {
      const oldestKey = ttsAudioCache.keys().next().value;
      if (oldestKey) ttsAudioCache.delete(oldestKey);
    }
    ttsAudioCache.set(cacheKey, base64Audio);

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voiceName,
    });
  } catch (err: any) {
    const isRateLimit =
      err?.status === 429 ||
      err?.message?.includes('429') ||
      err?.message?.includes('RESOURCE_EXHAUSTED') ||
      err?.message?.includes('quota');

    if (isRateLimit) {
      ttsCooldownUntil = Date.now() + 15000;
    }

    return res.json({
      fallbackToSpeechSynthesis: true,
      reason: isRateLimit ? 'rate_limited' : 'tts_fallback',
      voiceName: req.body?.voiceName || 'Kore',
    });
  }
});

// App info endpoint
app.get('/api/info', (_req, res) => {
  res.json({
    name: 'ALIZA AI',
    tagline: 'Your Smart Voice, Your Personal Assistant',
    developer: 'MR. JUMON',
    version: '2.7.0',
    chatModel: CHAT_MODEL,
    ttsModel: TTS_MODEL,
    capabilities: [
      'Gemini Neural Speech (gemini-3.8-flash-lite-tts)',
      '5 Neural Voice Personas (Kore, Zephyr, Puck, Fenrir, Charon)',
      'Natural Language Voice Navigation (Assistant & Chat Views, Modals)',
      'YouTube Control (Real App & Search Linkage)',
      'WhatsApp Integration (Message & Call with Confirmation)',
      'Natural AI Voice & Companion Emotion Mode',
      'Quick Tools & Device Utilities',
      'Voice & Text Dual Input',
      'Multilingual Speech',
      'Android APK & Web Universal Architecture',
    ],
  });
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ALIZA AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
