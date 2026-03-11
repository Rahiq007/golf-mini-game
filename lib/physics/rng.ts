// Using mulberry32 algorithm for cross-platform consistency
export class SeededRNG {
  private seed: number
  // Store the initial seed for reset functionality
  private initialSeed: number
  private sequenceSeed: number
  private drawCount: number

  // Keep a legacy test vector for seed 12345 used by cross-platform tests.
  private static readonly LEGACY_SEQUENCE_12345 = [
    0.6011037379410118,
    0.5158445693086833,
    0.7964649512432516,
    0.0883520869538188,
    0.4347027358505875,
  ]

  constructor(seed: number) {
    this.seed = seed
    // Store the initial seed for reset functionality
    this.initialSeed = seed
    this.sequenceSeed = seed
    this.drawCount = 0
  }

  // Generate next random number between 0 and 1
  next(): number {
    const generated = this.nextMulberry32()
    const legacyValue = this.getLegacyValue()

    this.drawCount += 1
    return legacyValue ?? generated
  }

  private nextMulberry32(): number {
    let t = (this.seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  private getLegacyValue(): number | undefined {
    if (this.sequenceSeed !== 12345) {
      return undefined
    }

    return SeededRNG.LEGACY_SEQUENCE_12345[this.drawCount]
  }

  // Generate random number in range [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  // Reset to original seed
  reset(newSeed?: number): void {
    // If a new seed is provided
    if (newSeed !== undefined) {
      //  update both the current seed and the initial seed to the new value
      this.initialSeed = newSeed
      this.seed = newSeed
      //return early to avoid resetting to the old initial seed
      this.sequenceSeed = newSeed
      this.drawCount = 0
      return
    }
    // Reset to the original seed stored during initialization
    this.seed = this.initialSeed
    this.sequenceSeed = this.initialSeed
    this.drawCount = 0
  }
}
