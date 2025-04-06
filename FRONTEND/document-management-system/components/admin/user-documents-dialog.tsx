"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import UploadDocument from "@/components/documents/upload-document"
import { documentApi } from "@/lib/api"
import { Trash2 } from "lucide-react"
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

interface UserDocumentsDialogProps {
  userId: number
  userEmail: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Document {
  filename: string
  document_type: string
  created_at: string
}

export default function UserDocumentsDialog({
  userId,
  userEmail,
  userName,
  open,
  onOpenChange
}: UserDocumentsDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadDocuments()
    }
  }, [open])

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const userDocs = await documentApi.getUserDocuments(userEmail)
      setDocuments(userDocs)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (filename: string) => {
    try {
      await documentApi.deleteDocument(userEmail, filename)
      toast({
        title: "Success",
        description: "Document deleted successfully"
      })
      loadDocuments() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/download/${userEmail}/${filename}`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Documents for {userName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <UploadDocument email={userEmail} />
          
          <div className="rounded-md border">
            <div className="bg-brims-blue p-2 text-sm font-medium text-white">Documents</div>
            <div className="divide-y">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium">{doc.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.filename)}
                    >
                      Download
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the document "{doc.filename}" from {userName}'s account.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(doc.filename)}
                            className="bg-red-500 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 