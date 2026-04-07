import { Toaster as SonnerToaster } from 'sonner'

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <SonnerToaster
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-surface-main group-[.toaster]:text-text-primary group-[.toaster]:border-border-default group-[.toaster]:shadow-mx-lg',
                    description: 'group-[.toast]:text-text-secondary',
                    actionButton: 'group-[.toast]:bg-brand-primary group-[.toast]:text-text-on-brand',
                    cancelButton: 'group-[.toast]:bg-mx-slate-100 group-[.toast]:text-text-secondary',
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
