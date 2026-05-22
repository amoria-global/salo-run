'use client';

import { useEffect, useState } from 'react';
import { listPermissions, type PermissionCatalog } from '@/app/lib/APIs/team';

/**
 * Read-only catalog of org-scoped permissions, grouped by category as
 * defined in PermissionRegistry on the backend. Photographers / clients /
 * event-coordinators don't edit this list - they just reference it
 * while building custom roles.
 */
export default function PermissionsPage() {
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setCatalog(await listPermissions());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ color: '#6b7280' }}>Loading…</div>;
  if (error) return <ErrorPanel message={error} />;
  if (!catalog) return null;

  const q = query.trim().toLowerCase();
  const filteredEntries = Object.entries(catalog.categories).map(([cat, perms]) => {
    const filtered = !q
      ? perms
      : perms.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    return [cat, filtered] as const;
  }).filter(([, perms]) => perms.length > 0);

  return (
    <div style={{ maxWidth: 920 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, gap: 12, flexWrap: 'wrap',
      }}>
        <p style={{ color: '#6b7280', fontSize: 13.5, margin: 0 }}>
          {catalog.total} system permission{catalog.total !== 1 ? 's' : ''} across {Object.keys(catalog.categories).length} categor{Object.keys(catalog.categories).length === 1 ? 'y' : 'ies'}. Assign these to custom roles on the Roles tab.
        </p>
        <input
          type="search"
          placeholder="Filter…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: 13.5, borderRadius: 8,
            border: '1px solid #e5e7eb', outline: 'none', minWidth: 220,
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {filteredEntries.map(([cat, perms]) => (
          <section key={cat} style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden',
          }}>
            <header style={{
              padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #e5e7eb',
              fontSize: 13, fontWeight: 700, color: '#111', letterSpacing: 0.2,
            }}>
              {cat} · <span style={{ color: '#6b7280', fontWeight: 500 }}>{perms.length} permission{perms.length !== 1 ? 's' : ''}</span>
            </header>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {perms.map(p => (
                <li key={p.name} style={{
                  padding: '12px 16px', borderTop: '1px solid #f4f4f5',
                  display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 2fr', gap: 12,
                }}>
                  <code style={{
                    fontSize: 12.5, color: '#054d6f', background: '#eef6fb',
                    padding: '3px 8px', borderRadius: 6, alignSelf: 'flex-start', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
                  }}>
                    {p.name}
                  </code>
                  <span style={{ fontSize: 13.5, color: '#374151' }}>{p.description}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {filteredEntries.length === 0 && (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>
            No permissions match “{query}”.
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div style={{
      padding: 14, borderRadius: 8,
      background: '#fef2f2', color: '#991b1b', fontSize: 13.5,
      border: '1px solid #fecaca',
    }}>
      {message}
    </div>
  );
}
