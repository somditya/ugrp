import Link from 'next/link';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              UGRP
            </Link>
            <div className="flex gap-4">
              <Link href="/posts" className="text-gray-600 hover:text-gray-900">
                Posts
              </Link>
              <Link href="/api/health" className="text-gray-600 hover:text-gray-900">
                API
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-100 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} UGRP
      </footer>
    </div>
  );
}
