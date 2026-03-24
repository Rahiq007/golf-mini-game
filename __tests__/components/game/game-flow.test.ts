// game loading, where it lands, and how it works

import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import GameUI from '@/components/game/GameUI'
import type { Coupon } from '@/app/api/mock/coupons/route'
import WalletPage from '@/app/wallet/page'
import { WalletManager, type WalletCoupon } from '@/lib/wallet/walletManager'
  // game flow
    // see how ball moves based on the angle and power sliders
    // see how the game starts when the play button is pressed
    // see how the game ends when the ball lands in the hole missing the hole
    // see how the win page is displayed when the ball lands in the hole
    // see how the wallet page is displayed when the view wallet button is pressed
    // see how the tutorial page is displayed when the tutorial button is pressed
    // see how the selection page is displayed when the selection coupons button is pressed
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children)
})

const mockCoupons: Coupon[] = [
  {
    id: 'c1',
    title: 'Test Coupon 1',
    description: 'Test description 1',
    type: 'percentage',
    value: 20,
    expiry: '2025-12-31',
    metadata: {},
  },
]

type AwardedCoupon = {
  id: string
  code: string
  title: string
  description: string
  type: string
  value: number
  expiry: string
  awardedAt: string
  metadata: Record<string, unknown>
}

const defaultProps = {
  gameState: 'playing',
  availableCoupons: mockCoupons,
  selectedCoupons: [] as string[],
  gameResult: null as 'win' | 'lose' | null,
  awardedCoupon: null as AwardedCoupon | null,
  showTutorial: false,
  isLoading: false,
  error: null,
  onSelectionChange: jest.fn(),
  onConfirm: jest.fn(),
  onShoot: jest.fn(),
  onTutorialClose: jest.fn(),
  onShowTutorial: jest.fn(),
  onAddToWallet: jest.fn(),
  onPlayAgain: jest.fn(),
  onResultClose: jest.fn(),
  onSetGameState: jest.fn(),
  onSetError: jest.fn(),
}

const mockAwardedCoupon: Exclude<typeof defaultProps.awardedCoupon, null> = {
  id: 'aw1',
  code: 'WINNER25',
  title: 'Winner Coupon',
  description: 'Special winner discount',
  type: 'percentage',
  value: 25,
  expiry: '2026-12-31',
  awardedAt: '2026-03-16T00:00:00.000Z',
  metadata: {},
}

const mockWalletCoupons: WalletCoupon[] = [
  {
    id: 'wallet_1',
    used: false,
    addedAt: '2026-03-10T00:00:00.000Z',
    coupon: {
      id: 'coupon_1',
      code: 'SAVE20',
      title: '20% Off',
      description: 'Save 20% on your order',
      type: 'percentage',
      value: 20,
      expiry: '2026-12-31',
      awardedAt: '2026-03-10T00:00:00.000Z',
      metadata: {},
    },
  },
  {
    id: 'wallet_2',
    used: true,
    usedAt: '2026-03-12T00:00:00.000Z',
    addedAt: '2026-03-11T00:00:00.000Z',
    coupon: {
      id: 'coupon_2',
      code: 'FIXED10',
      title: '$10 Off',
      description: 'Fixed discount',
      type: 'fixed',
      value: 10,
      expiry: '2026-12-31',
      awardedAt: '2026-03-11T00:00:00.000Z',
      metadata: {},
    },
  },
  {
    id: 'wallet_3',
    used: false,
    addedAt: '2026-03-13T00:00:00.000Z',
    coupon: {
      id: 'coupon_3',
      code: 'SHIPFREE',
      title: 'Free Shipping',
      description: 'Free shipping discount',
      type: 'shipping',
      value: 0,
      expiry: '2026-12-31',
      awardedAt: '2026-03-13T00:00:00.000Z',
      metadata: {},
    },
  },
]

const setupWalletPageMocks = () => {
  jest.spyOn(WalletManager, 'getCoupons').mockReturnValue(mockWalletCoupons)
  jest.spyOn(WalletManager, 'getStats').mockReturnValue({
    totalCoupons: 3,
    usedCoupons: 1,
    expiredCoupons: 0,
    activeCoupons: 2,
    totalSavings: 12.5,
  })
  jest.spyOn(WalletManager, 'isExpired').mockReturnValue(false)
  jest.spyOn(WalletManager, 'isExpiringSoon').mockReturnValue(false)
  jest.spyOn(WalletManager, 'exportWallet').mockReturnValue('{"coupons": []}')
  jest.spyOn(WalletManager, 'clearWallet').mockImplementation(() => {})
}

