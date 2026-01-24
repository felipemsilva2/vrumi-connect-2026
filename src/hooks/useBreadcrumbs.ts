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
  "/connect": "Vrumi Connect",
  "/connect/cadastro-instrutor": "Cadastro de Instrutor",
  "/connect/painel-instrutor": "Painel do Instrutor",
  "/connect/minhas-aulas": "Minhas Aulas",
  "/admin": "Admin",
  "/admin/painel": "Painel",
  "/admin/usuarios": "Usuários",
  "/admin/instrutores": "Instrutores",
  "/admin/agendamentos": "Agendamentos",
  "/admin/transacoes": "Transações",
  "/admin/funcoes": "Funções",
  "/admin/logs-auditoria": "Logs de Auditoria",
  "/admin/suporte": "Suporte",
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
    });

    // Filter out any breadcrumbs with undefined or empty labels
    return breadcrumbs.filter(crumb => crumb.label && crumb.label !== 'undefined' && crumb.label.trim() !== '');
  }, [location.pathname, params]);
}