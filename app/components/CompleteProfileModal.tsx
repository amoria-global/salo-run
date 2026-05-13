'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDashboardAuth, dashboardAuthFetch } from '../providers/AuthProvider';

import { getApiUrl} from '@/lib/api';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

// All possible step indices and labels
const ALL_STEPS = [
  { index: 0, label: 'Bio & Location' },
  { index: 1, label: 'Specialties & Equipment' },
  { index: 2, label: 'Philosophy & Skills' },
  { index: 3, label: 'Education' },
  { index: 4, label: 'Certifications & Training' },
];

const availableSpecialties = [
  'Wedding', 'Birthday', 'Corporate', 'Portrait', 'Family', 'Events',
  'Concerts', 'Fashion', 'Product', 'Real Estate', 'Sports', 'Documentary',
];

interface SkillEntry {
  id: string;
  name: string;
  level: number;
}

interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  fromYear: string;
  toYear: string;
  description: string;
}

interface CertEntry {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}

interface TrainingEntry {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RemoveTagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, onComplete, onSkip }) => {
  const { colors, actualTheme } = useTheme();
  const { user, token, refreshUserProfile } = useDashboardAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error'; message: string }[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Step 1: Bio & Location
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  // Step 2: Specialties & Equipment
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState('');

  // Step 4: Philosophy & Skills
  const [philosophy, setPhilosophy] = useState('');
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(50);

