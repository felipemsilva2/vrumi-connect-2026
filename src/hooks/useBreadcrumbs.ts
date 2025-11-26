import { useLocation, useParams } from "react-router-dom";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

const routeLabels: Record<string, string> = {
  "/": "Início",
  "/entrar": "Entrar",
  "/painel": "Painel",
  "/sala-de-estudos": "Sala de Estudo",
  "/biblioteca-de-placas": "Biblioteca de Placas",
  "/pagamento": "Pagamento",
  "/pagamento/sucesso": "Sucesso",
  "/pagamento/cancelado": "Cancelado",
  "/admin": "Admin",
  "/admin/painel": "Painel",
  "/admin/usuarios": "Usuários",
  "/admin/assinaturas": "Assinaturas",
  "/admin/funcoes": "Funções",
  "/admin/logs-auditoria": "Logs de Auditoria",
  "/admin/popular": "Popular Dados",
  "/admin/flashcards": "Flashcards",
  "/admin/questoes": "Questões",
  "/admin/placas": "Placas",
  "/termos-de-uso": "Termos de Uso",
  "/politica-de-privacidade": "Política de Privacidade",
  "/perguntas-frequentes": "Perguntas Frequentes",
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
          const label = routeLabels[adminRoute] || capitalizeWords(name);
          if (label && label !== 'undefined') {
            breadcrumbs.push({
              label: label,
              href: isLast ? undefined : currentPath,
              isCurrent: isLast
            });
          }
        } else {
          // Handle regular routes
          const route = currentPath as keyof typeof routeLabels;
          const label = routeLabels[route] || capitalizeWords(name);
          if (label && label !== 'undefined') {
            breadcrumbs.push({
              label: label,
              href: isLast ? undefined : currentPath,
              isCurrent: isLast
            });
          }
        }
      }
    });

    // Filter out any breadcrumbs with undefined or empty labels
    return breadcrumbs.filter(crumb => crumb.label && crumb.label !== 'undefined' && crumb.label.trim() !== '');
  }, [location.pathname, params]);
}