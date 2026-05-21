'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listRoles, createRole, updateRole, deleteRole, listPermissions,
  type RoleDto, type PermissionCatalog,
} from '@/app/lib/APIs/team';
import { Can, usePermissions } from '@/app/lib/usePermissions';

/**
 * Roles tab.
 *
 * Lists roles in the caller's organization + supports create/edit/delete.
 * Each row exposes the permission grant inline as a chip list; clicking
 * Edit opens an inline editor with category-grouped checkboxes.
 *
 * The permission catalog is fetched once on mount so the editor can
 * render category panels without round-tripping per role.
 */
export default function RolesPage() {
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RoleDto | 'new' | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [r, c] = await Promise.all([listRoles(), listPermissions()]);
      setRoles(r.roles);
      setCatalog(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); }, []);

  const handleDelete = async (r: RoleDto) => {
    if (!confirm(`Delete role "${r.name}"? Team members using this role must be reassigned first.`)) return;
    setSavingId(r.id);
    try {
      await deleteRole(r.id);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div style={{ color: '#6b7280' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 1040 }}>
      {error && (
        <div style={{
          padding: 12, marginBottom: 14, borderRadius: 8,
          background: '#fef2f2', color: '#991b1b', fontSize: 13.5, border: '1px solid #fecaca',
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 13.5 }}>
          {roles.length} role{roles.length !== 1 ? 's' : ''} in your organization.
        </p>
        <Can permission="roles.create">
          <button
            onClick={() => setEditing('new')}
            style={primaryBtn}
          >
            + New role
          </button>
        </Can>
      </div>

      {editing && catalog && (
        <RoleEditor
          role={editing === 'new' ? null : editing}
          catalog={catalog}
          onCancel={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refresh(); }}
        />
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {roles.map(r => (
          <article key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#111' }}>{r.name}</h3>
                {r.description && <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#6b7280' }}>{r.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {hasPermission('roles.edit') && (
                  <button onClick={() => setEditing(r)} style={secondaryBtn} disabled={savingId === r.id}>Edit</button>
                )}
                {hasPermission('roles.delete') && (
                  <button onClick={() => handleDelete(r)} style={dangerBtn} disabled={savingId === r.id}>Delete</button>
                )}
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {r.permissions.length === 0
                ? <span style={{ fontSize: 12.5, color: '#9ca3af' }}>No permissions assigned</span>
                : r.permissions.map(p => <PermChip key={p} name={p} />)}
            </div>
          </article>
        ))}
        {roles.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', color: '#6b7280' }}>
            No roles yet. {hasPermission('roles.create') ? 'Create one to start assigning permissions to team members.' : 'Ask an owner to create roles.'}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleEditor({ role, catalog, onCancel, onSaved }: {
  role: RoleDto | null;
  catalog: PermissionCatalog;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(role?.permissions ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFlat = useMemo(
    () => Object.values(catalog.categories).flatMap(arr => arr.map(p => p.name)),
    [catalog]);

  const toggle = (n: string) => setSelected(s => {
    const next = new Set(s);
    if (next.has(n)) next.delete(n); else next.add(n);
    return next;
  });
  const toggleCat = (perms: string[]) => setSelected(s => {
    const next = new Set(s);
    const allOn = perms.every(p => next.has(p));
    perms.forEach(p => allOn ? next.delete(p) : next.add(p));
    return next;
  });

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(null);
    try {
      if (role) {
        await updateRole(role.id, { name: name.trim(), description, permissions: Array.from(selected) });
      } else {
        await createRole({ name: name.trim(), description, permissions: Array.from(selected) });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <section style={{ ...cardStyle, marginBottom: 20, border: '2px solid #F20C8F' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>{role ? `Edit role: ${role.name}` : 'New role'}</h3>
      {error && (
        <div style={{ padding: 10, borderRadius: 6, background: '#fef2f2', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Name
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Manager" />
        </label>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Description (optional)
          <input value={description ?? ''} onChange={e => setDescription(e.target.value)} style={inputStyle} placeholder="What this role is for" />
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', letterSpacing: 0.2 }}>
          Permissions ({selected.size}/{allFlat.length} selected)
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => setSelected(new Set(allFlat))} style={ghostBtn}>Select all</button>
          <button type="button" onClick={() => setSelected(new Set())} style={ghostBtn}>Clear</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflow: 'auto', padding: 2 }}>
        {Object.entries(catalog.categories).map(([cat, perms]) => {
          const allOn = perms.every(p => selected.has(p.name));
          const someOn = perms.some(p => selected.has(p.name));
          return (
            <div key={cat} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={allOn}
                  ref={el => { if (el) el.indeterminate = !allOn && someOn; }}
                  onChange={() => toggleCat(perms.map(p => p.name))}
                />
                <strong style={{ fontSize: 13, color: '#111' }}>{cat}</strong>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  ({perms.filter(p => selected.has(p.name)).length}/{perms.length})
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                {perms.map(p => (
                  <label key={p.name} title={p.description} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: '#374151',
                    padding: '4px 6px', borderRadius: 6,
                    background: selected.has(p.name) ? 'rgba(242,12,143,0.07)' : 'transparent',
                    cursor: 'pointer',
                  }}>
                    <input type="checkbox" checked={selected.has(p.name)} onChange={() => toggle(p.name)} />
                    <code style={{ fontSize: 11.5, color: '#054d6f', fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace' }}>{p.name}</code>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <button onClick={onCancel} style={secondaryBtn} disabled={saving}>Cancel</button>
        <button onClick={handleSave} style={primaryBtn} disabled={saving}>{saving ? 'Saving…' : (role ? 'Save changes' : 'Create role')}</button>
      </div>
    </section>
  );
}

function PermChip({ name }: { name: string }) {
  return (
    <code style={{
      fontSize: 11.5, color: '#054d6f', background: '#eef6fb',
      padding: '2px 8px', borderRadius: 999, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
    }}>{name}</code>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
  padding: '14px 16px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13.5, borderRadius: 6,
  border: '1px solid #e5e7eb', outline: 'none', marginTop: 4,
};
const primaryBtn: React.CSSProperties = {
  padding: '8px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
  background: '#F20C8F', color: '#fff', border: 'none', cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  padding: '8px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
  background: '#fff', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer',
};
const dangerBtn: React.CSSProperties = {
  padding: '8px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
  background: '#fff', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer',
};
const ghostBtn: React.CSSProperties = {
  padding: '5px 9px', fontSize: 12, fontWeight: 600, borderRadius: 6,
  background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', cursor: 'pointer',
};
