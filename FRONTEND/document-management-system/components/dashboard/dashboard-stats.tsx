"use client"

import { FileText, Upload, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDocuments } from "@/context/document-context"

export default function DashboardStats() {
  const { documents } = useDocuments()

  // Calculate stats
  const totalDocuments = documents.length
  const recentUploads = documents.filter(
    (doc) => new Date(doc.uploadedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).length

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-brims-blue/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brims-blue">Total Documents</CardTitle>
          <FileText className="h-4 w-4 text-brims-blue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDocuments}</div>
          <p className="text-xs text-muted-foreground">Documents in your account</p>
        </CardContent>
      </Card>
      <Card className="border-brims-blue/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-brims-blue">Recent Uploads</CardTitle>
          <Clock className="h-4 w-4 text-brims-blue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentUploads}</div>
          <p className="text-xs text-muted-foreground">Uploads in the last 7 days</p>
        </CardContent>
      </Card>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

