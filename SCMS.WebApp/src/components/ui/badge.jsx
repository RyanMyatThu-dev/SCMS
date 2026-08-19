import * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = {
  variant: {
    default:
      "border-transparent bg-primary text-primary-foreground shadow",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground",
    destructive:
      "border-transparent bg-destructive text-destructive-foreground shadow",
    outline: "text-foreground border-border",
    success:
      "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning:
      "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  },
};

function Badge({ className, variant = "default", ...props }) {
  const variantClass = badgeVariants.variant[variant] || badgeVariants.variant.default;
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClass,
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
