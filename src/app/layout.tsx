import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Lunasin AI — Dashboard Cashflow UMKM",
  description: "Asisten Keuangan Pintar untuk UMKM Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans flex flex-col">
        {/* Navigation Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Lunasin AI
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded font-mono border border-indigo-500/30">
                  MVP
                </span>
              </Link>
              <nav className="hidden md:flex space-x-1 text-sm font-medium">
                <Link
                  href="/"
                  className="px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/invoices"
                  className="px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Invoices
                </Link>
                <Link
                  href="/clients"
                  className="px-3 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Clients
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col text-right text-xs">
                <span className="font-semibold text-slate-200">Mitra Abadi Jaya</span>
                <span className="text-slate-400">Tenant default</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white">
                M
              </div>
            </div>
          </div>
          {/* Mobile navigation */}
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-2 flex justify-around text-xs font-semibold">
            <Link href="/" className="text-slate-300 hover:text-white py-1">
              Dashboard
            </Link>
            <Link href="/invoices" className="text-slate-300 hover:text-white py-1">
              Invoices
            </Link>
            <Link href="/clients" className="text-slate-300 hover:text-white py-1">
              Clients
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            Lunasin AI © {new Date().getFullYear()} — Built for H0 Hackathon (Vercel v0 + AWS Databases)
          </div>
        </footer>
      </body>
    </html>
  );
}
