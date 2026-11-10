import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Camera,
  Calculator,
  Clock,
  Phone,
  MapPin,
  FileText,
  Sliders,
  Battery,
  BatteryCharging,
  Wifi,
  Bluetooth,
  Flashlight,
  Volume2,
  Sun,
  X,
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  ShieldAlert,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';
import { PhoneAppType, QuickNote } from '../types';
import { soundFx } from '../services/soundFx';

interface PhoneControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeApp?: PhoneAppType;
  onSpeak: (text: string) => void;
}

export const PhoneControlModal: React.FC<PhoneControlModalProps> = ({
  isOpen,
  onClose,
  activeApp = 'settings',
  onSpeak,
}) => {
  const [currentApp, setCurrentApp] = useState<PhoneAppType>(activeApp);

  // Settings State
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(80);
  const [brightnessLevel, setBrightnessLevel] = useState(90);
  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [isCharging, setIsCharging] = useState(false);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcEquation, setCalcEquation] = useState('');

  // Clock / Timer / Stopwatch State
  const [clockTab, setClockTab] = useState<'clock' | 'timer' | 'stopwatch'>('clock');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [timerRunning, setTimerRunning] = useState(false);

  // Dialer State
  const [dialNumber, setDialNumber] = useState('');
  const [showCallConfirm, setShowCallConfirm] = useState(false);

  // Notes State
  const [notes, setNotes] = useState<QuickNote[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aliza_notes');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (_) {}
      }
    }
    return [
      { id: 'n1', text: 'Meeting with MR. JUMON regarding ALIZA AI updates', createdAt: Date.now() - 3600000 },
      { id: 'n2', text: 'Check YouTube trending songs playlist', createdAt: Date.now() - 7200000 },
    ];
  });
  const [newNoteText, setNewNoteText] = useState('');

  // Maps State
  const [mapQuery, setMapQuery] = useState('Central Park, New York');

  useEffect(() => {
    if (activeApp) {
      setCurrentApp(activeApp);
    }
  }, [activeApp]);

  // Read Battery API if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {});
    }
  }, []);

  // Clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stopwatch updater
  useEffect(() => {
    let interval: any = null;
    if (stopwatchRunning) {
      interval = setInterval(() => setStopwatchTime((t) => t + 10), 10);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  // Timer countdown updater
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      soundFx.playAlert();
      onSpeak('Aliza AI Alert: Your timer has finished!');
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, onSpeak]);

  // Save notes to storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aliza_notes', JSON.stringify(notes));
    }
  }, [notes]);

  // Camera cleanup on app change / unmount
  useEffect(() => {
    if (currentApp !== 'camera' && cameraActive) {
      stopCamera();
    }
  }, [currentApp]);

  if (!isOpen) return null;

  // Camera Handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setCameraPermissionGranted(true);
      onSpeak('Camera opened successfully. Say cheese!');
    } catch (err) {
      console.warn('Camera permission denied or camera not found:', err);
      onSpeak('Camera permission was denied or device not found.');
      setCameraPermissionGranted(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    soundFx.playCameraShutter();
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedPhotos((prev) => [dataUrl, ...prev]);
      onSpeak('Photo captured and saved to Aliza gallery!');
    }
  };

  // Calculator Handlers
  const handleCalcInput = (char: string) => {
    soundFx.playTap();
    if (char === 'C') {
      setCalcDisplay('0');
      setCalcEquation('');
    } else if (char === '=') {
      try {
        // Safe evaluation of basic math expressions
        const sanitized = (calcEquation + calcDisplay).replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(result));
        setCalcEquation('');
        onSpeak(`The result is ${result}`);
      } catch (e) {
        setCalcDisplay('Error');
      }
    } else if (['+', '-', '*', '/'].includes(char)) {
      setCalcEquation(calcDisplay + ' ' + char + ' ');
      setCalcDisplay('0');
    } else {
      setCalcDisplay((prev) => (prev === '0' ? char : prev + char));
    }
  };

  // Dialer Handlers
  const handleDialPress = (key: string) => {
    soundFx.playDialTone(key);
    setDialNumber((prev) => prev + key);
  };

  const startPhoneCall = () => {
    if (!dialNumber.trim()) return;
    setShowCallConfirm(true);
    soundFx.playAlert();
    onSpeak(`Permission confirmation: Do you want to call ${dialNumber}?`);
  };

  const confirmCall = () => {
    setShowCallConfirm(false);
    soundFx.playSuccess();
    onSpeak(`Opening dialer for ${dialNumber}...`);
    window.open(`tel:${dialNumber}`, '_self');
  };

  // Notes Handlers
  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const note: QuickNote = {
      id: 'n-' + Date.now(),
      text: newNoteText.trim(),
      createdAt: Date.now(),
    };
    setNotes((prev) => [note, ...prev]);
    setNewNoteText('');
    soundFx.playSuccess();
    onSpeak('Note saved successfully!');
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    soundFx.playTap();
  };

  // App Tabs list
  const apps: { id: PhoneAppType; label: string; icon: any; color: string }[] = [
    { id: 'settings', label: 'In-App Preferences', icon: Sliders, color: 'text-purple-400' },
    { id: 'camera', label: 'Camera', icon: Camera, color: 'text-rose-400' },
    { id: 'calculator', label: 'Calculator', icon: Calculator, color: 'text-amber-400' },
    { id: 'clock', label: 'Clock', icon: Clock, color: 'text-cyan-400' },
    { id: 'dialer', label: 'Dialer', icon: Phone, color: 'text-emerald-400' },
    { id: 'maps', label: 'Maps', icon: MapPin, color: 'text-blue-400' },
    { id: 'notes', label: 'Notes', icon: FileText, color: 'text-yellow-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* Screen Torch Overlay if Flashlight active */}
      {flashlightOn && (
        <div
          onClick={() => setFlashlightOn(false)}
          className="fixed inset-0 z-60 bg-white flex flex-col items-center justify-center text-slate-900 cursor-pointer animate-fadeIn"
        >
          <Flashlight className="w-16 h-16 animate-bounce" />
          <h2 className="text-2xl font-black mt-4">Screen Torch Active</h2>
          <p className="text-sm text-slate-600 mt-1">Tap anywhere to turn off</p>
        </div>
      )}

      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl bg-slate-900 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/40">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Quick Tools
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  In-App Utilities
                </span>
              </div>
              <p className="text-xs text-slate-400">
                In-app calculator, clock & timer, notes, camera preview, and phone dialer
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick App Selector Bar */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          {apps.map((app) => {
            const Icon = app.icon;
            const isSelected = currentApp === app.id;
            return (
              <button
                key={app.id}
                onClick={() => {
                  soundFx.playTap();
                  setCurrentApp(app.id);
                  onSpeak(`Opening ${app.label}.`);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : app.color}`} />
                <span>{app.label}</span>
              </button>
            );
          })}
        </div>

        {/* App Main Body View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/30">
          {/* 1. SETTINGS & QUICK TOGGLES */}
          {currentApp === 'settings' && (
            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Phone Toggles & Hardware Status
              </h3>

              {/* Status grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Battery */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs">Battery</span>
                    {isCharging ? (
                      <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
                    ) : (
                      <Battery className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-black text-white">{batteryLevel}%</div>
                    <span className="text-[10px] text-emerald-400">
                      {isCharging ? 'Charging Fast' : 'Optimal Health'}
                    </span>
                  </div>
                </div>

                {/* Wi-Fi */}
                <button
                  onClick={() => {
                    setWifiEnabled(!wifiEnabled);
                    soundFx.playTap();
                    onSpeak(`Wi-Fi ${!wifiEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition text-left ${
                    wifiEnabled
                      ? 'bg-blue-950/40 border-blue-500/50 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  <div className="mt-2">
                    <div className="text-xs font-bold text-white">Wi-Fi</div>
                    <span className="text-[10px]">{wifiEnabled ? 'Connected (5GHz)' : 'Disabled'}</span>
                  </div>
                </button>

                {/* Bluetooth */}
                <button
                  onClick={() => {
                    setBluetoothEnabled(!bluetoothEnabled);
                    soundFx.playTap();
                    onSpeak(`Bluetooth ${!bluetoothEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition text-left ${
                    bluetoothEnabled
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <Bluetooth className="w-4 h-4" />
                  <div className="mt-2">
                    <div className="text-xs font-bold text-white">Bluetooth</div>
                    <span className="text-[10px]">{bluetoothEnabled ? 'Ready for Pairing' : 'Disabled'}</span>
                  </div>
                </button>

                {/* Flashlight */}
                <button
                  onClick={() => {
                    setFlashlightOn(!flashlightOn);
                    soundFx.playTap();
                    onSpeak(`Flashlight ${!flashlightOn ? 'activated' : 'deactivated'}.`);
                  }}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition text-left ${
                    flashlightOn
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <Flashlight className="w-4 h-4" />
                  <div className="mt-2">
                    <div className="text-xs font-bold text-white">Flashlight</div>
                    <span className="text-[10px]">{flashlightOn ? 'Bright ON' : 'Tap to Activate'}</span>
                  </div>
                </button>
              </div>

              {/* Volume & Brightness Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Volume2 className="w-4 h-4 text-purple-400" /> System Volume
                    </span>
                    <span className="text-purple-400 font-mono font-bold">{volumeLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumeLevel}
                    onChange={(e) => {
                      setVolumeLevel(Number(e.target.value));
                      soundFx.playTap();
                    }}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Sun className="w-4 h-4 text-amber-400" /> Screen Brightness
                    </span>
                    <span className="text-amber-400 font-mono font-bold">{brightnessLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brightnessLevel}
                    onChange={(e) => setBrightnessLevel(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. CAMERA */}
          {currentApp === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />

                {!cameraActive && (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                      <Camera className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Camera Access Required</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Aliza AI asks for your camera permission before accessing your webcam.
                    </p>
                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 hover:opacity-90 transition"
                    >
                      Allow & Open Camera
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                    <button
                      onClick={capturePhoto}
                      className="w-14 h-14 rounded-full bg-white border-4 border-rose-500 shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-rose-600" />
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs hover:bg-black transition"
                    >
                      Close Camera
                    </button>
                  </div>
                )}
              </div>

              {capturedPhotos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Captured Photos ({capturedPhotos.length})
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {capturedPhotos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Captured ${i}`}
                        className="w-20 h-16 rounded-xl object-cover border border-rose-500/40 shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. CALCULATOR */}
          {currentApp === 'calculator' && (
            <div className="max-w-xs mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              {/* Display */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
                <span className="text-[10px] text-slate-500 block h-4">{calcEquation}</span>
                <span className="text-2xl font-mono font-bold text-white truncate block">
                  {calcDisplay}
                </span>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-4 gap-2">
                {['C', '(', ')', '/'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleCalcInput(k)}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-sm transition"
                  >
                    {k}
                  </button>
                ))}
                {['7', '8', '9', '*'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleCalcInput(k)}
                    className={`p-3 rounded-xl font-bold text-sm transition ${
                      k === '*'
                        ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                        : 'bg-slate-950 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                {['4', '5', '6', '-'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleCalcInput(k)}
                    className={`p-3 rounded-xl font-bold text-sm transition ${
                      k === '-'
                        ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                        : 'bg-slate-950 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                {['1', '2', '3', '+'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleCalcInput(k)}
                    className={`p-3 rounded-xl font-bold text-sm transition ${
                      k === '+'
                        ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                        : 'bg-slate-950 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                {['0', '.', '%', '='].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleCalcInput(k)}
                    className={`p-3 rounded-xl font-bold text-sm transition ${
                      k === '='
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-950 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. CLOCK / TIMER / STOPWATCH */}
          {currentApp === 'clock' && (
            <div className="space-y-4">
              {/* Tab toggles */}
              <div className="flex justify-center gap-2">
                {(['clock', 'timer', 'stopwatch'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setClockTab(t)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                      clockTab === t
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {clockTab === 'clock' && (
                <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-4xl sm:text-5xl font-mono font-black text-cyan-400 tracking-wider">
                    {currentTime.toLocaleTimeString()}
                  </div>
                  <p className="text-sm text-slate-400">
                    {currentTime.toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {clockTab === 'stopwatch' && (
                <div className="p-6 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="text-4xl font-mono font-black text-white">
                    {Math.floor(stopwatchTime / 60000)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {Math.floor((stopwatchTime % 60000) / 1000)
                      .toString()
                      .padStart(2, '0')}
                    .
                    {Math.floor((stopwatchTime % 1000) / 10)
                      .toString()
                      .padStart(2, '0')}
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setStopwatchRunning(!stopwatchRunning)}
                      className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 text-white ${
                        stopwatchRunning ? 'bg-rose-600' : 'bg-cyan-600'
                      }`}
                    >
                      {stopwatchRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{stopwatchRunning ? 'Stop' : 'Start'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setStopwatchRunning(false);
                        setStopwatchTime(0);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>
                </div>
              )}

              {clockTab === 'timer' && (
                <div className="p-6 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="text-4xl font-mono font-black text-cyan-300">
                    {Math.floor(timerSeconds / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {(timerSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex justify-center gap-2">
                    {[60, 300, 600, 900].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => {
                          setTimerSeconds(sec);
                          setTimerRunning(false);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                      >
                        {sec / 60}m
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 text-white ${
                        timerRunning ? 'bg-rose-600' : 'bg-cyan-600'
                      }`}
                    >
                      {timerRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{timerRunning ? 'Pause' : 'Start Timer'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setTimerRunning(false);
                        setTimerSeconds(300);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. PHONE DIALER */}
          {currentApp === 'dialer' && (
            <div className="max-w-xs mx-auto p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              {/* Number display */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <input
                  type="text"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Enter phone number..."
                  className="w-full text-center text-xl font-mono font-bold text-white bg-transparent focus:outline-none"
                />
              </div>

              {/* Dial Pad */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { n: '1', sub: '' },
                  { n: '2', sub: 'ABC' },
                  { n: '3', sub: 'DEF' },
                  { n: '4', sub: 'GHI' },
                  { n: '5', sub: 'JKL' },
                  { n: '6', sub: 'MNO' },
                  { n: '7', sub: 'PQRS' },
                  { n: '8', sub: 'TUV' },
                  { n: '9', sub: 'WXYZ' },
                  { n: '*', sub: '' },
                  { n: '0', sub: '+' },
                  { n: '#', sub: '' },
                ].map((item) => (
                  <button
                    key={item.n}
                    onClick={() => handleDialPress(item.n)}
                    className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold transition flex flex-col items-center justify-center active:scale-95"
                  >
                    <span className="text-base">{item.n}</span>
                    <span className="text-[9px] text-slate-500">{item.sub || '\u00A0'}</span>
                  </button>
                ))}
              </div>

              {/* Call & Clear Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={startPhoneCall}
                  disabled={!dialNumber.trim()}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
                <button
                  onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
                  className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Del
                </button>
              </div>

              {/* Dialer Safety Confirmation */}
              {showCallConfirm && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/50 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Permission Required</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Aliza AI will initiate a cellular call to <span className="text-white font-mono font-bold">{dialNumber}</span>.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={confirmCall}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      Confirm Call
                    </button>
                    <button
                      onClick={() => setShowCallConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. MAPS */}
          {currentApp === 'maps' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={mapQuery}
                    onChange={(e) => setMapQuery(e.target.value)}
                    placeholder="Search locations or get directions..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
                    window.open(url, '_blank');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Maps
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center relative">
                <iframe
                  title="Google Maps Location"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0 filter contrast-105"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* 7. NOTES & VOICE MEMOS */}
          {currentApp === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={addNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Type or dictate note with Aliza..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Note
                </button>
              </form>

              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-slate-200">{note.text}</p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
