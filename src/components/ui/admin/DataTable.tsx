"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table"
import { buttonVariants } from "@/components/ui/shadcn/button"
import { cn } from "@/lib/dw/helpers"

interface Column {
  align?: "left" | "right" | "center"
  header: string
  cell: {
    class?: string
    content: (item: any) => string | Promise<string>
  }
}

interface DataTableProps {
  data: any[] | { error: string }
  columns: Column[]
  title?: string
  buttonLinks?: {
    href: string
    text: string
  }[]
}

export function DataTable({ data, columns, title, buttonLinks }: DataTableProps) {
  // Convert columns to TanStack Table format
  const tableColumns = React.useMemo<ColumnDef<any>[]>(() => {
    return columns.map((col, index) => {
      // Create a unique, valid id for each column
      const headerStr = String(col.header || '').replace(/\s+/g, '-').toLowerCase() || 'empty'
      const columnId = `col-${index}-${headerStr}`
      
      return {
      id: columnId,
      header: () => (
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
      ),
      cell: ({ row }: { row: any }) => {
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
      },
    }
    })
  }, [columns])

  const table = useReactTable({
    data: Array.isArray(data) ? data : [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Handle error state
  if (data && "error" in data) {
    return (
      <div>
        {title && (
          <div className="flex gap-8 w-full items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            {buttonLinks && buttonLinks.length > 0 && (
              <div className="flex gap-4">
                {buttonLinks.map((buttonLink, idx) => (
                  <a
                    key={idx}
                    href={buttonLink.href}
                    className={cn(buttonVariants())}
                  >
                    {buttonLink.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-red-500">Error loading data</p>
      </div>
    )
  }

  // Handle empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div>
        {title && (
          <div className="flex gap-8 w-full items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            {buttonLinks && buttonLinks.length > 0 && (
              <div className="flex gap-4">
                {buttonLinks.map((buttonLink, idx) => (
                  <a
                    key={idx}
                    href={buttonLink.href}
                    className={cn(buttonVariants())}
                  >
                    {buttonLink.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-neutral-500">No items found</p>
      </div>
    )
  }

  return (
    <div>
      {(title || (buttonLinks && buttonLinks.length > 0)) && (
        <div className="flex gap-8 w-full items-center justify-between mb-8">
          {title && (
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
          )}
          {buttonLinks && buttonLinks.length > 0 && (
            <div className="flex gap-4">
              {buttonLinks.map((buttonLink, idx) => (
                <a
                  key={idx}
                  href={buttonLink.href}
                  className={cn(buttonVariants())}
                >
                  {buttonLink.text}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="w-full overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
    </div>
  )
}