const renderGameFlowState = (overrides: Partial<typeof defaultProps> = {}) =>
  render(React.createElement(GameUI, { ...defaultProps, ...overrides }))

  // slider
    // angle upwards slider
    // angle degrees slider
    // power slider
    // see how the trajectory preview updates based on the angle and power sliders

const renderGameFlowPlayingState = () => renderGameFlowState({ gameState: 'playing' })
const renderGameFlowSelectingState = (selectedCoupons: string[] = []) =>
  renderGameFlowState({ gameState: 'selecting', selectedCoupons })
const renderGameFlowResultWinState = () =>
  renderGameFlowState({ gameState: 'result', gameResult: 'win', awardedCoupon: mockAwardedCoupon })
const renderGameFlowTutorialOpenState = () => renderGameFlowState({ showTutorial: true })

describe('Game Flow slider controls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all 3 sliders with expected defaults and bounds', () => {
    const { container } = renderGameFlowPlayingState()

    expect(screen.getByText(/Aim & Power/i)).toBeInTheDocument()
    expect(screen.getByText(/Angle Upwards:\s*30°/i)).toBeInTheDocument()
    expect(screen.getByText(/Angle:\s*0°\s*to the right/i)).toBeInTheDocument()
    expect(screen.getByText(/Power:\s*50%/i)).toBeInTheDocument()

    const sliders = container.querySelectorAll('input[type="range"]')
    expect(sliders).toHaveLength(3)

    expect(sliders[0]).toHaveAttribute('min', '0')
    expect(sliders[0]).toHaveAttribute('max', '90')

    expect(sliders[1]).toHaveAttribute('min', '-90')
    expect(sliders[1]).toHaveAttribute('max', '90')

    expect(sliders[2]).toHaveAttribute('min', '10')
    expect(sliders[2]).toHaveAttribute('max', '100')
  })

  it('updates angle and power labels when slider values change', () => {
    const { container } = renderGameFlowPlayingState()

    const sliders = container.querySelectorAll('input[type="range"]')

    fireEvent.change(sliders[0], { target: { value: '45' } })
    fireEvent.change(sliders[2], { target: { value: '80' } })

    expect(screen.getByText(/Angle Upwards:\s*45°/i)).toBeInTheDocument()
    expect(screen.getByText(/Power:\s*80%/i)).toBeInTheDocument()
  })

  it('updates left/right direction text when angle-direction slider changes', () => {
    const { container } = renderGameFlowPlayingState()

    const sliders = container.querySelectorAll('input[type="range"]')

    fireEvent.change(sliders[1], { target: { value: '-25' } })
    expect(screen.getByText(/Angle:\s*25°\s*to the left/i)).toBeInTheDocument()

    fireEvent.change(sliders[1], { target: { value: '15' } })
    expect(screen.getByText(/Angle:\s*15°\s*to the right/i)).toBeInTheDocument()
  })
})
// trajectory preview

