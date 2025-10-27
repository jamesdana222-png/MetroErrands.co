'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MfaSetup from '@/components/auth/MfaSetup';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium capitalize">{user.role || 'Customer'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="font-medium">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => logout()}
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="account">Account Settings</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>Account settings will be available soon.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and authentication methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showMfaSetup ? (
                    <MfaSetup onComplete={() => setShowMfaSetup(false)} />
                  ) : (
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start">
                          <Shield className="h-6 w-6 text-primary-600 mr-3 mt-0.5" />
                          <div>
                            <h3 className="font-medium">Multi-Factor Authentication</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Add an extra layer of security to your account by requiring a verification code in addition to your password.
                            </p>
                            <Button 
                              variant="outline" 
                              className="mt-3"
                              onClick={() => setShowMfaSetup(true)}
                            >
                              Setup MFA
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start">
                          <Shield className="h-6 w-6 text-primary-600 mr-3 mt-0.5" />
                          <div>
                            <h3 className="font-medium">Password</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Change your password or reset it if you've forgotten it.
                            </p>
                            <Button 
                              variant="outline" 
                              className="mt-3"
                              onClick={() => router.push('/auth/reset-password')}
                            >
                              Change Password
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}