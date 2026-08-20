import * as React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(
  ({ className, type = "text", startIcon, endIcon, error, onClear, ...props }, ref) => {
    const hasValue = props.value !== undefined && props.value !== null && String(props.value).length > 0;
    const showClear = Boolean(onClear && hasValue);

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
            (endIcon || showClear) && "!pr-11",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {showClear ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10 cursor-pointer"
            aria-label="Clear search input"
            title="Clear search"
          >
            <Cross2Icon className="w-4 h-4 shrink-0" />
          </button>
        ) : endIcon ? (
          <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-muted-foreground shrink-0 z-10">
            {endIcon}
          </div>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
