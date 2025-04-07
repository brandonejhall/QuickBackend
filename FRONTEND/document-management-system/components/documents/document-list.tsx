"use client"

import { useState } from "react"
import { format } from "date-fns"
import { FileText, Trash2, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useDocuments } from "@/context/document-context"
import { useAuth } from "@/context/auth-context"

interface DocumentListProps {
  email: string
}

export default function DocumentList({ email }: DocumentListProps) {
  const { documents, isLoading, pagination, currentPage, loadMoreDocuments, deleteDocument } = useDocuments()
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      await deleteDocument(documentToDelete)
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document. Please try again.",
      })
    } finally {
      setDocumentToDelete(null)
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/download/${user?.email}/${filename}`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      })
    }
  }

  if (isLoading && documents.length === 0) {
    return <div>Loading documents...</div>
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-brims-blue" />
        <h3 className="mt-2 text-lg font-semibold text-brims-blue">No documents found</h3>
        <p className="text-sm text-muted-foreground">Upload a document to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
          <Table>
            <TableHeader className="bg-brims-blue sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Uploaded</TableHead>
                <TableHead className="w-[120px] text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc.name)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDocumentToDelete(doc.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this document? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {currentPage < pagination.total_pages && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => loadMoreDocuments(currentPage + 1)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
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

