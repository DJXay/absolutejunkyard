import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Absolute Junkyard',
  description: 'One man\'s junk is another man\'s treasure',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">
        {/* Navigation Bar */}
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="text-xl font-black text-white tracking-tighter">
                  ABSOLUTE<span className="text-blue-500">JUNKYARD</span>
                </Link>
              </div>

              {/* Links */}
              <div className="flex space-x-8">
                <Link href="/browse" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition">
                  Browse Junk
                </Link>
                <Link href="/post" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition">
                  Post an Item
                </Link>
              </div>

            </div>
          </div>
        </nav>

        {/* Page Content */}
        {children}
        
      </body>
    </html>
  )
}
