import { useState, useEffect, useRef, useCallback } from 'react';
import { soundFx } from '../services/soundFx';
import { NeuralVoiceName } from '../types';
import { API_BASE } from '../config';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as CapSpeechRecognition } from '@capacitor-community/speech-recognition';

export interface UseSpeechProps {
  language?: string;
  voiceURI?: string;
  neuralVoice?: NeuralVoiceName;
  useNeuralTTS?: boolean;
  voiceRate?: number;
  voicePitch?: number;
  autoSpeak?: boolean;
  onTranscript?: (text: string) => void;
}

export function useSpeech({
  language = 'en-US',
  voiceURI = '',
  neuralVoice = 'Kore',
  useNeuralTTS = true,
  voiceRate = 1.0,
  voicePitch = 1.05,
  autoSpeak = true,
  onTranscript,
}: UseSpeechProps = {}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [playingVoiceId, setPlayingVoiceId] = useState<NeuralVoiceName | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const levelIntervalRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const latestTranscriptRef = useRef('');
  const transcriptSentRef = useRef(false);

  // Load available speech synthesis voices for local fallback
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      if (avail && avail.length > 0) {
        setVoices(avail);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Check if Speech Recognition API exists in browser or native Capacitor plugin
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (Capacitor.isNativePlatform()) {
      CapSpeechRecognition.available()
        .then((res) => {
          setRecognitionSupported(Boolean(res?.available));
        })
        .catch(() => {
          setRecognitionSupported(true);
        });
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setRecognitionSupported(Boolean(SpeechRecognitionAPI));
  }, []);

  // Stop Speech (Neural Audio + Web Speech)
  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (_) {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    setIsSpeaking(false);
    setPlayingVoiceId(null);
    clearInterval(levelIntervalRef.current);
    setAudioLevel(0);
  }, []);

  // Start Voice Recognition (supports native Android Capacitor plugin and web SpeechRecognition)
  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Reset error and previous transcripts
    setMicError(null);
    setTranscript('');
    latestTranscriptRef.current = '';
    transcriptSentRef.current = false;

    // Stop ongoing TTS speech if any
    stopSpeaking();

    // 1. Native Android execution via Capacitor Speech Recognition
    if (Capacitor.isNativePlatform()) {
      try {
        // Request microphone permission first
        const check = await CapSpeechRecognition.checkPermissions();
        if (check.speechRecognition !== 'granted') {
          const req = await CapSpeechRecognition.requestPermissions();
          if (req.speechRecognition !== 'granted') {
            setMicError('permission_denied');
            setIsListening(false);
            return;
          }
        }

        setIsListening(true);
        soundFx.playWakeChime();

        // Visualizer wave animation
        clearInterval(levelIntervalRef.current);
        levelIntervalRef.current = setInterval(() => {
          setAudioLevel(0.35 + Math.random() * 0.55);
        }, 100);

        // Remove any prior listeners
        await CapSpeechRecognition.removeAllListeners();

        await CapSpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (data?.matches && data.matches.length > 0) {
            const heard = data.matches[0].trim();
            setTranscript(heard);
            latestTranscriptRef.current = heard;
            setAudioLevel(0.8);
          }
        });

        const result = await CapSpeechRecognition.start({
          language: language || 'en-US',
          maxResults: 1,
          prompt: 'Speak to Aliza AI',
          partialResults: true,
          popup: false,
        });

        // If returned final matches
        if (result?.matches && result.matches.length > 0) {
          const finalMatch = result.matches[0].trim();
          setTranscript(finalMatch);
          latestTranscriptRef.current = finalMatch;
          if (onTranscript && !transcriptSentRef.current) {
            transcriptSentRef.current = true;
            onTranscript(finalMatch);
          }
        }
      } catch (err: any) {
        console.warn('Native speech recognition notice:', err);
        setIsListening(false);
        clearInterval(levelIntervalRef.current);
        setAudioLevel(0);
        if (err?.message?.includes('denied') || err?.message?.includes('permission')) {
          setMicError('permission_denied');
        } else {
          setMicError('no_speech');
        }
      }
      return;
    }

    // 2. Web browser fallback execution
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setRecognitionSupported(false);
      setMicError('unsupported');
      return;
    }

    // Clean up any stale recognition session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        soundFx.playWakeChime();

        clearInterval(levelIntervalRef.current);
        levelIntervalRef.current = setInterval(() => {
          setAudioLevel(0.25 + Math.random() * 0.45);
        }, 120);
      };

      recognition.onspeechstart = () => {
        clearInterval(levelIntervalRef.current);
        levelIntervalRef.current = setInterval(() => {
          setAudioLevel(0.55 + Math.random() * 0.45);
        }, 80);
      };

      recognition.onspeechend = () => {
        clearInterval(levelIntervalRef.current);
        setAudioLevel(0.2);
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        const currentText = (finalStr || interimStr).trim();
        setTranscript(currentText);
        latestTranscriptRef.current = currentText;

        setAudioLevel(0.75 + Math.random() * 0.25);

        if (finalStr && onTranscript && !transcriptSentRef.current) {
          transcriptSentRef.current = true;
          onTranscript(finalStr.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        const err = event.error;

        if (err === 'not-allowed' || err === 'permission-denied') {
          setMicError('permission_denied');
        } else if (err === 'audio-capture') {
          setMicError('audio_capture');
        } else if (err === 'network') {
          setMicError('network');
        } else if (err === 'no-speech') {
          setMicError('no_speech');
        } else if (err !== 'aborted') {
          setMicError(err || 'start_failed');
        }

        setIsListening(false);
        clearInterval(levelIntervalRef.current);
        setAudioLevel(0);
      };

      recognition.onend = () => {
        setIsListening(false);
        clearInterval(levelIntervalRef.current);
        setAudioLevel(0);
        recognitionRef.current = null;

        const pending = latestTranscriptRef.current.trim();
        if (pending && onTranscript && !transcriptSentRef.current) {
          transcriptSentRef.current = true;
          onTranscript(pending);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
      clearInterval(levelIntervalRef.current);
      setAudioLevel(0);
      if (err?.name === 'NotAllowedError') {
        setMicError('permission_denied');
      } else {
        setMicError('start_failed');
      }
    }
  }, [language, onTranscript, stopSpeaking]);

  // Stop Voice Recognition & send any captured speech
  const stopListening = useCallback(async () => {
    setIsListening(false);
    clearInterval(levelIntervalRef.current);
    setAudioLevel(0);

    if (Capacitor.isNativePlatform()) {
      try {
        await CapSpeechRecognition.stop();
        await CapSpeechRecognition.removeAllListeners();
      } catch (_) {}
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      recognitionRef.current = null;
    }

    const pending = latestTranscriptRef.current.trim();
    if (pending && onTranscript && !transcriptSentRef.current) {
      transcriptSentRef.current = true;
      onTranscript(pending);
    }
  }, [onTranscript]);

  // Browser Web Speech fallback helper
  const speakWithWebSpeech = useCallback(
    (text: string, onEndCallback?: () => void) => {
      if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      if (voiceURI) {
        const found = voices.find((v) => v.voiceURI === voiceURI);
        if (found) utterance.voice = found;
      }

      if (!utterance.voice && voices.length > 0) {
        const preferred = voices.find(
          (v) =>
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Zira') ||
              v.name.includes('Female')) &&
            v.lang.startsWith(language.slice(0, 2))
        );
        utterance.voice = preferred || voices[0];
      }

      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;
      utterance.lang = language || 'en-US';

      utterance.onstart = () => {
        setIsSpeaking(true);
        clearInterval(levelIntervalRef.current);
        levelIntervalRef.current = setInterval(() => {
          setAudioLevel(0.4 + Math.random() * 0.6);
        }, 100);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        clearInterval(levelIntervalRef.current);
        setAudioLevel(0);
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        clearInterval(levelIntervalRef.current);
        setAudioLevel(0);
      };

      window.speechSynthesis.speak(utterance);
    },
    [voices, voiceURI, voiceRate, voicePitch, language]
  );

  // Play Neural TTS Audio or fallback
  const speak = useCallback(
    async (
      text: string,
      onEndCallback?: () => void,
      overrideVoice?: NeuralVoiceName,
      overrideStyle?: string
    ) => {
      if (!text) return;

      stopSpeaking();

      const cleaned = text
        .replace(/[*#_`~]/g, '')
        .replace(/\{.*?\}/g, '')
        .trim();

      if (!cleaned) return;

      const targetVoice = overrideVoice || neuralVoice || 'Kore';

      // 1. Try Gemini Neural Speech through API endpoint (using API_BASE)
      if (useNeuralTTS) {
        try {
          setIsSpeaking(true);
          clearInterval(levelIntervalRef.current);
          levelIntervalRef.current = setInterval(() => {
            setAudioLevel(0.4 + Math.random() * 0.6);
          }, 100);

          const res = await fetch(`${API_BASE}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: cleaned,
              voiceName: targetVoice,
              style: overrideStyle,
            }),
          });

          if (!res.ok) {
            speakWithWebSpeech(cleaned, onEndCallback);
            return;
          }

          const data = await res.json();
          if (data.fallbackToSpeechSynthesis || !data.audioBase64) {
            speakWithWebSpeech(cleaned, onEndCallback);
            return;
          }

          const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
          const audio = new Audio(audioSrc);
          currentAudioRef.current = audio;

          audio.onended = () => {
            setIsSpeaking(false);
            setPlayingVoiceId(null);
            clearInterval(levelIntervalRef.current);
            setAudioLevel(0);
            currentAudioRef.current = null;
            if (onEndCallback) onEndCallback();
          };

          audio.onerror = () => {
            speakWithWebSpeech(cleaned, onEndCallback);
          };

          await audio.play();
          return;
        } catch (_) {
          speakWithWebSpeech(cleaned, onEndCallback);
          return;
        }
      }

      // 2. Web Speech API Fallback
      speakWithWebSpeech(cleaned, onEndCallback);
    },
    [neuralVoice, useNeuralTTS, speakWithWebSpeech, stopSpeaking]
  );

  // Play a dedicated sample for any of the 5 voice personas with visual tracking
  const playVoiceSample = useCallback(
    async (voiceName: NeuralVoiceName, sampleText: string, style?: string) => {
      stopSpeaking();
      setPlayingVoiceId(voiceName);

      try {
        await speak(
          sampleText,
          () => {
            setPlayingVoiceId(null);
          },
          voiceName,
          style
        );
      } catch (err) {
        console.warn('Error playing voice sample:', err);
        setPlayingVoiceId(null);
      }
    },
    [speak, stopSpeaking]
  );

  return {
    voices,
    isSpeaking,
    isListening,
    transcript,
    audioLevel,
    speechSupported,
    recognitionSupported,
    playingVoiceId,
    micError,
    setMicError,
    startListening,
    stopListening,
    speak,
    playVoiceSample,
    stopSpeaking,
  };
}
