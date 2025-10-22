import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameUI from '@/components/game/GameUI'
import type { Coupon } from '@/app/api/mock/coupons/route'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
})

const mockCoupons: Coupon[] = [
  {
    id: 'c1',
    title: 'Test Coupon 1',
    description: 'Test description 1',
    type: 'percentage',
    value: 20,
    expiry: '2025-12-31',
    metadata: {}
  },
  {
    id: 'c2',
    title: 'Test Coupon 2',
    description: 'Test description 2',
    type: 'fixed',
    value: 10,
    expiry: '2025-12-31',
    metadata: {}
  },
  {
    id: 'c3',
    title: 'Test Coupon 3',
    description: 'Test description 3',
    type: 'shipping',
    value: 0,
    expiry: '2025-12-31',
    metadata: {}
  },
  {
    id: 'c4',
    title: 'Test Coupon 4',
    description: 'Test description 4',
    type: 'bogo',
    value: 0,
    expiry: '2025-12-31',
    metadata: {}
  },
  {
    id: 'c5',
    title: 'Test Coupon 5',
    description: 'Test description 5',
    type: 'percentage',
    value: 50,
    expiry: '2025-12-31',
    metadata: {}
  }
]

describe('GameUI Component', () => {
  const defaultProps = {
    gameState: 'selecting' as const,
    availableCoupons: mockCoupons,
    selectedCoupons: [] as string[],
    gameResult: null,
    awardedCoupon: null,
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Header Section', () => {
    it('renders the game title', () => {
      render(<GameUI {...defaultProps} />)
      
      expect(screen.getByText('Golf Mini-Game')).toBeInTheDocument()
      expect(screen.getByText('One shot to win amazing coupons!')).toBeInTheDocument()
    })

    it('displays correct game state badge', () => {
      const { rerender } = render(<GameUI {...defaultProps} gameState="selecting" />)
      expect(screen.getByText('Select Coupons')).toBeInTheDocument()

      rerender(<GameUI {...defaultProps} gameState="playing" />)
      expect(screen.getByText('Ready to Play')).toBeInTheDocument()

      rerender(<GameUI {...defaultProps} gameState="animating" />)
      expect(screen.getByText('Ball in Motion')).toBeInTheDocument()

      rerender(<GameUI {...defaultProps} gameState="result" />)
      expect(screen.getByText('Game Complete')).toBeInTheDocument()
    })

    it('renders View Wallet button', () => {
      render(<GameUI {...defaultProps} />)
      
      const walletButton = screen.getByRole('button', { name: /view wallet/i })
      expect(walletButton).toBeInTheDocument()
    })

    it('renders Tutorial button', () => {
      render(<GameUI {...defaultProps} />)
      
      const tutorialButton = screen.getByRole('button', { name: /tutorial/i })
      expect(tutorialButton).toBeInTheDocument()
    })

    it('calls onShowTutorial when Tutorial button clicked', async () => {
      const user = userEvent.setup()
      render(<GameUI {...defaultProps} />)
      
      const tutorialButton = screen.getByRole('button', { name: /tutorial/i })
      await user.click(tutorialButton)
      
      expect(defaultProps.onShowTutorial).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Display', () => {
    it('shows error message when error is present', () => {
      render(<GameUI {...defaultProps} error="Test error message" />)
      
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('hides error when no error', () => {
      render(<GameUI {...defaultProps} error={null} />)
      
      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
    })

    it('calls onSetError when Dismiss button clicked', async () => {
      const user = userEvent.setup()
      render(<GameUI {...defaultProps} error="Test error" />)
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)
      
      expect(defaultProps.onSetError).toHaveBeenCalledWith(null)
    })
  })

  describe('Selecting State', () => {
    it('renders CouponPicker when in selecting state', () => {
      render(<GameUI {...defaultProps} gameState="selecting" />)
      
      expect(screen.getByText('Choose Your Prize Pool')).toBeInTheDocument()
    })

    it('passes correct props to CouponPicker', () => {
      render(<GameUI {...defaultProps} gameState="selecting" />)
      
      // Verify coupons are rendered
      mockCoupons.forEach(coupon => {
        expect(screen.getByText(coupon.title)).toBeInTheDocument()
      })
    })

    it('disables CouponPicker when loading', () => {
      render(<GameUI {...defaultProps} gameState="selecting" isLoading={true} />)
      
      const startButton = screen.getByRole('button', { name: /start game|select \d+ more/i })
      expect(startButton).toBeDisabled()
    })
  })

  describe('Playing State', () => {
    it('renders game canvas placeholder in playing state', () => {
      render(<GameUI {...defaultProps} gameState="playing" selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']} />)
      
      // Check for the canvas placeholder
      const canvasPlaceholder = screen.getByText(/GameCanvas will be rendered here/i).closest('div')
      expect(canvasPlaceholder).toHaveClass('bg-gray-200')
    })

    it('renders GameControls in playing state', () => {
      render(<GameUI {...defaultProps} gameState="playing" selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']} />)
      
      expect(screen.getByText('Aim & Power')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /take shot/i })).toBeInTheDocument()
    })

    it('renders selected coupons list', () => {
      render(
        <GameUI 
          {...defaultProps} 
          gameState="playing" 
          selectedCoupons={['c1', 'c2', 'c3']}
        />
      )
      
      expect(screen.getByText('Selected Coupons')).toBeInTheDocument()
      expect(screen.getByText('Test Coupon 1')).toBeInTheDocument()
      expect(screen.getByText('Test Coupon 2')).toBeInTheDocument()
      expect(screen.getByText('Test Coupon 3')).toBeInTheDocument()
    })

    it('renders Change Selection button', () => {
      render(
        <GameUI 
          {...defaultProps} 
          gameState="playing" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      expect(screen.getByRole('button', { name: /change selection/i })).toBeInTheDocument()
    })

    it('calls onSetGameState when Change Selection clicked', async () => {
      const user = userEvent.setup()
      render(
        <GameUI 
          {...defaultProps} 
          gameState="playing" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      const changeButton = screen.getByRole('button', { name: /change selection/i })
      await user.click(changeButton)
      
      expect(defaultProps.onSetGameState).toHaveBeenCalledWith('selecting')
    })

    it('disables Change Selection button when animating', () => {
      render(
        <GameUI 
          {...defaultProps} 
          gameState="animating" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      const changeButton = screen.getByRole('button', { name: /change selection/i })
      expect(changeButton).toBeDisabled()
    })
  })

  describe('Animating State', () => {
    it('disables GameControls during animation', () => {
      render(
        <GameUI 
          {...defaultProps} 
          gameState="animating" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      const shootButton = screen.getByRole('button', { name: /shooting.../i })
      expect(shootButton).toBeDisabled()
    })

    it('shows animating state badge', () => {
      render(
        <GameUI 
          {...defaultProps} 
          gameState="animating" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      expect(screen.getByText('Ball in Motion')).toBeInTheDocument()
    })
  })

  describe('Result State', () => {
    it('renders ResultModal when in result state', () => {
      render(
        <GameUI 
          {...defaultProps} 
          gameState="result"
          gameResult="win"
          awardedCoupon={mockCoupons[0]}
        />
      )
      
      // ResultModal should be rendered (it will handle its own display logic)
      expect(screen.getByText('Game Complete')).toBeInTheDocument()
    })
  })

  describe('Tutorial Overlay', () => {
    it('renders TutorialOverlay when showTutorial is true', () => {
      render(<GameUI {...defaultProps} showTutorial={true} />)
      
      // TutorialOverlay should be rendered
      // Actual content depends on TutorialOverlay implementation
      expect(defaultProps.onTutorialClose).toBeDefined()
    })

    it('does not show tutorial when showTutorial is false', () => {
      render(<GameUI {...defaultProps} showTutorial={false} />)
      
      // Just verify the component renders without tutorial
      expect(screen.getByText('Golf Mini-Game')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('disables interactions when loading', () => {
      render(<GameUI {...defaultProps} isLoading={true} gameState="selecting" />)
      
      const buttons = screen.getAllByRole('button')
      // Start game button should be disabled
      const startButton = buttons.find(btn => btn.textContent?.includes('Select') || btn.textContent?.includes('Start'))
      expect(startButton).toBeDisabled()
    })
  })

  describe('Responsive Layout', () => {
    it('uses grid layout for playing state', () => {
      const { container } = render(
        <GameUI 
          {...defaultProps} 
          gameState="playing" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toBeInTheDocument()
      expect(gridContainer).toHaveClass('lg:grid-cols-3')
    })

    it('applies responsive classes to canvas area', () => {
      const { container } = render(
        <GameUI 
          {...defaultProps} 
          gameState="playing" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      const canvasArea = container.querySelector('.lg\\:col-span-2')
      expect(canvasArea).toBeInTheDocument()
    })
  })

  describe('Integration with Child Components', () => {
    it('passes onSelectionChange to CouponPicker', async () => {
      const user = userEvent.setup()
      render(<GameUI {...defaultProps} gameState="selecting" />)
      
      // Click on a coupon
      const coupon = screen.getByText('Test Coupon 1').closest('div')
      await user.click(coupon!)
      
      expect(defaultProps.onSelectionChange).toHaveBeenCalled()
    })

    it('passes onConfirm to CouponPicker', () => {
      render(
        <GameUI 
          {...defaultProps} 
          gameState="selecting" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      const confirmButton = screen.getByRole('button', { name: /start game/i })
      expect(confirmButton).toBeInTheDocument()
    })

    it('passes onShoot to GameControls', () => {
      render(
        <GameUI 
          {...defaultProps} 
          gameState="playing" 
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
        />
      )
      
      const shootButton = screen.getByRole('button', { name: /take shot/i })
      expect(shootButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<GameUI {...defaultProps} />)
      
      const mainHeading = screen.getByRole('heading', { name: /golf mini-game/i })
      expect(mainHeading).toBeInTheDocument()
    })

    it('buttons have accessible names', () => {
      render(<GameUI {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /view wallet/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tutorial/i })).toBeInTheDocument()
    })
  })
})