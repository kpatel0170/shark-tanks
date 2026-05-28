import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
}

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, indicatorClassName, ...props }, ref) => {
  const clamped = Math.min(100, Math.max(0, value ?? 0))
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-slate-700', className)}
      value={clamped}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full bg-emerald-500 transition-all', indicatorClassName)}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName
