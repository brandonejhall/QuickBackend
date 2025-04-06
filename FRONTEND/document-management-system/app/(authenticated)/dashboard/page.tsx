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

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const { documents, isLoading } = useDocuments()

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
                  <DocumentList email={user?.email || ''} limit={10} />
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