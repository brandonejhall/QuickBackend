import type { Metadata } from "next"
import DocumentList from "@/components/documents/document-list"
import DocumentSearch from "@/components/documents/document-search"

export const metadata: Metadata = {
  title: "Documents | BRIMS Document Management System",
  description: "View and manage all your documents",
}

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brims-blue">Documents</h1>
      <DocumentSearch />
      <DocumentList />
    </div>
  )
}

