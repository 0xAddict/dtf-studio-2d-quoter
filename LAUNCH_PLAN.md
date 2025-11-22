# Hexea 3D Viewer - Launch Implementation Plan

**Target Deployment**: bolt.new
**Branch**: `claude/prepare-for-launch-01T3AYohf2EepRajsU1MKEH9`
**Last Updated**: 2025-11-22

---

## 🎯 Overview

This plan prepares the Hexea 3D Viewer for production deployment on bolt.new. Tasks are organized by priority and include bolt.new-specific optimizations.

**Total Estimated Effort**: ~80-100 hours (2-2.5 weeks)

---

## Phase 1: Critical Foundation (Week 1, Days 1-3)

### 1.1 Environment Configuration ⏱️ 2-3 hours
**Priority**: 🚨 Critical | **Status**: ⬜ Not Started

- [ ] Create production `.env` configuration
  - [ ] Add Supabase URL and anon key
  - [ ] Configure API base URLs for production
  - [ ] Add Web3Forms key for contact forms
  - [ ] Document all required environment variables
- [ ] Update `.env.example` with all required variables
- [ ] Add environment validation on app startup
- [ ] Create `env.validation.ts` utility to check required vars
- [ ] Document bolt.new environment variable setup in README

**Files to modify**:
- `.env`
- `.env.example`
- Create: `src/utils/env.validation.ts`
- `README.md`

**Deliverable**: Fully configured environment ready for bolt.new deployment

---

### 1.2 Security Hardening ⏱️ 6-8 hours
**Priority**: 🚨 Critical | **Status**: ⬜ Not Started

#### 1.2.1 Token Security
- [ ] Replace localStorage token storage with secure alternative
  - [ ] Implement httpOnly cookie support (if bolt.new supports)
  - [ ] Add token expiration checking
  - [ ] Implement automatic token refresh
- [ ] Add HTTPS-only enforcement in production
- [ ] Implement secure token transmission

#### 1.2.2 Security Headers
- [ ] Add Content Security Policy (CSP)
  ```typescript
  // Add to index.html or vite config
  {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://your-api.com https://*.supabase.co"
  }
  ```
- [ ] Configure security headers in `vite.config.ts`
- [ ] Add X-Frame-Options: DENY
- [ ] Add X-Content-Type-Options: nosniff
- [ ] Add Referrer-Policy: strict-origin-when-cross-origin

#### 1.2.3 Input Validation & Sanitization
- [ ] Add file upload validation (type, size, extension)
- [ ] Implement file size limits (max 50MB for 3D models)
- [ ] Add allowlist for file extensions (.stl, .obj, .fbx, .gltf, .glb)
- [ ] Sanitize user inputs in quote form
- [ ] Add rate limiting for API requests (client-side throttling)

#### 1.2.4 CORS Configuration
- [ ] Configure CORS for production API endpoints
- [ ] Update API client with production CORS headers
- [ ] Test cross-origin requests

**Files to modify**:
- `services/api/client.ts`
- `vite.config.ts`
- `index.html`
- Create: `src/utils/security.ts`
- Create: `src/utils/fileValidation.ts`

**Deliverable**: Hardened security posture suitable for production

---

### 1.3 Error Handling & User Feedback ⏱️ 8-10 hours
**Priority**: 🚨 Critical | **Status**: ⬜ Not Started

#### 1.3.1 Global Error Handling
- [ ] Create React Error Boundary component
- [ ] Wrap App with ErrorBoundary
- [ ] Add fallback UI for errors
- [ ] Implement error recovery mechanisms

#### 1.3.2 API Error Handling
- [ ] Enhance API client error handling
- [ ] Add user-friendly error messages
- [ ] Implement retry logic for network failures
- [ ] Add timeout handling (30s max)
- [ ] Create error message mapping utility

#### 1.3.3 Loading & Success States
- [ ] Add loading skeletons for model viewer
- [ ] Add upload progress indicators
- [ ] Add success toast notifications
- [ ] Add error toast notifications
- [ ] Implement loading states for all async operations

#### 1.3.4 3D Model Loading Errors
- [ ] Add try-catch around model loading
- [ ] Display user-friendly error for unsupported formats
- [ ] Add fallback for corrupted files
- [ ] Show loading progress for large models

**Files to create**:
- `src/components/ErrorBoundary.tsx`
- `src/components/Toast.tsx`
- `src/components/LoadingSkeleton.tsx`
- `src/utils/errorMessages.ts`

**Files to modify**:
- `src/App.tsx`
- `src/components/ModelViewer.tsx`
- `services/api/client.ts`

**Deliverable**: Comprehensive error handling with great UX

---

## Phase 2: Production Optimization (Week 1, Days 4-5)

