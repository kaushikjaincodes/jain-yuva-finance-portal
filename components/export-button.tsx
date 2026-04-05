"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Download } from "lucide-react"
import * as XLSX from "xlsx"

interface ExportButtonProps {
  data: Record<string, unknown>[]
  filename: string
  columns: string[]
}

export function ExportButton({ data, filename, columns }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sheetName, setSheetName] = useState("Sheet1")

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data to export")
      return
    }

    // Filter data to only include specified columns
    const filteredData = data.map((row) => {
      const filtered: Record<string, unknown> = {}
      columns.forEach((col) => {
        filtered[col] = row[col]
      })
      return filtered
    })

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(filteredData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generate and download file
    XLSX.writeFile(workbook, `${filename}.xlsx`)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export to Excel</DialogTitle>
          <DialogDescription>
            Enter a name for the Excel sheet
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="sheetName">Sheet Name</FieldLabel>
            <Input
              id="sheetName"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Sheet1"
            />
          </Field>
          <Button onClick={handleExport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}
