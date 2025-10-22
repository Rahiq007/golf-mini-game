import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CouponPicker from '@/components/game/CouponPicker'
import type { Coupon } from '@/app/api/mock/coupons/route'

// Mock coupons data
const mockCoupons: Coupon[] = [
  {
    id: 'c1',
    title: 'Summer Sale',
    description: 'Get discount on summer items',
    type: 'percentage',
    value: 20,
    expiry: '2025-12-31',
    metadata: { minPurchase: 50 }
  },
  {
    id: 'c2',
    title: 'Free Shipping',
    description: 'Free shipping on all orders',
    type: 'shipping',
    value: 0,
    expiry: '2025-12-31',
    metadata: {}
  },
  {
    id: 'c3',
    title: 'Fixed Discount',
    description: '$10 off your purchase',
    type: 'fixed',
    value: 10,
    expiry: '2025-12-31',
    metadata: {}
  },
  {
    id: 'c4',
    title: 'BOGO Deal',
    description: 'Buy one get one free',
    type: 'bogo',
    value: 0,
    expiry: '2025-12-31',
    metadata: {}
  },
  {
    id: 'c5',
    title: 'Mega Sale',
    description: '50% off everything',
    type: 'percentage',
    value: 50,
    expiry: '2025-12-31',
    metadata: {}
  },
  {
    id: 'c6',
    title: 'Extra Coupon',
    description: 'Additional discount',
    type: 'percentage',
    value: 15,
    expiry: '2025-12-31',
    metadata: {}
  }
]

describe('CouponPicker Component', () => {
  const mockOnSelectionChange = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the component with title and description', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('Choose Your Prize Pool')).toBeInTheDocument()
      expect(screen.getByText('Select exactly 5 coupons. Win one with a perfect shot!')).toBeInTheDocument()
    })

    it('displays all available coupons', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      mockCoupons.forEach((coupon) => {
        expect(screen.getByText(coupon.title)).toBeInTheDocument()
        expect(screen.getByText(coupon.description)).toBeInTheDocument()
      })
    })

    it('shows selection counter badge', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('2/5 selected')).toBeInTheDocument()
    })

    it('formats percentage coupon correctly', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('20% OFF')).toBeInTheDocument()
      expect(screen.getByText('50% OFF')).toBeInTheDocument()
    })

    it('formats fixed coupon correctly', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('$10 OFF')).toBeInTheDocument()
    })

    it('formats shipping coupon correctly', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('FREE SHIPPING')).toBeInTheDocument()
    })

    it('formats BOGO coupon correctly', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('BUY 1 GET 1')).toBeInTheDocument()
    })

    it('displays minimum purchase requirement when present', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('Min. purchase: $50')).toBeInTheDocument()
    })
  })

  describe('Selection Interaction', () => {
    it('calls onSelectionChange when a coupon is selected', async () => {
      const user = userEvent.setup()
      
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      const couponCard = screen.getByText('Summer Sale').closest('div')
      await user.click(couponCard!)

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['c1'])
    })

    it('calls onSelectionChange when a coupon is deselected', async () => {
      const user = userEvent.setup()
      
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      const couponCard = screen.getByText('Summer Sale').closest('div')
      await user.click(couponCard!)

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['c2'])
    })

    it('allows selecting up to 5 coupons', async () => {
      const user = userEvent.setup()
      
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      // Select 5 coupons
      for (let i = 0; i < 5; i++) {
        const couponCard = screen.getByText(mockCoupons[i].title).closest('div')
        await user.click(couponCard!)
      }

      expect(mockOnSelectionChange).toHaveBeenCalledTimes(5)
    })

    it('prevents selecting more than 5 coupons', async () => {
      const user = userEvent.setup()
      
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      // Try to select 6th coupon
      const sixthCoupon = screen.getByText('Extra Coupon').closest('div')
      await user.click(sixthCoupon!)

      // Should not call onSelectionChange because limit is reached
      expect(mockOnSelectionChange).not.toHaveBeenCalled()
    })

    it('shows checkmark icon on selected coupons', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      const selectedCoupon = screen.getByText('Summer Sale').closest('div')
      const checkmark = selectedCoupon?.querySelector('svg')
      
      expect(checkmark).toBeInTheDocument()
    })
  })

  describe('Confirm Button', () => {
    it('disables confirm button when less than 5 coupons selected', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /select \d+ more coupon/i })
      expect(confirmButton).toBeDisabled()
    })

    it('enables confirm button when exactly 5 coupons selected', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /start game/i })
      expect(confirmButton).not.toBeDisabled()
    })

    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /start game/i })
      await user.click(confirmButton)

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('shows correct message when 1 more coupon needed', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2', 'c3', 'c4']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('Select 1 more coupon')).toBeInTheDocument()
    })

    it('shows correct message when multiple coupons needed', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      expect(screen.getByText('Select 3 more coupons')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('disables all interactions when disabled prop is true', async () => {
      const user = userEvent.setup()
      
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
          disabled={true}
        />
      )

      const couponCard = screen.getByText('Summer Sale').closest('div')
      await user.click(couponCard!)

      expect(mockOnSelectionChange).not.toHaveBeenCalled()
    })

    it('disables confirm button when disabled prop is true', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1', 'c2', 'c3', 'c4', 'c5']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
          disabled={true}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /start game/i })
      expect(confirmButton).toBeDisabled()
    })
  })

  describe('Visual Feedback', () => {
    it('applies selected styling to selected coupons', () => {
      render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={['c1']}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      const selectedCoupon = screen.getByText('Summer Sale').closest('div')
      expect(selectedCoupon).toHaveClass('border-green-500')
      expect(selectedCoupon).toHaveClass('bg-green-50')
    })

    it('applies different colors for different coupon types', () => {
      const { container } = render(
        <CouponPicker
          coupons={mockCoupons}
          selectedCoupons={[]}
          onSelectionChange={mockOnSelectionChange}
          onConfirm={mockOnConfirm}
        />
      )

      // Check that different badge colors exist
      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument() // percentage
      expect(container.querySelector('.bg-green-100')).toBeInTheDocument() // fixed
      expect(container.querySelector('.bg-purple-100')).toBeInTheDocument() // shipping
      expect(container.querySelector('.bg-orange-100')).toBeInTheDocument() // bogo
    })
  })
})