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
  profilePicture?: string;
  joinedFrom?: string;
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

  // Parse address if available (format: "sector, district, province, country" or similar)
  let country = 'Rwanda';
  let province = '';
  let district = '';
  let sector = '';
  if (user.address) {
    const parts = user.address.split(',').map(p => p.trim());
    if (parts.length >= 4) {
      sector = parts[0];
      district = parts[1];
      province = parts[2];
      country = parts[3];
    } else if (parts.length >= 2) {
      district = parts[0];
      province = parts[1];
      if (parts[2]) country = parts[2];
    } else {
      sector = user.address;
    }
  }

  // Map customerType to display title
  const typeMap: Record<string, string> = {
    photographer: 'Photographer',
    'event-coordinator': 'Event Coordinator',
    client: 'Client',
    Videographer: 'Videographer',
  };
  const title = typeMap[user.customerType] || user.customerType || 'Client';

  return {
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    username: user.email?.split('@')[0] || '',
    email: user.email || '',
    phoneCode,
    phoneNumber,
    title,
    country,
    province,
    district,
    sector,
    profilePicture: user.profilePicture || undefined,
    joinedFrom: user.joinedFrom || undefined,
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
      const typeMap: Record<string, string> = {
        photographer: 'Photographer',
        'event-coordinator': 'Event Coordinator',
        client: 'Client',
        Videographer: 'Videographer',
      };
      setProfile(prev => ({
        ...prev,
        fullName: `${authUser.firstName} ${authUser.lastName}`.trim(),
        email: authUser.email || prev.email,
        username: authUser.email?.split('@')[0] || prev.username,
        title: typeMap[authUser.customerType] || authUser.customerType || prev.title,
        profilePicture: authUser.profilePicture || prev.profilePicture,
        joinedFrom: authUser.joinedFrom || prev.joinedFrom,
      }));
    }
  }, [authUser?.id, authUser?.firstName, authUser?.lastName, authUser?.email, authUser?.customerType, authUser?.profilePicture, authUser?.joinedFrom]);

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
