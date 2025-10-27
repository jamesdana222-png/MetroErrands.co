'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  
  // Check if this is a login page
  const isLoginPage = pathname?.includes('/login');
  
  // Only show sidebar if authenticated and not on login page
  const showSidebar = isAuthenticated && !isLoading && !isLoginPage;
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {showSidebar && <Sidebar />}
      <main className={`${showSidebar ? 'flex-1' : 'w-full'} p-6 overflow-auto`}>
        {children}
      </main>
    </div>
  );
}