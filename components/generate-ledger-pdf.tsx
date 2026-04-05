"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FileText } from "lucide-react"
import { useState } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface LedgerData {
  member: {
    id: number
    name: string
    email: string | null
    phone: string | null
    status: string
    monthly_contribution: number
    per_member_contribution: number
  }
  contributions: {
    month_year: string
    contribution_amount: number
    contribution_paid: boolean
    loan_installment_amount: number
    loan_installment_paid: boolean
  }[]
  loans: {
    loan_month: string
    loan_type: string
    loan_amount: number
    interest: number
    loan_installment: number
    due_amount: number
    status: string
  }[]
  penalties: {
    month_year: string
    penalty_type: string
    amount: number
  }[]
}

export function GenerateLedgerPDF({ memberId, memberName }: { memberId: number; memberName: string }) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/members/${memberId}/ledger`)
      if (!res.ok) throw new Error("Failed to fetch ledger data")
      
      const data: LedgerData = await res.json()
      const { member, contributions, loans, penalties } = data

      // Create PDF
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("Bachaat Committee", 105, 20, { align: "center" })
      
      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      doc.text("Member Ledger Report", 105, 30, { align: "center" })
      
      // Member Info
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Member Information", 14, 45)
      
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Name: ${member.name}`, 14, 55)
      doc.text(`Email: ${member.email || "N/A"}`, 14, 62)
      doc.text(`Phone: ${member.phone || "N/A"}`, 14, 69)
      doc.text(`Status: ${member.status.toUpperCase()}`, 14, 76)
      doc.text(`Monthly Contribution: Rs ${Number(member.monthly_contribution).toLocaleString("en-IN")}`, 14, 83)
      doc.text(`Total Contribution: Rs ${Number(member.per_member_contribution).toLocaleString("en-IN")}`, 14, 90)

      let yPos = 105

      // Contributions Table
      if (contributions.length > 0) {
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Contribution History", 14, yPos)
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [["Month", "Contribution", "Status", "Loan Installment", "Status"]],
          body: contributions.map((c) => [
            new Date(c.month_year).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
            `Rs ${Number(c.contribution_amount).toLocaleString("en-IN")}`,
            c.contribution_paid ? "Paid" : "Pending",
            `Rs ${Number(c.loan_installment_amount).toLocaleString("en-IN")}`,
            c.loan_installment_paid ? "Paid" : "Pending",
          ]),
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 8 },
        })
        
        yPos = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      }

      // Loans Table
      if (loans.length > 0) {
        if (yPos > 230) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Loan History", 14, yPos)
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [["Start Date", "Type", "Principal", "Interest", "EMI", "Due", "Status"]],
          body: loans.map((l) => [
            new Date(l.loan_month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
            l.loan_type.toUpperCase(),
            `Rs ${Number(l.loan_amount).toLocaleString("en-IN")}`,
            `Rs ${Number(l.interest).toLocaleString("en-IN")}`,
            `Rs ${Number(l.loan_installment).toLocaleString("en-IN")}`,
            `Rs ${Number(l.due_amount).toLocaleString("en-IN")}`,
            l.status.toUpperCase(),
          ]),
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 8 },
        })
        
        yPos = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      }

      // Penalties Table
      if (penalties.length > 0) {
        if (yPos > 230) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Penalty History", 14, yPos)
        
        autoTable(doc, {
          startY: yPos + 5,
          head: [["Month", "Type", "Amount"]],
          body: penalties.map((p) => [
            new Date(p.month_year).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
            p.penalty_type === "contribution_missed" ? "Contribution Missed" : "Loan Missed",
            `Rs ${Number(p.amount).toLocaleString("en-IN")}`,
          ]),
          theme: "grid",
          headStyles: { fillColor: [192, 57, 43] },
          styles: { fontSize: 8 },
        })
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(
          `Generated on ${new Date().toLocaleDateString("en-IN")} | Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        )
      }

      // Download PDF
      doc.save(`ledger-${member.name.replace(/\s+/g, "-")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={generatePDF}
      disabled={isGenerating}
      title="Download Ledger PDF"
    >
      {isGenerating ? <Spinner className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
    </Button>
  )
}
