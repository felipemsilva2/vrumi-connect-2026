---
description: Test PWA functionality and responsiveness
---

# Test PWA Implementation

Follow these steps to test the Progressive Web App implementation:

## 1. Verify Dev Server is Running
Check that the development server is running on http://localhost:8080

## 2. Open Application in Browser
// turbo
Open http://localhost:8080 in Chrome or Edge

## 3. Check Service Worker Registration
1. Open DevTools (F12)
2. Go to Application tab
3. Click on Service Workers
4. Verify service worker is "Activated and running"

## 4. Check Manifest
1. In DevTools Application tab
2. Click on Manifest
3. Verify all fields are populated:
   - Name: "Habilita - Preparação para CNH"
   - Short name: "Habilita"
   - Theme color: #10b981
   - Icons: Multiple sizes visible

## 5. Test Install Prompt
1. Wait 3 seconds after page load
2. Install prompt should appear at bottom of screen
3. Verify it shows platform-specific instructions
4. Test dismiss functionality
5. Reload page - prompt should not reappear

## 6. Test Responsive Design
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these viewports:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - Pixel 5 (393x851)
   - iPad Air (820x1180)
4. Verify layout adapts correctly
5. Check touch targets are adequate size

## 7. Test Mobile Sidebar
1. In mobile view, open the sidebar
2. Verify smooth animation
3. Check safe area insets (no content behind notch)
4. Test all navigation items
5. Verify close functionality

## 8. Run Lighthouse Audit
1. Open DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Click "Analyze page load"
5. Verify PWA score > 90

## 9. Test Offline Functionality
1. Browse several pages while online
2. Open DevTools > Network tab
3. Select "Offline" from throttling dropdown
4. Refresh the page
5. Verify page loads from cache
6. Navigate to previously visited pages
7. Verify they load correctly

## 10. Test on Mobile Device (Optional)
1. Find your local IP: `ipconfig`
2. On mobile device (same network), open: http://[YOUR-IP]:8080
3. Test install prompt
4. Install the app
5. Open from home screen
6. Verify standalone mode (no browser UI)

## Success Criteria
- ✅ Service worker active
- ✅ Manifest valid
- ✅ Install prompt appears and works
- ✅ Responsive on all viewports
- ✅ Lighthouse PWA score > 90
- ✅ Works offline for cached pages
- ✅ Safe areas respected
- ✅ Touch targets adequate size
