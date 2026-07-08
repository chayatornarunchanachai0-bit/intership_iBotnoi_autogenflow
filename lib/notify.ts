// เล่นเสียงแจ้งเตือนสั้นๆ ด้วย Web Audio API โดยไม่ต้องพึ่งไฟล์เสียง
export function playNotifySound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });

    setTimeout(() => ctx.close(), 400);
  } catch {
    // เบราว์เซอร์บางตัวบล็อก autoplay หรือไม่รองรับ Web Audio - ข้ามไปเงียบๆ
  }
}
