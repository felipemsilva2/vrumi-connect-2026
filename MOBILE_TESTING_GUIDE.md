# Mobile Testing Guide - Habilita PWA

## 🧪 Testing Checklist

### Desktop Testing (Chrome DevTools)

#### 1. **Responsive Design Mode**
```
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test these viewports:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPhone 14 Pro Max (430x932)
   - Pixel 5 (393x851)
   - Samsung Galaxy S20 Ultra (412x915)
   - iPad Air (820x1180)
   - iPad Pro (1024x1366)
```

#### 2. **PWA Audit (Lighthouse)**
```
1. Open DevTools > Lighthouse tab
2. Select "Progressive Web App" category
3. Click "Analyze page load"
4. Aim for score > 90
```

**Expected Results:**
- ✅ Installable
- ✅ PWA optimized
- ✅ Works offline
- ✅ Fast and reliable
- ✅ Configured for a custom splash screen

#### 3. **Service Worker Check**
```
1. DevTools > Application tab
2. Service Workers section
3. Verify:
   - Status: Activated and running
   - Source: /sw.js or similar
   - Update on reload: Optional
```

#### 4. **Manifest Check**
```
1. DevTools > Application tab
2. Manifest section
3. Verify:
   - Name: "Habilita - Preparação para CNH"
   - Short name: "Habilita"
   - Start URL: "/"
   - Theme color: #10b981
   - Display: standalone
   - Icons: Multiple sizes present
```

#### 5. **Cache Storage**
```
1. DevTools > Application tab
2. Cache Storage section
3. After first load, verify cached resources:
   - HTML files
   - CSS files
   - JavaScript bundles
   - Images
   - Fonts
```

### Mobile Testing (Real Devices)

#### Android Testing (Chrome)

**Installation Test:**
1. Open app in Chrome mobile
2. Wait for install prompt (bottom of screen)
3. Tap "Instalar App"
4. Verify app appears on home screen
5. Open from home screen
6. Verify standalone mode (no browser UI)

**Offline Test:**
1. Install the app
2. Enable Airplane mode
3. Open app from home screen
4. Verify previously visited pages load
5. Check cached images display correctly

**Touch Targets:**
1. All buttons should be easy to tap (44px minimum)
2. No accidental taps on nearby elements
3. Smooth scrolling and interactions

**Safe Areas (Notched Devices):**
1. Content should not be hidden by notch
2. Bottom navigation should respect home indicator
3. Sidebar should respect safe areas

#### iOS Testing (Safari)

**Installation Test:**
1. Open app in Safari
2. Look for install prompt or follow manual instructions
3. Tap Share button (square with arrow)
4. Scroll down, tap "Add to Home Screen"
5. Tap "Add" in top right
6. Verify app appears on home screen
7. Open from home screen
8. Verify standalone mode

**Status Bar:**
1. Check status bar style (should be black-translucent)
2. Verify it blends well with app header
3. No content hidden behind status bar

**Safe Areas:**
1. Test on iPhone X or newer
2. Verify content respects notch
3. Check bottom safe area (home indicator)
4. Landscape mode safe areas

**Offline Test:**
1. Install the app
2. Enable Airplane mode
3. Open app from home screen
4. Verify basic functionality works

### Feature Testing

#### 1. **Install Prompt**
- [ ] Appears after 3 seconds on first visit
- [ ] Shows platform-specific instructions
- [ ] Can be dismissed
- [ ] Doesn't reappear after dismissal
- [ ] Beautiful, animated UI
- [ ] Responsive on all screen sizes

#### 2. **Navigation**
- [ ] Sidebar opens smoothly
- [ ] All menu items clickable (44px minimum)
- [ ] Active state clearly visible
- [ ] Closes when clicking outside
- [ ] Smooth animations

#### 3. **Responsiveness**
- [ ] Layout adapts to screen size
- [ ] Text readable on small screens
- [ ] Images scale properly
- [ ] No horizontal scrolling
- [ ] Touch targets adequate size

#### 4. **Performance**
- [ ] Fast initial load (< 3s)
- [ ] Smooth scrolling
- [ ] No layout shifts
- [ ] Animations run at 60fps
- [ ] Images load progressively

