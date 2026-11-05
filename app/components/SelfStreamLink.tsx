'use client';

/** "Want to stream it yourself? Go live": the short way from the create event form into the Go live flow. */
import React from 'react';
import Link from 'next/link';

export default function SelfStreamLink({ href, color, linkColor }: { href: string; color: string; linkColor: string }) {
  return (
    <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color }}>
      Want to stream it yourself?{' '}
      <Link href={href} aria-label="Go live. Host your own event" style={{ color: linkColor, fontWeight: 700 }}>Go live</Link>
    </p>
  );
}
