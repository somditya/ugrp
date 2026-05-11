import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to UGRP</h1>
        <p className="text-lg text-gray-600 mb-8">
          Full-stack monorepo with Next.js, Express.js, Prisma &amp; PostgreSQL
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/posts"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Posts
          </Link>
          <Link
            href="/api/health"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            API Health
          </Link>
        </div>
      </div>
    </main>
  );
}
