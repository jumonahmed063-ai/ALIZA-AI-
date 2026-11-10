import React, { useState } from 'react';
import {
  Star,
  Sparkles,
  Heart,
  Check,
  X,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface RateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeak: (text: string) => void;
}

export const RateAppModal: React.FC<RateAppModalProps> = ({
  isOpen,
  onClose,
  onSpeak,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Smart Voice',
    'YouTube Control',
  ]);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const tags = [
    'Smart Voice',
    'Natural Sounding',
    'YouTube Control',
    'WhatsApp Assistant',
    'Cute Companion',
    'Fast AI Replies',
    'Made by MR. JUMON',
  ];

  const toggleTag = (t: string) => {
    soundFx.playTap();
    if (selectedTags.includes(t)) {
      setSelectedTags((prev) => prev.filter((item) => item !== t));
    } else {
      setSelectedTags((prev) => [...prev, t]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSuccess();
    setIsSubmitted(true);
    onSpeak(
      `Thank you so much for the ${rating}-star rating! MR. JUMON and I appreciate your kind support.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Rate ALIZA AI
              </h2>
              <p className="text-xs text-slate-400">
                Help MR. JUMON improve your personal voice assistant
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
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Play Store Preview Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <img
                  src="/assets/aistudio/file_000000007234821199c3208d804a0535_3dac4304.png"
                  alt="Aliza AI Logo"
                  className="w-12 h-12 rounded-xl object-cover border border-amber-400/40"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white">ALIZA AI</h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-semibold">
                      Google Play
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    MR. JUMON • AI Voice Assistant
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-bold text-amber-400 font-mono">4.9 ★</span>
                    <span className="text-[10px] text-slate-500">(50K+ Reviews)</span>
                  </div>
                </div>
              </div>

              {/* Interactive Stars */}
              <div className="text-center space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  How would you rate your experience with Aliza?
                </span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => {
                          setRating(star);
                          soundFx.playTap();
                        }}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {rating === 5 && '🌟 Extraordinary! Outstanding assistant!'}
                  {rating === 4 && '✨ Very Good! Very helpful assistant.'}
                  {rating === 3 && '👍 Good, has great potential!'}
                  {rating <= 2 && '🤝 Thanks, we will improve for you.'}
                </span>
              </div>

              {/* Tag chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium block">
                  What do you love most?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback text */}
              <div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share a few words about your experience with Aliza AI and MR. JUMON..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Submit 5-Star Review</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                <Heart className="w-8 h-8 fill-amber-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Thank You For Your Feedback!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Your review has been recorded. MR. JUMON is continuously updating Aliza AI to deliver the best voice assistant experience on Android.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition"
                >
                  Return to Assistant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
