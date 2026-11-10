import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Phone,
  Video,
  Send,
  User,
  Plus,
  ShieldCheck,
  AlertTriangle,
  X,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  ExternalLink,
  Search,
  Check,
} from 'lucide-react';
import { WhatsAppContact, WhatsAppPendingAction } from '../types';
import { soundFx } from '../services/soundFx';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface WhatsAppHubProps {
  isOpen: boolean;
  onClose: () => void;
  pendingAction?: WhatsAppPendingAction | null;
  onClearPendingAction: () => void;
  onSpeak: (text: string) => void;
}

const INITIAL_CONTACTS: WhatsAppContact[] = [
  {
    id: 'c1',
    name: 'MR. JUMON',
    phone: '+14155552671',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'Creator & Developer of ALIZA AI 🚀',
    lastSeen: 'Online',
  },
  {
    id: 'c2',
    name: 'Mom',
    phone: '+14155550192',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    status: 'Available',
    lastSeen: '10m ago',
  },
  {
    id: 'c3',
    name: 'Best Friend Alex',
    phone: '+14155558832',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    status: 'Busy gaming 🎮',
    lastSeen: '1h ago',
  },
  {
    id: 'c4',
    name: 'Project Team',
    phone: '+14155559901',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
    status: 'Sprint Review at 4 PM',
    lastSeen: 'Online',
  },
];

