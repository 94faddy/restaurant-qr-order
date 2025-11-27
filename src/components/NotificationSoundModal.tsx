// ===================================================
// FILE: NotificationSoundModal.tsx
// PATH: src/components/NotificationSoundModal.tsx
// DESCRIPTION: Modal สำหรับตั้งค่าเสียงแจ้งเตือน (เลือก 1-10 แบบ + ปรับความดัง/ระยะเวลา)
// ===================================================

'use client';

import { useState, useRef, useEffect } from 'react';

interface NotificationSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSound: number;
  currentVolume: number;
  currentDuration: number;
  onSave: (soundId: number, volume: number, duration: number) => void;
}

// รายการเสียงแจ้งเตือน
const notificationSounds = [
  { id: 1, name: 'ดิง-ดอง', description: 'เสียงกระดิ่งคลาสสิก', icon: '🔔' },
  { id: 2, name: 'ติ๊ด-ติ๊ด', description: 'เสียงบี๊ปสั้น 2 ครั้ง', icon: '📢' },
  { id: 3, name: 'ชิมมี่', description: 'เสียงสั่นไหว', icon: '✨' },
  { id: 4, name: 'ป๊อป', description: 'เสียงป๊อปอัพ', icon: '💫' },
  { id: 5, name: 'ระฆัง', description: 'เสียงระฆังวัด', icon: '🛎️' },
  { id: 6, name: 'ไซเรน', description: 'เสียงเตือนฉุกเฉิน', icon: '🚨' },
  { id: 7, name: 'นกหวีด', description: 'เสียงนกร้อง', icon: '🐦' },
  { id: 8, name: 'เมโลดี้', description: 'ทำนองสั้นๆ', icon: '🎵' },
  { id: 9, name: 'กลอง', description: 'เสียงตีกลอง', icon: '🥁' },
  { id: 10, name: 'ฮาร์ป', description: 'เสียงพิณ', icon: '🎶' },
];