### 2.1 Code Cleanup ⏱️ 3-4 hours
**Priority**: 🔥 High | **Status**: ⬜ Not Started

- [ ] Remove all `console.log` debug statements
- [ ] Remove commented-out code
- [ ] Convert debug logs to production logger
- [ ] Create centralized logging utility
- [ ] Add production vs development log levels
- [ ] Clean up ModelViewer.tsx debug code (lines 92-128)

**Files to create**:
- `src/utils/logger.ts`

**Files to modify**:
- `src/components/ModelViewer.tsx`
- All components with console.log

**Deliverable**: Clean production code without debug artifacts

---

### 2.2 Performance Optimization ⏱️ 6-8 hours
**Priority**: 🔥 High | **Status**: ⬜ Not Started

#### 2.2.1 Code Splitting
- [ ] Implement route-based code splitting
- [ ] Lazy load ModelViewer component
- [ ] Lazy load QuoteRequestModal
- [ ] Configure Vite for optimal chunking

#### 2.2.2 Asset Optimization
- [ ] Optimize public/hexea.png (currently 154KB)
- [ ] Add image compression
- [ ] Configure Three.js tree-shaking
- [ ] Optimize Tailwind CSS (remove CDN, use built version)

#### 2.2.3 Bundle Optimization
- [ ] Add bundle analyzer
- [ ] Minimize Three.js bundle size
- [ ] Enable gzip/brotli compression in Vite
- [ ] Configure production sourcemaps (hidden)

#### 2.2.4 Runtime Optimization
- [ ] Add React.memo for expensive components
- [ ] Implement useMemo for calculations
- [ ] Add useCallback for event handlers
- [ ] Optimize re-renders in ModelViewer

**Files to modify**:
- `vite.config.ts`
- `src/components/ModelViewer.tsx`
- `src/components/QuoteRequestModal.tsx`
- `tailwind.config.js`

**Configuration to add**:
```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'vendor': ['react', 'react-dom']
        }
      }
    },
    minify: 'terser',
    sourcemap: 'hidden'
  }
}
```

**Deliverable**: Optimized bundle size (<500KB initial load)

---

### 2.3 Type Safety Improvements ⏱️ 4-5 hours
**Priority**: 🔥 High | **Status**: ⬜ Not Started

- [ ] Enable strict TypeScript in `tsconfig.json`
  - [ ] Set `noImplicitAny: true`
  - [ ] Set `strictNullChecks: true`
  - [ ] Set `strictFunctionTypes: true`
- [ ] Remove all `any` types (24 instances found)
- [ ] Add proper error response types
- [ ] Create type guards for runtime validation
- [ ] Fix all TypeScript errors that arise

**Files to modify**:
- `tsconfig.json`
- `services/api/client.ts`
- `src/components/ModelViewer.tsx`
- All files with type safety issues

**Deliverable**: Strict TypeScript with zero `any` types

---

## Phase 3: Testing Foundation (Week 2, Days 1-3)

### 3.1 Testing Infrastructure ⏱️ 2-3 hours
**Priority**: 🔥 High | **Status**: ⬜ Not Started

- [ ] Install testing dependencies
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
  ```
- [ ] Configure Vitest in `vite.config.ts`
- [ ] Create test setup file
- [ ] Add test scripts to `package.json`
- [ ] Configure coverage reporting

**Files to create**:
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/test/utils.tsx` (test utilities)

**Deliverable**: Fully configured testing environment

---

### 3.2 Critical Path Tests ⏱️ 12-15 hours
**Priority**: 🔥 High | **Status**: ⬜ Not Started

#### 3.2.1 API Client Tests (Priority 1)
- [ ] Test API request/response handling
- [ ] Test token storage and retrieval
- [ ] Test error handling
- [ ] Test authentication flow
- [ ] Test file upload endpoints
- [ ] Mock fetch responses

**Target**: 90% coverage on `services/api/client.ts`

#### 3.2.2 Component Tests (Priority 2)
- [ ] Test ModelViewer rendering
- [ ] Test file upload interactions
- [ ] Test camera controls
- [ ] Test theme switching
- [ ] Test QuoteRequestModal form validation
- [ ] Test sidebar interactions

**Target**: 60% coverage on components

#### 3.2.3 Integration Tests (Priority 3)
- [ ] Test full upload-to-view flow
- [ ] Test quote request submission
- [ ] Test authentication flow
- [ ] Test error scenarios

**Files to create**:
- `services/api/client.test.ts`
- `src/components/ModelViewer.test.tsx`
- `src/components/QuoteRequestModal.test.tsx`
- `src/contexts/ThemeContext.test.tsx`
- `src/test/integration/upload-flow.test.tsx`

