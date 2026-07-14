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

const referenceModalWidths = {
  sm: "sm:!max-w-[720px]",
  md: "sm:!max-w-[1030px]",
  lg: "sm:!max-w-[1156px]",
  xl: "sm:!max-w-[1440px]",
  "2xl": "sm:!max-w-[calc(100vw-64px)]",
  "3xl": "sm:!max-w-[calc(100vw-64px)]",
} as const;

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
  onOpenAutoFocus?: (event: Event) => void;
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
  onOpenAutoFocus,
}: ModalProps) {
  const resolvedSize = size ?? "md";
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
          onOpenAutoFocus={onOpenAutoFocus}
          onCloseAutoFocus={(event) => {
            const previouslyFocusedElement = previouslyFocusedElementRef.current;
            if (!previouslyFocusedElement?.isConnected) return;

            event.preventDefault();
            requestAnimationFrame(() => previouslyFocusedElement.focus());
          }}
          className={cn(
            referenceStyle
              ? "fixed left-4 right-4 top-1/2 -translate-y-1/2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[101] focus:outline-none"
              : "fixed left-mx-md right-mx-md top-mx-md bottom-mx-md sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] focus:outline-none",
            modalSizeVariants({ size: resolvedSize }),
            referenceStyle && [
              "!max-h-[90vh] !rounded-[16px]",
              referenceModalWidths[resolvedSize],
            ],
            className,
          )}
        >
          <div className={cn(
            "border-b flex justify-between gap-mx-md sticky top-mx-0 bg-white z-10 shrink-0",
            referenceStyle
              ? "items-center border-gray-100 px-8 py-7"
              : "items-start border-border-default p-mx-md sm:p-mx-lg",
          )}>
            <div className="min-w-0">
              <Dialog.Title asChild>
                <Typography variant="h3" className={referenceStyle ? "text-[32px] leading-9" : undefined}>
                  {title}
                </Typography>
              </Dialog.Title>
              {description && (
                <Dialog.Description asChild>
                  <Typography
                    variant="tiny"
                    tone="muted"
                    className={referenceStyle ? "mt-2 block !text-[18px] !leading-7" : "mt-1 block"}
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
                    "flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all shrink-0",
                    referenceStyle
                      ? "h-8 w-8 !min-h-0 rounded-lg bg-transparent p-0"
                      : "h-mx-xl w-mx-xl rounded-mx-xl bg-surface-alt",
                  )}
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            )}
          </div>

          <div className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            referenceStyle
              ? "p-8 [&_input]:!text-base [&_select]:!text-base [&_textarea]:!text-base"
              : "p-mx-md sm:p-mx-lg",
          )}>
            {children}
          </div>

          {footer && (
            <div
              className={cn(
                "border-t flex sticky bottom-mx-0 bg-white shrink-0",
                referenceStyle
                  ? "flex-row justify-end gap-4 border-gray-100 px-8 py-6 [&>button]:!h-14 [&>button]:!min-h-0 [&>button]:!px-8 [&>button]:!text-xl"
                  : "flex-col-reverse gap-mx-sm border-border-default sm:flex-row sm:justify-end p-mx-md sm:p-mx-lg",
              )}
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
