---
description: How to test responsiveness and mobile views
---

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open the browser and navigate to the local URL (e.g., http://localhost:8080).

3. Open Developer Tools (F12).

4. Toggle the Device Toolbar (Ctrl+Shift+M).

5. Select a mobile device (e.g., iPhone 12 Pro) or set a responsive width < 768px.

6. **IMPORTANT**: Refresh the page (F5) after resizing to ensure all mobile-specific hooks and components are initialized correctly. Some hooks like `useIsMobile` might depend on the initial window size.

7. Verify that the Mobile Bottom Navigation appears at the bottom of the screen.

8. Click the "Menu" button in the bottom navigation to open the Mobile Sidebar.
