import { useLocation, useParams } from "react-router-dom";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

const routeLabels: Record<string, string> = {
  "/": "Início",
  "/auth": "Autenticação",
  "/dashboard": "Dashboard",
  "/study-room": "Sala de Estudo",
  "/checkout": "Checkout",
  "/checkout/success": "Sucesso",
  "/checkout/cancel": "Cancelado",
  "/admin": "Admin",
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Usuários",
  "/admin/subscriptions": "Assinaturas",
  "/admin/roles": "Funções",
  "/admin/audit-logs": "Logs de Auditoria",
  "/admin/populate": "Popular Dados",
  "/admin/flashcards": "Flashcards",
  "/admin/questions": "Questões",
};

function capitalizeWords(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const params = useParams();

  return useMemo(() => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always add home as first breadcrumb
    breadcrumbs.push({
      label: routeLabels['/'] || 'Início',
      href: '/',
      isCurrent: pathnames.length === 0
    });

    let currentPath = '';

    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      const isLast = index === pathnames.length - 1;

      // Handle dynamic routes with IDs
      if (params.id && name === params.id) {
        breadcrumbs.push({
          label: `Detalhes`,
          href: currentPath,
          isCurrent: isLast
        });
      } else {
        // Handle admin routes
        if (currentPath.startsWith('/admin')) {
          const adminRoute = currentPath as keyof typeof routeLabels;
          breadcrumbs.push({
            label: routeLabels[adminRoute] || capitalizeWords(name),
            href: isLast ? undefined : currentPath,
            isCurrent: isLast
          });
        } else {
          // Handle regular routes
          const route = currentPath as keyof typeof routeLabels;
          breadcrumbs.push({
            label: routeLabels[route] || capitalizeWords(name),
            href: isLast ? undefined : currentPath,
            isCurrent: isLast
          });
        }
      }
    });

    return breadcrumbs;
  }, [location.pathname, params]);
}