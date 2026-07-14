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

const referenceSizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
  "3xl": "max-w-[1280px]",
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
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  if (open && !wasOpenRef.current && typeof document !== "undefined") {
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  wasOpenRef.current = open;

  const referenceSize = referenceSizeClasses[size || "md"];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-reference-overlay={referenceStyle ? "true" : undefined}
          className={cn(
            "fixed inset-0 z-[100]",
            referenceStyle ? "bg-black/30" : "bg-mx-black/60 backdrop-blur-md",
          )}
        />
        <Dialog.Content
          data-reference-modal={referenceStyle ? "true" : undefined}
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
              ? cn(
                  "fixed left-4 right-4 top-1/2 z-[101] flex max-h-[90vh] -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2",
                  referenceSize,
                )
              : cn(
                  "fixed bottom-mx-md left-mx-md right-mx-md top-mx-md z-[101] focus:outline-none sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
                  modalSizeVariants({ size }),
                ),
            className,
          )}
        >
          <div
            className={cn(
              "sticky top-0 z-10 flex shrink-0 justify-between bg-white",
              referenceStyle
                ? "items-start gap-4 border-b border-gray-100 px-5 py-4"
                : "items-start gap-mx-md border-b border-border-default p-mx-md sm:p-mx-lg",
            )}
          >
            <div className="min-w-0">
              {referenceStyle ? (
                <>
                  <Dialog.Title className="text-lg font-semibold leading-6 text-gray-800">
                    {title}
                  </Dialog.Title>
                  {description && (
                    <Dialog.Description className="mt-0.5 text-sm leading-5 text-gray-500">
                      {description}
                    </Dialog.Description>
                  )}
                </>
              ) : (
                <>
                  <Dialog.Title asChild>
                    <Typography variant="h3">{title}</Typography>
                  </Dialog.Title>
                  {description && (
                    <Dialog.Description asChild>
                      <Typography variant="tiny" tone="muted" className="mt-1 block">
                        {description}
                      </Typography>
                    </Dialog.Description>
                  )}
                </>
              )}
            </div>
            {showClose && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Fechar modal"
                  className={cn(
                    "shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
                    referenceStyle
                      ? "mt-0.5 grid h-5 w-5 place-items-center rounded-md p-0 text-gray-400 hover:text-gray-600"
                      : "flex h-mx-xl w-mx-xl items-center justify-center rounded-mx-xl bg-surface-alt text-text-tertiary hover:text-text-primary",
                  )}
                >
                  <X size={referenceStyle ? 18 : 20} />
                </button>
              </Dialog.Close>
            )}
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              referenceStyle
                ? "p-5 [&_input]:!text-sm [&_select]:!text-sm [&_textarea]:!text-sm"
                : "p-mx-md sm:p-mx-lg",
            )}
          >
            {children}
          </div>

          {footer && (
            <div
              className={cn(
                "sticky bottom-0 flex shrink-0 bg-white",
                referenceStyle
                  ? "border-t border-gray-100 p-5 [&>button]:!min-h-0"
                  : "flex-col-reverse gap-mx-sm border-t border-border-default p-mx-md sm:flex-row sm:justify-end sm:p-mx-lg",
              )}
              style={{
                paddingBottom: referenceStyle
                  ? "max(env(safe-area-inset-bottom, 0px), 1.25rem)"
                  : "max(env(safe-area-inset-bottom, 0px), 1rem)",
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
