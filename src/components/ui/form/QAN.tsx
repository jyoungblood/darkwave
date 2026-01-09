"use client";

import * as React from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import * as SortableJS from "sortablejs";
import type { SortableEvent } from "sortablejs";
import { cn } from "@/lib/dw/helpers";

const Sortable = SortableJS.default || SortableJS;
type SortableInstance = InstanceType<typeof Sortable>;

interface Field {
  label?: string;
  sublabel?: string | string[];
  name: string;
  type?: string;
  width?: string;
  placeholder?: string;
  labelSize?: "xs" | "sm" | "base";
}

interface QANProps {
  name: string;
  label?: string;
  sublabel?: string | string[];
  fields: Field[];
  value?: string | null;
  fieldLabel?: string;
  fieldSublabel?: string | string[];
  fieldLabelSize?: "xs" | "sm" | "base";
  buttonLabel?: string;
  sortable?: boolean;
  limit?: number;
  className?: string;
}

export function QAN({
  name,
  fields,
  value = null,
  fieldLabel,
  fieldLabelSize = "sm",
  fieldSublabel,
  buttonLabel = "Add Item",
  sortable = false,
  limit,
  className,
}: QANProps) {
  // Parse initial data
  const initialData = React.useMemo(() => {
    if (!value) return [];
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }, [value]);

  const [items, setItems] = React.useState<Array<Record<string, any>>>(initialData);
  const hiddenInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sortableInstanceRef = React.useRef<SortableInstance | null>(null);

  // Sync state to hidden input whenever items change
  React.useEffect(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = JSON.stringify(items);
    }
  }, [items]);

  // Initialize sortable if enabled
  React.useEffect(() => {
    if (!sortable || !containerRef.current) return;

    const itemsContainer = containerRef.current.querySelector('.qan-items-container') as HTMLElement;
    if (!itemsContainer) return;

    const sortableInstance = new Sortable(itemsContainer, {
      animation: 150,
      ghostClass: 'opacity-50',
      handle: '.cursor-move',
      onEnd: (event: SortableEvent) => {
        setItems((prevItems) => {
          const newItems = [...prevItems];
          const [movedItem] = newItems.splice(event.oldIndex!, 1);
          newItems.splice(event.newIndex!, 0, movedItem);
          return newItems;
        });
      },
    });

    sortableInstanceRef.current = sortableInstance;

    return () => {
      if (sortableInstanceRef.current) {
        sortableInstanceRef.current.destroy();
        sortableInstanceRef.current = null;
      }
    };
  }, [sortable]);

  const handleAddItem = () => {
    const newItem: Record<string, any> = {};
    fields.forEach((field) => {
      newItem[field.name] = '';
    });
    setItems([...items, newItem]);

    // Focus first input in the new row after React renders it
    setTimeout(() => {
      if (containerRef.current) {
        const lastRow = containerRef.current.querySelector('.qan-items-container')?.lastElementChild;
        if (lastRow) {
          const firstInput = lastRow.querySelector('input[type="text"], input[type="email"], input[type="number"]') as HTMLInputElement;
          if (firstInput) {
            firstInput.focus();
          }
        }
      }
    }, 0);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleFieldChange = (index: number, fieldName: string, value: string) => {
    const newItems = [...items];
    if (!newItems[index]) {
      newItems[index] = {};
    }
    newItems[index][fieldName] = value;
    setItems(newItems);
  };

  const showAddButton = limit ? items.length < limit : true;

  return (
    <div className={cn("qan-container", className)} data-name={name} ref={containerRef}>
      {fieldLabel && (
        <Label 
          htmlFor={`input-${name}`} 
          className={cn(
            "mb-2",
            fieldLabelSize === "xs" ? "text-xs" : fieldLabelSize === "sm" ? "text-sm" : "text-base"
          )}
        >
          {fieldLabel}
          {fieldSublabel && (
            <span className={cn(
              fieldLabelSize === "xs" ? "text-xs" : fieldLabelSize === "sm" ? "text-sm" : "text-base",
              "text-muted-foreground block mt-1"
            )}>
              {Array.isArray(fieldSublabel) ? fieldSublabel.join(' ') : fieldSublabel}
            </span>
          )}
        </Label>
      )}

      <input
        type="hidden"
        name={name}
        ref={hiddenInputRef}
        value={JSON.stringify(items)}
      />

      <div className="space-y-4 transition-all duration-200 qan-items-container">
        {items.map((item, index) => (
          <div key={index} className="flex gap-4 items-end">
            {sortable && (
              <div className="flex items-center justify-center w-8 h-10 cursor-move text-gray-400 hover:text-gray-600">
                <span className="icon-[tabler--grip-vertical] w-4 h-4"></span>
              </div>
            )}
            {fields.map((field) => {
              const labelSize = field.labelSize || "sm";
              const labelSizeClass = labelSize === "xs" ? "text-xs" : labelSize === "sm" ? "text-sm" : "text-base";
              // Input text size: smaller when label is smaller, default when label is sm/base
              const inputSizeClass = labelSize === "xs" ? "text-sm md:text-xs" : undefined;
              
              return (
                <div
                  key={field.name}
                  className="flex flex-col"
                  style={field.width ? { width: field.width } : { flex: 1 }}
                >
                  {field.label && (
                    <Label
                      htmlFor={`input-${name}-${field.name}-${index}`}
                      className={cn(labelSizeClass, "mb-2")}
                    >
                      {field.label}
                      {field.sublabel && (
                        <span className={cn(labelSizeClass, "text-muted-foreground block mt-0.5")}>
                          {Array.isArray(field.sublabel) ? field.sublabel.join(' ') : field.sublabel}
                        </span>
                      )}
                    </Label>
                  )}
                  <Input
                    type={field.type || 'text'}
                    id={`input-${name}-${field.name}-${index}`}
                    placeholder={field.placeholder}
                    value={item[field.name] || ''}
                    onChange={(e) => handleFieldChange(index, field.name, e.target.value)}
                    className={inputSizeClass}
                  />
                </div>
              );
            })}
            {/* Delete button or placeholder for layout consistency */}
            {item.protected ? (
              <div className="h-10 w-10" aria-hidden="true" />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-primary/50 hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleRemoveItem(index)}
              >
                <span className="icon-[tabler--trash] w-4 h-4"></span>
              </Button>
            )}
          </div>
        ))}
      </div>

      {showAddButton && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="mt-5"
          onClick={handleAddItem}
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
