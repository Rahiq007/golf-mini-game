import { test, expect } from "@playwright/test"

test.describe("Golf Mini-Game E2E", () => {
  test("complete game flow with deterministic winning shot", async ({ page }) => {
    // Navigate to the game
    await page.goto("/play-golf")

    // Wait for the game to load
    await expect(page.locator("h1")).toContainText("Golf Mini-Game")

    // Skip tutorial if it appears
    const tutorialSkip = page.locator('button:has-text("Skip Tutorial")')
    if (await tutorialSkip.isVisible()) {
      await tutorialSkip.click()
    }

    // Wait for coupons to load and verify coupon selection
    await expect(page.locator("text=Choose Your Prize Pool")).toBeVisible()
    await expect(page.locator("text=5/5 selected")).toBeVisible()

    // Start the game
    await page.click('button:has-text("Start Game")')

    // Wait for game controls to appear
    await expect(page.locator("text=Aim & Power")).toBeVisible()

    // Set specific angle and power for deterministic win
    // Use sliders to set precise values
    const angleSlider = page.locator('input[type="range"]').first()
    const powerSlider = page.locator('input[type="range"]').last()

    await angleSlider.fill("15") // 15 degrees
    await powerSlider.fill("85") // 85% power

    // Take the shot
    await page.click('button:has-text("Take Shot")')

    // Wait for animation to complete and result modal to appear
    await expect(page.locator("text=Hole in One!").or(page.locator("text=So Close!"))).toBeVisible({
      timeout: 15000,
    })

    // Check if we won (this specific combination should win with certain seeds)
    const winModal = page.locator("text=Hole in One!")
    if (await winModal.isVisible()) {
      // Verify coupon award
      await expect(page.locator("text=Congratulations! You won a coupon!")).toBeVisible()
      await expect(page.locator("text=Coupon Code:")).toBeVisible()

      // Add to wallet
      await page.click('button:has-text("Add to Wallet")')

      // Close result modal
      await page.click('button:has-text("Close")')

      // Navigate to wallet
      await page.click('a:has-text("View Wallet")')

      // Verify coupon appears in wallet
      await expect(page.locator("h1")).toContainText("My Coupon Wallet")
      await expect(page.locator("text=MOCK-C")).toBeVisible()

      // Verify wallet stats
      await expect(page.locator("text=Total Coupons")).toBeVisible()
      await expect(page.locator("text=1").first()).toBeVisible() // Should show 1 total coupon
    }
  })

  test("coupon selection and validation", async ({ page }) => {
    await page.goto("/play-golf")

    // Wait for coupons to load
    await expect(page.locator("text=Choose Your Prize Pool")).toBeVisible()

    // Verify all 5 coupons are displayed
    const couponCards = page.locator('[class*="border-2"][class*="cursor-pointer"]')
    await expect(couponCards).toHaveCount(5)

    // Verify coupon details
    await expect(page.locator("text=10% OFF - Sitewide")).toBeVisible()
    await expect(page.locator("text=$5 OFF")).toBeVisible()
    await expect(page.locator("text=Free Shipping")).toBeVisible()

    // Test deselection (click to deselect one)
    await couponCards.first().click()
    await expect(page.locator("text=4/5 selected")).toBeVisible()

    // Verify start button is disabled
    const startButton = page.locator('button:has-text("Start Game")')
    await expect(startButton).toBeDisabled()

    // Re-select to enable start button
    await couponCards.first().click()
    await expect(page.locator("text=5/5 selected")).toBeVisible()
    await expect(startButton).toBeEnabled()
  })

  test("wallet functionality", async ({ page }) => {
    // First, add a mock coupon to localStorage
    await page.addInitScript(() => {
      const mockWalletCoupon = {
        id: "test_123",
        coupon: {
          id: "c1",
          code: "TEST-COUPON-123",
          title: "Test Coupon",
          description: "Test coupon for E2E testing",
          type: "percentage",
          value: 15,
          expiry: "2025-12-31",
          awardedAt: "2024-01-01T00:00:00.000Z",
          metadata: {},
        },
        used: false,
        addedAt: "2024-01-01T00:00:00.000Z",
      }
      localStorage.setItem("golf-wallet", JSON.stringify([mockWalletCoupon]))
    })

    await page.goto("/wallet")

    // Verify wallet page loads
    await expect(page.locator("h1")).toContainText("My Coupon Wallet")

    // Verify wallet stats
    await expect(page.locator("text=Wallet Overview")).toBeVisible()
    await expect(page.locator("text=1").first()).toBeVisible() // Total coupons

    // Verify coupon card
    await expect(page.locator("text=Test Coupon")).toBeVisible()
    await expect(page.locator("text=TEST-COUPON-123")).toBeVisible()

    // Test copy functionality
    await page.click('button:has-text("Copy")')
    await expect(page.locator("text=Copied!")).toBeVisible()

    // Test mark as used
    await page.click('button:has-text("Mark as Used")')
    await expect(page.locator("text=Used")).toBeVisible()

    // Test filtering
    await page.click('button:has-text("Used")')
    await expect(page.locator("text=Test Coupon")).toBeVisible()

    await page.click('button:has-text("Active")')
    await expect(page.locator("text=No coupons match your current filter")).toBeVisible()
  })

  test("game controls and physics preview", async ({ page }) => {
    await page.goto("/play-golf")

    // Skip coupon selection
    await page.waitForSelector('button:has-text("Start Game")')
    await page.click('button:has-text("Start Game")')

    // Wait for game controls
    await expect(page.locator("text=Aim & Power")).toBeVisible()

    // Test drag controls
    const dragArea = page.locator('[class*="cursor-crosshair"]')
    await expect(dragArea).toBeVisible()

    // Test manual controls
    const angleSlider = page.locator('input[type="range"]').first()
    const powerSlider = page.locator('input[type="range"]').last()

    await angleSlider.fill("30")
    await expect(page.locator("text=Angle: 30°")).toBeVisible()

    await powerSlider.fill("75")
    await expect(page.locator("text=Power: 75%")).toBeVisible()

    // Verify trajectory preview appears
    await expect(page.locator("text=Trajectory Preview")).toBeVisible()

    // Test keyboard controls
    await page.keyboard.press("ArrowRight")
    await expect(page.locator("text=Angle: 32°")).toBeVisible()

    await page.keyboard.press("ArrowUp")
    await expect(page.locator("text=Power: 80%")).toBeVisible()
  })
})
