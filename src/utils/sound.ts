/**
 * Web Audio API synthesizer for the task timer alarm.
 * Plays a soft, polite, high-end notification chime.
 */
export function playAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    // First chime
    const playNote = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };
    
    const now = ctx.currentTime;
    playNote(now, 880, 0.4); // A5 (high note)
    playNote(now + 0.15, 1109.73, 0.6); // C#6 (major third chord effect)
  } catch (error) {
    console.warn("Audio Context playback stalled or was blocked by browser autoplay policies:", error);
  }
}
