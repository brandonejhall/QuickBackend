"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { documentApi } from "@/lib/api"
import UserDocumentsDialog from "./user-documents-dialog"

interface User {
  id: number
  email: string
  fullname: string
  role: string
}

export default function UserLookup() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)

    try {
      const results = await documentApi.searchUsers(searchTerm)
      setSearchResults(results)
      
      if (results.length === 0) {
        toast({
          title: "No users found",
          description: `No users found matching "${searchTerm}"`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by email or name..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isSearching} className="bg-brims-blue hover:bg-brims-blue/90">
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {searchResults.length > 0 && (
        <div className="rounded-md border">
          <div className="bg-brims-blue p-2 text-sm font-medium text-white">Found {searchResults.length} user(s)</div>
          <div className="divide-y">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{user.fullname}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectUser(user)}
                  className="border-brims-blue text-brims-blue hover:bg-brims-blue/10"
                >
                  View Documents
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <UserDocumentsDialog
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          userName={selectedUser.fullname}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        />
      )}
    </div>
  )
}

