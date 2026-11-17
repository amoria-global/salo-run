"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  applyPackageTierNamingPolicy,
  bulkPublishPackages,
  createPackage,
  DEFAULT_PACKAGE_ADDON_TEMPLATES,
  deletePackage,
  draftsMissingPrice,
  EXTENDED_POLICY_TIERS,
  extractPackagesWithAi,
  listPackages,
  POLICY_PACKAGE_TIERS,
  QUICK_DELIVERY_POLICY_PRESETS,
  QUICK_OTHER_POLICY_PRESETS,
  updatePackage,
  type BulkPublishMode,
  type CreatePackageInput,
  type ExtractedAiPackageDraft,
  type Package,
  type PackageAddonItem,
  type PackageFeatureItem,
  type ServiceType,
} from '@/app/lib/packagesApi';

interface CurrencyOption {
  id: string;
  code: string;
  name?: string;
}

interface PhotographerPackagesManagerProps {
  currencies: CurrencyOption[];
  canEdit?: boolean;
  onOpenGeoPricing?: (pkg: { id: string; name?: string }) => void;
  onPackagesChanged?: () => void;
}

const QUICK_FEATURE_SUGGESTIONS: Record<ServiceType, string[]> = {
  STUDIO: [
    'High-resolution retouched digital photos',
    'Online gallery storage & instant download',
    'Multiple backdrop & outfit changes',
    'Professional studio lighting setup',
    'Printed A4 / A3 framed portrait',
    'Same-day preview highlights',
  ],
  OUTDOOR: [
    'Full event outdoor coverage',
    'Online gallery storage & guest sharing',
    '4K highlight & full ceremony video',
    'Printed luxury photo book / album',
    'Multi-camera live streaming',
    'Drone aerial coverage',
    '2 Photographers & 2 Videographers',
  ],
};

function buildAddonsListFromInputs(
  priceInputs: Record<string, string>,
  customList: { key: string; name: string; priceText: string }[],
  currencyCode = 'RWF',
): PackageAddonItem[] {
  const result: PackageAddonItem[] = [];
  for (const tpl of DEFAULT_PACKAGE_ADDON_TEMPLATES) {
    const raw = (priceInputs[tpl.key] ?? '').replace(/[^\d]/g, '');
    const price = raw ? parseInt(raw, 10) : 0;
    result.push({
      key: tpl.key,
      name: tpl.name,
      price: Number.isFinite(price) && price > 0 ? price : 0,
      currencyCode,
      enabled: Number.isFinite(price) && price > 0,
    });
  }
  for (const c of customList) {
    const cleanName = c.name.trim();
    if (!cleanName) continue;
    const raw = (c.priceText ?? '').replace(/[^\d]/g, '');
    const price = raw ? parseInt(raw, 10) : 0;
    result.push({
      key: c.key,
      name: cleanName,
      price: Number.isFinite(price) && price > 0 ? price : 0,
      currencyCode,
      enabled: Number.isFinite(price) && price > 0,
    });
  }
  return result;
}