export const WhatsAppHub: React.FC<WhatsAppHubProps> = ({
  isOpen,
  onClose,
  pendingAction,
  onClearPendingAction,
  onSpeak,
}) => {
  const [contacts, setContacts] = useState<WhatsAppContact[]>(INITIAL_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact>(INITIAL_CONTACTS[0]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Call preview state (honestly labeled preview only)
  const [activeCallPreview, setActiveCallPreview] = useState<{
    contact: WhatsAppContact;
    type: 'voice' | 'video';
    duration: number;
  } | null>(null);

  // Safety confirmation dialog state
  const [confirmationData, setConfirmationData] = useState<WhatsAppPendingAction | null>(null);
  const [lastActionNotice, setLastActionNotice] = useState<string | null>(null);

  const callTimerRef = useRef<any>(null);

  const openWhatsAppUrl = async (url: string) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.open({ url });
        return;
      } catch (_) {}
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle external pending action from AI voice command
  useEffect(() => {
    if (pendingAction) {
      setConfirmationData(pendingAction);
      soundFx.playAlert();
      if (pendingAction.contactName) {
        const found = contacts.find((c) =>
          c.name.toLowerCase().includes(pendingAction.contactName.toLowerCase())
        );
        if (found) {
          setSelectedContact(found);
        } else {
          setSelectedContact({
            id: 'temp-' + Date.now(),
            name: pendingAction.contactName,
            phone: pendingAction.phone || '',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            status: 'Contact',
          });
        }
      }
      if (pendingAction.message) {
        setMessageText(pendingAction.message);
      }
    }
  }, [pendingAction, contacts]);

  useEffect(() => {
    if (activeCallPreview) {
      callTimerRef.current = setInterval(() => {
        setActiveCallPreview((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [activeCallPreview]);

  if (!isOpen) return null;

  // Add new contact
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;
    const newContact: WhatsAppContact = {
      id: 'c-' + Date.now(),
      name: newContactName.trim(),
      phone: newContactPhone.trim() || '+14155550000',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      status: 'Hey there! I am using WhatsApp.',
    };
    setContacts((prev) => [newContact, ...prev]);
    setSelectedContact(newContact);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
    onSpeak(`Added ${newContact.name} to contacts.`);
  };

  // Trigger confirmation for sending message
  const requestSendMessage = () => {
    if (!messageText.trim()) return;
    setConfirmationData({
      actionType: 'send_message',
      contactName: selectedContact.name,
      phone: selectedContact.phone,
      message: messageText,
    });
    soundFx.playAlert();
    onSpeak(
      `Permission confirmation: Ready to open WhatsApp to message ${selectedContact.name}? Please tap confirm.`
    );
  };

  // Trigger confirmation for voice or video call
  const requestCall = (type: 'voice' | 'video') => {
    setConfirmationData({
      actionType: type === 'video' ? 'video_call' : 'voice_call',
      contactName: selectedContact.name,
      phone: selectedContact.phone,
    });
    soundFx.playAlert();
    onSpeak(
      `Permission confirmation: Ready to open WhatsApp ${
        type === 'video' ? 'video call' : 'voice call'
      } with ${selectedContact.name}? Please tap confirm.`
    );
  };

  // Execute confirmed action honestly
  const handleConfirmAction = () => {
    if (!confirmationData) return;
    soundFx.playSuccess();

    const cleanPhone = (confirmationData.phone || selectedContact.phone || '').replace(/[^0-9]/g, '');

    if (confirmationData.actionType === 'send_message') {
      const msg = confirmationData.message || messageText;
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;

      setLastActionNotice(
        `Opening WhatsApp with message prepared for ${confirmationData.contactName}: "${msg}"`
      );
      // Honest verbal feedback: "Opening WhatsApp" (never "message sent")
      onSpeak(`Opening WhatsApp for ${confirmationData.contactName}.`);

      openWhatsAppUrl(waUrl);
      setMessageText('');
    } else {
      // Initiate WhatsApp call link
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}`
        : 'https://whatsapp.com';

      setLastActionNotice(`Opening WhatsApp call for ${confirmationData.contactName}.`);
      onSpeak(`Opening WhatsApp call for ${confirmationData.contactName}.`);

      openWhatsAppUrl(waUrl);
    }

    setConfirmationData(null);
    onClearPendingAction();
  };

  const handleCancelAction = () => {
    soundFx.playTap();
    setConfirmationData(null);
    onClearPendingAction();
    onSpeak('Action cancelled. WhatsApp was not opened.');
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  WhatsApp Assistant
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Confirmation Enforced
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prepares messages and calls, then opens official WhatsApp upon your confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice */}
        {lastActionNotice && (
          <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between">
            <span>{lastActionNotice}</span>
            <button
              onClick={() => setLastActionNotice(null)}
              className="text-emerald-400 hover:text-white text-[11px] underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Contacts Sidebar */}
          <div className="border-r border-slate-800 flex flex-col bg-slate-950/40">
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contacts ({contacts.length})
                </span>
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Contact Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Add Contact Modal Form */}
            {showAddContact && (
              <form onSubmit={handleAddContact} className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone (e.g. +14155550192)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="px-2.5 py-1 rounded-md text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Contacts Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredContacts.map((contact) => {
                const isSelected = selectedContact.id === contact.id;
                return (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-950/40 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {contact.name}
                        </span>
                        {contact.lastSeen && (
                          <span className="text-[10px] text-slate-500">{contact.lastSeen}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{contact.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat & Preparation Panel */}
          <div className="col-span-2 flex flex-col bg-slate-950/60 overflow-hidden">
            {/* Active Contact Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedContact.avatar}
                  alt={selectedContact.name}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{selectedContact.name}</h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {selectedContact.phone || 'No phone number added'}
                  </p>
                </div>
              </div>

              {/* Action Buttons for Call (requires confirmation) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => requestCall('voice')}
                  title="Prepare Voice Call"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => requestCall('video')}
                  title="Prepare Video Call"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preparation Workspace */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mandatory Confirmation Protocol</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ALIZA AI prepares your message or call, then asks for your explicit confirmation before launching WhatsApp. No message is ever dispatched without your tap.
                </p>
              </div>

              {/* Message Composer Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  Compose WhatsApp Message for {selectedContact.name}:
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Type or speak: "Hey ${selectedContact.name}, let's catch up!"`}
                  rows={4}
                  className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-sm text-white placeholder-slate-500 focus:outline-none transition resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-500">
                  Opens in official WhatsApp on confirmation
                </span>
                <button
                  onClick={requestSendMessage}
                  disabled={!messageText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-30 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Prepare & Confirm</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MANDATORY CONFIRMATION POPUP MODAL */}
        {confirmationData && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.35)] space-y-5 animate-scaleUp">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirmation Required</h3>
                  <p className="text-xs text-slate-400">Permission to open WhatsApp</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">
                  Action: <span className="font-bold text-white capitalize">{confirmationData.actionType.replace('_', ' ')}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Recipient: <span className="font-bold text-emerald-400">{confirmationData.contactName}</span>
                </div>
                {confirmationData.message && (
                  <div className="text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500 block mb-1">Message content:</span>
                    <p className="italic bg-slate-900 p-2.5 rounded-xl">"{confirmationData.message}"</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleCancelAction}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Open WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
