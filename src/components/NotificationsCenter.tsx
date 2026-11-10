import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Clock,
  Info,
} from 'lucide-react';
import { NotificationItem, ReminderItem } from '../types';
import { soundFx } from '../services/soundFx';

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  reminders: ReminderItem[];
  onAddReminder: (title: string, minutes: number) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'reminders'>('alerts');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderMinutes, setNewReminderMinutes] = useState('10');

  if (!isOpen) return null;

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    const mins = parseInt(newReminderMinutes, 10) || 5;
    onAddReminder(newReminderTitle.trim(), mins);
    setNewReminderTitle('');
    soundFx.playSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/40">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Notifications & Reminders
              </h2>
              <p className="text-xs text-slate-400">
                Aliza AI updates, task reminders & daily voice briefings
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition ${
              activeTab === 'alerts'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Updates ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition ${
              activeTab === 'reminders'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Voice Reminders ({reminders.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'alerts' ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Recent System Alerts</span>
                <button
                  onClick={onMarkAllAsRead}
                  className="text-purple-400 hover:underline"
                >
                  Mark all as read
                </button>
              </div>

              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition ${
                    n.read
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                      : 'bg-purple-950/30 border-purple-500/40 text-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{n.title}</h4>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add reminder input */}
              <form onSubmit={handleCreateReminder} className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-purple-400 block">
                  Add Quick Voice Reminder
                </span>
                <input
                  type="text"
                  required
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  placeholder="e.g. Call Mom, Hydrate with water, Meeting..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Trigger in:</span>
                  <select
                    value={newReminderMinutes}
                    onChange={(e) => setNewReminderMinutes(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                  >
                    <option value="1">1 minute (Test)</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                  <button
                    type="submit"
                    className="ml-auto px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </form>

              {/* Reminders List */}
              <div className="space-y-2">
                {reminders.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No active reminders. Tell Aliza: "Remind me in 10 minutes".
                  </div>
                ) : (
                  reminders.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => onToggleReminder(r.id)}
                          className="text-slate-400 hover:text-emerald-400"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              r.completed ? 'text-emerald-400 fill-emerald-400/20' : ''
                            }`}
                          />
                        </button>
                        <div>
                          <span
                            className={`text-xs block ${
                              r.completed ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {r.title}
                          </span>
                          <span className="text-[10px] text-purple-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {new Date(r.dueTime).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteReminder(r.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
