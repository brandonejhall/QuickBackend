import LoginForm from "@/components/auth/login-form"

export default function Home() {
  // Normally we would check auth state here and redirect
  // For MVP testing, we'll just show the login form
  // const isAuthenticated = true
  // if (isAuthenticated) redirect("/dashboard")

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
      <LoginForm />
    </div>
  )
}

