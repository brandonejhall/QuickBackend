"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { FileText, Trash2 } from "lucide-react"
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
import { documentApi, DocumentResponse } from "@/lib/api"

interface DocumentListProps {
  email: string
  limit?: number
}

export default function DocumentList({ email, limit }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDocuments = async () => {
    try {
      const data = await documentApi.getUserDocuments(email)
      setDocuments(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch documents. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [email])

  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      await documentApi.deleteDocument(email, documentToDelete)
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      })
      fetchDocuments()
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

  if (isLoading) {
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

  const displayedDocuments = limit ? documents.slice(0, limit) : documents

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-brims-blue">
          <TableRow>
            <TableHead className="text-white">Name</TableHead>
            <TableHead className="text-white">Type</TableHead>
            <TableHead className="text-white">Uploaded</TableHead>
            <TableHead className="w-[80px] text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedDocuments.map((document) => (
            <TableRow key={document.filename}>
              <TableCell className="font-medium">{document.filename}</TableCell>
              <TableCell>{document.document_type}</TableCell>
              <TableCell>{format(new Date(document.created_at), "MMM d, yyyy")}</TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setDocumentToDelete(document.filename)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
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
                      <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

