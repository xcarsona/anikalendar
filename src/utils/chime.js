// A soft two-note chime synthesized with Web Audio, so there's no sound file
// to ship. Browsers only allow audio after a user gesture, so call
// primeChime() from a click (e.g. the timer's Start button) first.

let context = null

export function primeChime() {
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') context.resume()
  } catch {
    // No Web Audio; the chime is optional.
  }
}

export function playChime() {
  if (!context) return
  const t = context.currentTime
  for (const [frequency, offset] of [
    [660, 0],
    [880, 0.22],
  ]) {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, t + offset)
    gain.gain.exponentialRampToValueAtTime(0.18, t + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 1.2)
    osc.connect(gain).connect(context.destination)
    osc.start(t + offset)
    osc.stop(t + offset + 1.25)
  }
}
