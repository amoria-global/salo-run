"use client";
import { useEffect } from 'react';
import { getLandingUrl } from '@/lib/urls';

export default function Home() {
  useEffect(() => {
    window.location.href = getLandingUrl();
  }, []);
  return null;
}
 