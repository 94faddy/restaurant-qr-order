// ===================================================
// FILE: notification.ts
// PATH: /restaurant-qr-order/src/lib/notification.ts
// DESCRIPTION: Helper functions สำหรับเสียงและการแจ้งเตือน
// ===================================================

// Create notification sound using Web Audio API
export function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create oscillator for beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set sound properties
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    // Envelope
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    
    // Play
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    
    // Second beep
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.value = 1000;
      oscillator2.type = 'sine';
      
      const now2 = audioContext.currentTime;
      gainNode2.gain.setValueAtTime(0, now2);
      gainNode2.gain.linearRampToValueAtTime(0.5, now2 + 0.05);
      gainNode2.gain.linearRampToValueAtTime(0, now2 + 0.3);
      
      oscillator2.start(now2);
      oscillator2.stop(now2 + 0.3);
    }, 200);
    
  } catch (error) {
    console.error('Cannot play notification sound:', error);
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Show browser notification
export function showNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    tag: 'order-notification',
  });
}

// Vibrate (for mobile)
export function vibrate(pattern: number | number[] = [200, 100, 200]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// Combined notification function
export function notifyNewOrder(
  tableName: string, 
  itemCount: number, 
  options: { sound?: boolean; notification?: boolean; vibrate?: boolean } = {}
) {
  const { sound = true, notification = true, vibrate: shouldVibrate = true } = options;
  
  if (sound) {
    playNotificationSound();
  }
  
  if (notification) {
    showNotification(
      '🔔 มีออเดอร์ใหม่!',
      `${tableName} - ${itemCount} รายการ`
    );
  }
  
  if (shouldVibrate) {
    vibrate();
  }
}