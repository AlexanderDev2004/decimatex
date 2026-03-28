import type * as React from "react"

import { cn } from "@/lib/utils"

type SwitchProps = Omit<React.ComponentProps<"button">, "role" | "aria-checked" | "onChange"> & {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
}

function Switch({
  className,
  checked,
  disabled,
  onCheckedChange,
  onClick,
  ...props
}: SwitchProps) {
  const state = checked ? "checked" : "unchecked"

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled) {
      return
    }
    onCheckedChange?.(!checked)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={state}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted",
        className
      )}
      {...props}
    >
      <span
        data-state={state}
        className="pointer-events-none block size-6 rounded-full bg-background shadow-sm transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      />
    </button>
  )
}

export { Switch }
