"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, min, max, step, value, defaultValue, onValueChange, disabled, ...props }, ref) => {
  const fallbackValue =
    typeof min === "number"
      ? min
      : typeof max === "number"
        ? max
        : 0

  const rangeValue =
    Array.isArray(value) && typeof value[0] === "number"
      ? value[0]
      : Array.isArray(defaultValue) && typeof defaultValue[0] === "number"
        ? defaultValue[0]
        : fallbackValue

  return (
    <>
      <input
        type="range"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        min={min}
        max={max}
        step={step}
        value={rangeValue}
        disabled={disabled}
        onChange={(event) => onValueChange?.([Number(event.target.value)])}
      />
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
