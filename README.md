# Golf Mini-Game - Production-Ready Demo

A polished, mobile-first golf mini-game built with Next.js and Babylon.js where users can win coupons with a single perfect shot. Features deterministic physics simulation, 3D visualization, and a complete coupon management system.

## 🎯 Features

- **One-Shot Golf Game**: Simple drag-to-aim controls for mobile and desktop
- **3D Visualization**: Realistic golf course with Babylon.js rendering
- **Deterministic Physics**: Cross-platform consistent ball physics simulation
- **Coupon System**: Win and manage coupons with local wallet storage
- **Mock Backend**: Production-ready API structure for easy NestJS migration
- **Responsive Design**: Mobile-first with touch controls and keyboard accessibility
- **Testing Suite**: Comprehensive unit, integration, and E2E tests

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Modern browser with WebGL support

### Installation

\`\`\`bash
# Clone and install dependencies
git clone <repository-url>
cd golf-mini-game
npm install

# Start development server
npm run dev

# Open http://localhost:3000/play-golf
\`\`\`

### Testing

\`\`\`bash
# Run unit and integration tests
npm test

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
\`\`\`

## 🎮 How to Play

1. **Select Coupons**: Choose exactly 5 coupons from the available collection
2. **Aim Your Shot**: Use drag controls or sliders to set angle and power
3. **Take the Shot**: Click "Take Shot" to launch the ball
4. **Win Prizes**: Land in the hole to win one of your selected coupons
5. **Manage Wallet**: View and use your won coupons in the wallet

### Controls

- **Desktop**: Click and drag to aim, scroll to zoom camera, arrow keys for fine control
- **Mobile**: Touch and drag to aim, pinch to zoom
- **Keyboard**: Arrow keys (angle/power), Space/Enter (shoot)

## 🏗️ Architecture

### Core Components

\`\`\`
├── lib/physics/          # Deterministic physics engine
│   ├── simulator.ts      # Main physics simulation
│   ├── rng.ts           # Seeded random number generator
│   └── utils.ts         # Physics utilities and helpers
├── components/game/      # Game UI components
│   ├── GameCanvas.tsx   # Babylon.js 3D scene wrapper
│   ├── GameControls.tsx # Aim and power controls
│   └── ResultModal.tsx  # Win/lose result display
├── app/api/mock/        # Mock backend API routes
│   ├── session/         # Game session management
│   ├── play/           # Shot processing and verification
│   └── coupons/        # Coupon data endpoints
└── lib/wallet/          # Coupon wallet management
    └── walletManager.ts # Local storage wallet operations
\`\`\`

### Physics Engine

The deterministic physics engine ensures consistent results across platforms:

- **Fixed Timestep**: 120 FPS simulation with value rounding for determinism
- **Seeded RNG**: Mulberry32 algorithm for reproducible randomness
- **Realistic Physics**: Gravity, air resistance, friction, and wind effects
- **Cross-Platform**: Identical results on all devices and browsers

### Mock Backend

Production-ready API structure with:

- **Session Management**: Secure session creation with expiration
- **Anti-Fraud Protection**: Rate limiting, replay protection, input validation
- **Deterministic Verification**: Server re-runs physics simulation to verify results
- **Telemetry**: Event tracking and debugging capabilities

## 🔧 Configuration

### Physics Parameters

Adjust game difficulty and behavior in `lib/physics/simulator.ts`:

\`\`\`typescript
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  VMAX: 30,              // Maximum ball velocity (m/s)
  friction: 0.015,       // Grass friction coefficient
  holePosition: { x: 45, y: 0 }, // Hole location (meters)
  holeRadius: 0.054,     // Standard golf hole radius
  windMaxMagnitude: 3,   // Maximum wind effect (m/s)
  // ... more parameters
}
\`\`\`

### Environment Variables

\`\`\`bash
# Optional: Enable production analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Development: Custom redirect URL for auth flows
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

## 🧪 Testing Strategy

### Unit Tests (`__tests__/`)

- **Physics Engine**: Deterministic behavior, input validation, cross-platform consistency
- **Wallet Manager**: Coupon storage, statistics calculation, expiration handling
- **API Routes**: Session management, game processing, security validation

### Integration Tests

- **Mock API**: End-to-end API workflow testing
- **Physics Integration**: Client-server simulation consistency
- **Wallet Integration**: Local storage operations

### E2E Tests (`e2e/`)

- **Complete Game Flow**: Coupon selection → gameplay → wallet storage
- **Deterministic Winning Shot**: Reproducible win scenario testing
- **Mobile Responsiveness**: Touch controls and responsive design
- **Accessibility**: Keyboard navigation and screen reader support

### Running Tests

\`\`\`bash
# Unit tests with watch mode
npm run test:watch

# E2E tests with UI
npm run test:e2e:ui

# Coverage report
npm run test:coverage
\`\`\`

## 🚀 Production Migration

### NestJS Backend Migration

The mock API is designed for seamless NestJS migration:

1. **Keep Physics Module**: Copy `lib/physics/` unchanged to NestJS project
2. **Replace API Routes**: Implement identical endpoints with real database
3. **Add Authentication**: Integrate with your auth system
4. **Database Schema**: 

\`\`\`sql
-- Sessions table
CREATE TABLE game_sessions (
  id VARCHAR PRIMARY KEY,
  seed INTEGER NOT NULL,
  coupon_ids JSON NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Awarded coupons table  
CREATE TABLE awarded_coupons (
  id VARCHAR PRIMARY KEY,
  session_id VARCHAR REFERENCES game_sessions(id),
  coupon_id VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  awarded_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Deployment Checklist

- [ ] Replace mock API with production backend
- [ ] Set up real database (PostgreSQL recommended)
- [ ] Configure Redis for session management
- [ ] Add authentication and user management
- [ ] Set up monitoring and analytics
- [ ] Configure CDN for 3D assets
- [ ] Add rate limiting and DDoS protection
- [ ] Set up error tracking (Sentry recommended)

### Performance Optimization

- **3D Assets**: Use CDN for Babylon.js models and textures
- **Physics Caching**: Cache common trajectory calculations
- **Database**: Index session and coupon queries
- **Frontend**: Implement service worker for offline play

## 🔒 Security Considerations

### Current Mock Implementation

- Session-based game state management
- Input validation and sanitization  
- Rate limiting simulation
- Replay attack protection
- Deterministic server-side verification

### Production Security

- Implement proper authentication (JWT recommended)
- Add CSRF protection for API endpoints
- Use HTTPS everywhere
- Implement proper session management with Redis
- Add comprehensive logging and monitoring
- Regular security audits and dependency updates

## 📱 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **WebGL Required**: For 3D graphics rendering
- **Mobile**: iOS Safari 14+, Android Chrome 90+
- **Accessibility**: WCAG 2.1 AA compliant

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Maintain test coverage above 70%
- Use conventional commit messages
- Update documentation for new features
- Test on multiple browsers and devices

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Babylon.js** - 3D graphics engine
- **Next.js** - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Playwright** - E2E testing framework

---

**Built with ❤️ for the v0.dev community**

For questions or support, please open an issue or contact the development team.
