import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip"

interface TooltipWrapperProps {
  triggerIconClass?: string
  content: string | string[]
  subtextColor?: string
  sideOffset?: number
}

export function TooltipWrapper({
  triggerIconClass = "icon-[tabler--info-circle] size-4 text-neutral-400",
  content,
  subtextColor = "text-neutral-500",
  sideOffset = 4,
}: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={triggerIconClass} />
        </TooltipTrigger>
        <TooltipContent sideOffset={sideOffset}>
          <div className="max-w-xl px-4 py-3 text-start">
            {Array.isArray(content) ? (
              <ul className={`text-sm ${subtextColor} list-disc list-inside`}>
                {content.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className={`text-sm ${subtextColor}`} dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

