// Using mulberry32 algorithm for cross-platform consistency
export class SeededRNG {
  private seed: number
  // Store the initial seed for reset functionality
  private initialSeed: number

  constructor(seed: number) {
    this.seed = seed
    // Store the initial seed for reset functionality
    this.initialSeed = seed
  }

  // Generate next random number between 0 and 1
  next(): number {
    let t = (this.seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
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
      return
    }
    // Reset to the original seed stored during initialization
    this.seed = this.initialSeed
  }
}
