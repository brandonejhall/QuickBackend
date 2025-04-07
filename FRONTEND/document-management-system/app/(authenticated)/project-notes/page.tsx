'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import ProtectedRoute from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Download, Trash2, Upload } from 'lucide-react'
import { projectNotesApi, ProjectNote } from '@/lib/api'
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
} from '@/components/ui/alert-dialog'

export default function ProjectNotesPage() {
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      fetchNotes()
    }
  }, [isAdmin])

  const fetchNotes = async () => {
    try {
      const data = await projectNotesApi.getProjectNotes()
      setNotes(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch project notes',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      if (selectedFile) {
        formData.append('file', selectedFile)
      }

      const newNote = await projectNotesApi.createProjectNote(formData)
      setNotes([newNote, ...notes])
      setTitle('')
      setDescription('')
      setSelectedFile(null)
      toast({
        title: 'Success',
        description: 'Project note created successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project note',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (noteId: number) => {
    try {
      await projectNotesApi.deleteProjectNote(noteId)
      setNotes(notes.filter(note => note.id !== noteId))
      toast({
        title: 'Success',
        description: 'Project note deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project note',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = async (noteId: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const updatedNote = await projectNotesApi.updateProjectNote(noteId, formData)
      setNotes(notes.map(note => note.id === noteId ? updatedNote : note))
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async (noteId: number, fileName: string) => {
    try {
      const blob = await projectNotesApi.downloadFile(noteId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      })
    }
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You do not have permission to access this page.</p>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Project Notes</h1>

        <Card>
          <CardHeader>
            <CardTitle>Create New Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter note title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter note description"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Attach File (Optional)</label>
                <Input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Note'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{note.title}</CardTitle>
                  <div className="flex space-x-2">
                    {note.file_id && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(note.id, note.file_name!)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this project note and any associated files.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(note.id)}
                            className="bg-red-500 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{note.description}</p>
                {note.file_name && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Attached file: {note.file_name}</span>
                  </div>
                )}
                <div className="mt-4">
                  <Input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(note.id, file)
                    }}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
} 