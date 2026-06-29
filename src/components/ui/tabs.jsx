import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
    "inline-flex h-10 items-center justify-center rounded-[16px] bg-mx-bg p-1 text-mx-muted",
      className
    )}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-[12px] px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action focus-visible:ring-offset-2 disabled:pointer-events-none disabled:text-mx-muted disabled:opacity-100 data-[state=active]:bg-white data-[state=active]:text-mx-action data-[state=active]:shadow-card",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
    "mt-2 ring-offset-background motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-[180ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
