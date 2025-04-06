'use client'

import ProtectedRoute from '@/components/auth/protected-route'
import Image from "next/image"
import DocumentList from "@/components/documents/document-list"
import UserLookup from "@/components/admin/user-lookup"
import UploadDocument from "@/components/documents/upload-document"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@/context/auth-context'
import { useDocuments } from "@/context/document-context"
import { documentApi } from "@/lib/api"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
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

interface RecentUpload {
  id: number
  filename: string
  document_type: string
  created_at: string
  user: {
    email: string
    fullname: string
  }
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { documents, isLoading } = useDocuments()
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isAdmin) {
      loadRecentUploads()
    }
  }, [isAdmin])

  const loadRecentUploads = async () => {
    try {
      const uploads = await documentApi.getRecentUploads()
      setRecentUploads(uploads)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load recent uploads",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (filename: string, userEmail: string) => {
    try {
      await documentApi.deleteDocument(userEmail, filename)
      toast({
        title: "Success",
        description: "Document deleted successfully"
      })
      loadRecentUploads() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      })
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-brims-blue">
          {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
        </h1>

        {isAdmin ? (
          // Admin Dashboard Content
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-brims-blue">User Lookup</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserLookup />
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-brims-blue">Welcome to BRIMS</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <Image
                    src="/founder.jpeg"
                    alt="BRIMS Founder"
                    width={200}
                    height={200}
                    className="rounded-lg border-4 border-brims-blue"
                    priority
                  />
                  <p className="text-center text-sm text-muted-foreground">
                    Welcome to the BRIMS Document Management System. We're here to help you manage your real estate documents
                    efficiently.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-brims-blue">Recent Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="bg-brims-blue p-2 text-sm font-medium text-white">Last 10 Uploads</div>
                    <div className="divide-y">
                      {recentUploads.map((upload) => (
                        <div key={upload.id} className="flex items-center justify-between p-3">
                          <div>
                            <p className="font-medium">{upload.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {upload.document_type} • {new Date(upload.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded by: {upload.user.fullname} ({upload.user.email})
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the document "{upload.filename}" uploaded by {upload.user.fullname}.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(upload.filename, upload.user.email)}
                                  className="bg-red-500 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          // Regular User Dashboard Content
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <DashboardStats />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-brims-blue">Welcome to BRIMS</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <Image
                    src="/founder.jpeg"
                    alt="BRIMS Founder"
                    width={200}
                    height={200}
                    className="rounded-lg border-4 border-brims-blue"
                    priority
                  />
                  <p className="text-center text-sm text-muted-foreground">
                    Welcome to the BRIMS Document Management System. We're here to help you manage your real estate documents
                    efficiently.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-brims-blue">Upload Document</h2>
                <UploadDocument email={user?.email || ''} />
              </div>
              <div>
                <h2 className="mb-4 text-xl font-semibold text-brims-blue">Recent Documents</h2>
                <DocumentList email={user?.email || ''} limit={5} />
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
} 