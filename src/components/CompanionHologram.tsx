import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Smile,
  Zap,
  Radio,
  Play,
  Check,
  Cpu,
  AlertTriangle,
  RotateCcw,
  X,
} from 'lucide-react';
import { CompanionMood, NeuralVoiceName, VOICE_PERSONAS } from '../types';
import { soundFx } from '../services/soundFx';

interface CompanionHologramProps {
  mood: CompanionMood;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  latestSpeech: string;
  transcript?: string;
  micError?: string | null;
  onClearMicError?: () => void;
  onMicToggle: () => void;
  onStopSpeaking: () => void;
  onMoodSelect: (mood: CompanionMood) => void;
  activeNeuralVoice: NeuralVoiceName;
  onSelectNeuralVoice: (v: NeuralVoiceName) => void;
  onPlayVoiceSample: (v: NeuralVoiceName, sampleText: string, style?: string) => void;
  playingVoiceId: NeuralVoiceName | null;
}

export const CompanionHologram: React.FC<CompanionHologramProps> = ({
  mood,
  isListening,
  isSpeaking,
  audioLevel,
  latestSpeech,
  transcript = '',
  micError = null,
  onClearMicError,
  onMicToggle,
  onStopSpeaking,
  onMoodSelect,
  activeNeuralVoice,
  onSelectNeuralVoice,
  onPlayVoiceSample,
  playingVoiceId,
}) => {
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Determine ring border color and aura based on active status
  let ringClasses = 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.35)]';
  let statusText = 'Aliza is Ready';
  let statusIcon = <Sparkles className="w-4 h-4 text-purple-400" />;

  if (isListening) {
    ringClasses = 'border-cyan-400 shadow-[0_0_45px_rgba(6,182,212,0.6)] animate-pulse';
    statusText = 'Listening to you...';
    statusIcon = <Radio className="w-4 h-4 text-cyan-400 animate-ping" />;
  } else if (isSpeaking) {
    ringClasses = 'border-pink-500 shadow-[0_0_50px_rgba(236,72,153,0.65)] animate-pulse-slow';
    statusText = 'Aliza is Speaking';
    statusIcon = <Volume2 className="w-4 h-4 text-pink-400 animate-bounce" />;
  } else if (mood === 'thinking') {
    ringClasses = 'border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5)]';
    statusText = 'Thinking & Processing...';
    statusIcon = <Zap className="w-4 h-4 text-amber-400" />;
  } else if (mood === 'loving') {
    ringClasses = 'border-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.55)]';
    statusText = 'Companion Mode: Caring & Warm';
    statusIcon = <Heart className="w-4 h-4 text-rose-400 animate-pulse" />;
  } else if (mood === 'playful') {
    ringClasses = 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.55)]';
    statusText = 'Companion Mode: Playful';
    statusIcon = <Smile className="w-4 h-4 text-emerald-400" />;
  }

  // Audio wave heights
  const bars = [16, 28, 42, 60, 48, 75, 55, 38, 65, 80, 50, 32, 20];
  const activePersona = VOICE_PERSONAS.find((p) => p.id === activeNeuralVoice) || VOICE_PERSONAS[0];

  return (
    <div className="relative flex flex-col items-center justify-center py-2 select-none w-full max-w-xl">
      {/* Hologram Aura Backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden -z-10">
        <div
          className={`w-72 h-72 sm:w-88 sm:h-88 rounded-full blur-3xl transition-all duration-700 opacity-40 ${
            isListening
              ? 'bg-cyan-500'
              : isSpeaking
              ? 'bg-pink-500'
              : mood === 'loving'
              ? 'bg-rose-500'
              : 'bg-purple-600'
          }`}
        />
      </div>

      {/* Main Holographic Avatar Container */}
      <div className="relative group">
        {/* Outer Rotating Cyber Ring */}
        <div
          className={`absolute -inset-3.5 rounded-3xl border-2 border-dashed transition-all duration-500 pointer-events-none ${
            isListening ? 'border-cyan-400/80 animate-spin' : 'border-purple-500/30'
          }`}
          style={{ animationDuration: '24s' }}
        />

        {/* Glow Frame */}
        <div
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 transition-all duration-500 bg-slate-900/90 ${ringClasses}`}
        >
          {/* Official Aliza AI Character Artwork */}
          <img
            src="/assets/aistudio/file_000000007234821199c3208d804a0535_3dac4304.png"
            alt="Aliza AI - Smart Voice Assistant by MR. JUMON"
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isSpeaking
                ? 'scale-105'
                : isListening
                ? 'scale-102 filter drop-shadow'
                : 'hover:scale-105'
            }`}
          />

          {/* Hologram Scanline Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-purple-600/20 pointer-events-none" />

          {/* Live Speaking Indicator Overlay */}
          {isSpeaking && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pink-900/80 border border-pink-400/60 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
              <span className="text-[10px] font-semibold text-pink-200 uppercase tracking-wider">
                Voice Active
              </span>
            </div>
          )}

          {/* Listening Indicator Overlay */}
          {isListening && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-900/80 border border-cyan-400/60 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-semibold text-cyan-200 uppercase tracking-wider">
                Listening
              </span>
            </div>
          )}

          {/* Aliza AI Tagline at the base of the image */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2 pt-6 flex flex-col items-center text-center">
            <span className="text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300">
              ALIZA AI
            </span>
            <span className="text-[9px] text-purple-300/80 font-medium tracking-tight">
              by MR. JUMON
            </span>
          </div>
        </div>

        {/* Floating Quick Action Mic Button */}
        <button
          onClick={() => {
            soundFx.playTap();
            onMicToggle();
          }}
          title={
            isListening
              ? transcript
                ? 'Tap to send what you said'
                : 'Listening... Tap to stop'
              : 'Tap to Speak to Aliza'
          }
          className={`absolute -bottom-4 right-1/2 translate-x-1/2 z-20 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs tracking-wider transition-all duration-300 shadow-xl cursor-pointer ${
            isListening
              ? 'bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 text-white scale-105 shadow-red-500/50 ring-4 ring-red-400/30 animate-mic-ring'
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white hover:scale-105 shadow-purple-500/40 hover:shadow-purple-500/70'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 animate-pulse" />
              <span>{transcript ? 'TAP TO SEND 🚀' : 'LISTENING... (SPEAK)'}</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>TAP TO SPEAK</span>
            </>
          )}
        </button>
      </div>

      {/* Mic Status / Error Micro-Banner */}
      {micError && (
        <div className="mt-6 w-full max-w-sm px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              {micError === 'permission_denied' && 'Microphone blocked in browser.'}
              {micError === 'unsupported' && 'Voice recognition needs Chrome or Edge.'}
              {micError === 'no_speech' && 'No speech heard. Try speaking again!'}
              {micError === 'audio_capture' && 'Microphone hardware busy or in use.'}
              {micError === 'network' && 'Speech recognition network issue.'}
              {micError === 'start_failed' && 'Could not activate microphone.'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                soundFx.playTap();
                onMicToggle();
              }}
              className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
            {onClearMicError && (
              <button
                onClick={onClearMicError}
                className="p-1 rounded text-amber-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Transcript Bubble during speech recognition */}
      {isListening && transcript && (
        <div className="mt-5 w-full max-w-md px-4 py-2 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 text-xs font-semibold text-center shadow-lg animate-pulse">
          🎙️ Hearing: "{transcript}"
        </div>
      )}

      {/* Audio Visualizer Waveform */}
      <div className={`h-10 ${micError || (isListening && transcript) ? 'mt-3' : 'mt-7'} flex items-center justify-center gap-1`}>
        {bars.map((baseH, i) => {
          const dynamicMultiplier = isListening || isSpeaking ? 0.3 + audioLevel * 1.2 : 0.15;
          const height = Math.max(4, Math.min(36, baseH * dynamicMultiplier));
          return (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-100 ${
                isSpeaking
                  ? 'bg-gradient-to-t from-pink-500 to-purple-400'
                  : isListening
                  ? 'bg-gradient-to-t from-cyan-400 to-blue-500'
                  : 'bg-purple-900/40'
              }`}
              style={{
                height: `${height}px`,
                animationDelay: `${i * 45}ms`,
              }}
            />
          );
        })}
      </div>

      {/* Active Voice Persona Indicator & Quick Audition Switcher */}
      <div className="mt-1 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-pink-500/30 text-xs text-pink-200 shadow">
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
          <span className="font-semibold">Voice: {activePersona.name}</span>
          <button
            onClick={() => {
              soundFx.playTap();
              onPlayVoiceSample(activePersona.id, activePersona.sampleText, activePersona.stylePrompt);
            }}
            title="Test Current Voice Sample"
            className="ml-1 p-1 rounded-md bg-pink-600/30 hover:bg-pink-600 text-pink-300 hover:text-white transition flex items-center gap-1 text-[10px]"
          >
            {playingVoiceId === activePersona.id ? (
              <span className="font-bold text-[10px] text-white animate-pulse">Playing</span>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Test Voice</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowVoicePicker(!showVoicePicker)}
            className="text-[10px] text-purple-300 hover:text-white underline ml-1"
          >
            {showVoicePicker ? 'Hide' : 'Switch'}
          </button>
        </div>

        {/* 5 Selectable Voice Personas Live Sample Audio Tray */}
        {showVoicePicker && (
          <div className="w-full p-3 rounded-2xl bg-slate-900/95 border border-purple-500/40 shadow-xl space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1">
              <span className="flex items-center gap-1.5 text-pink-400">
                <Cpu className="w-3.5 h-3.5" />
                Select Voice Persona (Gemini 3.8 Flash Neural Speech):
              </span>
              <span className="text-[10px] text-slate-500 font-mono">gemini-3.8-flash-lite-tts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOICE_PERSONAS.map((vp) => {
                const isSelected = activeNeuralVoice === vp.id;
                const isPlaying = playingVoiceId === vp.id;

                return (
                  <div
                    key={vp.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-purple-950/60 border-pink-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{vp.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-pink-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{vp.tone}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Live Sample Audio Button with Visual Equalizer */}
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playTap();
                          onPlayVoiceSample(vp.id, vp.sampleText, vp.stylePrompt);
                        }}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                          isPlaying
                            ? 'bg-pink-600 text-white shadow ring-2 ring-pink-400 animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-pink-300'
                        }`}
                        title="Hear Sample Audio"
                      >
                        {isPlaying ? (
                          <div className="flex items-center gap-0.5 px-1">
                            <span className="w-0.5 h-3 bg-white animate-pulse" />
                            <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
                            <span className="w-0.5 h-3.5 bg-white animate-pulse delay-150" />
                          </div>
                        ) : (
                          <Play className="w-3 h-3 fill-current" />
                        )}
                        <span className="text-[10px] font-semibold hidden sm:inline">
                          {isPlaying ? 'Playing' : 'Sample'}
                        </span>
                      </button>

                      {/* Select Voice Button */}
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playSuccess();
                            onSelectNeuralVoice(vp.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 hover:text-white text-[10px] font-bold text-slate-300 transition"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Status Pill & Mode Bar */}
      <div className="flex items-center gap-2 mt-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-purple-500/30 text-xs text-purple-200">
        {statusIcon}
        <span className="font-medium">{statusText}</span>
        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            title="Mute Speech"
            className="ml-1 p-0.5 rounded hover:bg-slate-800 text-pink-400 hover:text-pink-300"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expressive Speech Bubble (Latest Spoken Response) */}
      {latestSpeech && (
        <div className="mt-3 max-w-md w-full px-4 text-center">
          <div className="relative inline-block px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-lg text-sm text-slate-100 backdrop-blur-md">
            <p className="line-clamp-3 leading-relaxed">
              "{latestSpeech}"
            </p>
          </div>
        </div>
      )}

      {/* Virtual Emotions / Companion Mood Picker */}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px]">
        <span className="text-slate-400 mr-1 text-[10px] font-semibold uppercase tracking-wider">
          Emotion:
        </span>
        {[
          { key: 'happy', label: 'Happy ✨', color: 'hover:text-amber-300' },
          { key: 'playful', label: 'Playful 😉', color: 'hover:text-emerald-300' },
          { key: 'loving', label: 'Warm 💖', color: 'hover:text-rose-300' },
          { key: 'thinking', label: 'Thinking 💡', color: 'hover:text-cyan-300' },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => onMoodSelect(m.key as CompanionMood)}
            className={`px-2.5 py-0.8 rounded-full border transition-all ${
              mood === m.key
                ? 'bg-purple-600/30 border-purple-400 text-purple-200 font-semibold'
                : 'border-slate-800 text-slate-400 bg-slate-900/40 ' + m.color
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};
