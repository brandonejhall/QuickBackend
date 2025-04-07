"use client"

import { useDocuments } from "@/context/document-context"
import { Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function AdminDocumentList() {
  const { documents, isLoading, downloadDocument, deleteDocument } = useDocuments()
  const { toast } = useToast()

  const handleDownload = async (filename: string, email: string) => {
    try {
      await downloadDocument(filename, email)
      toast({
        title: "Success",
        description: "Document downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string, filename: string, email: string) => {
    try {
      await deleteDocument(id)
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading documents...</div>
  }

  if (documents.length === 0) {
    return <div>No documents found</div>
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{doc.name}</h3>
              <p className="text-sm text-muted-foreground">
                Uploaded by: {doc.uploadedBy} | {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">Type: {doc.type}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDownload(doc.name, doc.userId)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDelete(doc.id, doc.name, doc.userId)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 