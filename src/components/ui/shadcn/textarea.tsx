import * as React from "react"

import { cn } from "@/lib/dw/helpers"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const combinedRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Set field-sizing CSS property for modern browsers
    textarea.style.setProperty("field-sizing", "content")

    function autoResize() {
      if (!textarea) return
      textarea.style.height = "auto"
      textarea.style.height = textarea.scrollHeight + "px"
    }

    textarea.addEventListener("input", autoResize)
    // Resize on initial load if there's a value
    if (textarea.value) {
      // Use requestAnimationFrame to ensure this runs after React has fully rendered
      requestAnimationFrame(() => {
        autoResize()
      })
    }

    return () => {
      textarea.removeEventListener("input", autoResize)
    }
  }, [])

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={combinedRef}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

