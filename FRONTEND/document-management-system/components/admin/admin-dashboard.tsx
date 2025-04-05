'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { useDocuments } from "@/context/document-context"

export default function AdminDashboard() {
  const { user } = useAuth()
  const { documents, isLoading } = useDocuments()

  // Calculate admin stats
  const totalDocuments = documents.length
  const totalUsers = new Set(documents.map(doc => doc.userId)).size
  const recentDocuments = documents.slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brims-blue">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
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
      </div>

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
  )
} 