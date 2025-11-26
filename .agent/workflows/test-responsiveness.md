---
description: How to test responsiveness and mobile views
---

# Test Mobile Responsiveness

Follow these steps to thoroughly test mobile responsiveness:

## 1. Open Chrome DevTools
// turbo
Press F12 to open Chrome DevTools

## 2. Enable Device Toolbar
// turbo
Press Ctrl+Shift+M to toggle device toolbar

## 3. Test Small Phone (iPhone SE)
1. Select "iPhone SE" from device dropdown
2. Viewport: 375x667
3. Check:
   - Text is readable
   - Buttons are tappable (44px minimum)
   - No horizontal scrolling
   - Images scale properly
   - Navigation works smoothly

## 4. Test Medium Phone (iPhone 12 Pro)
1. Select "iPhone 12 Pro"
2. Viewport: 390x844
3. Verify:
   - Layout adapts correctly
   - Safe areas respected (notch)
   - Content not hidden
   - Sidebar animation smooth

## 5. Test Large Phone (iPhone 14 Pro Max)
1. Select "iPhone 14 Pro Max" or similar
2. Viewport: 430x932
3. Check:
   - Content uses available space
   - Not too stretched
   - Maintains good proportions

## 6. Test Android Phone (Pixel 5)
1. Select "Pixel 5"
2. Viewport: 393x851
3. Verify:
   - Material Design elements work
   - Touch targets adequate
   - Animations smooth

## 7. Test Tablet (iPad Air)
1. Select "iPad Air"
2. Viewport: 820x1180
3. Check both orientations:
   - Portrait: Content centered, good use of space
   - Landscape: Layout adapts, no wasted space

## 8. Test Large Tablet (iPad Pro)
1. Select "iPad Pro"
2. Viewport: 1024x1366
3. Verify:
   - Desktop-like layout on larger screens
   - Sidebar behavior appropriate
   - Content not too stretched

## 9. Test Landscape Orientation
1. For each device, rotate to landscape
2. Click the rotate icon in DevTools
3. Verify:
   - Layout adapts correctly
   - No content overflow
   - Navigation still accessible
   - Safe areas respected

## 10. Test Touch Interactions
1. Enable "Show touch events" in DevTools
2. Click the three dots > More tools > Sensors
3. Test:
   - Button taps
   - Swipe gestures
   - Scroll behavior
   - Sidebar open/close

## 11. Test with Network Throttling
1. Open Network tab
2. Select "Slow 3G" from throttling dropdown
3. Verify:
   - Page loads progressively
   - Loading states visible
   - No layout shifts
   - Images load with placeholders

## 12. Test Font Scaling
1. In DevTools, go to Settings (F1)
2. Under Appearance, adjust "Font size"
3. Test with larger fonts
4. Verify:
   - Text doesn't overflow
   - Layout adapts
   - Buttons still tappable

## Common Issues to Check

### Layout Issues
- [ ] No horizontal scrolling on any viewport
- [ ] Content fits within viewport
- [ ] Proper spacing on all screen sizes
- [ ] Images don't overflow

### Touch Targets
- [ ] All buttons minimum 44x44px
- [ ] Adequate spacing between tappable elements
- [ ] No accidental taps on nearby elements
- [ ] Easy to tap with thumb

### Typography
- [ ] Text readable on smallest viewport
- [ ] Line length appropriate (45-75 characters)
- [ ] Proper hierarchy maintained
- [ ] Font sizes scale appropriately

### Navigation
- [ ] Menu accessible on all viewports
- [ ] Sidebar opens/closes smoothly
- [ ] Active states clearly visible
- [ ] Back button works correctly

### Safe Areas
- [ ] Content not hidden by notch (iPhone X+)
- [ ] Bottom navigation respects home indicator
- [ ] Sidebar respects safe areas
- [ ] Status bar area handled correctly

## Success Criteria
- ✅ Works on all tested viewports
- ✅ No horizontal scrolling
- ✅ Touch targets adequate size
- ✅ Text readable on all screens
- ✅ Smooth animations
- ✅ Safe areas respected
- ✅ Layout adapts to orientation
- ✅ Progressive loading works
