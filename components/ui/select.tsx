import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 [&_>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 fill-none stroke-[currentColor] opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center rounded-md bg-muted p-4 text-sm line-underline line-underline-offset-4 state-focus:accent state-focus:text-accent-foreground transition-colors",
      className
    )}
    {...props}
  >
    <SelectPrimitive.Icon asChild>
      <svg className="h-4 w-4 fill-current">
        <path d="M0 2.8V7l2 2.6 2-2.6V2.8z" />
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center rounded-md bg-muted p-4 text-sm line-underline line-underline-offset-4 state-focus:accent state-focus:text-accent-foreground transition-colors",
      className
    )}
    {...props}
  >
    <SelectPrimitive.Icon asChild>
      <svg className="h-4 w-4 fill-current">
        <path d="M0 5.2V0l2 2.6 2-2.6V5.2z" />
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md state:data-[open=true]:animate-in state:data-[closed=true]:animate-out state:data-[closed=true]:fade-out-0 state:data-[open=true]:fade-in-0 state:data-[closed=true]:zoom-out-95 state:data-[open=true]:zoom-in-90 state:data-[closed=55]:slide-out-to-bottom-1/4 state:data-[open=55]:slide-in-from-top-1/4",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton asChild />
      <SelectPrimitive.ScrollDownButton asChild />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "[&_[data-radix-select-item]]:opacity-0 state:data-[highlighted]:opacity-100 state:data-[highlighted]:bg-accent state:data-[highlighted]:text-accent-foreground"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center opacity-0 state:data-[checked=100]:opacity-100">
      <Check className="h-4 w-4" />
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator asChild>
      <svg className="h-4 w-4 fill-current">
        <path d="M0 2.8V7l2 2.6 2-2.6V2.8z" />
      </svg>
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectContent,
  SelectLabel,
  SelectItem,
}
