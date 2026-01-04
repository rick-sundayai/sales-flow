import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold text-text mb-6">
          Welcome to <br />
          <span className="text-primary">Auth Template</span>
        </h1>
        
        <p className="text-gray-400 mb-8">
          A clean and secure authentication template built with Next.js 15 and Supabase.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/auth/login" 
            className="block w-full bg-primary hover:bg-primary/90 text-background font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Sign In
          </Link>
          
          <Link 
            href="/auth/register" 
            className="block w-full bg-surface hover:bg-surface/80 border border-border text-text font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Create Account
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-text mb-4">Features</h2>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>✓ Next.js 15 with App Router</li>
            <li>✓ Supabase Authentication</li>
            <li>✓ TypeScript Support</li>
            <li>✓ Tailwind CSS Styling</li>
            <li>✓ Route Protection</li>
            <li>✓ User Management</li>
          </ul>
        </div>
      </div>
    </div>
  )
}