export default function PhotographerPackagesManager({
  currencies,
  canEdit = true,
  onOpenGeoPricing,
  onPackagesChanged,
}: PhotographerPackagesManagerProps) {
  const { colors, actualTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [builderTab, setBuilderTab] = useState<'ai' | 'manual'>('ai');
  const [sessionFilter, setSessionFilter] = useState<'ALL' | ServiceType>('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Upload Document (3-step) State ───
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [rawBrochureText, setRawBrochureText] = useState('');
  const [defaultSession, setDefaultSession] = useState<ServiceType>('OUTDOOR');
  const [extracting, setExtracting] = useState(false);
  const [extractedDrafts, setExtractedDrafts] = useState<ExtractedAiPackageDraft[]>([]);
  const [publishMode, setPublishMode] = useState<BulkPublishMode>('REPLACE_ALL');
  const [reviewSessionTab, setReviewSessionTab] = useState<ServiceType>('OUTDOOR');
  const [publishingBatch, setPublishingBatch] = useState(false);

  // ─── Studio / Post-Scan Policies & Add-ons State ───
  const [studioDeliveryPolicy, setStudioDeliveryPolicy] = useState('');
  const [studioOtherPolicies, setStudioOtherPolicies] = useState<string[]>([]);
  const [newStudioPolicyText, setNewStudioPolicyText] = useState('');
  const [policyReadFromMenu, setPolicyReadFromMenu] = useState(false);
  const [detectedDroneInMenu, setDetectedDroneInMenu] = useState(false);
  const [studioAddonPrices, setStudioAddonPrices] = useState<Record<string, string>>({
    drone_capturing: '',
    express_delivery: '',
    extra_hour: '',
    fog_machine: '',
    extra_crew: '',
  });
  const [studioCustomAddons, setStudioCustomAddons] = useState<
    { key: string; name: string; priceText: string }[]
  >([]);
  const [newStudioAddonName, setNewStudioAddonName] = useState('');
  const [newStudioAddonPrice, setNewStudioAddonPrice] = useState('');

  // ─── Edit Draft Modal State (in Step 2) ───
  const [editingDraft, setEditingDraft] = useState<ExtractedAiPackageDraft | null>(null);
  const [newDraftFeatureText, setNewDraftFeatureText] = useState('');

  // ─── Manual Custom Builder State ───
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [manualServiceType, setManualServiceType] = useState<ServiceType>('OUTDOOR');
  const [manualTier, setManualTier] = useState<string>('Diamond');
  const [useCustomTitle, setUseCustomTitle] = useState(false);
  const [customTitleText, setCustomTitleText] = useState('');
  const [manualPrice, setManualPrice] = useState('350000');
  const [currencyId, setCurrencyId] = useState<string>('');
  const [manualPriceUnit, setManualPriceUnit] = useState('per event');
  const [manualDurationHours, setManualDurationHours] = useState('6');
  const [manualIncludedPhotos, setManualIncludedPhotos] = useState('250');
  const [manualIncludedVideos, setManualIncludedVideos] = useState('1');
  const [manualDeliveryDays, setManualDeliveryDays] = useState('7');
  const [manualDeliveryPolicy, setManualDeliveryPolicy] = useState('');
  const [manualOtherPolicies, setManualOtherPolicies] = useState<string[]>([]);
  const [newManualPolicyText, setNewManualPolicyText] = useState('');
  const [manualAddonPrices, setManualAddonPrices] = useState<Record<string, string>>({
    drone_capturing: '',
    express_delivery: '',
    extra_hour: '',
    fog_machine: '',
    extra_crew: '',
  });
  const [manualCustomAddons, setManualCustomAddons] = useState<
    { key: string; name: string; priceText: string }[]
  >([]);
  const [newManualAddonName, setNewManualAddonName] = useState('');
  const [newManualAddonPrice, setNewManualAddonPrice] = useState('');
  const [manualHasLiveStream, setManualHasLiveStream] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualItems, setManualItems] = useState<string[]>([
    'High-resolution edited digital photos',
    'Online gallery storage & instant download',
  ]);
  const [newManualItemInput, setNewManualItemInput] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [deletingPkgId, setDeletingPkgId] = useState<string | null>(null);

  // ─── Stage Modal Targets ('studio' | 'manual' | null) ───
  const [policyModalTarget, setPolicyModalTarget] = useState<'studio' | 'manual' | null>(null);
  const [addonsModalTarget, setAddonsModalTarget] = useState<'studio' | 'manual' | null>(null);

  useEffect(() => {
    if (!currencyId && currencies.length > 0) {
      const rwf = currencies.find((c) => c.code === 'RWF') || currencies[0];
      if (rwf) setCurrencyId(rwf.id);
    }
  }, [currencies, currencyId]);

  const refreshPackages = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listPackages();
      setPackages(list);
      onPackagesChanged?.();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not load your packages.');
    } finally {
      setLoading(false);
    }
  }, [onPackagesChanged]);

  useEffect(() => {
    void refreshPackages();
  }, [refreshPackages]);

  const studioAddonsList = useMemo(
    () => buildAddonsListFromInputs(studioAddonPrices, studioCustomAddons, 'RWF'),
    [studioAddonPrices, studioCustomAddons],
  );
  const manualAddonsList = useMemo(
    () => buildAddonsListFromInputs(manualAddonPrices, manualCustomAddons, 'RWF'),
    [manualAddonPrices, manualCustomAddons],
  );

  const studioDrafts = useMemo(
    () => extractedDrafts.filter((d) => d.serviceType === 'STUDIO'),
    [extractedDrafts],
  );
  const outdoorDrafts = useMemo(
    () => extractedDrafts.filter((d) => d.serviceType === 'OUTDOOR'),
    [extractedDrafts],
  );
  const activeSessionDrafts = reviewSessionTab === 'STUDIO' ? studioDrafts : outdoorDrafts;

  const filteredExistingPackages = useMemo(() => {
    if (sessionFilter === 'ALL') return packages;
    return packages.filter((p) => (p.serviceType ?? 'OUTDOOR') === sessionFilter);
  }, [packages, sessionFilter]);

  // ─── Handlers ───
  const handleRunAiExtraction = async () => {
    setErrorMsg(null);
    if (uploadedFiles.length === 0 && !rawBrochureText.trim()) {
      setErrorMsg('Please select at least one brochure image/PDF or paste your package menu text.');
      return;
    }
    setExtracting(true);
    try {
      const res = await extractPackagesWithAi({
        files: uploadedFiles,
        rawText: rawBrochureText.trim() || undefined,
        defaultServiceType: defaultSession,
      });

      const menuDeliv = (res.extractedDeliveryPolicy || '').trim();
      const menuOther = res.extractedOtherPolicies ?? [];
      if (menuDeliv && !studioDeliveryPolicy.trim()) {
        setStudioDeliveryPolicy(menuDeliv);
        setPolicyReadFromMenu(true);
      }
      if (menuOther.length > 0) {
        setStudioOtherPolicies((prev) => Array.from(new Set([...prev, ...menuOther])));
      }
      setDetectedDroneInMenu(Boolean(res.detectedDroneInMenu));

      const effectiveDeliv = studioDeliveryPolicy.trim() || menuDeliv;
      const effectiveOther = Array.from(new Set([...studioOtherPolicies, ...menuOther]));
      const activeAddons = studioAddonsList.filter((a) => a.enabled && a.price > 0);
      const dronePrice =
        activeAddons.find((a) => a.key === 'drone_capturing')?.price ?? null;

      const enriched = applyPackageTierNamingPolicy(res.extractedPackages).map((d) => ({
        ...d,
        deliveryPolicy: effectiveDeliv || d.deliveryPolicy,
        otherPolicies: effectiveOther.length > 0 ? effectiveOther : d.otherPolicies,
        addons: activeAddons,
        droneCapturingPrice: dronePrice,
        hasDroneCapturing: Boolean(dronePrice && dronePrice > 0),
      }));

      setExtractedDrafts(enriched);
      setPublishMode(res.suggestedMode);
      setReviewSessionTab(res.defaultSuggestedSession);
      setAiStep(2);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not extract packages from the uploaded document.');
    } finally {
      setExtracting(false);
    }
  };

  const handleToggleDraftSession = (tempId: string, nextSession: ServiceType) => {
    setExtractedDrafts((prev) => {
      const updated = prev.map((d) =>
        d.tempId === tempId
          ? {
              ...d,
              serviceType: nextSession,
              priceUnit: nextSession === 'STUDIO' ? 'per session' : 'per event',
            }
          : d,
      );
      return applyPackageTierNamingPolicy(updated);
    });
  };

  const handleRemoveDraft = (tempId: string) => {
    setExtractedDrafts((prev) => applyPackageTierNamingPolicy(prev.filter((d) => d.tempId !== tempId)));
  };

  const handleAddEmptyDraft = () => {
    const newDraft: ExtractedAiPackageDraft = {
      tempId: `custom-${Date.now()}`,
      packageName: 'Basic',
      originalTitle: 'Custom Package',
      serviceType: defaultSession,
      price: 150000,
      currencyCode: 'RWF',
      currencyId: currencyId || currencies[0]?.id,
      priceUnit: defaultSession === 'STUDIO' ? 'per session' : 'per event',
      durationHours: defaultSession === 'STUDIO' ? 2 : 6,
      includedPhotos: defaultSession === 'STUDIO' ? 30 : 200,
      includedVideos: 1,
      photobookPhotos: null,
      hasLiveStream: false,
      deliveryDays: 7,
      deliveryPolicy: studioDeliveryPolicy.trim(),
      otherPolicies: studioOtherPolicies,
      addons: studioAddonsList.filter((a) => a.enabled && a.price > 0),
      originalDescription: 'Edited high-resolution photos • Online gallery delivery',
      enhancedDescription: 'Complete photography session with edited high-resolution photos and online gallery delivery.',
      ingredients: ['Edited high-resolution photos', 'Online gallery delivery'],
    };
    setExtractedDrafts((prev) => applyPackageTierNamingPolicy([...prev, newDraft]));
    setEditingDraft(newDraft);
  };

  const handlePublishBatch = async () => {
    setErrorMsg(null);
    const resolvedCurrencyId = currencyId || currencies[0]?.id;
    if (!resolvedCurrencyId) {
      setErrorMsg('Please select a currency before publishing.');
      return;
    }
    if (extractedDrafts.length === 0) {
      setErrorMsg('Add at least one package before publishing.');
      return;
    }
    const unpriced = draftsMissingPrice(extractedDrafts);
    if (unpriced.length > 0) {
      setErrorMsg(`Please enter a valid price for all ${unpriced.length} unpriced package(s).`);
      return;
    }

    setPublishingBatch(true);
    try {
      const activeStudioAddons = studioAddonsList.filter((a) => a.enabled && a.price > 0);
      const studioDronePrice =
        activeStudioAddons.find((a) => a.key === 'drone_capturing')?.price ?? null;
      const normalized = applyPackageTierNamingPolicy<ExtractedAiPackageDraft>(extractedDrafts);

      const inputs: CreatePackageInput[] = normalized.map((d: ExtractedAiPackageDraft) => {
        const pkgAddons =
          d.addons && d.addons.some((a) => a.enabled && a.price > 0)
            ? d.addons.filter((a) => a.enabled && a.price > 0)
            : activeStudioAddons;
        const pkgDronePrice =
          d.droneCapturingPrice && d.droneCapturingPrice > 0
            ? d.droneCapturingPrice
            : studioDronePrice;
        const pkgDeliveryPolicy = studioDeliveryPolicy.trim() || d.deliveryPolicy;
        const pkgOtherPolicies =
          d.otherPolicies && d.otherPolicies.length > 0 ? d.otherPolicies : studioOtherPolicies;

        return {
          packageName: d.packageName,
          price: d.price as number,
          currencyId: d.currencyId || resolvedCurrencyId,
          currencyCode: d.currencyCode || 'RWF',
          priceUnit: d.priceUnit || (d.serviceType === 'STUDIO' ? 'per session' : 'per event'),
          durationHours: d.durationHours,
          includedPhotos: d.includedPhotos,
          includedVideos: d.includedVideos,
          photobookPhotos: d.photobookPhotos ?? null,
          hasLiveStream: d.hasLiveStream,
          deliveryDays: d.deliveryDays,
          serviceType: d.serviceType,
          deliveryPolicy: pkgDeliveryPolicy,
          otherPolicies: pkgOtherPolicies,
          addons: pkgAddons,
          droneCapturingPrice: pkgDronePrice,
          hasDroneCapturing: Boolean(pkgDronePrice && pkgDronePrice > 0),
          description: d.enhancedDescription || d.originalDescription,
          features: d.ingredients.map((itemName, idx) => ({
            featureName: itemName,
            isIncluded: true,
            displayOrder: idx,
          })),
        };
      });

      await bulkPublishPackages({
        mode: publishMode,
        enforceTierPolicy: true,
        packages: inputs,
        existingPackages: packages,
      });

      await refreshPackages();
      setSuccessMsg(`Published ${inputs.length} package(s) to your profile.`);
      setViewMode('list');
      setAiStep(1);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not publish packages.');
    } finally {
      setPublishingBatch(false);
    }
  };

  const handleOpenManualEdit = (pkg: Package) => {
    setEditingPkgId(pkg.id);
    setManualServiceType(pkg.serviceType ?? 'OUTDOOR');
    const isStandardTier = (POLICY_PACKAGE_TIERS as readonly string[]).includes(pkg.name);
    setManualTier(isStandardTier ? pkg.name : 'Diamond');
    setUseCustomTitle(!isStandardTier);
    setCustomTitleText(isStandardTier ? '' : pkg.name);
    setManualPrice(String(pkg.price ?? 300000));
    if (pkg.currencyId) setCurrencyId(pkg.currencyId);
    setManualPriceUnit(pkg.priceUnit || (pkg.serviceType === 'STUDIO' ? 'per session' : 'per event'));
    setManualDurationHours(String(pkg.durationHours ?? 6));
    setManualIncludedPhotos(String(pkg.includedPhotos ?? 200));
    setManualIncludedVideos(String(pkg.includedVideos ?? 1));
    setManualDeliveryDays(String(pkg.deliveryDays ?? 7));
    setManualDeliveryPolicy(pkg.deliveryPolicy ?? '');
    setManualOtherPolicies(pkg.otherPolicies ?? []);
    const nextPrices: Record<string, string> = {
      drone_capturing: pkg.droneCapturingPrice ? String(pkg.droneCapturingPrice) : '',
      express_delivery: '',
      extra_hour: '',
      fog_machine: '',
      extra_crew: '',
    };
    const nextCustom: { key: string; name: string; priceText: string }[] = [];
    for (const a of pkg.addons ?? []) {
      if (a.key in nextPrices) {
        nextPrices[a.key] = a.price > 0 ? String(a.price) : '';
      } else if (a.price > 0) {
        nextCustom.push({ key: a.key, name: a.name, priceText: String(a.price) });
      }
    }
    setManualAddonPrices(nextPrices);
    setManualCustomAddons(nextCustom);
    setManualHasLiveStream(Boolean(pkg.hasLiveStream));
    setManualDescription(pkg.description ?? '');
    setManualItems(
      pkg.features && pkg.features.length > 0
        ? pkg.features.map((f) => f.featureName)
        : ['Edited high-resolution photos', 'Online gallery delivery'],
    );
    setBuilderTab('manual');
    setViewMode('builder');
  };

  const handleManualSubmit = async () => {
    setErrorMsg(null);
    const resolvedCurrencyId = currencyId || currencies[0]?.id;
    if (!resolvedCurrencyId) {
      setErrorMsg('Please select a currency.');
      return;
    }
    const priceNum = Number(String(manualPrice).replace(/,/g, '').trim());
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid package price.');
      return;
    }

    const chosenName =
      useCustomTitle && customTitleText.trim() ? customTitleText.trim() : manualTier;

    const features: PackageFeatureItem[] = manualItems
      .map((s) => s.trim())
      .filter(Boolean)
      .map((featureName, idx) => ({
        featureName,
        isIncluded: true,
        displayOrder: idx,
      }));

    const activeManualAddons = manualAddonsList.filter((a) => a.enabled && a.price > 0);
    const manualDronePrice =
      activeManualAddons.find((a) => a.key === 'drone_capturing')?.price ?? null;
    const selectedCurrCode =
      currencies.find((c) => c.id === resolvedCurrencyId)?.code || 'RWF';

    const combinedDescription = [
      manualDescription.trim(),
      manualDeliveryPolicy.trim() ? `Delivery policy: ${manualDeliveryPolicy.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' • ');

    const input: CreatePackageInput = {
      packageName: chosenName,
      price: priceNum,
      currencyId: resolvedCurrencyId,
      currencyCode: selectedCurrCode,
      priceUnit: manualPriceUnit,
      durationHours: Number(manualDurationHours) || 0,
      includedPhotos: Number(manualIncludedPhotos) || 0,
      includedVideos: Number(manualIncludedVideos) || 0,
      hasLiveStream: manualHasLiveStream,
      deliveryDays: Number(manualDeliveryDays) || 0,
      serviceType: manualServiceType,
      deliveryPolicy: manualDeliveryPolicy.trim(),
      otherPolicies: manualOtherPolicies.filter((p) => p.trim().length > 0),
      addons: activeManualAddons,
      droneCapturingPrice: manualDronePrice,
      hasDroneCapturing: Boolean(manualDronePrice && manualDronePrice > 0),
      description: combinedDescription || features.map((f) => f.featureName).join(' • '),
      features,
    };

    setManualSubmitting(true);
    try {
      if (editingPkgId) {
        await updatePackage(editingPkgId, input);
        setSuccessMsg(`Updated package "${chosenName}".`);
      } else {
        await createPackage(input);
        setSuccessMsg(`Created package "${chosenName}".`);
      }
      setEditingPkgId(null);
      await refreshPackages();
      setViewMode('list');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not save the package.');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleDeletePackage = async (pkg: Package) => {
    setErrorMsg(null);
    setDeletingPkgId(pkg.id);
    try {
      await deletePackage(pkg.id, pkg);
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
      setSuccessMsg(`Deleted package "${pkg.name}".`);
      onPackagesChanged?.();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Could not delete package.');
    } finally {
      setDeletingPkgId(null);
    }
  };

  // ─── Stage Trigger Buttons (Top of Step 2 & Manual Upload) ───
  const renderPoliciesAndAddonsTriggers = (target: 'studio' | 'manual') => {
    const isStudio = target === 'studio';
    const deliveryVal = (isStudio ? studioDeliveryPolicy : manualDeliveryPolicy).trim();
    const otherList = isStudio ? studioOtherPolicies : manualOtherPolicies;
    const hasDelivery = Boolean(deliveryVal);
    const activeAddons = (isStudio ? studioAddonsList : manualAddonsList).filter(
      (a) => a.enabled && a.price > 0,
    );
    const droneAddon = activeAddons.find((a) => a.key === 'drone_capturing');

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* 1. Add Delivery Policy Button (Opens Delivery Policy Modal) */}
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setPolicyModalTarget(target);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: 14,
            border: `1.5px solid ${hasDelivery ? colors.brandPrimary : colors.borderPrimary}`,
            background: hasDelivery ? `${colors.brandPrimary}10` : colors.bgTertiary,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: `${colors.brandPrimary}16`,
                color: colors.brandPrimary,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="bi bi-shield-check" />
            </span>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: '0.66rem',
                fontWeight: 800,
                background: hasDelivery ? `${colors.brandPrimary}20` : colors.bgCard,
                color: hasDelivery ? colors.brandPrimary : colors.textSecondary,
                border: `1px solid ${hasDelivery ? colors.brandPrimary : colors.borderPrimary}`,
              }}
            >
              {hasDelivery ? (isStudio && policyReadFromMenu ? '✓ FROM MENU' : '✓ SAVED') : 'OPTIONAL'}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: colors.textPrimary }}>
            {hasDelivery ? 'Delivery Policy' : 'Add Delivery Policy'}
          </div>
          <div style={{ fontSize: '0.76rem', color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
            {hasDelivery
              ? `${deliveryVal}${otherList.length > 0 ? ` (+${otherList.length} more)` : ''}`
              : 'Tap to add delivery & studio rules'}
          </div>
        </button>

        {/* 2. Add-ons & Drone Capturing Button (Opens Add-ons Modal) */}
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setAddonsModalTarget(target);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: 14,
            border: `1.5px solid ${activeAddons.length > 0 ? colors.brandPrimary : colors.borderPrimary}`,
            background: activeAddons.length > 0 ? `${colors.brandPrimary}10` : colors.bgTertiary,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: `${colors.brandPrimary}16`,
                color: colors.brandPrimary,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="bi bi-airplane" />
            </span>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: '0.66rem',
                fontWeight: 800,
                background: activeAddons.length > 0 ? `${colors.brandPrimary}20` : colors.bgCard,
                color: activeAddons.length > 0 ? colors.brandPrimary : colors.textSecondary,
                border: `1px solid ${activeAddons.length > 0 ? colors.brandPrimary : colors.borderPrimary}`,
              }}
            >
              {droneAddon
                ? `DRONE ON · +${Math.round(droneAddon.price / 1000)}K`
                : activeAddons.length > 0
                  ? `${activeAddons.length} ACTIVE`
                  : 'OPTIONAL'}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: colors.textPrimary }}>
            Add-ons &amp; Drone
          </div>
          <div style={{ fontSize: '0.76rem', color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
            {activeAddons.length > 0
              ? activeAddons.map((a) => `${a.name} (+${a.price.toLocaleString()})`).join(' · ')
              : detectedDroneInMenu
                ? 'Drone spotted in menu · Tap to price'
                : 'Drone Capturing & self-priced extras'}
          </div>
        </button>
      </div>
    );
  };

  // ─── Modals for Delivery Policy & Add-ons / Drone Capturing ───
  const renderPolicyAndAddonsModals = () => {
    const activeTarget = policyModalTarget || addonsModalTarget || 'studio';
    const isStudio = activeTarget === 'studio';

    const deliveryVal = isStudio ? studioDeliveryPolicy : manualDeliveryPolicy;
    const setDeliveryVal = isStudio
      ? (val: string) => {
          setStudioDeliveryPolicy(val);
          setExtractedDrafts((prev) =>
            prev.map((d) => ({ ...d, deliveryPolicy: val || d.deliveryPolicy })),
          );
        }
      : setManualDeliveryPolicy;

    const otherList = isStudio ? studioOtherPolicies : manualOtherPolicies;
    const setOtherList = isStudio
      ? (updater: (prev: string[]) => string[]) => {
          setStudioOtherPolicies((prev) => {
            const next = updater(prev);
            setExtractedDrafts((drafts) => drafts.map((d) => ({ ...d, otherPolicies: next })));
            return next;
          });
        }
      : setManualOtherPolicies;

    const newPolicyInput = isStudio ? newStudioPolicyText : newManualPolicyText;
    const setNewPolicyInput = isStudio ? setNewStudioPolicyText : setNewManualPolicyText;

    const addonPrices = isStudio ? studioAddonPrices : manualAddonPrices;
    const updateAddonPrice = (key: string, rawVal: string) => {
      const cleanDigits = rawVal.replace(/[^\d]/g, '');
      if (isStudio) {
        setStudioAddonPrices((prev) => {
          const next = { ...prev, [key]: cleanDigits };
          const updatedAddons = buildAddonsListFromInputs(next, studioCustomAddons, 'RWF');
          const activeOnly = updatedAddons.filter((a) => a.enabled && a.price > 0);
          const dronePrice = activeOnly.find((a) => a.key === 'drone_capturing')?.price ?? null;
          setExtractedDrafts((drafts) =>
            drafts.map((d) => ({
              ...d,
              addons: activeOnly,
              droneCapturingPrice: dronePrice,
              hasDroneCapturing: Boolean(dronePrice && dronePrice > 0),
            })),
          );
          return next;
        });
      } else {
        setManualAddonPrices((prev) => ({ ...prev, [key]: cleanDigits }));
      }
    };

    const customAddons = isStudio ? studioCustomAddons : manualCustomAddons;
    const newAddonName = isStudio ? newStudioAddonName : newManualAddonName;
    const setNewAddonName = isStudio ? setNewStudioAddonName : setNewManualAddonName;
    const newAddonPrice = isStudio ? newStudioAddonPrice : newManualAddonPrice;
    const setNewAddonPrice = isStudio ? setNewStudioAddonPrice : setNewManualAddonPrice;

    const handleAddCustomAddon = () => {
      const cleanName = newAddonName.trim();
      const cleanDigits = newAddonPrice.replace(/[^\d]/g, '');
      if (!cleanName) return;
      const newEntry = {
        key: `custom_${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`,
        name: cleanName,
        priceText: cleanDigits,
      };
      if (isStudio) {
        setStudioCustomAddons((prev) => {
          const next = [...prev, newEntry];
          const updatedAddons = buildAddonsListFromInputs(studioAddonPrices, next, 'RWF').filter(
            (a) => a.enabled && a.price > 0,
          );
          setExtractedDrafts((drafts) => drafts.map((d) => ({ ...d, addons: updatedAddons })));
          return next;
        });
      } else {
        setManualCustomAddons((prev) => [...prev, newEntry]);
      }
      setNewAddonName('');
      setNewAddonPrice('');
    };

    const dronePriceNum = Number((addonPrices.drone_capturing || '').replace(/[^\d]/g, '')) || 0;
    const isDroneEnabled = dronePriceNum > 0;

    return (
      <>
        {policyModalTarget !== null && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setPolicyModalTarget(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15,23,42,0.62)',
              backdropFilter: 'blur(6px)',
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 540,
                background: colors.bgModal,
                borderRadius: 20,
                padding: 20,
                border: `1px solid ${colors.borderPrimary}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-shield-check" style={{ color: colors.brandPrimary, fontSize: 18 }} />
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: colors.textPrimary }}>
                    Delivery Policy
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.66rem', fontWeight: 800, background: colors.bgTertiary, color: colors.textSecondary }}>
                    OPTIONAL
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPolicyModalTarget(null)}
                  style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: 18 }}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 6 }}>
                  Delivery Turnaround Policy
                </label>
                <input
                  type="text"
                  value={deliveryVal}
                  onChange={(e) => setDeliveryVal(e.target.value)}
                  placeholder="e.g. Delivery in 5–7 days via online gallery"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${colors.borderPrimary}`,
                    background: colors.bgCard,
                    color: colors.textPrimary,
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUICK_DELIVERY_POLICY_PRESETS.map((preset) => {
                  const active = deliveryVal.trim() === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDeliveryVal(preset)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: `1px solid ${active ? colors.brandPrimary : colors.borderPrimary}`,
                        background: active ? colors.brandPrimary : colors.bgTertiary,
                        color: active ? '#fff' : colors.textPrimary,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 6 }}>
                  Other Studio Policies
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {QUICK_OTHER_POLICY_PRESETS.map((preset) => {
                    const active = otherList.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setOtherList((prev) =>
                            prev.includes(preset) ? prev.filter((p) => p !== preset) : [...prev, preset],
                          )
                        }
                        style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: `1px solid ${active ? colors.brandPrimary : colors.borderPrimary}`,
                          background: active ? colors.brandPrimary : colors.bgTertiary,
                          color: active ? '#fff' : colors.textPrimary,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {active ? '✓ ' : '+ '}
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newPolicyInput}
                    onChange={(e) => setNewPolicyInput(e.target.value)}
                    placeholder="Add custom rule..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: `1.5px solid ${colors.borderPrimary}`,
                      background: colors.bgCard,
                      color: colors.textPrimary,
                      fontSize: '0.84rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = newPolicyInput.trim();
                      if (!clean) return;
                      setOtherList((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
                      setNewPolicyInput('');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: colors.brandPrimary,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPolicyModalTarget(null)}
                style={{
                  padding: '11px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: colors.brandPrimary,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Save Delivery Policy
              </button>
            </div>
          </div>
        )}

        {addonsModalTarget !== null && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setAddonsModalTarget(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15,23,42,0.62)',
              backdropFilter: 'blur(6px)',
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 560,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: colors.bgModal,
                borderRadius: 20,
                padding: 20,
                border: `1px solid ${colors.borderPrimary}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-airplane" style={{ color: colors.brandPrimary, fontSize: 18 }} />
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: colors.textPrimary }}>
                    Add-ons &amp; Drone Capturing
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAddonsModalTarget(null)}
                  style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: 18 }}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {/* Featured Self-Priced Drone Capturing Card */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: `1.5px solid ${isDroneEnabled ? colors.brandPrimary : colors.borderPrimary}`,
                  background: isDroneEnabled ? `${colors.brandPrimary}10` : colors.bgTertiary,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: colors.textPrimary }}>
                    <i className="bi bi-airplane-fill" style={{ color: colors.brandPrimary, marginRight: 6 }} />
                    Drone Capturing (Self-Priced)
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      background: isDroneEnabled ? colors.brandPrimary : colors.bgCard,
                      color: isDroneEnabled ? '#fff' : colors.textSecondary,
                    }}
                  >
                    {isDroneEnabled ? `ON · +${dronePriceNum.toLocaleString()} RWF` : 'OFF (Enter amount to enable)'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addonPrices.drone_capturing || ''}
                    onChange={(e) => updateAddonPrice('drone_capturing', e.target.value)}
                    placeholder="Enter your Drone Capturing price (RWF) — 0 leaves it OFF"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: `1.5px solid ${colors.borderPrimary}`,
                      background: colors.bgCard,
                      color: colors.textPrimary,
                      fontSize: '0.84rem',
                    }}
                  />
                  {isDroneEnabled && (
                    <button
                      type="button"
                      onClick={() => updateAddonPrice('drone_capturing', '')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textSecondary,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Other Standard Self-Priced Add-ons */}
              {DEFAULT_PACKAGE_ADDON_TEMPLATES.filter((t) => !t.isDrone).map((tpl) => {
                const val = addonPrices[tpl.key] || '';
                const numVal = Number(val.replace(/[^\d]/g, '')) || 0;
                const enabled = numVal > 0;
                return (
                  <div
                    key={tpl.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${enabled ? colors.brandPrimary : colors.borderPrimary}`,
                      background: colors.bgCard,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: colors.textPrimary }}>{tpl.name}</div>
                      <div style={{ fontSize: '0.72rem', color: colors.textSecondary }}>{tpl.description}</div>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={val}
                      onChange={(e) => updateAddonPrice(tpl.key, e.target.value)}
                      placeholder="Amount (RWF)"
                      style={{
                        width: 130,
                        padding: '7px 10px',
                        borderRadius: 8,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgTertiary,
                        color: colors.textPrimary,
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                );
              })}

              {/* Custom Add-ons */}
              {customAddons.map((c) => (
                <div
                  key={c.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: `1px solid ${colors.borderPrimary}`,
                    background: colors.bgCard,
                  }}
                >
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: colors.textPrimary }}>
                    {c.name} (+{Number(c.priceText || 0).toLocaleString()} RWF)
                  </span>
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8 }}>
                <input
                  type="text"
                  value={newAddonName}
                  onChange={(e) => setNewAddonName(e.target.value)}
                  placeholder="Custom add-on name..."
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${colors.borderPrimary}`,
                    background: colors.bgCard,
                    color: colors.textPrimary,
                    fontSize: '0.82rem',
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={newAddonPrice}
                  onChange={(e) => setNewAddonPrice(e.target.value)}
                  placeholder="Price (RWF)"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${colors.borderPrimary}`,
                    background: colors.bgCard,
                    color: colors.textPrimary,
                    fontSize: '0.82rem',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomAddon}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: colors.brandPrimary,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  + Add
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAddonsModalTarget(null)}
                style={{
                  padding: '11px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: colors.brandPrimary,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Save Add-ons
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {renderPolicyAndAddonsModals()}

      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: colors.textPrimary }}>
            {viewMode === 'list' ? 'My Packages' : 'Upload & Create Packages'}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: colors.textSecondary }}>
            {viewMode === 'list'
              ? 'Manage your Indoor (Studio) and Outdoor (Event) packages, delivery policies, and self-priced Drone Capturing.'
              : 'Upload your menu PDF/photo to organize packages automatically or create a custom package manually.'}
          </p>
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            {viewMode === 'list' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPkgId(null);
                    setBuilderTab('ai');
                    setAiStep(1);
                    setViewMode('builder');
                  }}
                  style={{
                    padding: '9px 15px',
                    borderRadius: 10,
                    border: 'none',
                    background: colors.brandPrimary,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <i className="bi bi-file-earmark-arrow-up" /> Upload Menu / Add Packages
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${colors.borderPrimary}`,
                  background: colors.bgCard,
                  color: colors.textPrimary,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <i className="bi bi-arrow-left" /> Back to My Packages ({packages.length})
              </button>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.35)',
            color: '#059669',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer' }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {/* ───────── VIEW 1: MY PACKAGES LIST ───────── */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(
              [
                ['ALL', `All (${packages.length})`],
                ['OUTDOOR', `Outdoor (${packages.filter((p) => (p.serviceType ?? 'OUTDOOR') === 'OUTDOOR').length})`],
                ['STUDIO', `Indoor (${packages.filter((p) => p.serviceType === 'STUDIO').length})`],
              ] as const
            ).map(([key, label]) => {
              const active = sessionFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSessionFilter(key)}
                  style={{
                    padding: '6px 13px',
                    borderRadius: 999,
                    border: `1.5px solid ${active ? colors.brandPrimary : colors.borderPrimary}`,
                    background: active ? colors.brandPrimary : colors.bgCard,
                    color: active ? '#fff' : colors.textPrimary,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ padding: 28, textAlign: 'center', color: colors.textSecondary, fontSize: '0.88rem' }}>
              Loading your packages...
            </div>
          ) : filteredExistingPackages.length === 0 ? (
            <div
              style={{
                padding: '32px 20px',
                borderRadius: 16,
                border: `1.5px dashed ${colors.borderPrimary}`,
                background: colors.bgTertiary,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: colors.textPrimary }}>
                No packages in this view yet
              </div>
              <div style={{ fontSize: '0.82rem', color: colors.textSecondary, maxWidth: 420 }}>
                Upload your existing PDF or photo menu to extract all your packages automatically, or add a custom package manually.
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setBuilderTab('ai');
                    setAiStep(1);
                    setViewMode('builder');
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: colors.brandPrimary,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  + Upload Menu / Create Package
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {filteredExistingPackages.map((pkg) => {
                const activeAddons = (pkg.addons ?? []).filter((a) => a.enabled && a.price > 0);
                return (
                  <div
                    key={pkg.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: `1px solid ${colors.borderPrimary}`,
                      background: colors.bgTertiary,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: colors.textPrimary }}>{pkg.name}</span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              background: pkg.serviceType === 'STUDIO' ? `${colors.brandPrimary}18` : 'rgba(245,158,11,0.16)',
                              color: pkg.serviceType === 'STUDIO' ? colors.brandPrimary : '#D97706',
                            }}
                          >
                            {pkg.serviceType === 'STUDIO' ? 'Indoor (Studio)' : 'Outdoor (Events)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: colors.textSecondary, marginTop: 2 }}>
                          {pkg.durationHours ? `${pkg.durationHours}h coverage` : 'Flexible hours'}
                          {pkg.includedPhotos ? ` · ${pkg.includedPhotos} photos` : ''}
                          {pkg.includedVideos ? ` · ${pkg.includedVideos} video(s)` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 900, color: colors.brandPrimary }}>
                        {pkg.currency || 'RWF'} {(pkg.price ?? 0).toLocaleString()}
                      </div>
                    </div>

                    {pkg.deliveryPolicy && (
                      <div style={{ fontSize: '0.76rem', color: colors.textSecondary }}>
                        <i className="bi bi-shield-check" style={{ color: colors.brandPrimary, marginRight: 5 }} />
                        {pkg.deliveryPolicy}
                      </div>
                    )}

                    {activeAddons.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {activeAddons.map((addon) => (
                          <span
                            key={addon.key}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 999,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: `${colors.brandPrimary}16`,
                              color: colors.brandPrimary,
                            }}
                          >
                            <i className={`bi ${addon.key === 'drone_capturing' ? 'bi-airplane-fill' : 'bi-plus-circle'}`} />{' '}
                            {addon.name}: +{addon.price.toLocaleString()} {addon.currencyCode || pkg.currency || 'RWF'}
                          </span>
                        ))}
                      </div>
                    )}

                    {pkg.features && pkg.features.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {pkg.features.slice(0, 5).map((f, i) => (
                          <div key={i} style={{ fontSize: '0.77rem', color: colors.textSecondary }}>
                            • {f.featureName}
                          </div>
                        ))}
                      </div>
                    )}

                    {canEdit && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                        {onOpenGeoPricing && (
                          <button
                            type="button"
                            onClick={() => onOpenGeoPricing({ id: pkg.id, name: pkg.name })}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              border: `1px solid ${colors.borderPrimary}`,
                              background: colors.bgCard,
                              color: colors.textPrimary,
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            🌍 Geo pricing
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenManualEdit(pkg)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: `1px solid ${colors.brandPrimary}`,
                            background: colors.bgCard,
                            color: colors.brandPrimary,
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingPkgId === pkg.id}
                          onClick={() => handleDeletePackage(pkg)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(220,38,38,0.35)',
                            background: 'rgba(254,242,242,0.85)',
                            color: '#DC2626',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {deletingPkgId === pkg.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────── VIEW 2: UPLOAD DOCUMENT & MANUAL BUILDER ───────── */}
      {viewMode === 'builder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mode Switch: Upload Document vs Manual Upload */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4, borderRadius: 12, background: colors.bgTertiary }}>
            <button
              type="button"
              onClick={() => setBuilderTab('ai')}
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                border: 'none',
                background: builderTab === 'ai' ? colors.brandPrimary : 'transparent',
                color: builderTab === 'ai' ? '#fff' : colors.textPrimary,
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-file-earmark-richtext" /> Upload Document
            </button>
            <button
              type="button"
              onClick={() => setBuilderTab('manual')}
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                border: 'none',
                background: builderTab === 'manual' ? colors.brandPrimary : 'transparent',
                color: builderTab === 'manual' ? '#fff' : colors.textPrimary,
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-sliders" /> Manual Upload
            </button>
          </div>

          {builderTab === 'ai' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Step Indicator */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  [1, '1. Upload Document'],
                  [2, '2. Organize Packages'],
                  [3, '3. Review & Publish'],
                ].map(([num, label]) => {
                  const active = aiStep === num;
                  const done = aiStep > (num as number);
                  return (
                    <div
                      key={num}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${active || done ? colors.brandPrimary : colors.borderPrimary}`,
                        background: active ? `${colors.brandPrimary}14` : colors.bgCard,
                        color: active || done ? colors.brandPrimary : colors.textSecondary,
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textAlign: 'center',
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* STEP 1: UPLOAD DOCUMENT */}
              {aiStep === 1 && (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    border: `1px solid ${colors.borderPrimary}`,
                    background: colors.bgTertiary,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 6 }}>
                      Default Session Category
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(
                        [
                          ['STUDIO', 'Indoor (Studio)'],
                          ['OUTDOOR', 'Outdoor (Events)'],
                        ] as const
                      ).map(([st, lbl]) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setDefaultSession(st)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: `1.5px solid ${defaultSession === st ? colors.brandPrimary : colors.borderPrimary}`,
                            background: defaultSession === st ? colors.brandPrimary : colors.bgCard,
                            color: defaultSession === st ? '#fff' : colors.textPrimary,
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                          }}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) setUploadedFiles((prev) => [...prev, ...files]);
                      }}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%',
                        padding: '22px 16px',
                        borderRadius: 14,
                        border: `2px dashed ${colors.brandPrimary}`,
                        background: colors.bgCard,
                        color: colors.brandPrimary,
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <i className="bi bi-cloud-arrow-up" style={{ fontSize: 26 }} />
                      <span>Choose Menu PDF or Package Photos</span>
                    </button>

                    {uploadedFiles.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                        {uploadedFiles.map((f, idx) => (
                          <span
                            key={`${f.name}-${idx}`}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 999,
                              background: colors.bgCard,
                              border: `1px solid ${colors.borderPrimary}`,
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: colors.textPrimary,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {f.name}
                            <button
                              type="button"
                              onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0 }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 6 }}>
                      Or Paste Package Menu Text (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={rawBrochureText}
                      onChange={(e) => setRawBrochureText(e.target.value)}
                      placeholder="Paste package names, items, and prices..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1.5px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textPrimary,
                        fontSize: '0.84rem',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={extracting}
                    onClick={handleRunAiExtraction}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 12,
                      border: 'none',
                      background: colors.brandPrimary,
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: extracting ? 'wait' : 'pointer',
                    }}
                  >
                    {extracting ? 'Scanning & Organizing Packages...' : 'Scan & Organize Packages'}
                  </button>
                </div>
              )}

              {/* STEP 2: ORGANIZE PACKAGES (With Top-of-Stage Delivery Policy & Add-ons / Drone Modal Triggers) */}
              {aiStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {renderPoliciesAndAddonsTriggers('studio')}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {extractedDrafts.map((draft, idx) => (
                      <div
                        key={draft.tempId}
                        style={{
                          padding: 14,
                          borderRadius: 14,
                          border: `1px solid ${colors.borderPrimary}`,
                          background: colors.bgTertiary,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '0.96rem', fontWeight: 800, color: colors.textPrimary }}>
                                {draft.packageName}
                              </span>
                              {idx === 0 && (
                                <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 800, background: `${colors.brandPrimary}20`, color: colors.brandPrimary }}>
                                  HIGHEST AMOUNT • DIAMOND
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                              Extracted from: &ldquo;{draft.originalTitle}&rdquo;
                            </div>
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 900, color: colors.brandPrimary }}>
                            {draft.price ? `${draft.price.toLocaleString()} ${draft.currencyCode}` : 'Price needed'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(['STUDIO', 'OUTDOOR'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleToggleDraftSession(draft.tempId, st)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 999,
                                  border: `1px solid ${draft.serviceType === st ? colors.brandPrimary : colors.borderPrimary}`,
                                  background: draft.serviceType === st ? colors.brandPrimary : colors.bgCard,
                                  color: draft.serviceType === st ? '#fff' : colors.textSecondary,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {st === 'STUDIO' ? 'Indoor (Studio)' : 'Outdoor (Events)'}
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setEditingDraft(draft)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: `1px solid ${colors.borderPrimary}`,
                                background: colors.bgCard,
                                color: colors.brandPrimary,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Edit Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDraft(draft.tempId)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: '1px solid rgba(220,38,38,0.35)',
                                background: 'rgba(254,242,242,0.85)',
                                color: '#DC2626',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.76rem', color: colors.textSecondary }}>
                          {draft.ingredients.join(' • ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleAddEmptyDraft}
                      style={{
                        padding: '9px 14px',
                        borderRadius: 10,
                        border: `1.5px dashed ${colors.brandPrimary}`,
                        background: colors.bgCard,
                        color: colors.brandPrimary,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      + Add Another Package
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setAiStep(1)}
                        style={{
                          padding: '9px 14px',
                          borderRadius: 10,
                          border: `1px solid ${colors.borderPrimary}`,
                          background: colors.bgCard,
                          color: colors.textSecondary,
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiStep(3)}
                        style={{
                          padding: '9px 16px',
                          borderRadius: 10,
                          border: 'none',
                          background: colors.brandPrimary,
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                        }}
                      >
                        Next: Review by Session
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & PUBLISH */}
              {aiStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setReviewSessionTab('STUDIO')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: `1.5px solid ${reviewSessionTab === 'STUDIO' ? colors.brandPrimary : colors.borderPrimary}`,
                        background: reviewSessionTab === 'STUDIO' ? colors.brandPrimary : colors.bgCard,
                        color: reviewSessionTab === 'STUDIO' ? '#fff' : colors.textPrimary,
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Indoor ({studioDrafts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewSessionTab('OUTDOOR')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: `1.5px solid ${reviewSessionTab === 'OUTDOOR' ? colors.brandPrimary : colors.borderPrimary}`,
                        background: reviewSessionTab === 'OUTDOOR' ? colors.brandPrimary : colors.bgCard,
                        color: reviewSessionTab === 'OUTDOOR' ? '#fff' : colors.textPrimary,
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Outdoor ({outdoorDrafts.length})
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeSessionDrafts.map((d) => (
                      <div
                        key={d.tempId}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: `1px solid ${colors.borderPrimary}`,
                          background: colors.bgTertiary,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: colors.textPrimary }}>{d.packageName}</div>
                          <div style={{ fontSize: '0.76rem', color: colors.textSecondary }}>{d.ingredients.join(' • ')}</div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '0.92rem', color: colors.brandPrimary }}>
                          {d.price?.toLocaleString()} {d.currencyCode}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setAiStep(2)}
                      style={{
                        padding: '9px 14px',
                        borderRadius: 10,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textSecondary,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={publishingBatch}
                      onClick={handlePublishBatch}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: 'none',
                        background: colors.brandPrimary,
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        cursor: publishingBatch ? 'wait' : 'pointer',
                      }}
                    >
                      {publishingBatch ? 'Publishing...' : `Publish ${extractedDrafts.length} Package(s)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MANUAL CUSTOM UPLOAD */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {renderPoliciesAndAddonsTriggers('manual')}

              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: `1px solid ${colors.borderPrimary}`,
                  background: colors.bgTertiary,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  {(
                    [
                      ['STUDIO', 'Indoor (Studio)'],
                      ['OUTDOOR', 'Outdoor (Events)'],
                    ] as const
                  ).map(([st, lbl]) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setManualServiceType(st);
                        setManualPriceUnit(st === 'STUDIO' ? 'per session' : 'per event');
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 10,
                        border: `1.5px solid ${manualServiceType === st ? colors.brandPrimary : colors.borderPrimary}`,
                        background: manualServiceType === st ? colors.brandPrimary : colors.bgCard,
                        color: manualServiceType === st ? '#fff' : colors.textPrimary,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 6 }}>
                    Package Title (Tier Policy or Custom)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {POLICY_PACKAGE_TIERS.map((tier) => {
                      const active = !useCustomTitle && manualTier === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => {
                            setUseCustomTitle(false);
                            setManualTier(tier);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 999,
                            border: `1px solid ${active ? colors.brandPrimary : colors.borderPrimary}`,
                            background: active ? colors.brandPrimary : colors.bgCard,
                            color: active ? '#fff' : colors.textPrimary,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {tier}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setUseCustomTitle(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        border: `1px solid ${useCustomTitle ? colors.brandPrimary : colors.borderPrimary}`,
                        background: useCustomTitle ? colors.brandPrimary : colors.bgCard,
                        color: useCustomTitle ? '#fff' : colors.textPrimary,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Custom Title
                    </button>
                  </div>
                  {useCustomTitle && (
                    <input
                      type="text"
                      value={customTitleText}
                      onChange={(e) => setCustomTitleText(e.target.value)}
                      placeholder="Enter custom package title..."
                      style={{
                        marginTop: 8,
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textPrimary,
                        fontSize: '0.84rem',
                      }}
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 4 }}>
                      Price *
                    </label>
                    <input
                      type="number"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 4 }}>
                      Currency *
                    </label>
                    <select
                      value={currencyId}
                      onChange={(e) => setCurrencyId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textPrimary,
                      }}
                    >
                      {currencies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 4 }}>
                      Duration (Hours)
                    </label>
                    <input
                      type="number"
                      value={manualDurationHours}
                      onChange={(e) => setManualDurationHours(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 4 }}>
                      Edited Photos
                    </label>
                    <input
                      type="number"
                      value={manualIncludedPhotos}
                      onChange={(e) => setManualIncludedPhotos(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textPrimary,
                      }}
                    />
                  </div>
                </div>

                {/* Included Items Builder */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 6 }}>
                    Included Items ({manualItems.length})
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {QUICK_FEATURE_SUGGESTIONS[manualServiceType as ServiceType].map((sug) => {
                      const active = manualItems.includes(sug);
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() =>
                            setManualItems((prev) =>
                              prev.includes(sug) ? prev.filter((i) => i !== sug) : [...prev, sug],
                            )
                          }
                          style={{
                            padding: '5px 10px',
                            borderRadius: 999,
                            border: `1px solid ${active ? colors.brandPrimary : colors.borderPrimary}`,
                            background: active ? colors.brandPrimary : colors.bgCard,
                            color: active ? '#fff' : colors.textPrimary,
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {active ? '✓ ' : '+ '}
                          {sug}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={newManualItemInput}
                      onChange={(e) => setNewManualItemInput(e.target.value)}
                      placeholder="Add custom included item..."
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: `1px solid ${colors.borderPrimary}`,
                        background: colors.bgCard,
                        color: colors.textPrimary,
                        fontSize: '0.82rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = newManualItemInput.trim();
                        if (!clean) return;
                        setManualItems((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
                        setNewManualItemInput('');
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: colors.brandPrimary,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={manualSubmitting}
                  onClick={handleManualSubmit}
                  style={{
                    padding: '11px 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: colors.brandPrimary,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: manualSubmitting ? 'wait' : 'pointer',
                  }}
                >
                  {manualSubmitting ? 'Saving...' : editingPkgId ? 'Update Package' : 'Save Package'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Extracted Draft Modal */}
      {editingDraft && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingDraft(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15,23,42,0.62)',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: colors.bgModal,
              borderRadius: 18,
              padding: 20,
              border: `1px solid ${colors.borderPrimary}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>
              Edit {editingDraft.packageName} Package
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: colors.textSecondary, marginBottom: 4 }}>
                Price ({editingDraft.currencyCode})
              </label>
              <input
                type="number"
                value={editingDraft.price ?? ''}
                onChange={(e) =>
                  setEditingDraft({ ...editingDraft, price: Number(e.target.value) || null })
                }
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderPrimary}`,
                  background: colors.bgCard,
                  color: colors.textPrimary,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newDraftFeatureText}
                onChange={(e) => setNewDraftFeatureText(e.target.value)}
                placeholder="Add item to package..."
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderPrimary}`,
                  background: colors.bgCard,
                  color: colors.textPrimary,
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const clean = newDraftFeatureText.trim();
                  if (!clean) return;
                  setEditingDraft({
                    ...editingDraft,
                    ingredients: [...editingDraft.ingredients, clean],
                  });
                  setNewDraftFeatureText('');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: colors.brandPrimary,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setEditingDraft(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderPrimary}`,
                  background: colors.bgCard,
                  color: colors.textSecondary,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setExtractedDrafts((prev) =>
                    applyPackageTierNamingPolicy(
                      prev.map((d) => (d.tempId === editingDraft.tempId ? editingDraft : d)),
                    ),
                  );
                  setEditingDraft(null);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: colors.brandPrimary,
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
