'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user data from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile data:', error);
          return;
        }
        
        if (data) {
          setProfileData({
            name: data.name || '',
            email: data.email || '',
            department: data.department || '',
            position: data.position || ''
          });
        }
      } catch (error) {
        console.error('Error in fetchProfileData:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-2 rounded-full mr-4">
            <User size={32} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-medium">{profileData.name}</h2>
            <p className="text-gray-500">{profileData.position}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">Email</p>
            <p>{profileData.email}</p>
          </div>
          
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500">Department</p>
            <p>{profileData.department}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Position</p>
            <p>{profileData.position}</p>
          </div>
        </div>
      </div>
    </div>
  );
}