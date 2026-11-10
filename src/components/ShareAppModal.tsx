import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  MessageSquare,
  QrCode,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeak: (text: string) => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  onSpeak,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://aliza-ai.app';
  const shareText = `Check out ALIZA AI – Your Smart Voice Assistant developed by MR. JUMON! Controls YouTube, WhatsApp, phone tools, and features a friendly companion with natural AI voice. Try it here: ${appUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    soundFx.playSuccess();
    onSpeak('Aliza AI link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ALIZA AI – Smart Voice Assistant',
          text: shareText,
          url: appUrl,
        });
        soundFx.playSuccess();
      } catch (err) {
        console.warn('Share cancelled or not supported:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToWhatsApp = () => {
    soundFx.playTap();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    soundFx.playTap();
    const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(
      'ALIZA AI – Smart Voice Assistant by MR. JUMON'
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/40">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Share ALIZA AI
              </h2>
              <p className="text-xs text-slate-400">
                Invite friends & family to experience Aliza AI
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Share Preview Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex gap-3 items-center">
            <img
              src="/assets/aistudio/file_000000007234821199c3208d804a0535_3dac4304.png"
              alt="Aliza AI"
              className="w-16 h-16 rounded-2xl object-cover border border-cyan-400/40 shadow"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white tracking-wide">
                ALIZA AI
              </h3>
              <p className="text-xs text-cyan-400 font-medium">
                Your Smart Voice, Your Personal Assistant.
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">
                Developed by MR. JUMON
              </span>
            </div>
          </div>

          {/* Direct Share Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleNativeShare}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via Android / System Apps</span>
            </button>

            <button
              onClick={shareToWhatsApp}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share to WhatsApp Contacts</span>
            </button>

            <button
              onClick={shareToTelegram}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Share to Telegram</span>
            </button>
          </div>

          {/* Copy Link Bar */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium block">
              Direct App Link:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
