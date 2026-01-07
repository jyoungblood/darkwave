"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table"
import { Button } from "@/components/ui/shadcn/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/dw/helpers"

// Extend TanStack Table meta type to include align
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right" | "center"
  }
}

interface Column {
  align?: "left" | "right" | "center"
  header: string
  sortable?: boolean
  accessorKey?: string
  cell: {
    class?: string
    content: (item: any) => string | Promise<string>
  }
}

interface DataTableProps {
  data: any[] | { error: string }
  columns: Column[]
  className?: string
}

export function DataTable({ data, columns, className }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Convert columns to TanStack Table format
  const tableColumns = React.useMemo<ColumnDef<any>[]>(() => {
    return columns.map((col, index) => {
      // Create a unique, valid id for each column
      const headerStr = String(col.header || '').replace(/\s+/g, '-').toLowerCase() || 'empty'
      const columnId = `col-${index}-${headerStr}`
      
      const columnDef: ColumnDef<any> = {
        id: columnId,
        enableSorting: col.sortable ?? false,
        ...(col.sortable && col.accessorKey ? { accessorKey: col.accessorKey } : {}),
        meta: {
          align: col.align,
        },
      }

      // Header with sorting support
      columnDef.header = ({ column }) => {
        if (col.sortable) {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(isSorted === "asc")}
              className={cn(
                "font-bold text-xs text-muted-foreground -ml-3 h-8 hover:bg-transparent",
                col.align === "right" && "text-right justify-end",
                col.align === "center" && "text-center justify-center",
                col.align === "left" && "text-left justify-start"
              )}
            >
              {col.header}
              {isSorted === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )
        }
        
        return (
          <div
            className={cn(
              "font-bold text-xs text-muted-foreground",
              col.align === "right" && "text-right",
              col.align === "center" && "text-center",
              col.align === "left" && "text-left"
            )}
          >
            {col.header}
          </div>
        )
      }

      // Cell renderer
      columnDef.cell = ({ row }) => {
        // Check if content was pre-processed in Astro
        const preProcessedKey = `_cell_${col.header}`
        let htmlContent = ""
        
        if (row.original[preProcessedKey] !== undefined) {
          // Use pre-processed content from Astro
          htmlContent = row.original[preProcessedKey]
        } else {
          // Fallback to calling the function (for sync content)
          const content = col.cell.content(row.original)
          htmlContent = content instanceof Promise ? "" : content
        }
        
        return (
          <div
            className={cn(
              "whitespace-nowrap",
              col.cell.class,
              col.align === "right" && "text-right",
              col.align === "center" && "text-center",
              col.align === "left" && "text-left"
            )}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )
      }

      return columnDef
    })
  }, [columns])

  const table = useReactTable({
    data: Array.isArray(data) ? data : [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  // Handle error state
  if (data && "error" in data) {
    return (
      <div>
        <p className="text-red-500">Error loading data</p>
      </div>
    )
  }

  // Handle empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">No items found</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const align = header.column.columnDef.meta?.align
                  return (
                    <TableHead 
                      key={header.id}
                      className={cn(
                        align === "right" && "text-right",
                        align === "center" && "text-center",
                        align === "left" && "text-left"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
  )
}
