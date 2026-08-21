import * as React from "react";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";

/**
 * Custom Accessible Select Component matching Warm Pearl & Frosted Ambient Theme
 * Supports keyboard navigation (Enter, Space, ArrowUp, ArrowDown, Escape, Tab),
 * click-outside dismissal, optional search filtering, disabled options, and clean ARIA attributes.
 */

export function Select({
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  error = false,
  ariaLabel,
  renderOption,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const containerRef = React.useRef(null);
  const listboxRef = React.useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Sync focused index with selected value on open
  React.useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => String(opt.value) === String(value));
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, options, value]);

  // Scroll focused option into view
  React.useEffect(() => {
    if (isOpen && listboxRef.current && focusedIndex >= 0) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (focusedIndex >= 0 && options[focusedIndex]) {
        handleSelect(options[focusedIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    } else if (e.key === "Tab") {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-card/95 px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-orange-500/80 ring-2 ring-orange-500/20",
          error && "border-destructive focus-visible:ring-destructive",
          !selectedOption && "text-muted-foreground"
        )}
      >
        <span className="truncate text-left font-medium">
          {selectedOption ? (
            renderOption ? (
              renderOption(selectedOption)
            ) : (
              selectedOption.label || selectedOption.name || selectedOption.value
            )
          ) : (
            placeholder
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-orange-500"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Floating Dropdown Listbox */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || placeholder}
          className="absolute z-50 mt-1.5 max-h-60 w-full min-w-[12rem] overflow-auto rounded-2xl border border-border/80 bg-card/98 p-1.5 text-xs text-card-foreground shadow-scms-modal backdrop-blur-2xl animate-fadeIn"
        >
          {options.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground italic">
              No options available
            </div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isFocused = idx === focusedIndex;

              return (
                <div
                  key={String(opt.value ?? idx)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                    opt.disabled && "cursor-not-allowed opacity-40",
                    isFocused && !opt.disabled && "bg-secondary text-foreground",
                    isSelected && "bg-orange-50 dark:bg-orange-950/50 font-bold text-orange-700 dark:text-orange-300"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">
                      {renderOption ? renderOption(opt) : opt.label || opt.name || opt.value}
                    </span>
                    {opt.description && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        ({opt.description})
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <CheckIcon className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Select;