#### 5. **Offline Functionality**
- [ ] Previously visited pages load
- [ ] Cached images display
- [ ] Fonts load from cache
- [ ] Graceful degradation for uncached content

## 🔧 Testing Tools

### Chrome DevTools Device Emulation
```
1. F12 to open DevTools
2. Ctrl+Shift+M for device toolbar
3. Select device or custom dimensions
4. Test touch events
5. Throttle network (Slow 3G, Offline)
```

### Lighthouse CLI
```bash
npm install -g lighthouse
lighthouse https://your-app-url --view
```

### Testing on Local Network

**1. Find your local IP:**
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**2. Access from mobile:**
```
http://192.168.1.100:8080
```

**Note:** Both devices must be on same network

### BrowserStack / LambdaTest
For comprehensive cross-device testing:
- Real device testing
- Multiple OS versions
- Screenshot comparison
- Automated testing

## 📊 Performance Benchmarks

### Target Metrics
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.8s
- **Cumulative Layout Shift (CLS):** < 0.1
- **First Input Delay (FID):** < 100ms

### How to Measure
1. DevTools > Lighthouse
2. Run performance audit
3. Check Core Web Vitals
4. Optimize based on suggestions

## 🐛 Common Issues & Solutions

### Issue: Install prompt not showing
**Solutions:**
- Ensure HTTPS (required for PWA)
- Check service worker is registered
- Verify manifest.json is valid
- Clear browser cache and try again
- Check browser console for errors

### Issue: App not working offline
**Solutions:**
- Verify service worker is active
- Check cache storage in DevTools
- Ensure pages were visited while online
- Check workbox configuration

### Issue: Icons not displaying
**Solutions:**
- Verify icon paths in manifest.json
- Check icons exist in public folder
- Clear cache and reload
- Verify icon sizes are correct

### Issue: Safe areas not working
**Solutions:**
- Check viewport meta tag includes viewport-fit=cover
- Verify CSS uses env(safe-area-inset-*)
- Test on actual device with notch
- Check iOS version (requires iOS 11+)

### Issue: Touch targets too small
**Solutions:**
- Ensure minimum 44x44px size
- Add padding to clickable elements
- Test on actual device
- Use Chrome DevTools touch emulation

## ✅ Pre-Deployment Checklist

- [ ] All Lighthouse audits pass (score > 90)
- [ ] Service worker registered and active
- [ ] Manifest.json valid and complete
- [ ] Icons in all required sizes
- [ ] HTTPS enabled
- [ ] Tested on real Android device
- [ ] Tested on real iOS device
- [ ] Offline functionality works
- [ ] Install prompt appears correctly
- [ ] Safe areas respected on notched devices
- [ ] All touch targets minimum 44px
- [ ] No console errors
- [ ] Performance metrics meet targets

## 📱 Test Scenarios

### Scenario 1: First-Time User (Android)
1. User opens app in Chrome
2. Install prompt appears
3. User taps "Install"
4. App added to home screen
5. User opens from home screen
6. App loads in standalone mode
7. User navigates through features
8. User closes and reopens app

### Scenario 2: First-Time User (iOS)
1. User opens app in Safari
2. Install prompt appears with instructions
3. User follows steps to add to home screen
4. App added to home screen
5. User opens from home screen
6. App loads in standalone mode
7. User navigates through features
8. User closes and reopens app

### Scenario 3: Offline Usage
1. User installs app
2. User browses several pages
3. User enables airplane mode
4. User opens app from home screen
5. Previously visited pages load
6. User can view cached content
7. User sees appropriate offline message for uncached content

### Scenario 4: Update Scenario
1. App is installed
2. New version deployed
3. Service worker detects update
4. User sees update notification (if implemented)
5. User refreshes or reopens app
6. New version loads
7. Old cache cleared

## 🎯 Success Criteria

Your PWA is ready for production when:
- ✅ Lighthouse PWA score > 90
- ✅ Works offline for core features
- ✅ Installs successfully on Android
- ✅ Installs successfully on iOS
- ✅ Respects safe areas on all devices
- ✅ All touch targets meet 44px minimum
- ✅ Performance metrics meet targets
- ✅ No console errors
- ✅ Smooth animations on mobile
- ✅ Tested on real devices

---

**Last Updated:** 2025-11-26
**Version:** 1.0.0
