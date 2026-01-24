import { useLocation } from 'react-router-dom';

/**
 * Returns the appropriate home route based on current location context
 * UX Best Practice: When in admin or connect context, logo should go to respective home
 * When in external/public context, logo should go to marketing homepage
 */
export const useContextualHomeRoute = (): string => {
  const location = useLocation();
  const isConnectContext = location.pathname.startsWith('/connect');
  const isAdminContext = location.pathname.startsWith('/admin');

  if (isAdminContext) return '/admin/painel';
  if (isConnectContext) return '/connect';
  return '/';
};

/**
 * Navigation utility that handles contextual redirects
 * Use this for logo clicks and home button navigation
 */
export const useContextualNavigation = () => {
  const homeRoute = useContextualHomeRoute();
  return homeRoute;
};