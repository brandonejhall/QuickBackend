'use client'

import ProtectedRoute from '@/components/auth/protected-route'
import Image from "next/image"
import DocumentList from "@/components/documents/document-list"
import UploadDocument from "@/components/documents/upload-document"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@/context/auth-context'
import { useDocuments } from "@/context/document-context"

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { documents, isLoading } = useDocuments()

  // Admin-specific stats
  const totalDocuments = documents.length
  const totalUsers = new Set(documents.map(doc => doc.userId)).size
  const recentDocuments = documents.slice(0, 5)

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
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-brims-blue">Total Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{totalDocuments}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-brims-blue">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{totalUsers}</p>
                    </CardContent>
                  </Card>
                </div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-brims-blue">Admin Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button className="w-full rounded-md bg-brims-blue px-4 py-2 text-sm text-white hover:bg-brims-blue/90">
                      Manage Users
                    </button>
                    <button className="w-full rounded-md bg-brims-blue px-4 py-2 text-sm text-white hover:bg-brims-blue/90">
                      View Reports
                    </button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-brims-blue">Recent Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading documents...</p>
                  ) : recentDocuments.length > 0 ? (
                    <div className="space-y-4">
                      {recentDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">Uploaded by: {doc.userId}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No documents found</p>
                  )}
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