**Deliverable**: 40-60% overall code coverage with critical paths tested

---

## Phase 4: Documentation & Polish (Week 2, Days 4-5)

### 4.1 Deployment Documentation ⏱️ 3-4 hours
**Priority**: 🔥 High | **Status**: ⬜ Not Started

- [ ] Create comprehensive README.md
  - [ ] Project overview and features
  - [ ] Prerequisites
  - [ ] Local development setup
  - [ ] Environment variable configuration
  - [ ] bolt.new deployment instructions
  - [ ] Troubleshooting guide
- [ ] Create DEPLOYMENT.md
  - [ ] Step-by-step bolt.new deployment
  - [ ] Environment variable setup in bolt.new
  - [ ] Production build verification
  - [ ] Rollback procedures
- [ ] Document API integration
- [ ] Add inline code documentation

**Files to modify/create**:
- `README.md` (expand from 21 lines)
- Create: `DEPLOYMENT.md`
- Create: `TROUBLESHOOTING.md`

**Deliverable**: Complete deployment documentation

---

### 4.2 User Documentation ⏱️ 2-3 hours
**Priority**: ⚠️ Medium | **Status**: ⬜ Not Started

- [ ] Create USER_GUIDE.md
  - [ ] How to upload models
  - [ ] How to use viewer controls
  - [ ] Keyboard shortcuts reference
  - [ ] How to request quotes
  - [ ] Supported file formats
  - [ ] File size limits
  - [ ] Troubleshooting common issues
- [ ] Add in-app help tooltips
- [ ] Create FAQ section

**Files to create**:
- `USER_GUIDE.md`
- `FAQ.md`

**Deliverable**: User-friendly documentation

---

### 4.3 Repository Essentials ⏱️ 2-3 hours
**Priority**: ⚠️ Medium | **Status**: ⬜ Not Started

- [ ] Create LICENSE file (choose license)
- [ ] Create CONTRIBUTING.md
- [ ] Create CODE_OF_CONDUCT.md
- [ ] Create SECURITY.md
  - [ ] Security reporting process
  - [ ] Supported versions
  - [ ] Security best practices
- [ ] Create CHANGELOG.md
- [ ] Add PR template
- [ ] Add issue templates

