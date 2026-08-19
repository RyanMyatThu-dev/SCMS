import * as React from "react";
import { cn } from "../../lib/utils";

const buttonVariants = {
  variant: {
    default:
      "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98]",
    destructive:
      "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]",
    outline:
      "border border-input bg-background/80 hover:bg-secondary hover:text-secondary-foreground text-foreground active:scale-[0.98]",
    secondary:
      "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]",
    ghost:
      "hover:bg-secondary hover:text-secondary-foreground text-foreground",
    link:
      "text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-11 px-5 py-2.5 text-sm font-semibold",
    sm: "h-9 rounded-xl px-3 text-xs font-semibold",
    lg: "h-12 rounded-2xl px-8 text-base font-semibold",
    icon: "h-11 w-11 p-0 shrink-0",
  },
};

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      disabled = false,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = buttonVariants.variant[variant] || buttonVariants.variant.default;
    const sizeClass = buttonVariants.size[size] || buttonVariants.size.default;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          variantClass,
          sizeClass,
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
