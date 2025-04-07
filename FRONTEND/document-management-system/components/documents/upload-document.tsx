"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useDocuments } from "@/context/document-context"
import { documentApi } from "@/lib/api"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

interface UploadDocumentProps {
  email: string;
}

export default function UploadDocument({ email }: UploadDocumentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadDocument } = useDocuments()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const selectedFile = e.target.files[0]

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file.",
      })
      return
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
      })
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setProgress(0)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          return prev + 5
        })
      }, 100)

      // Upload the file
      await documentApi.uploadDocument(file, {
        filename: file.name,
        document_type: file.type,
        email: email // Use the provided email
      })

      // Complete the upload
      clearInterval(interval)
      setProgress(100)

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      })

      // Reset form
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
      })
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-brims-blue/30 bg-brims-blue/5 p-6">
        <Upload className="mb-2 h-8 w-8 text-brims-blue" />
        <p className="mb-1 text-sm font-medium">Drag and drop your file here</p>
        <p className="mb-4 text-xs text-muted-foreground">PDF, DOCX, or TXT up to 10MB</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
          disabled={isUploading}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="border-brims-blue text-brims-blue hover:bg-brims-blue/10"
        >
          Select File
        </Button>
      </div>

      {file && (
        <div className="rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileIcon type={file.type} />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isUploading}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isUploading && (
            <div className="mt-2 space-y-1">
              <Progress value={progress} className="h-2 bg-gray-200 [&>div]:bg-brims-blue" />
              <p className="text-right text-xs text-muted-foreground">{progress}%</p>
            </div>
          )}

          {!isUploading && (
            <Button
              className="mt-2 w-full bg-brims-blue hover:bg-brims-blue/90"
              onClick={handleUpload}
              disabled={!file}
            >
              Upload
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function FileIcon({ type }: { type: string }) {
  let color = "text-brims-blue"

  if (type === "application/pdf") {
    color = "text-red-500"
  } else if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    color = "text-brims-blue"
  } else if (type === "text/plain") {
    color = "text-gray-500"
  }

  return <FileText className={`h-8 w-8 ${color}`} />
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

