import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(
  ({ className, type = "text", startIcon, endIcon, error, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {startIcon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-muted-foreground shrink-0 z-10">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-2xl border border-input bg-background/90 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            startIcon && "!pl-11",
            endIcon && "!pr-11",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-muted-foreground shrink-0 z-10">
            {endIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
