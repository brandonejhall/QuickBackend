"use client"

import { useState } from "react"
import DocumentList from "@/components/documents/document-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function ClientDocuments() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null)
  const { toast } = useToast()

  // This component would receive the selected user from UserLookup
  // For demo purposes, we'll use a mock user

  // In a real app, this would be set when a user is selected in UserLookup
  const handleUserSelected = (userId: string, userName: string) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    toast({
      title: "User documents loaded",
      description: `Viewing documents for ${userName}`,
    })
  }

  // For demo purposes, let's simulate a selected user
  if (!selectedUserId) {
    return (
      <Card>
        <CardHeader className="bg-brims-blue text-white">
          <CardTitle>Client Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Select a client to view their documents</p>
          {/* Demo button to simulate user selection */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => handleUserSelected("1", "John Doe")}
              className="text-sm text-brims-blue hover:underline"
            >
              (Demo: Load John Doe's documents)
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="bg-brims-blue text-white">
        <CardTitle>Documents for {selectedUserName}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <DocumentList userId={selectedUserId} />
      </CardContent>
    </Card>
  )
}

