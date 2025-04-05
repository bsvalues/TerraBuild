import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
}

export function Breadcrumb({
  separator = <ChevronRight className="h-4 w-4" />,
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export interface BreadcrumbListProps extends React.OlHTMLAttributes<HTMLOListElement> {}

export function BreadcrumbList({
  className,
  ...props
}: BreadcrumbListProps) {
  return (
    <ol
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    />
  );
}

export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  isCurrentPage?: boolean;
}

export function BreadcrumbItem({ className, isCurrentPage, ...props }: BreadcrumbItemProps) {
  return (
    <li
      className={cn("inline-flex items-center", className)}
      aria-current={isCurrentPage ? "page" : undefined}
      {...props}
    />
  );
}

export interface BreadcrumbLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
}

export function BreadcrumbLink({
  asChild,
  className,
  ...props
}: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      className={cn("hover:text-foreground transition-colors", 
        props["aria-current"] === "page" 
          ? "font-medium text-foreground pointer-events-none" 
          : "text-muted-foreground",
        className)}
      {...props}
    />
  );
}

export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {
  children?: React.ReactNode;
}

export function BreadcrumbSeparator({
  className,
  children = <ChevronRight className="h-4 w-4" />,
  ...props
}: BreadcrumbSeparatorProps) {
  return (
    <li
      className={cn("mx-2 flex items-center text-muted-foreground", className)}
      {...props}
    >
      {children}
    </li>
  );
}

// Create a more complete Breadcrumb component that automatically inserts separators
Breadcrumb.Item = function BreadcrumbItemWithSeparator({
  children,
  isCurrentPage,
  ...props
}: BreadcrumbItemProps) {
  // Find all siblings that are BreadcrumbItems
  const siblings = React.Children.toArray(
    React.useContext(BreadcrumbContext).children
  ).filter((child) => React.isValidElement(child));
  
  // Get the index of the current child
  const index = siblings.findIndex(
    (child) => React.isValidElement(child) && child.props === props
  );
  
  // Determine if this is the last item
  const isLastItem = index === siblings.length - 1;
  
  return (
    <>
      <BreadcrumbItem isCurrentPage={isCurrentPage} {...props}>
        {children}
      </BreadcrumbItem>
      {!isLastItem && <BreadcrumbSeparator />}
    </>
  );
};

// Context to hold children
const BreadcrumbContext = React.createContext<{
  children: React.ReactNode;
}>({
  children: null,
});

// Enhanced Breadcrumb that provides context
export function EnhancedBreadcrumb({
  children,
  ...props
}: BreadcrumbProps) {
  return (
    <BreadcrumbContext.Provider value={{ children }}>
      <Breadcrumb {...props}>{children}</Breadcrumb>
    </BreadcrumbContext.Provider>
  );
}