**Files to create**:
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`

**Deliverable**: Professional open-source repository

---

### 4.4 Code Quality Tools ⏱️ 3-4 hours
**Priority**: ⚠️ Medium | **Status**: ⬜ Not Started

- [ ] Install and configure ESLint
  ```bash
  npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  ```
- [ ] Install and configure Prettier
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
- [ ] Create `.eslintrc.json`
- [ ] Create `.prettierrc`
- [ ] Add pre-commit hooks with Husky
  ```bash
  npm install -D husky lint-staged
  ```
- [ ] Configure lint-staged
- [ ] Add format/lint scripts to package.json
- [ ] Fix all linting errors

**Files to create**:
- `.eslintrc.json`
- `.prettierrc`
- `.husky/pre-commit`
- `.lintstagedrc.json`

**Deliverable**: Automated code quality enforcement

---

## Phase 5: Monitoring & Launch Prep (Final 2-3 days)

### 5.1 Error Tracking ⏱️ 2-3 hours
**Priority**: 🔥 High | **Status**: ⬜ Not Started

- [ ] Choose error tracking service (Sentry recommended for bolt.new)
- [ ] Create Sentry account
- [ ] Install Sentry SDK
  ```bash
  npm install @sentry/react @sentry/tracing
  ```
- [ ] Configure Sentry in app
- [ ] Add source map upload
- [ ] Test error reporting
- [ ] Set up alert notifications
- [ ] Configure error sampling for production

**Files to modify**:
- `src/main.tsx`
- `vite.config.ts`
- `.env.example` (add VITE_SENTRY_DSN)

**Configuration**:
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

**Deliverable**: Production error tracking configured

---

### 5.2 Analytics (Optional) ⏱️ 1-2 hours
**Priority**: ⚠️ Low | **Status**: ⬜ Not Started

- [ ] Choose analytics service (Plausible, Fathom, or Google Analytics)
- [ ] Install analytics SDK
- [ ] Configure privacy-friendly tracking
- [ ] Track key events:
  - [ ] Model uploads
  - [ ] Quote requests
  - [ ] Viewer interactions
  - [ ] Theme changes
- [ ] Add analytics to environment variables

**Deliverable**: Basic usage analytics

---

### 5.3 Final Pre-Launch Checklist ⏱️ 3-4 hours
**Priority**: 🚨 Critical | **Status**: ⬜ Not Started

#### Build & Deploy
- [ ] Run production build successfully
  ```bash
  npm run build
  ```
- [ ] Verify build size (<2MB total)
- [ ] Test production build locally
  ```bash
  npm run preview
  ```
- [ ] Verify all environment variables are documented
- [ ] Test with real Supabase credentials

#### Testing
- [ ] Run all tests and ensure they pass
  ```bash
  npm test
  ```
- [ ] Run linting
  ```bash
  npm run lint
  ```
- [ ] Run type checking
  ```bash
  npm run type-check
  ```
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS Safari, Chrome Mobile)
- [ ] Test with slow 3G network throttling
- [ ] Test offline behavior

#### Security
- [ ] Run security audit
  ```bash
  npm audit
  ```
- [ ] Fix all high/critical vulnerabilities
- [ ] Verify HTTPS is enforced
- [ ] Verify security headers are present
- [ ] Test file upload restrictions
- [ ] Verify token security

#### Functionality
- [ ] Test model upload with all supported formats (.stl, .obj, .fbx, .gltf, .glb)
- [ ] Test quote request submission
- [ ] Test dark/light theme switching
- [ ] Test keyboard shortcuts (R, M, P, W, ESC)
- [ ] Test accessibility with screen reader
- [ ] Test camera controls (orbit, pan, zoom)
- [ ] Test on various screen sizes

#### Performance
- [ ] Run Lighthouse audit (target: 90+ performance)
- [ ] Check Core Web Vitals
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Verify bundle size optimization
- [ ] Test with large 3D models (>10MB)

#### Documentation
- [ ] Review all documentation for accuracy
- [ ] Verify deployment instructions work
- [ ] Check all links in documentation
- [ ] Ensure environment variable documentation is complete

**Deliverable**: Production-ready application

---

### 5.4 bolt.new Deployment ⏱️ 2-3 hours
**Priority**: 🚨 Critical | **Status**: ⬜ Not Started

- [ ] Prepare deployment configuration
- [ ] Set up environment variables in bolt.new dashboard
- [ ] Deploy to bolt.new staging environment
- [ ] Test deployed application thoroughly
- [ ] Configure custom domain (if applicable)
- [ ] Set up SSL certificate
- [ ] Deploy to production
- [ ] Monitor for errors in first 24 hours
- [ ] Set up uptime monitoring

**Deployment Steps**:
1. Push final code to GitHub
2. Connect bolt.new to GitHub repository
3. Configure build settings (npm run build)
4. Add all environment variables
5. Deploy and test
6. Monitor Sentry for errors

**Deliverable**: Live production application on bolt.new

---

## Post-Launch (Ongoing)

### Week 1 Post-Launch
- [ ] Monitor error rates in Sentry
- [ ] Check analytics for usage patterns
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Monitor performance metrics
- [ ] Check server logs

### Week 2-4 Post-Launch
- [ ] Address user-reported issues
- [ ] Implement feedback improvements
- [ ] Optimize based on real usage data
- [ ] Increase test coverage to 80%+
- [ ] Add E2E tests with Playwright/Cypress
- [ ] Performance optimization based on real data

---

## Success Criteria

### Pre-Launch
- ✅ All Critical and High priority tasks complete
- ✅ Test coverage >40%
- ✅ Lighthouse score >90
- ✅ Zero high/critical security vulnerabilities
- ✅ All environment variables configured
- ✅ Production build successful
- ✅ Error tracking configured
- ✅ Documentation complete

### Post-Launch (Week 1)
- ✅ <1% error rate
- ✅ <3s average page load time
- ✅ Positive user feedback
- ✅ No critical bugs
- ✅ 99%+ uptime

---

## Risk Management

### High-Risk Areas
1. **3D Model Loading** - Large file performance issues
   - Mitigation: Implement progressive loading, file size limits
2. **Mobile Performance** - WebGL on mobile devices
   - Mitigation: Test on real devices, implement quality settings
3. **Security** - Token storage and API security
   - Mitigation: Implement all security measures in Phase 1.2
4. **bolt.new Limitations** - Platform-specific constraints
   - Mitigation: Review bolt.new documentation, test early

### Contingency Plans
- **If tests don't pass**: Fix failures before deployment
- **If build size too large**: Implement aggressive code splitting
- **If security issues found**: Delay launch until resolved
- **If bolt.new deployment fails**: Investigate error logs, contact support

---

## Notes

- This plan is optimized for bolt.new deployment (no Docker/CI needed)
- bolt.new handles build and deployment automatically
- Focus on frontend optimization and error handling
- Sentry is recommended for bolt.new compatibility
- All times are estimates for one developer

---

## Next Steps

1. Review this plan with team
2. Prioritize tasks based on resources
3. Begin with Phase 1: Critical Foundation
4. Track progress by checking off completed items
5. Update this document as plan evolves

**Ready to begin implementation!** 🚀