describe('Game Flow trajectory preview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
    // shows the trajectory of the ball based on the angle and power sliders
    it('renders trajectory preview when angle and power are set', () => {
      const { container } = renderGameFlowPlayingState()
        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })

    // see how the trajectory preview updates based on the angle and power sliders
    it('updates trajectory preview when angle and power sliders change', () => {
      const { container } = renderGameFlowPlayingState()
      const sliders = container.querySelectorAll('input[type="range"]')
    // updates in real-time as the sliders are adjusted
        fireEvent.change(sliders[0], { target: { value: '60' } })
        fireEvent.change(sliders[2], { target: { value: '90' } })

        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
})

// buttons
describe('Game Flow buttons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  // play button to start the game
  it('calls onShoot when play button is clicked', () => {
    renderGameFlowPlayingState()
    const playButton = screen.getByRole('button', { name: /Take Shot/i })
    fireEvent.click(playButton)
    expect(defaultProps.onShoot).toHaveBeenCalled()
  })

  // change selction coupons
  it('calls onSetGameState with "selecting" when change selection button is clicked', () => {
    renderGameFlowPlayingState()
    const changeSelectionButton = screen.getByRole('button', { name: /Change Selection/i })
    fireEvent.click(changeSelectionButton)
    expect(defaultProps.onSetGameState).toHaveBeenCalledWith('selecting')
  })

  // veiw wallet button
  it('renders view wallet button as a link to wallet page', () => {
    renderGameFlowPlayingState()
    const viewWalletButton = screen.getByRole('button', { name: /View Wallet/i })
    const walletLink = viewWalletButton.closest('a')
    expect(walletLink).toHaveAttribute('href', '/wallet')
  })

  // tutorial button
  it('calls onShowTutorial when tutorial button is clicked', () => {
    renderGameFlowPlayingState()
    const tutorialButton = screen.getByRole('button', { name: /Tutorial/i })
    fireEvent.click(tutorialButton)
    expect(defaultProps.onShowTutorial).toHaveBeenCalled()
  })

  // skip tutorial button
  it('calls onTutorialClose when skip tutorial button is clicked', () => {
    renderGameFlowTutorialOpenState()
    const skipTutorialButton = screen.getByRole('button', { name: /Skip Tutorial/i })
    fireEvent.click(skipTutorialButton)
    expect(defaultProps.onTutorialClose).toHaveBeenCalled()
  })

  // next button to move to the next step of the tutorial
  // previous button to move to the previous step of the tutorial
  it('moves tutorial steps when next and previous buttons are clicked', () => {
    renderGameFlowTutorialOpenState()
    const nextTutorialButton = screen.getByRole('button', { name: /Next/i })
    fireEvent.click(nextTutorialButton)
    expect(screen.getByText(/Choose Your Prizes/i)).toBeInTheDocument()

    const previousTutorialButton = screen.getByRole('button', { name: /Previous/i })
    fireEvent.click(previousTutorialButton)
    expect(screen.getByText(/Welcome to Golf Mini-Game!/i)).toBeInTheDocument()
  })

  // play golf button in wallet page
  it('shows play golf button in wallet page as a link to /play-golf', async () => {
    setupWalletPageMocks()
    render(React.createElement(WalletPage))

    await screen.findByRole('heading', { name: /My Coupon Wallet/i })
    const playGolfButton = screen.getByRole('button', { name: /Play Golf Game/i })
    const playGolfLink = playGolfButton.closest('a')

    expect(playGolfLink).toHaveAttribute('href', '/play-golf')
  })

  // export wallet button in wallet page
  it('exports wallet when export wallet button in wallet page is clicked', async () => {
    setupWalletPageMocks()
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    const createObjectURLMock = jest.fn(() => 'blob:wallet-export')
    const revokeObjectURLMock = jest.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURLMock, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURLMock, configurable: true })

    const anchorClickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(React.createElement(WalletPage))
    await screen.findByRole('heading', { name: /My Coupon Wallet/i })

    const exportWalletButton = screen.getByRole('button', { name: /Export Wallet/i })
    fireEvent.click(exportWalletButton)

    expect(WalletManager.exportWallet).toHaveBeenCalled()
    expect(createObjectURLMock).toHaveBeenCalled()
    expect(anchorClickSpy).toHaveBeenCalled()
    expect(revokeObjectURLMock).toHaveBeenCalled()

    Object.defineProperty(URL, 'createObjectURL', { value: originalCreateObjectURL, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: originalRevokeObjectURL, configurable: true })
  })

  // clear wallet button in wallet page
  it('clears wallet when clear wallet button in wallet page is clicked and confirmed', async () => {
    setupWalletPageMocks()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    render(React.createElement(WalletPage))
    await screen.findByRole('heading', { name: /My Coupon Wallet/i })

    const clearWalletButton = screen.getByRole('button', { name: /Clear All/i })
    fireEvent.click(clearWalletButton)

    expect(confirmSpy).toHaveBeenCalled()
    expect(WalletManager.clearWallet).toHaveBeenCalled()
  })

  // sort by dropdown in wallet page
  it('updates sort by dropdown in wallet page when changed', async () => {
    setupWalletPageMocks()
    render(React.createElement(WalletPage))

    await screen.findByRole('heading', { name: /My Coupon Wallet/i })
    const sortByDropdown = screen.getByRole('combobox')

    fireEvent.change(sortByDropdown, { target: { value: 'expiry' } })

    expect(sortByDropdown).toHaveValue('expiry')
  })

  // info section in wallet page (total coupons, active coupons, expired coupons,
  // used, total savings, usage rate, etc.)
  it('displays wallet info section with expected data', async () => {
    setupWalletPageMocks()
    render(React.createElement(WalletPage))

    await screen.findByText(/Wallet Overview/i)
    expect(screen.getByText(/Total Coupons/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Expired/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Used/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/\$12\.50/)).toBeInTheDocument()
    expect(screen.getByText(/33%/)).toBeInTheDocument()
  })

  // copy code coupon button in win page
  it('copies coupon code when copy code coupon button in win page is clicked', async () => {
    renderGameFlowResultWinState()
    const copyCodeButton = screen.getByRole('button', { name: /Copy Code/i })
    await act(async () => {
      fireEvent.click(copyCodeButton)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockAwardedCoupon.code)
  })

  // add to wallet button in win page
  it('calls onAddToWallet with awarded coupon when add to wallet button in win page is clicked', () => {
    renderGameFlowResultWinState()
    const addToWalletButton = screen.getByRole('button', { name: /Add to Wallet/i })
    fireEvent.click(addToWalletButton)
    expect(defaultProps.onAddToWallet).toHaveBeenCalledWith(mockAwardedCoupon)
  })

  // play again button in win page
  it('calls onPlayAgain when play again button in win page is clicked', () => {
    renderGameFlowResultWinState()
    const playAgainButton = screen.getByRole('button', { name: /Play Again/i })
    fireEvent.click(playAgainButton)
    expect(defaultProps.onPlayAgain).toHaveBeenCalled()
  })

  // close button in win page
  it('calls onResultClose when close button in win page is clicked', () => {
    renderGameFlowResultWinState()
    const closeButton = screen.getByRole('button', { name: /Close/i })
    fireEvent.click(closeButton)
    expect(defaultProps.onResultClose).toHaveBeenCalled()
  })

  // selction coupons button in selection page
  it('shows selection page when change selection button is clicked', () => {
    renderGameFlowPlayingState()
    const selectionCouponsButton = screen.getByRole('button', { name: /Change Selection/i })
    fireEvent.click(selectionCouponsButton)
    expect(defaultProps.onSetGameState).toHaveBeenCalledWith('selecting')
  })

  // start game button in selection page
  it('calls onConfirm when start game button in selection page is clicked', () => {
    renderGameFlowSelectingState(['c1', 'c2', 'c3', 'c4', 'c5'])
    const startGameButton = screen.getByRole('button', { name: /Start Game/i })
    fireEvent.click(startGameButton)
    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })
})

