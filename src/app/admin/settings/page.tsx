'use client';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <p className="text-gray-600">
        This page requires database configuration. Please add Supabase environment variables in your Render dashboard.
      </p>
    </div>
  );
}