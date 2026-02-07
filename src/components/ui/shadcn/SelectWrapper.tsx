"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select"

interface Option {
  label: string
  value: string
}

interface OptionGroup {
  label: string
  options: Option[]
}

interface SelectWrapperProps {
  name: string
  required?: boolean
  value?: string
  className?: string
  options: Option[] | OptionGroup[]
  placeholder?: string
  id?: string
}

export function SelectWrapper({
  name,
  required = false,
  value = "",
  className,
  options,
  placeholder = "",
  id,
}: SelectWrapperProps) {
  // Simple state - just track the selected value
  const [selectedValue, setSelectedValue] = React.useState<string>(value || "")
  const hiddenInputRef = React.useRef<HTMLInputElement>(null)

  // Update when value prop changes from parent
  React.useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value || "")
    }
  }, [value])

  // Sync hidden input whenever selectedValue changes
  React.useEffect(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = selectedValue
    }
  }, [selectedValue])

  // Determine if options are grouped
  const isGrouped = options.length > 0 && "options" in options[0]

  // Filter out options with empty string values (Radix doesn't allow them)
  const filteredOptions = isGrouped
    ? (options as OptionGroup[]).map((group) => ({
        ...group,
        options: group.options.filter((opt) => opt.value !== ""),
      }))
    : (options as Option[]).filter((opt) => opt.value !== "")

  // Handle value change
  function handleValueChange(newValue: string) {
    const finalValue = newValue || ""
    setSelectedValue(finalValue)
    // Immediately update hidden input for form submission
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = finalValue
    }
  }

  return (
    <>
      <Select
        value={selectedValue || undefined}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className={className} id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          {isGrouped ? (
            (filteredOptions as OptionGroup[]).map((group, groupIndex) => (
              <SelectGroup key={groupIndex}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option, optionIndex) => (
                  <SelectItem key={`${option.value}-${optionIndex}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          ) : (
            (filteredOptions as Option[]).map((option, optionIndex) => (
              <SelectItem key={`${option.value}-${optionIndex}`} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <input
        ref={hiddenInputRef}
        type="hidden"
        id={`hidden-${name}`}
        name={name}
        value={selectedValue}
        required={required}
      />
    </>
  )
}
