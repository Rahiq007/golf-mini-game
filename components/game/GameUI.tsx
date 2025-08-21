import React from 'react';
import GameControls from './GameControls';
import CouponPicker from './CouponPicker';
import ResultModal from './ResultModal';
import TutorialOverlay from './TutorialOverlay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Coupon } from '@/app/api/mock/coupons/route';

interface GameUIProps {
  gameState: string;
  availableCoupons: Coupon[];
  selectedCoupons: string[];
  gameResult: string | null;
  awardedCoupon: any;
  showTutorial: boolean;
  isLoading: boolean;
  error: string | null;
  onSelectionChange: (selected: string[]) => void;
  onConfirm: () => void;
  onShoot: (angle: number, power: number) => void;
  onTutorialClose: () => void;
  onShowTutorial: () => void;
  onAddToWallet: (coupon: any) => void;
  onPlayAgain: () => void;
  onResultClose: () => void;
  onSetGameState: (state: string) => void;
  onSetError: (error: string | null) => void;
}

const GameUI: React.FC<GameUIProps> = ({
  gameState,
  availableCoupons,
  selectedCoupons,
  gameResult,
  awardedCoupon,
  showTutorial,
  isLoading,
  error,
  onSelectionChange,
  onConfirm,
  onShoot,
  onTutorialClose,
  onShowTutorial,
  onAddToWallet,
  onPlayAgain,
  onResultClose,
  onSetGameState,
  onSetError,
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Golf Mini-Game</h1>
        <p className="text-white/90 text-lg">One shot to win amazing coupons!</p>
        <div className="flex justify-center items-center gap-4 mt-4">
          <Badge variant="secondary" className="bg-white/20 text-white">
            {gameState === 'selecting' && 'Select Coupons'}
            {gameState === 'playing' && 'Ready to Play'}
            {gameState === 'animating' && 'Ball in Motion'}
            {gameState === 'result' && 'Game Complete'}
          </Badge>
          <Link href="/wallet">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              View Wallet
            </Button>
          </Link>
          <Button
            onClick={onShowTutorial}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Tutorial
          </Button>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 p-4 bg-red-50 border-red-200">
          <div className="text-red-600 text-center">{error}</div>
          <Button onClick={() => onSetError(null)} variant="ghost" size="sm" className="w-full mt-2">
            Dismiss
          </Button>
        </Card>
      )}

      {/* Game Content */}
      {gameState === 'selecting' && (
        <CouponPicker
          coupons={availableCoupons}
          selectedCoupons={selectedCoupons}
          onSelectionChange={onSelectionChange}
          onConfirm={onConfirm}
          disabled={isLoading}
        />
      )}

      {(gameState === 'playing' || gameState === 'animating') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Placeholder for GameCanvas */}
          <div className="lg:col-span-2 h-96 lg:h-[500px] bg-gray-200 rounded-lg">
            {/* GameCanvas will be rendered here */}
          </div>

          {/* Game Controls */}
          <div className="space-y-4">
            <GameControls onShoot={onShoot} disabled={gameState === 'animating' || isLoading} />

            {/* Session Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Selected Coupons</h3>
              <div className="space-y-1">
                {selectedCoupons.map((couponId) => {
                  const coupon = availableCoupons.find((c) => c.id === couponId);
                  return (
                    <div key={couponId} className="text-sm text-gray-600">
                      {coupon?.title || couponId}
                    </div>
                  );
                })}
              </div>
              <Button
                onClick={() => onSetGameState('selecting')}
                variant="outline"
                size="sm"
                className="w-full mt-3"
                disabled={gameState === 'animating'}
              >
                Change Selection
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay isOpen={showTutorial} onClose={onTutorialClose} onSkip={onTutorialClose} />

      {/* Result Modal */}
      <ResultModal
        isOpen={gameState === 'result'}
        result={gameResult || 'lose'}
        awardedCoupon={awardedCoupon || undefined}
        onClose={onResultClose}
        onAddToWallet={onAddToWallet}
        onPlayAgain={onPlayAgain}
      />
    </div>
  );
};

export default GameUI;