export default function NotificationSoundModal({
  isOpen,
  onClose,
  currentSound,
  currentVolume,
  currentDuration,
  onSave,
}: NotificationSoundModalProps) {
  const [selectedSound, setSelectedSound] = useState(currentSound);
  const [volume, setVolume] = useState(currentVolume);
  const [duration, setDuration] = useState(currentDuration);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setSelectedSound(currentSound);
    setVolume(currentVolume);
    setDuration(currentDuration);
  }, [currentSound, currentVolume, currentDuration, isOpen]);

  // สร้าง AudioContext เมื่อต้องการเล่นเสียง
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // แปลง volume (0-100) เป็น gain (0-1)
  const volumeToGain = (vol: number) => vol / 100;
  
  // แปลง duration (50-200) เป็น multiplier (0.5-2.0)
  const durationToMultiplier = (dur: number) => dur / 100;

  // ฟังก์ชันเล่นเสียงแต่ละแบบ
  const playSound = (soundId: number) => {
    setIsPlaying(soundId);
    
    const audioContext = getAudioContext();
    const gain = volumeToGain(volume);
    const durMultiplier = durationToMultiplier(duration);
    
    // ตั้งค่าเสียงแต่ละแบบ
    switch (soundId) {
      case 1: playDingDong(audioContext, gain, durMultiplier); break;
      case 2: playBeepBeep(audioContext, gain, durMultiplier); break;
      case 3: playShimmer(audioContext, gain, durMultiplier); break;
      case 4: playPop(audioContext, gain, durMultiplier); break;
      case 5: playBell(audioContext, gain, durMultiplier); break;
      case 6: playSiren(audioContext, gain, durMultiplier); break;
      case 7: playBird(audioContext, gain, durMultiplier); break;
      case 8: playMelody(audioContext, gain, durMultiplier); break;
      case 9: playDrum(audioContext, gain, durMultiplier); break;
      case 10: playHarp(audioContext, gain, durMultiplier); break;
    }

    setTimeout(() => setIsPlaying(null), 1500 * durMultiplier);
  };

  // เสียง 1: ดิง-ดอง
  const playDingDong = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    
    // Ding
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 880;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(vol, now + 0.02 * dur);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5 * dur);
    osc1.start(now);
    osc1.stop(now + 0.5 * dur);

    // Dong
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 660;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, now + 0.15 * dur);
    gain2.gain.linearRampToValueAtTime(vol, now + 0.17 * dur);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7 * dur);
    osc2.start(now + 0.15 * dur);
    osc2.stop(now + 0.7 * dur);
  };

  // เสียง 2: ติ๊ด-ติ๊ด
  const playBeepBeep = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    
    [0, 0.2 * dur].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1000;
      osc.type = 'square';
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol * 0.6, now + delay + 0.02 * dur);
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.15 * dur);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15 * dur);
    });
  };

  // เสียง 3: ชิมมี่
  const playShimmer = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    const frequencies = [523, 659, 784, 1047];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = now + i * 0.05 * dur;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol * 0.4, startTime + 0.02 * dur);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5 * dur);
      osc.start(startTime);
      osc.stop(startTime + 0.5 * dur);
    });
  };

  // เสียง 4: ป๊อป
  const playPop = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1 * dur);
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15 * dur);
    osc.start(now);
    osc.stop(now + 0.15 * dur);
  };

  // เสียง 5: ระฆัง
  const playBell = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    const frequencies = [523, 659, 784];
    
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.01 * dur);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1 * dur);
      osc.start(now);
      osc.stop(now + 1 * dur);
    });
  };

  // เสียง 6: ไซเรน
  const playSiren = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.25 * dur);
    osc.frequency.linearRampToValueAtTime(400, now + 0.5 * dur);
    gain.gain.setValueAtTime(vol * 0.8, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5 * dur);
    osc.start(now);
    osc.stop(now + 0.5 * dur);
  };

  // เสียง 7: นกหวีด
  const playBird = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    
    [0, 0.2 * dur, 0.35 * dur].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const baseFreq = 1200 + i * 200;
      osc.frequency.setValueAtTime(baseFreq, now + delay);
      osc.frequency.linearRampToValueAtTime(baseFreq + 300, now + delay + 0.1 * dur);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol * 0.6, now + delay + 0.02 * dur);
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.12 * dur);
      osc.start(now + delay);
      osc.stop(now + delay + 0.12 * dur);
    });
  };

  // เสียง 8: เมโลดี้
  const playMelody = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'triangle';
      const startTime = now + i * 0.12 * dur;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol * 0.6, startTime + 0.02 * dur);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15 * dur);
      osc.start(startTime);
      osc.stop(startTime + 0.15 * dur);
    });
  };

  // เสียง 9: กลอง
  const playDrum = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1 * dur);
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2 * dur);
    osc.start(now);
    osc.stop(now + 0.2 * dur);
  };

  // เสียง 10: ฮาร์ป
  const playHarp = (ctx: AudioContext, vol: number, dur: number) => {
    const now = ctx.currentTime;
    const frequencies = [261, 329, 392, 523, 659, 784];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = now + i * 0.08 * dur;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol * 0.4, startTime + 0.01 * dur);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8 * dur);
      osc.start(startTime);
      osc.stop(startTime + 0.8 * dur);
    });
  };

  const handleSave = () => {
    onSave(selectedSound, volume, duration);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">🔊 ตั้งค่าเสียงแจ้งเตือน</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Volume & Duration Sliders */}
        <div className="p-4 border-b bg-gray-50 space-y-4">
          {/* Volume Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">🔊 ความดัง</label>
              <span className="text-sm font-bold text-primary-600">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>เบา</span>
              <span>ปานกลาง</span>
              <span>ดัง</span>
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">⏱️ ระยะเวลา</label>
              <span className="text-sm font-bold text-primary-600">{duration}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              step="10"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>สั้น (0.5x)</span>
              <span>ปกติ (1x)</span>
              <span>ยาว (2x)</span>
            </div>
          </div>
        </div>

        {/* Sound List */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {notificationSounds.map((sound) => (
            <div
              key={sound.id}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedSound === sound.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedSound(sound.id)}
            >
              <div className="text-center">
                <span className="text-3xl block mb-2">{sound.icon}</span>
                <p className="font-semibold text-gray-900">{sound.name}</p>
                <p className="text-xs text-gray-500 mt-1">{sound.description}</p>
              </div>

              {/* Play Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playSound(sound.id);
                }}
                disabled={isPlaying !== null}
                className={`mt-3 w-full py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isPlaying === sound.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isPlaying === sound.id ? '🔊 กำลังเล่น...' : '▶️ ทดลอง'}
              </button>

              {/* Selected Indicator */}
              {selectedSound === sound.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-ghost py-3"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-primary py-3"
          >
            💾 บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

// Export ฟังก์ชันเล่นเสียงสำหรับใช้ที่อื่น (รับ volume และ duration)
export function playNotificationSoundById(soundId: number, volume: number = 50, duration: number = 100) {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  
  const vol = volume / 100; // แปลงเป็น 0-1
  const dur = duration / 100; // แปลงเป็น multiplier
  
  switch (soundId) {
    case 1: playDingDongSound(audioContext, vol, dur); break;
    case 2: playBeepBeepSound(audioContext, vol, dur); break;
    case 3: playShimmerSound(audioContext, vol, dur); break;
    case 4: playPopSound(audioContext, vol, dur); break;
    case 5: playBellSound(audioContext, vol, dur); break;
    case 6: playSirenSound(audioContext, vol, dur); break;
    case 7: playBirdSound(audioContext, vol, dur); break;
    case 8: playMelodySound(audioContext, vol, dur); break;
    case 9: playDrumSound(audioContext, vol, dur); break;
    case 10: playHarpSound(audioContext, vol, dur); break;
    default: playDingDongSound(audioContext, vol, dur);
  }
}

// ฟังก์ชันเล่นเสียงแยก (export สำหรับใช้งานภายนอก)
function playDingDongSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.frequency.value = 880;
  osc1.type = 'sine';
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(vol, now + 0.02 * dur);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5 * dur);
  osc1.start(now);
  osc1.stop(now + 0.5 * dur);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.frequency.value = 660;
  osc2.type = 'sine';
  gain2.gain.setValueAtTime(0, now + 0.15 * dur);
  gain2.gain.linearRampToValueAtTime(vol, now + 0.17 * dur);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7 * dur);
  osc2.start(now + 0.15 * dur);
  osc2.stop(now + 0.7 * dur);
}

function playBeepBeepSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  [0, 0.2 * dur].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1000;
    osc.type = 'square';
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + delay + 0.02 * dur);
    gain.gain.linearRampToValueAtTime(0, now + delay + 0.15 * dur);
    osc.start(now + delay);
    osc.stop(now + delay + 0.15 * dur);
  });
}

function playShimmerSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    const startTime = now + i * 0.05 * dur;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol * 0.4, startTime + 0.02 * dur);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5 * dur);
    osc.start(startTime);
    osc.stop(startTime + 0.5 * dur);
  });
}

function playPopSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.1 * dur);
  osc.type = 'sine';
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15 * dur);
  osc.start(now);
  osc.stop(now + 0.15 * dur);
}

function playBellSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  [523, 659, 784].forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.01 * dur);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1 * dur);
    osc.start(now);
    osc.stop(now + 1 * dur);
  });
}

function playSirenSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.linearRampToValueAtTime(800, now + 0.25 * dur);
  osc.frequency.linearRampToValueAtTime(400, now + 0.5 * dur);
  gain.gain.setValueAtTime(vol * 0.8, now);
  gain.gain.linearRampToValueAtTime(0.01, now + 0.5 * dur);
  osc.start(now);
  osc.stop(now + 0.5 * dur);
}

function playBirdSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  [0, 0.2 * dur, 0.35 * dur].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const baseFreq = 1200 + i * 200;
    osc.frequency.setValueAtTime(baseFreq, now + delay);
    osc.frequency.linearRampToValueAtTime(baseFreq + 300, now + delay + 0.1 * dur);
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + delay + 0.02 * dur);
    gain.gain.linearRampToValueAtTime(0, now + delay + 0.12 * dur);
    osc.start(now + delay);
    osc.stop(now + delay + 0.12 * dur);
  });
}

function playMelodySound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'triangle';
    const startTime = now + i * 0.12 * dur;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol * 0.6, startTime + 0.02 * dur);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15 * dur);
    osc.start(startTime);
    osc.stop(startTime + 0.15 * dur);
  });
}

function playDrumSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.1 * dur);
  osc.type = 'sine';
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2 * dur);
  osc.start(now);
  osc.stop(now + 0.2 * dur);
}

function playHarpSound(ctx: AudioContext, vol: number, dur: number) {
  const now = ctx.currentTime;
  [261, 329, 392, 523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    const startTime = now + i * 0.08 * dur;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol * 0.4, startTime + 0.01 * dur);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8 * dur);
    osc.start(startTime);
    osc.stop(startTime + 0.8 * dur);
  });
}