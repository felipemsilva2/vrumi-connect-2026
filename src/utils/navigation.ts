import { useLocation } from 'react-router-dom';

/**
 * Returns the appropriate home route based on current location context
 * UX Best Practice: When in dashboard context, logo should go to dashboard home
 * When in external/public context, logo should go to marketing homepage
 */
export const useContextualHomeRoute = (): string => {
  const location = useLocation();
  const isDashboardContext = location.pathname.startsWith('/painel') ||
    location.pathname.startsWith('/sala-de-estudos') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/biblioteca-de-placas');

  return isDashboardContext ? '/painel' : '/';
};

/**
 * Navigation utility that handles contextual redirects
 * Use this for logo clicks and home button navigation
 */
export const useContextualNavigation = () => {
  const homeRoute = useContextualHomeRoute();
  return homeRoute;
};