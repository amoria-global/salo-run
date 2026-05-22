'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listMembers, listRoles, inviteMember, updateMember,
  setMemberActive, removeMember, type MemberDto, type RoleDto,
} from '@/app/lib/APIs/team';
import { Can, usePermissions } from '@/app/lib/usePermissions';

/**
 * Users tab - list of team members in the caller's organization with
 * invite + role/department/active inline edits.
 *
 * The owner row is intentionally NOT listed (backend's
 * listTeamMembersByOrganizationId excludes self), so this page only ever
 * shows invited team members.
 */
export default function UsersPage() {
  const { hasPermission } = usePermissions();
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [query, setQuery] = useState('');

  const refresh = async () => {
    try {
      const [m, r] = await Promise.all([listMembers(), listRoles()]);
      setMembers(m.users);
      setRoles(r.roles);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m =>
      m.email.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      (m.department || '').toLowerCase().includes(q) ||
      (m.role?.name || '').toLowerCase().includes(q));
  }, [members, query]);

  if (loading) return <div style={{ color: '#6b7280' }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 1100 }}>
      {error && (
        <div style={{
          padding: 12, marginBottom: 14, borderRadius: 8,
          background: '#fef2f2', color: '#991b1b', fontSize: 13.5, border: '1px solid #fecaca',
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <input
          type="search" placeholder="Search team…" value={query} onChange={e => setQuery(e.target.value)}
          style={{ padding: '8px 12px', fontSize: 13.5, borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none', minWidth: 240 }}
        />
        <Can permission="users.create">
          <button onClick={() => setShowInvite(true)} style={primaryBtn}>+ Invite team member</button>
        </Can>
      </div>

      {showInvite && (
        <InviteModal
          roles={roles}
          onClose={() => setShowInvite(false)}
          onInvited={async () => { setShowInvite(false); await refresh(); }}
        />
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Department</Th><Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <UserRow key={m.id} member={m} roles={roles} onChanged={refresh} canEdit={hasPermission('users.edit')} canDelete={hasPermission('users.delete')} />
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
                {members.length === 0
                  ? <>No team members yet. {hasPermission('users.create') ? 'Click “Invite team member” to add one.' : 'Ask an owner to invite people.'}</>
                  : `No matches for “${query}”.`}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ member, roles, onChanged, canEdit, canDelete }: {
  member: MemberDto;
  roles: RoleDto[];
  onChanged: () => Promise<void> | void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const handleRoleChange = async (newRoleId: string) => {
    setBusy(true);
    try {
      await updateMember(member.id, { roleId: newRoleId || undefined });
      await onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  };
  const handleDeptChange = async (dep: string) => {
    setBusy(true);
    try {
      await updateMember(member.id, { department: dep });
      await onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  };
  const handleToggleActive = async () => {
    setBusy(true);
    try {
      await setMemberActive(member.id, !member.active);
      await onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally { setBusy(false); }
  };
  const handleRemove = async () => {
    if (!confirm(`Remove ${member.firstName} ${member.lastName} from your team? Their account will be detached but their history preserved.`)) return;
    setBusy(true);
    try {
      await removeMember(member.id);
      await onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Remove failed');
    } finally { setBusy(false); }
  };

  return (
    <tr style={{ borderTop: '1px solid #f4f4f5', background: !member.active ? '#fafafa' : undefined, opacity: !member.active ? 0.65 : 1 }}>
      <Td>{member.firstName} {member.lastName}</Td>
      <Td><a href={`mailto:${member.email}`} style={{ color: '#054d6f' }}>{member.email}</a></Td>
      <Td>
        {canEdit ? (
          <select value={member.role?.id ?? ''} onChange={e => handleRoleChange(e.target.value)} disabled={busy} style={inlineSelect}>
            <option value="">- No role -</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        ) : <span>{member.role?.name ?? '-'}</span>}
      </Td>
      <Td>
        {canEdit ? (
          <input
            defaultValue={member.department ?? ''}
            onBlur={e => { if ((e.target.value || '') !== (member.department || '')) void handleDeptChange(e.target.value); }}
            placeholder="-" disabled={busy}
            style={{ ...inlineSelect, minWidth: 140 }}
          />
        ) : <span>{member.department ?? '-'}</span>}
      </Td>
      <Td>
        <span style={{
          fontSize: 11.5, fontWeight: 600,
          padding: '3px 9px', borderRadius: 999,
          color: member.active ? '#065f46' : '#9a3412',
          background: member.active ? '#d1fae5' : '#ffedd5',
        }}>
          {member.active ? 'Active' : 'Inactive'}
        </span>
      </Td>
      <Td align="right">
        <div style={{ display: 'inline-flex', gap: 6 }}>
          {canEdit && (
            <button onClick={handleToggleActive} disabled={busy} style={secondaryBtn}>
              {member.active ? 'Deactivate' : 'Activate'}
            </button>
          )}
          {canDelete && (
            <button onClick={handleRemove} disabled={busy} style={dangerBtn}>Remove</button>
          )}
        </div>
      </Td>
    </tr>
  );
}

function InviteModal({ roles, onClose, onInvited }: {
  roles: RoleDto[];
  onClose: () => void;
  onInvited: () => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState<string>('');
  const [department, setDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    setBusy(true); setError(null);
    try {
      await inviteMember({ email: email.trim(), firstName, lastName, roleId: roleId || null, department });
      await onInvited();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invite failed');
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Invite team member</h3>
        {error && (
          <div style={{ padding: 10, borderRadius: 6, background: '#fef2f2', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={lbl}>Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="member@example.com" />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={lbl}>First name
              <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
            </label>
            <label style={lbl}>Last name
              <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <label style={lbl}>Role
            <select value={roleId} onChange={e => setRoleId(e.target.value)} style={inputStyle}>
              <option value="">- No role (no permissions) -</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label style={lbl}>Department (optional)
            <input value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle} placeholder="e.g. Editors, Sales, Support" />
          </label>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            They'll get an email with a temporary password and must change it on first sign-in.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={secondaryBtn} disabled={busy}>Cancel</button>
          <button onClick={submit} style={primaryBtn} disabled={busy}>{busy ? 'Inviting…' : 'Send invitation'}</button>
        </div>
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <th style={{ padding: '12px 14px', textAlign: align ?? 'left', fontSize: 11.5, fontWeight: 700, color: '#374151', letterSpacing: 0.5, textTransform: 'uppercase' }}>{children}</th>;
}
function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <td style={{ padding: '10px 14px', textAlign: align ?? 'left', color: '#111' }}>{children}</td>;
}

const lbl: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#374151' };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13.5, borderRadius: 6,
  border: '1px solid #e5e7eb', outline: 'none', marginTop: 4,
};
const inlineSelect: React.CSSProperties = {
  padding: '5px 8px', fontSize: 12.5, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none', background: '#fff',
};
const primaryBtn: React.CSSProperties = {
  padding: '8px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
  background: '#F20C8F', color: '#fff', border: 'none', cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  padding: '6px 12px', fontSize: 12.5, fontWeight: 600, borderRadius: 6,
  background: '#fff', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer',
};
const dangerBtn: React.CSSProperties = {
  padding: '6px 12px', fontSize: 12.5, fontWeight: 600, borderRadius: 6,
  background: '#fff', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer',
};
