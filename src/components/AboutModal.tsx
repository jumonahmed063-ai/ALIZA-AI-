import React from 'react';
import {
  Crown,
  Sparkles,
  Heart,
  Youtube,
  MessageSquare,
  Smartphone,
  Mic,
  X,
  Volume2,
} from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakWelcome: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onSpeakWelcome,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-hidden rounded-2xl bg-slate-900 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.3)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/40">
              <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                About ALIZA AI
              </h2>
              <p className="text-xs text-purple-300 font-semibold">
                Developed with vision by MR. JUMON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Story & Poster Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Official Visual Poster */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl group">
            <img
              src="/assets/aistudio/file_000000007234821199c3208d804a0535_3dac4304.png"
              alt="Aliza AI - Developed by MR. JUMON"
              className="w-full h-auto object-cover group-hover:scale-102 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            <button
              onClick={() => {
                soundFx.playSuccess();
                onSpeakWelcome();
              }}
              className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/40 flex items-center gap-2 hover:scale-105 transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Welcome Message</span>
            </button>
          </div>

          {/* Official Welcome Message */}
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Official Welcome Message
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
              "Hello! I am Aliza AI, your smart personal voice assistant. I am here to help you with phone activities, YouTube, WhatsApp, everyday tasks, and intelligent conversations. Just speak, and let's get started!"
            </p>
            <span className="text-[11px] text-pink-400 font-bold block text-right">
              — Created with vision by MR. JUMON
            </span>
          </div>

          {/* About Story */}
          <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" /> What is Aliza AI?
            </h3>
            <p>
              Aliza AI is a smart, voice-controlled personal AI assistant designed to make everyday phone activities easier. It allows users to communicate naturally through voice or text, get instant AI responses, control supported phone functions, and access helpful services.
            </p>
            <p>
              Aliza AI combines a natural-sounding AI voice, intelligent conversation, and useful Android features in one application.
            </p>
          </div>

          {/* Core Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <Youtube className="w-4 h-4" />
                <span>1. YouTube Control</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Voice search for songs, play/pause music, and open YouTube videos.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <MessageSquare className="w-4 h-4" />
                <span>2. WhatsApp Control</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Draft messages & initiate calls with mandatory confirmation safety.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
                <Mic className="w-4 h-4" />
                <span>3. Natural Voice & Companion</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Natural-sounding AI voice, spoken responses & expressive companion moods.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Smartphone className="w-4 h-4" />
                <span>4. Phone Control</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Camera, calculator, clock, settings, flashlight, dialer & everyday tools.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-purple-300">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            Developed by MR. JUMON
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
