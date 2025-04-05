"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DocumentSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [fileType, setFileType] = useState("all")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching for:", { searchTerm, fileType })
    // In a real app, this would filter documents
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search documents..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Select value={fileType} onValueChange={setFileType}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="File type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="docx">DOCX</SelectItem>
          <SelectItem value="txt">TXT</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" className="bg-brims-blue hover:bg-brims-blue/90">
        Search
      </Button>
    </form>
  )
}

