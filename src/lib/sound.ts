let audioCtx: AudioContext | null = null

export const playScanBeep = (freq = 880, duration = 0.08) => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) audioCtx = new AudioContextClass()
    }
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume()
      }
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + duration)
    }
  } catch {}

  // Tactile vibration on smartphones
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(80)
  }
}

export const playErrorTone = () => {
  playScanBeep(320, 0.2)
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([80, 50, 80])
  }
}
