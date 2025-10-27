import AuthForm from '@/components/auth/AuthForm';
import { Metadata } from 'next';
import AuthPageClient from '@/components/auth/AuthPageClient';

export const metadata: Metadata = {
  title: 'Authentication | MetroErrandCo',
  description: 'Sign in or create an account with MetroErrandCo',
};

export default function AuthPage() {
  return (
    <AuthPageClient>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <AuthForm />
        </div>
      </div>
    </AuthPageClient>
  );
}