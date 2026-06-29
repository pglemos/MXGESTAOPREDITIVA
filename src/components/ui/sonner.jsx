"use client";
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    (<Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-mx-text group-[.toaster]:border-mx-border group-[.toaster]:shadow-popover",
          description: "group-[.toast]:text-mx-muted",
          actionButton:
            "group-[.toast]:bg-mx-action group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-mx-bg group-[.toast]:text-mx-muted",
        },
      }}
      {...props} />)
  );
}

export { Toaster }