describe('Game Flow scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // see how ball moves based on the angle and power sliders
  it('sees how ball moves based on the angle and power sliders', () => {
    const { container } = renderGameFlowPlayingState()
    const sliders = container.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBeGreaterThan(0)
  })

  // see how the game starts when the play button is pressed
  it('sees how the game starts when the play button is pressed', () => {
    renderGameFlowPlayingState()
    const playButton = screen.getByRole('button', { name: /Take Shot/i })
    fireEvent.click(playButton)
    expect(defaultProps.onShoot).toHaveBeenCalled()
  })

  // see how the game ends when the ball lands in the hole missing the hole
  it('sees how the game ends when the ball lands in the hole missing the hole', () => {
    renderGameFlowState({ gameState: 'result', gameResult: 'lose' })
    expect(screen.getByText(/So Close!/i)).toBeInTheDocument()
    expect(screen.getByText(/Better luck next time/i)).toBeInTheDocument()
  })

  // see how the win page is displayed when the ball lands in the hole
  it('sees how the win page is displayed when the ball lands in the hole', () => {
    renderGameFlowResultWinState()
    expect(screen.getByText(/Hole in One!/i)).toBeInTheDocument()
    expect(screen.getByText(/Congratulations! You won a coupon!/i)).toBeInTheDocument()
    expect(screen.getByText(mockAwardedCoupon.title)).toBeInTheDocument()
  })

  // see how the wallet page is displayed when the view wallet button is pressed
  it('sees how the wallet page is displayed when the view wallet button is pressed', () => {
    renderGameFlowPlayingState()
    const viewWalletButton = screen.getByRole('button', { name: /View Wallet/i })
    const walletLink = viewWalletButton.closest('a')
    expect(walletLink).toHaveAttribute('href', '/wallet')
  })

  // see how the tutorial page is displayed when the tutorial button is pressed
  it('sees how the tutorial page is displayed when the tutorial button is pressed', () => {
    renderGameFlowPlayingState()
    const tutorialButton = screen.getByRole('button', { name: /Tutorial/i })
    fireEvent.click(tutorialButton)
    expect(defaultProps.onShowTutorial).toHaveBeenCalled()
  })

  // see how the selection page is displayed when the selection coupons button is pressed
  it('sees how the selection page is displayed when the selection coupons button is pressed', () => {
    renderGameFlowPlayingState()
    const selectionCouponsButton = screen.getByRole('button', { name: /Change Selection/i })
    fireEvent.click(selectionCouponsButton)
    expect(defaultProps.onSetGameState).toHaveBeenCalledWith('selecting')
  })
})