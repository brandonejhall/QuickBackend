"use client"

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">File Access Test Page</h1>
      
      <div className="mb-8">
        <h2 className="mb-2 text-xl">Base64 Image Test (should work):</h2>
        <div className="border p-4">
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
            alt="Test Base64 Image"
            width={100}
            height={100}
            className="rounded-lg"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-xl">Image Test with absolute path:</h2>
        <div className="border p-4">
          <img
            src="http://localhost:3000/logo-with-slogan.png"
            alt="BRIMS Logo with absolute path"
            width={160}
            height={40}
            className="h-auto w-full max-w-[160px]"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-xl">Image Test with data URL:</h2>
        <div className="border p-4">
          <img
            src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSAkKCAkKCAkKCAkKCAkKCAkKCAkKCAkKCAkKCAkKCAkKCAkKCAkKCD/2wBDARUXFyAeIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gIB4gCD/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            alt="Test JPEG Image"
            width={100}
            height={100}
            className="rounded-lg"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-xl">Test File Access:</h2>
        <div className="space-y-2">
          <a 
            href="http://localhost:3000/test.txt" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block text-blue-500 hover:underline"
          >
            Open test.txt (absolute URL)
          </a>
          <a 
            href="/test.txt" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block text-blue-500 hover:underline"
          >
            Open test.txt (relative URL)
          </a>
        </div>
      </div>
    </div>
  )
} 