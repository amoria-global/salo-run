'use client';

/** Compare goals: pick, create, edit or delete a plan. The active plan's targets show as progress on the cards. */
import { useState } from 'react';
import { Pencil, Plus, Target, Trash2 } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { useLanguage } from '@/app/context/LanguageContext';
import type { Period } from './homeData';
import type { Plan, PlanDraft, useGoals } from './useGoals';

type Goals = ReturnType<typeof useGoals>;
const EMPTY: PlanDraft = { name: '', timePeriod: 'week', targetEarnings: '', targetPending: '', targetClients: '', targetBonuses: '', targetRatings: '' };

export default function GoalsSheet({ open, onClose, goals, onPeriod }: { open: boolean; onClose: () => void; goals: Goals; onPeriod: (p: Period) => void }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);
  const [draft, setDraft] = useState<PlanDraft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const field = (k: keyof PlanDraft) => ({
    value: (draft[k] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft((d) => ({ ...d, [k]: e.target.value })),
  });
  const startNew = () => { setDraft(EMPTY); setEditing('new'); };
  const startEdit = (p: Plan) => { setDraft({ ...p }); setEditing(p); };
  const valid = draft.name.trim() && draft.targetEarnings.trim();

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    const saved = await goals.save(draft, editing && editing !== 'new' ? editing.id : undefined);
    setBusy(false);
    if (saved) { onPeriod(saved.timePeriod); setEditing(null); onClose(); }
  };

  const input = { className: 'g-select', style: { width: '100%', height: 40 } };
  return (
    <Modal isOpen={open} onClose={() => { setEditing(null); onClose(); }} size="md"
      title={editing ? t(editing === 'new' ? 'New goal' : 'Edit goal') : t('Compare goals')}
      description={editing ? undefined : t('Set targets and see progress on your Home cards.')}
      footer={editing ? (
        <>
          <button type="button" className="g-btn g-btn-ghost" onClick={() => setEditing(null)}>{t('Cancel')}</button>
          <button type="button" className="g-btn g-btn-primary" disabled={!valid || busy} onClick={submit}>{busy ? t('Saving…') : t('Save goal')}</button>
        </>
      ) : (
        <>
          {goals.active && <button type="button" className="g-btn g-btn-ghost" onClick={() => { goals.select(null); onClose(); }}>{t('Stop comparing')}</button>}
          <button type="button" className="g-btn g-btn-primary" onClick={startNew}><Plus size={16} aria-hidden /> {t('New goal')}</button>
        </>
      )}>
      {goals.error && <p role="alert" style={{ color: 'var(--g-error)', margin: '0 0 10px' }}>{t('We could not save that. Please try again.')}</p>}
      {editing ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <label>{t('Goal name')}<input {...input} {...field('name')} required maxLength={80} placeholder={t('e.g. December push')} /></label>
          <label>{t('Choose a period')}
            <select {...input} {...field('timePeriod')}>
              <option value="today">{t('Today')}</option><option value="week">{t('This week')}</option>
              <option value="month">{t('This month')}</option><option value="custom">{t('Custom')}</option>
            </select>
          </label>
          {draft.timePeriod === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>{t('From')}<input type="date" {...input} {...field('customStartDate')} /></label>
              <label>{t('To')}<input type="date" {...input} {...field('customEndDate')} /></label>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>{t('Earnings target')}<input inputMode="decimal" {...input} {...field('targetEarnings')} required /></label>
            <label>{t('Pending payouts target')}<input inputMode="decimal" {...input} {...field('targetPending')} /></label>
            <label>{t('Clients target')}<input inputMode="numeric" {...input} {...field('targetClients')} /></label>
            <label>{t('Rating target')}<input inputMode="decimal" {...input} {...field('targetRatings')} /></label>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--g-text-muted)' }}>{t('Earnings targets are in USD.')}</p>
        </div>
      ) : goals.plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--g-text-soft)' }}>
          <Target size={32} aria-hidden style={{ color: 'var(--g-primary-light)' }} />
          <p style={{ margin: '8px 0 0' }}>{t('No goals yet. Create one to compare against.')}</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {goals.plans.map((p) => (
            <li key={p.id} className="g-panel" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderColor: goals.active?.id === p.id ? 'var(--g-primary-light)' : undefined }}>
              <button type="button" className="g-menu-item" style={{ flex: 1, minWidth: 0 }} onClick={() => { goals.select(p); onPeriod(p.timePeriod); onClose(); }}>
                <span style={{ minWidth: 0 }}>
                  <strong className="g-ellipsis" style={{ display: 'block' }}>{p.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--g-text-muted)' }}>{t(p.timePeriod === 'week' ? 'This week' : p.timePeriod === 'month' ? 'This month' : p.timePeriod === 'today' ? 'Today' : 'Custom')}</span>
                </span>
              </button>
              <button type="button" className="g-icon-btn" aria-label={`${t('Edit')} ${p.name}`} onClick={() => startEdit(p)}><Pencil size={16} /></button>
              <button type="button" className="g-icon-btn" aria-label={`${t('Delete')} ${p.name}`} onClick={() => goals.remove(p.id)}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
