"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SheetContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextType>({
  open: false,
  onOpenChange: () => {},
});

export function Sheet({
  open = false,
  onOpenChange = () => {},
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  children,
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { onOpenChange } = React.useContext(SheetContext);
  return (
    <button
      type="button"
      onClick={() => onOpenChange(true)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function SheetClose({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { onOpenChange } = React.useContext(SheetContext);
  return (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function SheetContent({
  children,
  className,
  side = "right",
  showCloseButton = true,
}: {
  children: React.ReactNode;
  className?: string;
  side?: "right" | "left" | "top" | "bottom";
  showCloseButton?: boolean;
}) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  // Mount/unmount lifecycle with smooth animation
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (open) {
      document.body.style.overflow = "hidden";
      const frameId = requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => {
        cancelAnimationFrame(frameId);
      };
    } else {
      setVisible(false);
      timeoutId = setTimeout(() => {
        document.body.style.overflow = "";
      }, 300);
      return () => {
        clearTimeout(timeoutId);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!mounted) return null;
  if (!open && !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-auto">
      {/* Backdrop overlay */}
      <div
        onClick={() => onOpenChange(false)}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-[110] flex flex-col h-full bg-zinc-950 text-white shadow-2xl transition-transform duration-300 ease-out will-change-transform",
          side === "right" && "border-l border-white/15",
          side === "left" && "border-r border-white/15",
          side === "right" && (visible ? "translate-x-0" : "translate-x-full"),
          side === "left" && (visible ? "translate-x-0" : "-translate-x-full"),
          className
        )}
      >
        {children}

        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 cursor-pointer z-20"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}

export function SheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  );
}

export function SheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-white/10 pt-4",
        className
      )}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg font-semibold text-white", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs text-zinc-400", className)}
      {...props}
    />
  );
}