  // Step 5: Education
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);

  // Step 6: Certifications & Training
  const [certEntries, setCertEntries] = useState<CertEntry[]>([]);
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);

  // Responsive check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-fill form from user profile data
  useEffect(() => {
    if (user && !prefilled) {
      if (user.about) setBio(user.about);
      if (user.address) setLocation(user.address);
      if (user.specialties?.length) setSelectedSpecialties([...user.specialties]);
      if (user.equipments?.length) setEquipmentList(user.equipments.map(e => e.name));
      if (user.professionalPhilosophy) setPhilosophy(user.professionalPhilosophy);
      if (user.professionalSkills?.length) {
        setSkills(user.professionalSkills.map(s => ({
          id: s.id || Date.now().toString() + Math.random(),
          name: s.name,
          level: s.proficiencyLevel ?? s.skillPercentage ?? 50,
        })));
      }
      if (user.educationLevels?.length) {
        setEducationEntries(user.educationLevels.map(e => ({
          id: e.id || Date.now().toString() + Math.random(),
          degree: e.degree,
          institution: e.institution,
          fromYear: e.startDate?.split('-')[0] || '',
          toYear: e.endDate?.split('-')[0] || '',
          description: e.description || '',
        })));
      }
      if (user.certifications?.length) {
        setCertEntries(user.certifications.map(c => ({
          id: c.id || Date.now().toString() + Math.random(),
          title: c.title,
          issuer: c.institution,
          year: c.yearObtained,
          description: c.description || '',
        })));
      }
      if (user.trainings?.length) {
        setTrainingEntries(user.trainings.map(t => ({
          id: t.id || Date.now().toString() + Math.random(),
          title: t.title,
          issuer: t.institution,
          year: t.yearObtained,
          description: t.description || '',
        })));
      }
      setPrefilled(true);
    }
  }, [user, prefilled]);

  // Freeze which steps are shown when the modal opens — computed once on open,
  // not re-derived on every user refresh (which would shift steps mid-flow).
  const [activeSteps, setActiveSteps] = useState<typeof ALL_STEPS>(ALL_STEPS);

  useEffect(() => {
    if (isOpen && user) {
      const missing: typeof ALL_STEPS = [];
      if (!user.about || !user.address) missing.push(ALL_STEPS[0]);
      if (!user.specialties?.length || !user.equipments?.length) missing.push(ALL_STEPS[1]);
      if (!user.professionalPhilosophy || !user.professionalSkills?.length) missing.push(ALL_STEPS[2]);
      if (!user.educationLevels?.length) missing.push(ALL_STEPS[3]);
      if (!user.certifications?.length && !user.trainings?.length) missing.push(ALL_STEPS[4]);
      setActiveSteps(missing.length > 0 ? missing : ALL_STEPS);
      setCurrentStepIndex(0);
      setPrefilled(false);
      setError('');
    }
  // Only recompute when the modal opens, not on every user change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1970 + 11 }, (_, i) => (currentYear + 10 - i).toString());

  if (!isOpen) return null;

  const currentStepData = activeSteps[currentStepIndex];
  const totalSteps = activeSteps.length;

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const addEquipment = () => {
    const trimmed = newEquipment.trim();
    if (trimmed && !equipmentList.includes(trimmed)) {
      setEquipmentList(prev => [...prev, trimmed]);
      setNewEquipment('');
    }
  };

  const removeEquipment = (item: string) => {
    setEquipmentList(prev => prev.filter(e => e !== item));
  };

  const addSkill = () => {
    const trimmed = newSkillName.trim();
    if (trimmed && !skills.find(s => s.name === trimmed)) {
      setSkills(prev => [...prev, { id: Date.now().toString(), name: trimmed, level: newSkillLevel }]);
      setNewSkillName('');
      setNewSkillLevel(50);
    }
  };

  const removeSkill = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  const addEducation = () => {
    setEducationEntries(prev => [...prev, {
      id: Date.now().toString(),
      degree: '',
      institution: '',
      fromYear: '',
      toYear: '',
      description: '',
    }]);
  };

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    setEducationEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEducation = (id: string) => {
    setEducationEntries(prev => prev.filter(e => e.id !== id));
  };

  const addCertification = () => {
    setCertEntries(prev => [...prev, {
      id: Date.now().toString(),
      title: '',
      issuer: '',
      year: '',
      description: '',
    }]);
  };

  const updateCertification = (id: string, field: keyof CertEntry, value: string) => {
    setCertEntries(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCertification = (id: string) => {
    setCertEntries(prev => prev.filter(c => c.id !== id));
  };

  const addTraining = () => {
    setTrainingEntries(prev => [...prev, {
      id: Date.now().toString(),
      title: '',
      issuer: '',
      year: '',
      description: '',
    }]);
  };

  const updateTraining = (id: string, field: keyof TrainingEntry, value: string) => {
    setTrainingEntries(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTraining = (id: string) => {
    setTrainingEntries(prev => prev.filter(t => t.id !== id));
  };

  // Shared API call helper
  const apiCall = async (label: string, endpoint: string, body?: Record<string, unknown>): Promise<boolean> => {
    const apiUrl = getApiUrl();
    // dashboardAuthFetch attaches Bearer when available *and* sends the
    // amoria_auth HttpOnly cookie via credentials: 'include', so cookie-only
    // sessions (no localStorage Bearer) still authenticate correctly.
    const headers: Record<string, string> = {};
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    try {
      setSubmissionStatus(`Saving ${label}...`);
      const response = await dashboardAuthFetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || `Failed to save ${label}`);
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to save ${label}`;
      showToast('error', msg);
      return false;
    }
  };

  // Save the current slide's data to its endpoint(s)
  const saveCurrentStep = async (): Promise<boolean> => {
    if (!currentStepData) return false;
    let allOk = true;

    switch (currentStepData.index) {
      case 0: {
        // Bio & Location → update-important-details
        if (bio || location) {
          const ok = await apiCall('bio & location', '/api/remote/photographer/update-important-details', {
            about: bio,
            address: location,
          });
          if (!ok) allOk = false;
        }
        break;
      }
      case 1: {
        // Specialties & Equipment
        if (selectedSpecialties.length > 0) {
          const ok = await apiCall('specialties', '/api/remote/photographer/update-important-details', {
            specialties: selectedSpecialties,
          });
          if (!ok) allOk = false;
        }
        // Add new equipment items
        const existingEquipmentNames = new Set((user?.equipments || []).map(e => e.name));
        for (const name of equipmentList.filter(n => !existingEquipmentNames.has(n))) {
          const ok = await apiCall(`equipment "${name}"`, '/api/remote/photographer/add-equipment', { name });
          if (!ok) allOk = false;
        }
        break;
      }
      case 2: {
        // Philosophy & Skills
        if (philosophy) {
          const ok = await apiCall('philosophy', '/api/remote/photographer/update-important-details', {
            professionalPhilosophy: philosophy,
          });
          if (!ok) allOk = false;
        }
        // Add new skills
        const existingSkillNames = new Set((user?.professionalSkills || []).map(s => s.name));
        for (const skill of skills.filter(s => !existingSkillNames.has(s.name))) {
          const ok = await apiCall(`skill "${skill.name}"`, '/api/remote/photographer/add-professional-skills', {
            name: skill.name,
            skillPercentage: skill.level,
          });
          if (!ok) allOk = false;
        }
        break;
      }
      case 3: {
        // Education — add new entries
        const existingEduKeys = new Set((user?.educationLevels || []).map(e => `${e.degree}|${e.institution}`));
        for (const edu of educationEntries.filter(e => e.degree && e.institution && !existingEduKeys.has(`${e.degree}|${e.institution}`))) {
          const ok = await apiCall(`education "${edu.degree}"`, '/api/remote/photographer/add-education-level', {
            degree: edu.degree,
            institution: edu.institution,
            startDate: edu.fromYear ? `${edu.fromYear}-01-01` : '',
            endDate: edu.toYear === 'Present' ? '' : (edu.toYear ? `${edu.toYear}-01-01` : ''),
            description: edu.description || '',
          });
          if (!ok) allOk = false;
        }
        break;
      }
      case 4: {
        // Certifications & Training — add new entries
        const existingCertKeys = new Set((user?.certifications || []).map(c => `${c.title}|${c.institution}`));
        for (const cert of certEntries.filter(c => c.title && c.issuer && !existingCertKeys.has(`${c.title}|${c.issuer}`))) {
          const ok = await apiCall(`certification "${cert.title}"`, '/api/remote/photographer/add-trainting-certification', {
            title: cert.title,
            institution: cert.issuer,
            yearObtained: cert.year || '',
            description: cert.description || '',
            type: 'CERTIFICATION',
          });
          if (!ok) allOk = false;
        }
        const existingTrainingKeys = new Set((user?.trainings || []).map(t => `${t.title}|${t.institution}`));
        for (const training of trainingEntries.filter(t => t.title && t.issuer && !existingTrainingKeys.has(`${t.title}|${t.issuer}`))) {
          const ok = await apiCall(`training "${training.title}"`, '/api/remote/photographer/add-trainting-certification', {
            title: training.title,
            institution: training.issuer,
            yearObtained: training.year || '',
            description: training.description || '',
            type: 'TRAINING',
          });
          if (!ok) allOk = false;
        }
        break;
      }
    }

    return allOk;
  };

  // Save current slide and advance to next
  const saveAndNext = async () => {
    setSubmitting(true);
    setError('');
    setSubmissionStatus('');

    try {
      const ok = await saveCurrentStep();
      if (!ok) {
        setError('Some items failed to save. Please review and try again.');
        return;
      }

      // Refresh profile to get fresh data for deduplication
      setSubmissionStatus('Refreshing profile...');
      await refreshUserProfile();

      showToast('success', `${currentStepData?.label} saved!`);
      setCurrentStepIndex(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      showToast('error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
      setSubmissionStatus('');
    }
  };

  // Save last slide then call submit-profile endpoint
  const saveLastAndSubmit = async () => {
    setSubmitting(true);
    setError('');
    setSubmissionStatus('');

    try {
      // Save the current slide's data first
      const ok = await saveCurrentStep();
      if (!ok) {
        setError('Some items failed to save. Please review and try again.');
        return;
      }

      // Call submit-profile (POST with token only, no body)
      setSubmissionStatus('Submitting profile...');
      const submitOk = await apiCall('profile submission', '/api/remote/photographer/submit-profile');
      if (!submitOk) {
        setError('Profile submission failed. Please try again.');
        return;
      }

      // Refresh profile with final data
      setSubmissionStatus('Refreshing profile...');
      await refreshUserProfile();

      showToast('success', 'Profile completed successfully!');
      setTimeout(() => { onComplete(); }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      showToast('error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
      setSubmissionStatus('');
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  };

  // Shared input style
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: `2px solid ${colors.borderPrimary}`,
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    color: colors.textPrimary,
    backgroundColor: colors.bgCard,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: colors.textPrimary,
    marginBottom: '0.375rem',
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#083A85';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8, 58, 133, 0.1)';
  };

  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = colors.borderPrimary;
    e.currentTarget.style.boxShadow = 'none';
  };

  // Render step content based on the actual step index
  const renderStep = () => {
    if (!currentStepData) return null;
    switch (currentStepData.index) {
      case 0: return renderBioLocation();
      case 1: return renderSpecialtiesEquipment();
      case 2: return renderPhilosophySkills();
      case 3: return renderEducation();
      case 4: return renderCertTraining();
      default: return null;
    }
  };

  const renderBioLocation = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={labelStyle}>About You <span style={{ color: '#6b7280', fontWeight: 400 }}>(Tell clients about yourself)</span></label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="I'm a passionate photographer with 5+ years of experience specializing in..."
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={focusHandler}
          onBlur={blurHandler}
        />
        <div style={{ fontSize: '0.75rem', color: colors.textSecondary, marginTop: '0.25rem' }}>
          {bio.length} characters {bio.length < 50 && bio.length > 0 ? '(minimum 50 recommended)' : ''}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Location</label>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="e.g., Kigali, Rwanda"
          style={inputStyle}
          onFocus={focusHandler}
          onBlur={blurHandler}
        />
      </div>
    </div>
  );

  const renderSpecialtiesEquipment = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={labelStyle}>Specialties <span style={{ color: '#6b7280', fontWeight: 400 }}>(Select your areas of expertise)</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.375rem' }}>
          {availableSpecialties.map(specialty => {
            const isSelected = selectedSpecialties.includes(specialty);
            return (
              <button
                key={specialty}
                onClick={() => toggleSpecialty(specialty)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  border: isSelected ? '2px solid #083A85' : `2px solid ${colors.borderPrimary}`,
                  backgroundColor: isSelected
                    ? (actualTheme === 'dark' ? 'rgba(8, 58, 133, 0.2)' : 'rgba(8, 58, 133, 0.08)')
                    : colors.bgCard,
                  color: isSelected ? '#083A85' : colors.textSecondary,
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {specialty}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Equipment</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newEquipment}
            onChange={e => setNewEquipment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEquipment(); } }}
            placeholder="e.g., Canon EOS R5"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={focusHandler}
            onBlur={blurHandler}
          />
          <button
            onClick={addEquipment}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#083A85',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <PlusIcon /> Add
          </button>
        </div>
        {equipmentList.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {equipmentList.map(item => (
              <span
                key={item}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: actualTheme === 'dark' ? 'rgba(8, 58, 133, 0.15)' : 'rgba(8, 58, 133, 0.08)',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  color: colors.textPrimary,
                  fontWeight: 500,
                }}
              >
                {item}
                <button
                  onClick={() => removeEquipment(item)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#EF4444',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <RemoveTagIcon />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPhilosophySkills = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={labelStyle}>Professional Philosophy</label>
        <textarea
          value={philosophy}
          onChange={e => setPhilosophy(e.target.value)}
          placeholder="What drives your work? What's your approach to photography?"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={focusHandler}
          onBlur={blurHandler}
        />
      </div>

      <div>
        <label style={labelStyle}>Skills</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <input
            type="text"
            value={newSkillName}
            onChange={e => setNewSkillName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            placeholder="Skill name"
            style={{ ...inputStyle, flex: 1, minWidth: isMobile ? '100%' : '140px' }}
            onFocus={focusHandler}
            onBlur={blurHandler}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: isMobile ? '100%' : 'auto' }}>
            <input
              type="range"
              min="0"
              max="100"
              value={newSkillLevel}
              onChange={e => setNewSkillLevel(Number(e.target.value))}
              style={{ width: isMobile ? '100%' : '100px', accentColor: '#083A85' }}
            />
            <span style={{ fontSize: '0.8rem', color: colors.textSecondary, fontWeight: 600, minWidth: '32px' }}>
              {newSkillLevel}%
            </span>
          </div>
          <button
            onClick={addSkill}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#083A85',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <PlusIcon /> Add
          </button>
        </div>

        {skills.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            {skills.map(skill => (
              <div
                key={skill.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  borderRadius: '0.5rem',
                  border: `2px solid ${colors.borderPrimary}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary }}>{skill.name}</span>
                  <div style={{
                    marginTop: '0.25rem',
                    height: '6px',
                    backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    maxWidth: '200px',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${skill.level}%`,
                      backgroundColor: '#083A85',
                      borderRadius: '3px',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: colors.textSecondary }}>{skill.level}%</span>
                  <button
                    onClick={() => removeSkill(skill.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#EF4444',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderEducation = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Education</label>
        <button
          onClick={addEducation}
          style={{
            padding: '0.5rem 0.875rem',
            backgroundColor: '#083A85',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <PlusIcon /> Add Education
        </button>
      </div>

      {educationEntries.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
          No education entries yet. Click &quot;Add Education&quot; to add one.
        </p>
      )}

      {educationEntries.map((entry, index) => (
        <div
          key={entry.id}
          style={{
            padding: '1rem',
            border: `2px solid ${colors.borderPrimary}`,
            borderRadius: '0.75rem',
            backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSecondary }}>Education #{index + 1}</span>
            <button
              onClick={() => removeEducation(entry.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
            >
              <TrashIcon />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <input type="text" value={entry.degree} onChange={e => updateEducation(entry.id, 'degree', e.target.value)} placeholder="Degree (e.g., Bachelor of Fine Arts)" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            <input type="text" value={entry.institution} onChange={e => updateEducation(entry.id, 'institution', e.target.value)} placeholder="Institution" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={entry.fromYear} onChange={e => updateEducation(entry.id, 'fromYear', e.target.value)} style={{ ...inputStyle, flex: 1 }} onFocus={focusHandler} onBlur={blurHandler}>
                <option value="">From Year</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={entry.toYear} onChange={e => updateEducation(entry.id, 'toYear', e.target.value)} style={{ ...inputStyle, flex: 1 }} onFocus={focusHandler} onBlur={blurHandler}>
                <option value="">To Year</option>
                <option value="Present">Present</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <textarea value={entry.description} onChange={e => updateEducation(entry.id, 'description', e.target.value)} placeholder="Brief description (optional)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focusHandler} onBlur={blurHandler} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderCertTraining = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Certifications */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Certifications</label>
          <button onClick={addCertification} style={{ padding: '0.5rem 0.875rem', backgroundColor: '#083A85', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <PlusIcon /> Add
          </button>
        </div>

        {certEntries.length === 0 && (
          <p style={{ fontSize: '0.85rem', color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' }}>
            No certifications yet.
          </p>
        )}

        {certEntries.map((entry, index) => (
          <div key={entry.id} style={{ padding: '0.875rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem', backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSecondary }}>Certification #{index + 1}</span>
              <button onClick={() => removeCertification(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: '0.25rem' }}><TrashIcon /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input type="text" value={entry.title} onChange={e => updateCertification(entry.id, 'title', e.target.value)} placeholder="Certification title" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              <input type="text" value={entry.issuer} onChange={e => updateCertification(entry.id, 'issuer', e.target.value)} placeholder="Issuing institution" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              <select value={entry.year} onChange={e => updateCertification(entry.id, 'year', e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                <option value="">Year obtained</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <textarea value={entry.description} onChange={e => updateCertification(entry.id, 'description', e.target.value)} placeholder="Description (optional)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>
        ))}
      </div>

      {/* Training & Workshops */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Training &amp; Workshops</label>
          <button onClick={addTraining} style={{ padding: '0.5rem 0.875rem', backgroundColor: '#083A85', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <PlusIcon /> Add
          </button>
        </div>

        {trainingEntries.length === 0 && (
          <p style={{ fontSize: '0.85rem', color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: '0.5rem 0' }}>
            No training entries yet.
          </p>
        )}

        {trainingEntries.map((entry, index) => (
          <div key={entry.id} style={{ padding: '0.875rem', border: `2px solid ${colors.borderPrimary}`, borderRadius: '0.75rem', backgroundColor: actualTheme === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSecondary }}>Training #{index + 1}</span>
              <button onClick={() => removeTraining(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: '0.25rem' }}><TrashIcon /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input type="text" value={entry.title} onChange={e => updateTraining(entry.id, 'title', e.target.value)} placeholder="Training / Workshop name" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              <input type="text" value={entry.issuer} onChange={e => updateTraining(entry.id, 'issuer', e.target.value)} placeholder="Institution / Organizer" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              <select value={entry.year} onChange={e => updateTraining(entry.id, 'year', e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                <option value="">Year</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <textarea value={entry.description} onChange={e => updateTraining(entry.id, 'description', e.target.value)} placeholder="Description (optional)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .profile-modal-content {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 1rem 1rem 0 0 !important;
            max-height: 95vh !important;
            position: fixed !important;
            bottom: 0 !important;
            top: auto !important;
          }
          .profile-modal-body {
            padding: 1rem !important;
          }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
          animation: 'ck-fade-in 180ms ease both',
        }}
      >
        <div
          className="profile-modal-content"
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--ck-surface)',
            color: 'var(--ck-text)',
            borderRadius: isMobile ? '20px 20px 0 0' : 20,
            width: 580,
            maxWidth: '100%',
            maxHeight: isMobile ? '95vh' : 'calc(100vh - 32px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
            animation: 'ck-modal-pop 320ms cubic-bezier(0.32, 0.72, 0, 1) both',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '18px 22px 16px',
            borderBottom: '1px solid var(--ck-stroke)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(8,58,133,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="bi bi-person-badge" style={{ fontSize: 16, color: 'var(--ck-blue)' }}></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#F20C8F',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>Onboarding</div>
                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  color: 'var(--ck-text)',
                  margin: 0,
                }}>Complete your profile</h3>
              </div>
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--ck-text-soft)',
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}>
              {currentStepData?.label}. Fill in the missing sections to get discovered by clients.
            </p>

            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
              {activeSteps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: 4, borderRadius: 9999,
                    background: i <= currentStepIndex
                      ? 'linear-gradient(90deg, #083A85, #F20C8F)'
                      : 'var(--ck-stroke)',
                    transition: 'background 320ms var(--ck-ease)',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: 'var(--ck-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--ck-blue)',
              }}>
                {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
              </span>
            </div>
          </div>

          {/* Body - scrollable */}
          <div
            className="profile-modal-body"
            style={{
              padding: isMobile ? '1rem' : '1.25rem 1.5rem',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {renderStep()}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.625rem 1.5rem',
              backgroundColor: actualTheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
              color: '#EF4444',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderTop: `1px solid ${actualTheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FECACA'}`,
            }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
            borderTop: `2px solid ${colors.borderPrimary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            gap: '0.625rem',
          }}>
            {/* Skip button - left side */}
            <button
              onClick={onSkip}
              disabled={submitting}
              style={{
                padding: '0.625rem 1rem',
                border: 'none',
                borderRadius: '0.625rem',
                background: 'none',
                color: colors.textSecondary,
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Skip for now
            </button>

            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            {currentStepIndex > 0 && (
              <button
                onClick={goBack}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: `2px solid ${colors.borderPrimary}`,
                  borderRadius: '0.625rem',
                  background: colors.bgTertiary,
                  color: colors.textPrimary,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = colors.bgHover || colors.bgTertiary;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = colors.bgTertiary;
                }}
              >
                Back
              </button>
            )}

            {currentStepIndex < totalSteps - 1 ? (
              <button
                onClick={saveAndNext}
                disabled={submitting}
                style={{
                  padding: '0.625rem 1.5rem',
                  border: submitting ? '2px solid #9CA3AF' : '2px solid #083A85',
                  borderRadius: '0.625rem',
                  background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #083A85 0%, #0d5ab8 100%)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
                onMouseEnter={e => {
                  if (!submitting) e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {submitting && (
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'profileModalSpin 0.8s linear infinite',
                  }} />
                )}
                {submitting ? (submissionStatus || 'Saving...') : 'Save & Next'}
              </button>
            ) : (
              <button
                onClick={saveLastAndSubmit}
                disabled={submitting}
                style={{
                  padding: '0.625rem 1.5rem',
                  border: submitting ? '2px solid #9CA3AF' : '2px solid #083A85',
                  borderRadius: '0.625rem',
                  background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #083A85 0%, #0d5ab8 100%)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
                onMouseEnter={e => {
                  if (!submitting) e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {submitting && (
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'profileModalSpin 0.8s linear infinite',
                  }} />
                )}
                {submitting ? (submissionStatus || 'Submitting...') : 'Submit Profile'}
              </button>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minWidth: '250px',
              maxWidth: '400px',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            {toast.type === 'success' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0 0.25rem',
                fontSize: '1.25rem',
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes profileModalSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default CompleteProfileModal;
