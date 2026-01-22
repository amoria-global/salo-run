"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDashboardAuth, type DashboardUser } from '../providers/AuthProvider';

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
  title: string;
  country: string;
  province: string;
  district: string;
  sector: string;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

/**
 * Create profile from auth user data
 */
function createProfileFromUser(user: DashboardUser | null): UserProfile {
  if (!user) {
    return {
      fullName: '',
      username: '',
      email: '',
      phoneCode: '+250',
      phoneNumber: '',
      title: 'Client',
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Gasabo',
      sector: 'Kimironko',
    };
  }

  // Parse phone number to extract code and number
  const phone = user.phone || '';
  let phoneCode = '+250';
  let phoneNumber = phone;

  // Try to extract country code if present
  if (phone.startsWith('+')) {
    const match = phone.match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) {
      phoneCode = match[1];
      phoneNumber = match[2];
    }
  }

  return {
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    username: user.email?.split('@')[0] || '',
    email: user.email || '',
    phoneCode,
    phoneNumber,
    title: user.customerType === 'photographer' ? 'Photographer' : 'Client',
    country: 'Rwanda',
    province: 'Kigali City',
    district: 'Gasabo',
    sector: 'Kimironko',
  };
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  // Get user from auth context
  let authUser: DashboardUser | null = null;
  try {
    const auth = useDashboardAuth();
    authUser = auth.user;
  } catch {
    // Auth provider not ready yet, use null
  }

  const [profile, setProfile] = useState<UserProfile>(() => createProfileFromUser(authUser));

  // Update profile when auth user changes
  useEffect(() => {
    if (authUser) {
      setProfile(prev => ({
        ...prev,
        fullName: `${authUser.firstName} ${authUser.lastName}`.trim(),
        email: authUser.email || prev.email,
        username: authUser.email?.split('@')[0] || prev.username,
        title: authUser.customerType === 'photographer' ? 'Photographer' : 'Client',
      }));
    }
  }, [authUser?.id, authUser?.firstName, authUser?.lastName, authUser?.email, authUser?.customerType]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
