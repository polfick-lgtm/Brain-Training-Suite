// One user-initiated phrase at a time. Cancellation invalidates every delayed callback.
export class PhraseTutor {
  constructor({
    synthesis,
    Utterance,
    onStage,
    setTimer = (callback, delay) => setTimeout(callback, delay),
    clearTimer = (id) => clearTimeout(id),
  }) {
    Object.assign(this, { synthesis, Utterance, onStage, setTimer, clearTimer })
    this.generation = 0
    this.timer = null
  }

  stop() {
    this.generation++
    if (this.timer !== null) this.clearTimer(this.timer)
    this.timer = null
    this.synthesis?.cancel()
    this.utterance = null
  }

  play(pair, { pauseSeconds = 5, slow = false, englishOnly = false } = {}) {
    this.stop()
    if (!this.synthesis || !this.Utterance) {
      this.onStage('unavailable')
      return
    }
    const generation = this.generation
    const active = () => this.generation === generation
    const say = (text, lang, rate, onend) => {
      if (!active()) return
      const utterance = new this.Utterance(text)
      utterance.lang = lang
      utterance.rate = rate
      const voices = this.synthesis.getVoices()
      const voice =
        voices.find((v) => v.lang === lang) ||
        voices.find((v) => v.lang.startsWith(lang.slice(0, 2)))
      if (voice) utterance.voice = voice
      utterance.onend = () => {
        if (active()) onend()
      }
      utterance.onerror = (event) => {
        if (active() && !['canceled', 'interrupted'].includes(event.error)) {
          this.stop()
          this.onStage('unavailable')
        }
      }
      this.utterance = utterance
      try {
        this.synthesis.speak(utterance)
      } catch {
        this.stop()
        this.onStage('unavailable')
      }
    }
    const english = () => {
      if (!active()) return
      this.timer = null
      this.onStage('english')
      say(pair.phrase, 'en-GB', slow ? 0.65 : 0.9, () => this.onStage('repeat'))
    }
    if (englishOnly) english()
    else {
      this.onStage('italian')
      say(pair.meaning, 'it-IT', 0.95, () => {
        this.onStage('think')
        this.timer = this.setTimer(
          english,
          Math.min(10, Math.max(1, pauseSeconds)) * 1000,
        )
      })
    }
  }
}
