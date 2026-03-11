import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value = 0, ...props }, ref) => {
  const clampedValue = Math.min(100, Math.max(0, value ?? 0))
  return (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-3 w-full overflow-hidden rounded-full bg-slate-700', className)}
    value={clampedValue}
    {...props}
  >
    <ProgressPrimitive.Indicator className="h-full bg-emerald-500 transition-all" style={{ transform: `translateX(-${100 - clampedValue}%)` }} />
  </ProgressPrimitive.Root>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName
