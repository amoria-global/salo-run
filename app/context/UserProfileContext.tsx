"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

// Default profile data (will be replaced by backend data later)
const defaultProfile: UserProfile = {
  fullName: 'Diane Marry',
  username: 'diane_marry',
  email: 'dianemarry@gmail.com',
  phoneCode: '+250',
  phoneNumber: '788 123 456',
  title: 'Client',
  country: 'Rwanda',
  province: 'Kigali City',
  district: 'Gasabo',
  sector: 'Kimironko',
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

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
