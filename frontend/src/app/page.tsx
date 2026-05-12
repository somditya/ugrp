import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">UGRP</h1>
        <p className="text-lg text-gray-600 mb-8">
          University Grievance Redressal Portal
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/grievances"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            File a Grievance
          </Link>
          <Link
            href="/departments"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Departments
          </Link>
        </div>
      </div>
    </main>
  );
}