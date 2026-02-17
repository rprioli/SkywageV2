import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Tailwind-merge needs to know about our custom `text-responsive-*` utilities (defined in `globals.css`)
 * so it doesn't treat them as conflicting with text color utilities like `text-brand-ink`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      // Enables correct merging for: `text-responsive-xs` ... `text-responsive-5xl`
      // (Tailwind-merge's `text` scale maps to `text-*` font-size utilities.)
      text: [
        "responsive-xs",
        "responsive-sm",
        "responsive-base",
        "responsive-lg",
        "responsive-xl",
        "responsive-2xl",
        "responsive-3xl",
        "responsive-4xl",
        "responsive-5xl",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
