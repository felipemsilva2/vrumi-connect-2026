import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartBreadcrumbProps {
  className?: string;
  separator?: React.ReactNode;
}

export function SmartBreadcrumb({ className, separator = <ChevronRight className="h-4 w-4" /> }: SmartBreadcrumbProps) {
  const breadcrumbs = useBreadcrumbs();

  // Don't show breadcrumbs if we're on the home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={cn("mb-6", className)}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <>
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
              )}
            </>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
