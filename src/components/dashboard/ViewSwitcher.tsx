'use client';

import { useRouter } from 'next/navigation';
import { Users, Briefcase } from 'lucide-react';

type ViewSwitcherProps = {
  currentView: 'admin' | 'employee';
  currentSection?: string;
};

// Map of related sections between admin and employee views
const sectionMap: { admin: Record<string, string>; employee: Record<string, string> } = {
  // Admin sections mapped to employee sections
  admin: {
    'users': 'profile',
    'tasks': 'tasks',
    'attendance': 'attendance',
    'chat': 'chat',
    'projects': 'tasks',
    'analytics': 'dashboard',
    'settings': 'profile',
    'default': 'dashboard'
  },
  // Employee sections mapped to admin sections
  employee: {
    'dashboard': '',
    'tasks': 'tasks',
    'attendance': 'attendance',
    'chat': 'chat',
    'profile': 'users',
    'default': ''
  }
};

export default function ViewSwitcher({ currentView, currentSection = 'default' }: ViewSwitcherProps) {
  const router = useRouter();
  
  // Determine the target view and section
  const targetView = currentView === 'admin' ? 'employee' : 'admin';
  
  // Safely access the section map with fallbacks
  const currentViewMap = sectionMap[currentView] || {};
  const targetSection = (currentSection && currentViewMap[currentSection]) || currentViewMap['default'] || '';
  
  // Construct the target URL
  const targetUrl = `/${targetView}${targetSection ? `/${targetSection}` : ''}`;
  
  // Determine the icon and text based on the target view
  const Icon = targetView === 'admin' ? Briefcase : Users;
  const text = targetView === 'admin' ? 'Switch to Admin View' : 'Switch to Employee View';
  
  const handleSwitch = () => {
    router.push(targetUrl);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Switch view on Enter or Space key
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSwitch();
    }
  };
  
  return (
    <button
      onClick={handleSwitch}
      onKeyDown={handleKeyDown}
      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      role="switch"
      aria-checked={currentView === 'admin'}
      aria-label={text}
      tabIndex={0}
    >
      <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</span>
    </button>
  );
}
