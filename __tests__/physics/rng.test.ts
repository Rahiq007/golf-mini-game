import { SeededRNG } from "@/lib/physics/rng"

describe("SeededRNG - Comprehensive Tests", () => {
  describe("Basic Functionality", () => {
    it("should produce consistent random sequences with same seed", () => {
      const rng1 = new SeededRNG(12345)
      const rng2 = new SeededRNG(12345)

      const sequence1 = Array.from({ length: 100 }, () => rng1.next())
      const sequence2 = Array.from({ length: 100 }, () => rng2.next())

      expect(sequence1).toEqual(sequence2)
    })

    it("should produce different sequences for different seeds", () => {
      const rng1 = new SeededRNG(111)
      const rng2 = new SeededRNG(222)

      const sequence1 = Array.from({ length: 10 }, () => rng1.next())
      const sequence2 = Array.from({ length: 10 }, () => rng2.next())

      expect(sequence1).not.toEqual(sequence2)
    })

    it("should generate numbers between 0 and 1", () => {
      const rng = new SeededRNG(54321)
      
      for (let i = 0; i < 1000; i++) {
        const value = rng.next()
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })
  })

  describe("Edge Cases", () => {
    it("should handle seed of 0", () => {
      const rng = new SeededRNG(0)
      const value = rng.next()
      
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    })

    it("should handle maximum safe integer seed", () => {
      const rng = new SeededRNG(Number.MAX_SAFE_INTEGER)
      const value = rng.next()
      
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    })

    it("should handle negative seeds", () => {
      const rng = new SeededRNG(-12345)
      const value = rng.next()
      
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    })

    it("should handle very small seed", () => {
      const rng = new SeededRNG(1)
      const value = rng.next()
      
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    })

    it("should produce different values on consecutive calls", () => {
      const rng = new SeededRNG(999)
      const values = new Set(Array.from({ length: 100 }, () => rng.next()))
      
      // Should have many unique values (at least 90 out of 100)
      expect(values.size).toBeGreaterThan(90)
    })
  })

  describe("Range Method", () => {
    it("should generate numbers within specified range", () => {
      const rng = new SeededRNG(12345)
      const min = 10
      const max = 20
      
      for (let i = 0; i < 100; i++) {
        const value = rng.range(min, max)
        expect(value).toBeGreaterThanOrEqual(min)
        expect(value).toBeLessThan(max)
      }
    })

    it("should handle negative ranges", () => {
      const rng = new SeededRNG(54321)
      const min = -100
      const max = -50
      
      for (let i = 0; i < 100; i++) {
        const value = rng.range(min, max)
        expect(value).toBeGreaterThanOrEqual(min)
        expect(value).toBeLessThan(max)
      }
    })

    it("should handle fractional ranges", () => {
      const rng = new SeededRNG(11111)
      const min = 0.1
      const max = 0.5
      
      for (let i = 0; i < 100; i++) {
        const value = rng.range(min, max)
        expect(value).toBeGreaterThanOrEqual(min)
        expect(value).toBeLessThan(max)
      }
    })

    it("should handle very large ranges", () => {
      const rng = new SeededRNG(22222)
      const min = 0
      const max = 1000000
      
      const value = rng.range(min, max)
      expect(value).toBeGreaterThanOrEqual(min)
      expect(value).toBeLessThan(max)
    })

    it("should handle min === max (degenerate case)", () => {
      const rng = new SeededRNG(33333)
      const value = rng.range(5, 5)
      
      expect(value).toBe(5)
    })
  })

  describe("Reset Functionality", () => {
    it("should reset to original seed", () => {
      const rng = new SeededRNG(54321)
      const firstValue = rng.next()

      // Generate more values
      rng.next()
      rng.next()
      rng.next()

      // Reset and check first value matches
      rng.reset()
      expect(rng.next()).toBe(firstValue)
    })

    it("should reset to new seed", () => {
      const rng = new SeededRNG(100)
      rng.next() // Advance state
      
      rng.reset(200)
      const newRng = new SeededRNG(200)
      
      expect(rng.next()).toBe(newRng.next())
    })

    it("should produce same sequence after reset", () => {
      const rng = new SeededRNG(12345)
      const sequence1 = Array.from({ length: 10 }, () => rng.next())
      
      rng.reset()
      const sequence2 = Array.from({ length: 10 }, () => rng.next())
      
      expect(sequence1).toEqual(sequence2)
    })
  })

  describe("Distribution Properties", () => {
    it("should have roughly uniform distribution", () => {
      const rng = new SeededRNG(42)
      const buckets = Array(10).fill(0)
      const iterations = 10000
      
      for (let i = 0; i < iterations; i++) {
        const value = rng.next()
        const bucket = Math.floor(value * 10)
        buckets[bucket]++
      }
      
      // Each bucket should have roughly 1000 values (±20%)
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(800)
        expect(count).toBeLessThan(1200)
      })
    })

    it("should not have obvious patterns in consecutive values", () => {
      const rng = new SeededRNG(999)
      const values = Array.from({ length: 100 }, () => rng.next())
      
      // Check that consecutive values are not all increasing or decreasing
      let increasing = 0
      let decreasing = 0
      
      for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i - 1]) increasing++
        if (values[i] < values[i - 1]) decreasing++
      }
      
      // Should be roughly 50/50 split (within 20% tolerance)
      expect(increasing).toBeGreaterThan(30)
      expect(increasing).toBeLessThan(70)
      expect(decreasing).toBeGreaterThan(30)
      expect(decreasing).toBeLessThan(70)
    })
  })

  describe("Cross-Platform Consistency", () => {
    it("should produce known sequence for known seed", () => {
      const rng = new SeededRNG(12345)
      const expectedFirst5 = [
        0.6011037379410118,
        0.5158445693086833,
        0.7964649512432516,
        0.08835208695381880,
        0.4347027358505875
      ]
      
      const actual = Array.from({ length: 5 }, () => rng.next())
      
      // Compare with small tolerance for floating point
      actual.forEach((value, i) => {
        expect(value).toBeCloseTo(expectedFirst5[i], 10)
      })
    })

    it("should be deterministic across multiple runs", () => {
      const seed = 98765
      const runs = 5
      const sequences = []
      
      for (let run = 0; run < runs; run++) {
        const rng = new SeededRNG(seed)
        sequences.push(Array.from({ length: 20 }, () => rng.next()))
      }
      
      // All sequences should be identical
      for (let i = 1; i < runs; i++) {
        expect(sequences[i]).toEqual(sequences[0])
      }
    })
  })

  describe("Performance", () => {
    it("should generate many random numbers quickly", () => {
      const rng = new SeededRNG(11111)
      const startTime = Date.now()
      
      for (let i = 0; i < 100000; i++) {
        rng.next()
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete in less than 100ms
      expect(duration).toBeLessThan(100)
    })
  })
})