import type { Metadata } from "next"
import Image from "next/image"
import UserLookup from "@/components/admin/user-lookup"
import ClientDocuments from "@/components/admin/client-documents"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Admin | BRIMS Document Management System",
  description: "Admin dashboard for document management",
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brims-blue">Admin Dashboard</h1>

      <Card className="mb-6">
        <CardHeader className="bg-brims-blue text-white">
          <CardTitle>BRIMS Document Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4 md:flex-row md:items-start md:space-x-6 md:space-y-0">
            <Image
              src="/founder.jpeg"
              alt="BRIMS Founder"
              width={150}
              height={150}
              className="rounded-lg border-4 border-brims-blue"
            />
            <div>
              <h2 className="mb-2 text-xl font-bold text-brims-blue">Bold Realty Investment and Management Services</h2>
              <p className="text-muted-foreground">
                Welcome to the BRIMS admin dashboard. Here you can manage users and their documents. Our document
                management system helps realtors and clients securely store and access important real estate documents.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-brims-blue">User Lookup</h2>
          <UserLookup />
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold text-brims-blue">Client Documents</h2>
          <ClientDocuments />
        </div>
      </div>
    </div>
  )
}

