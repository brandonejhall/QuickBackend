"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// Mock users for demo
const MOCK_USERS = [
  { id: "1", email: "john.doe@example.com", name: "John Doe" },
  { id: "2", email: "jane.smith@example.com", name: "Jane Smith" },
  { id: "3", email: "bob.johnson@example.com", name: "Bob Johnson" },
]

export default function UserLookup() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<typeof MOCK_USERS>([])
  const [isSearching, setIsSearching] = useState(false)
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)

    // Simulate API call
    setTimeout(() => {
      const results = MOCK_USERS.filter((user) => user.email.toLowerCase().includes(searchTerm.toLowerCase()))

      setSearchResults(results)
      setIsSearching(false)

      if (results.length === 0) {
        toast({
          title: "No users found",
          description: `No users found matching "${searchTerm}"`,
        })
      }
    }, 500)
  }

  const handleSelectUser = (userId: string) => {
    // In a real app, this would select the user and show their documents
    console.log("Selected user:", userId)
    toast({
      title: "User selected",
      description: "User documents loaded successfully.",
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by email..."
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
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectUser(user.id)}
                  className="border-brims-blue text-brims-blue hover:bg-brims-blue/10"
                >
                  View Documents
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

