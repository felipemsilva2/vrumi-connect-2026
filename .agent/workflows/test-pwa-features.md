---
description: Test PWA specific features and fixes
---

# Test PWA Features & Fixes

Follow these steps to verify the recent PWA responsiveness fixes:

## 1. Bottom Navigation Bar
1. Open the app on a mobile device or Chrome DevTools (iPhone 12/14).
2. **Verify Fixation**: Scroll the page up and down. The bottom menu MUST remain fixed at the bottom.
3. **Verify Safe Area**: Check if there is extra padding at the bottom of the menu (for the home indicator on iOS).
4. **Verify Content**: Ensure the last item in the list is not hidden behind the menu.
5. **Verify Z-Index**: Ensure the menu stays ON TOP of all other content.

## 2. Text & Button Overflow
1. Navigate to "Estatísticas" or any card-heavy view.
2. **Check Buttons**: Look for buttons with long text. Verify that text is truncated (`...`) and does not overflow the button container.
3. **Check Labels**: Verify that bottom menu labels are truncated if too long.
4. **Check Cards**: Ensure no text spills out of cards.

## 3. Viewport & Layout
1. **No Horizontal Scroll**: Ensure the page does NOT scroll horizontally.
2. **Card Containment**: Verify that all cards respect the screen width and have `box-sizing: border-box`.
3. **Hidden Overflow**: Check that `overflow-hidden` is working on cards by looking for clipped content at the corners.

## 4. Virtual Keyboard
1. Click on an input field (e.g., Search or Profile edit).
2. **Verify Menu**: The bottom menu should either hide or stay fixed depending on the desired behavior (usually hides or stays above keyboard).
3. **Verify Viewport**: Ensure the viewport resizes correctly and content is accessible.

## 5. Orientation Change
1. Rotate the device to Landscape.
2. **Verify Layout**: Check if the grid adapts (e.g., 1 column to 2 columns).
3. **Verify Safe Areas**: Check left/right safe areas (notch).

## 6. Touch Targets
1. **Size**: Ensure all tap targets are at least 44x44px.
2. **Spacing**: Ensure there is enough space between interactive elements.

## Success Criteria
- [ ] Bottom menu is rock solid and respects safe areas.
- [ ] No text overflows buttons or cards.
- [ ] No horizontal scrolling.
- [ ] Layout adapts gracefully to all mobile screen sizes (including `xs` < 480px).
