import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react' // Assuming you have lucide-react (standard in shadcn)

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-xl w-full mx-auto text-center space-y-8">
        
        {/* Brand Badge - Adds a professional touch */}
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-border bg-surface text-xs font-medium text-gray-400 mb-4">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
          System Status: Operational
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-text">
          Close Deals <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
            Faster & Smarter
          </span>
        </h1>
        
        <p className="text-lg text-gray-400 max-w-md mx-auto leading-relaxed">
          Welcome to <span className="text-text font-semibold">SalesFlow</span>. 
          The intelligent workspace for managing pipelines, tracking activities, and securing client data.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link 
            href="/auth/login" 
            className="group inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-background font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg shadow-primary/20"
          >
            Access Workspace
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          {/* Optional: Secondary button if you have a public 'About' page */}
          {/* <Link href="/about" className="...">Learn More</Link> */}
        </div>
        
        <div className="mt-16 pt-8 border-t border-border/50">
          <p className="text-sm font-medium text-gray-500 mb-6 uppercase tracking-wider">
            Powering High-Performance Teams
          </p>
          
          {/* Grid layout for features looks more premium than a vertical list */}
          <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
            {[
              "AI Risk Analysis",
              "Visual Pipelines",
              "Secure Audit Logs",
              "Smart Calendar"
            ].map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}