import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/atoms/Typography";
import { X } from "lucide-react";

const modalSizeVariants = cva(
  "w-auto sm:w-full bg-white shadow-mx-lg rounded-mx-2xl sm:rounded-mx-3xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]",
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-xl",
        xl: "max-w-3xl",
        "2xl": "max-w-5xl",
        "3xl": "max-w-[1280px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface ModalProps extends VariantProps<typeof modalSizeVariants> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  showClose?: boolean;
  footer?: ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  referenceStyle?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  showClose = true,
  footer,
  className,
  closeOnEscape = true,
  referenceStyle = false,
}: ModalProps) {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  if (open && !wasOpenRef.current && typeof document !== "undefined") {
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  }
  wasOpenRef.current = open;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[100]",
            referenceStyle ? "bg-black/30" : "bg-mx-black/60 backdrop-blur-md",
          )}
        />
        <Dialog.Content
          onEscapeKeyDown={(event) => {
            if (!closeOnEscape) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            const previouslyFocusedElement = previouslyFocusedElementRef.current;
            if (!previouslyFocusedElement?.isConnected) return;

            event.preventDefault();
            requestAnimationFrame(() => previouslyFocusedElement.focus());
          }}
          className={cn(
            "fixed left-mx-md right-mx-md top-mx-md bottom-mx-md sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] focus:outline-none",
            modalSizeVariants({ size }),
            referenceStyle && "!max-h-[calc(100dvh-84px)] !rounded-[16px]",
            className,
          )}
        >
          <div className="p-mx-md sm:p-mx-lg border-b border-border-default flex items-start justify-between gap-mx-md sticky top-mx-0 bg-white z-10 shrink-0">
            <div className="min-w-0">
              <Dialog.Title asChild>
                <Typography variant="h3">{title}</Typography>
              </Dialog.Title>
              {description && (
                <Dialog.Description asChild>
                  <Typography
                    variant="tiny"
                    tone="muted"
                    className="mt-1 block"
                  >
                    {description}
                  </Typography>
                </Dialog.Description>
              )}
            </div>
            {showClose && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Fechar modal"
                  className={cn(
                    "w-mx-xl h-mx-xl flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all shrink-0",
                    referenceStyle
                      ? "rounded-lg bg-transparent"
                      : "rounded-mx-xl bg-surface-alt",
                  )}
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-mx-md sm:p-mx-lg">
            {children}
          </div>

          {footer && (
            <div
              className="p-mx-md sm:p-mx-lg border-t border-border-default flex flex-col-reverse sm:flex-row sm:justify-end gap-mx-sm sticky bottom-mx-0 bg-white shrink-0"
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)",
              }}
            >
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
