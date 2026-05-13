"use client";
import React, { useState, useEffect, useRef } from 'react';
import { dashboardAuthFetch } from '../providers/AuthProvider';
import { getApiUrl } from '@/lib/api';

interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  colors: Record<string, string>;
  actualTheme: string;
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

type WizardStep = 1 | 2 | 3 | 4;
const WIZARD_LABELS = ['Personal Info', 'Selfie', 'Government ID', 'Review'];
const KYC_DRAFT_KEY = 'kyc_draft_v1';

export default function KycVerificationModal({ isOpen, onClose, onSuccess, colors, actualTheme }: KycVerificationModalProps) {
  const [step, setStep] = useState<'form' | 'uploading' | 'success' | 'failed'>('form');
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [error, setError] = useState('');

  const [fullLegalName, setFullLegalName] = useState('');
  const [gender, setGender] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState('');

  type DocumentType = '' | 'PASSPORT' | 'NATIONAL_ID' | 'DRIVER_LICENSE';
  const [documentType, setDocumentType] = useState<DocumentType>('');
  const [govIdFront, setGovIdFront] = useState<File | null>(null);
  const [govIdFrontPreview, setGovIdFrontPreview] = useState('');
  const [govIdRatioWarning, setGovIdRatioWarning] = useState('');
  // Separate warning fired when the front image looks like a face photo (big face)
  // rather than a real document. Gates Next the same way the ratio warning does.
  const [govIdFaceWarning, setGovIdFaceWarning] = useState('');
  // Server-side OCR validation result — checked while on Step 3 so the user is
  // gated right there instead of at submit.
  const [govIdOcrWarning, setGovIdOcrWarning] = useState('');
  const [govIdOcrStatus, setGovIdOcrStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  // Side-validation warnings — distinguish FRONT from BACK of ID / license.
  const [govIdFrontSideWarning, setGovIdFrontSideWarning] = useState('');
  const [govIdBackSideWarning, setGovIdBackSideWarning] = useState('');
  const [govIdSideCheckStatus, setGovIdSideCheckStatus] = useState<'idle' | 'checking' | 'ok'>('idle');

  const imageLandmarkerRef = useRef<unknown>(null);
  const [govIdBack, setGovIdBack] = useState<File | null>(null);
  const [govIdBackPreview, setGovIdBackPreview] = useState('');
  const [idCameraSide, setIdCameraSide] = useState<null | 'front' | 'back'>(null);

  const selfieInputRef = useRef<HTMLInputElement>(null);
  const govIdFrontInputRef = useRef<HTMLInputElement>(null);
  const govIdBackInputRef = useRef<HTMLInputElement>(null);
  const idVideoRef = useRef<HTMLVideoElement>(null);
  const idStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraMode, setCameraMode] = useState<'idle' | 'live' | 'unavailable'>('idle');
  const [cameraError, setCameraError] = useState('');

  // Liveness detection
  type LivenessChallenge = 'blink' | 'turn-left' | 'turn-right';
  type LivenessStage = 'loading' | 'searching' | LivenessChallenge | 'success' | 'timeout';
  const [livenessStage, setLivenessStage] = useState<LivenessStage>('loading');
  const [blinkCount, setBlinkCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [landmarkerReady, setLandmarkerReady] = useState(false);
  const landmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number | null>(null);
  const stageRef = useRef<LivenessStage>('loading');
  const blinkCountRef = useRef(0);
  const blinkArmedRef = useRef(true);
  const [tooDark, setTooDark] = useState(false);
  const tooDarkRef = useRef(false);
  const brightnessCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Randomized challenge order + timing
  const challengeOrderRef = useRef<LivenessChallenge[]>([]);
  const challengeIndexRef = useRef(0);
  const challengeStartTimeRef = useRef(0);
  const CHALLENGE_TIME_LIMIT = 8000; // 8 seconds per challenge — generous for slow users
  const REQUIRED_BLINKS = 1; // was 2 — still requires a real eye close/open cycle
  const [challengeTimeLeft, setChallengeTimeLeft] = useState(0);

  // Multi-frame selfie capture (one frame per completed challenge)
  const capturedFramesRef = useRef<Blob[]>([]);

  // Backend session-binding challenge token
  const challengeTokenRef = useRef<string | null>(null);

  // Forensic metadata — timing per challenge in ms
  const challengeTimingsRef = useRef<number[]>([]);

  // Portrait orientation — used to rotate camera overlays for mobile
  const [isPortrait, setIsPortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (max-width: 768px)');
    const update = () => setIsPortrait(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Preload state — shows users whether the liveness model is ready before they reach Step 2
  const [preloadState, setPreloadState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  // Respect users who prefer reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Screen-reader announcement for step changes — read aloud by assistive tech
  const [stepAnnouncement, setStepAnnouncement] = useState('');
  useEffect(() => {
    if (!isOpen || step !== 'form') return;
    const stepName = WIZARD_LABELS[wizardStep - 1];
    setStepAnnouncement(`Step ${wizardStep} of 4: ${stepName}`);
  }, [wizardStep, isOpen, step]);

  // Keyboard-aware bottom offset — lifts the sticky footer above the virtual keyboard on mobile.
  // Uses VisualViewport API (iOS 13+, Android 11+).
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const vv = (window as typeof window & { visualViewport?: VisualViewport }).visualViewport;
    if (!vv) return;
    const update = () => {
      const diff = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(diff > 60 ? diff : 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Track the actual VISIBLE viewport height. On iOS Safari, window.innerHeight is
  // unreliable — it includes the URL bar area. visualViewport.height gives the true
  // visible area. We expose this as a CSS variable --kyc-vh for use by the modal.
  useEffect(() => {
    const vv = (window as typeof window & { visualViewport?: VisualViewport }).visualViewport;
    const setVh = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty('--kyc-vh', `${h}px`);
    };
    setVh();
    if (vv) {
      vv.addEventListener('resize', setVh);
      vv.addEventListener('scroll', setVh);
    } else {
      window.addEventListener('resize', setVh);
      window.addEventListener('orientationchange', setVh);
    }
    return () => {
      if (vv) {
        vv.removeEventListener('resize', setVh);
        vv.removeEventListener('scroll', setVh);
      } else {
        window.removeEventListener('resize', setVh);
        window.removeEventListener('orientationchange', setVh);
      }
    };
  }, []);

  // Load existing KYC data if rejected (for resubmission)
  const [existingKyc, setExistingKyc] = useState<{
    status: string;
    reviewComment?: string;
    fullLegalName?: string;
    gender?: string;
    locationAddress?: string;
  } | null>(null);

  const setStage = (s: LivenessStage) => {
    stageRef.current = s;
    setLivenessStage(s);
    // Reset timer when entering a new challenge stage
    if (s === 'blink' || s === 'turn-left' || s === 'turn-right') {
      challengeStartTimeRef.current = performance.now();
    }
  };

  const shuffleChallenges = () => {
    // Simplified flow: always blink + ONE head turn (direction randomized).
    // Much less tiring than 3 sequential challenges but still defeats still-photo
    // spoofing (blink) and basic video replay (random direction user can't predict).
    const headTurn: LivenessChallenge = Math.random() < 0.5 ? 'turn-left' : 'turn-right';
    const challenges: LivenessChallenge[] = Math.random() < 0.5
      ? ['blink', headTurn]
      : [headTurn, 'blink'];
    challengeOrderRef.current = challenges;
    challengeIndexRef.current = 0;
    capturedFramesRef.current = [];
    challengeTimingsRef.current = [];
  };

  const advanceToNextChallenge = () => {
    // Record elapsed time for the challenge just completed
    const elapsed = Math.round(performance.now() - challengeStartTimeRef.current);
    challengeTimingsRef.current.push(elapsed);
    // Capture a frame on each completed challenge
    captureFrameToBuffer();
    const nextIdx = challengeIndexRef.current + 1;
    challengeIndexRef.current = nextIdx;
    if (nextIdx >= challengeOrderRef.current.length) {
      setStage('success');
      setTimeout(() => captureNow(), 400);
    } else {
      setStage(challengeOrderRef.current[nextIdx]);
    }
  };

  const captureFrameToBuffer = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob(blob => {
      if (blob) capturedFramesRef.current.push(blob);
    }, 'image/jpeg', 0.85);
  };

  const stopCamera = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraMode('idle');
    setStage('loading');
    setBlinkCount(0);
    blinkCountRef.current = 0;
    blinkArmedRef.current = true;
    setFaceDetected(false);
    challengeOrderRef.current = [];
    challengeIndexRef.current = 0;
    capturedFramesRef.current = [];
    challengeTimingsRef.current = [];
    setChallengeTimeLeft(0);
  };

  const captureNow = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelfiePhoto(file);
      setSelfiePreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const ensureLandmarker = async () => {
    if (landmarkerRef.current) {
      setLandmarkerReady(true);
      return landmarkerRef.current;
    }
    const vision = await import('@mediapipe/tasks-vision');
    const fileset = await vision.FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
    );
    const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    });
    landmarkerRef.current = landmarker;
    setLandmarkerReady(true);
    return landmarker;
  };

  const checkBrightness = (video: HTMLVideoElement): boolean => {
    if (!brightnessCanvasRef.current) {
      brightnessCanvasRef.current = document.createElement('canvas');
      brightnessCanvasRef.current.width = 64;
      brightnessCanvasRef.current.height = 64;
    }
    const c = brightnessCanvasRef.current;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return true;
    ctx.drawImage(video, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 16) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const avg = sum / (data.length / 16);
    return avg >= 55;
  };

  let brightnessCheckCounter = 0;

  const detectLoop = () => {
    const video = videoRef.current;
    const lm = landmarkerRef.current as unknown as {
      detectForVideo: (v: HTMLVideoElement, t: number) => {
        faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
        faceBlendshapes: Array<{ categories: Array<{ categoryName: string; score: number }> }>;
      };
    } | null;
    if (!video || !lm || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    // Check brightness every ~15 frames (~4x/sec) for performance
    brightnessCheckCounter++;
    if (brightnessCheckCounter % 15 === 0) {
      const bright = checkBrightness(video);
      tooDarkRef.current = !bright;
      setTooDark(!bright);
    }

    const result = lm.detectForVideo(video, performance.now());
    const hasFace = result.faceLandmarks && result.faceLandmarks.length > 0;
    setFaceDetected(hasFace);

    if (!hasFace) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const landmarks = result.faceLandmarks[0];
    const blendshapes = result.faceBlendshapes?.[0]?.categories ?? [];
    const blinkLeft = blendshapes.find(b => b.categoryName === 'eyeBlinkLeft')?.score ?? 0;
    const blinkRight = blendshapes.find(b => b.categoryName === 'eyeBlinkRight')?.score ?? 0;

    // Head yaw via nose tip vs eye outers (unmirrored coords)
    const nose = landmarks[1];
    const rightEyeOuter = landmarks[33];
    const leftEyeOuter = landmarks[263];
    const yawRatio =
      leftEyeOuter && rightEyeOuter && nose
        ? (nose.x - rightEyeOuter.x) / (leftEyeOuter.x - rightEyeOuter.x)
        : 0.5;

    const stage = stageRef.current;

    // Block all challenge progression when lighting is too poor
    if (tooDarkRef.current) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    // Check challenge timeout (pause timer display ~4x/sec)
    if (stage === 'blink' || stage === 'turn-left' || stage === 'turn-right') {
      const elapsed = performance.now() - challengeStartTimeRef.current;
      if (brightnessCheckCounter % 15 === 0) {
        setChallengeTimeLeft(Math.max(0, Math.ceil((CHALLENGE_TIME_LIMIT - elapsed) / 1000)));
      }
      if (elapsed > CHALLENGE_TIME_LIMIT) {
        // Timeout — retry ONLY the current challenge, keep completed ones intact.
        // Previously this reshuffled everything; that was frustrating when a user
        // nailed 2 of 3 challenges and timed out on the third.
        const failedChallenge = stage;
        setStage('timeout');
        setTimeout(() => {
          // Reset only the failed-challenge-specific state
          if (failedChallenge === 'blink') {
            blinkCountRef.current = 0;
            blinkArmedRef.current = true;
            setBlinkCount(0);
          }
          // Restart the SAME challenge with a fresh timer
          setStage(failedChallenge);
        }, 2000);
        rafRef.current = requestAnimationFrame(detectLoop);
        return;
      }
    }

    if (stage === 'searching') {
      // Wait for centered face before starting first randomized challenge
      if (yawRatio > 0.4 && yawRatio < 0.6) {
        if (challengeOrderRef.current.length === 0) shuffleChallenges();
        setStage(challengeOrderRef.current[0]);
      }
    } else if (stage === 'blink') {
      // Detect a full blink cycle (closed → open) using both eyes.
      // Thresholds are permissive: soft eye-close registers, small openings count as open.
      const eyesClosed = blinkLeft > 0.4 && blinkRight > 0.4;
      const eyesOpen = blinkLeft < 0.25 && blinkRight < 0.25;
      if (eyesClosed && blinkArmedRef.current) {
        blinkArmedRef.current = false;
      } else if (eyesOpen && !blinkArmedRef.current) {
        blinkArmedRef.current = true;
        const next = blinkCountRef.current + 1;
        blinkCountRef.current = next;
        setBlinkCount(next);
        if (next >= REQUIRED_BLINKS) advanceToNextChallenge();
      }
    } else if (stage === 'turn-left') {
      // Relaxed yaw threshold — small head turn now counts (was 0.62).
      if (yawRatio > 0.57) advanceToNextChallenge();
    } else if (stage === 'turn-right') {
      if (yawRatio < 0.43) advanceToNextChallenge();
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  };

  const startCamera = async () => {
    setCameraError('');
    setStage('loading');
    setBlinkCount(0);
    blinkCountRef.current = 0;
    blinkArmedRef.current = true;
    shuffleChallenges();
    try {
      // Request a challenge token from backend (session binding)
      const apiUrl = getApiUrl();
      const tokenRes = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/kyc/challenge-token`, {
        method: 'POST',
      });
      const tokenData = await tokenRes.json();
      if (tokenData.action === 1 && tokenData.challengeToken) {
        challengeTokenRef.current = tokenData.challengeToken;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraMode('live');

      try {
        await ensureLandmarker();
      } catch {
        setCameraError('Could not load liveness model. Please refresh and try again.');
      }
    } catch {
      setCameraMode('unavailable');
      setCameraError('Camera access denied or unavailable.');
    }
  };

  // Attach the MediaStream to the <video> element once it mounts.
  useEffect(() => {
    if (cameraMode !== 'live') return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    video.play().catch(() => {});
  }, [cameraMode]);

  // Start the detection loop once BOTH the video is ready AND the landmarker
  // model has finished loading. This re-runs when either becomes ready.
  useEffect(() => {
    if (cameraMode !== 'live') return;
    if (!landmarkerReady) return;
    if (rafRef.current != null) return;
    const video = videoRef.current;
    if (!video) return;
    const begin = () => {
      if (rafRef.current != null) return;
      setStage('searching');
      rafRef.current = requestAnimationFrame(detectLoop);
    };
    if (video.readyState >= 2) {
      begin();
    } else {
      video.addEventListener('loadeddata', begin, { once: true });
      return () => video.removeEventListener('loadeddata', begin);
    }
  }, [cameraMode, landmarkerReady]);

  useEffect(() => {
    if (!isOpen) { stopCamera(); return; }
    setStep('form');
    setError('');
    // Selfies and ID photos are always re-captured — we only persist text.
    setSelfiePhoto(null);
    setSelfiePreview('');
    setGovIdFront(null);
    setGovIdFrontPreview('');
    setGovIdBack(null);
    setGovIdBackPreview('');
    setGovIdRatioWarning('');
    setGovIdFaceWarning('');
    setGovIdOcrWarning('');
    setGovIdOcrStatus('idle');
    setGovIdFrontSideWarning('');
    setGovIdBackSideWarning('');
    setGovIdSideCheckStatus('idle');
    setIdCameraSide(null);
    setCameraError('');

    // Restore text draft from localStorage (if any)
    let draftLoaded = false;
    try {
      const raw = localStorage.getItem(KYC_DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.fullLegalName) setFullLegalName(d.fullLegalName);
        if (d.gender) setGender(d.gender);
        if (d.locationAddress) setLocationAddress(d.locationAddress);
        if (d.documentType) setDocumentType(d.documentType);
        if (typeof d.wizardStep === 'number' && d.wizardStep >= 1 && d.wizardStep <= 4) {
          // Don't restore past step 2 — selfie/ID photos were wiped.
          setWizardStep(Math.min(d.wizardStep, 2) as WizardStep);
        } else {
          setWizardStep(1);
        }
        draftLoaded = true;
      }
    } catch { /* ignore malformed draft */ }

    if (!draftLoaded) {
      setWizardStep(1);
      setFullLegalName('');
      setGender('');
      setLocationAddress('');
      setDocumentType('');
    }

    const apiUrl = getApiUrl();
    dashboardAuthFetch(`${apiUrl}/api/remote/customer/kyc/status`)
      .then(res => res.json())
      .then(data => {
        if (data.action === 1 && data.data?.latestSubmission) {
          const sub = data.data.latestSubmission;
          setExistingKyc({
            status: sub.status,
            reviewComment: sub.reviewComment,
            fullLegalName: sub.fullLegalName,
            gender: sub.gender,
            locationAddress: sub.locationAddress,
          });
          // Server rejection data overrides a local draft — the user needs
          // to correct the submission the admin flagged.
          if (sub.status === 'REJECTED') {
            setFullLegalName(sub.fullLegalName || '');
            setGender(sub.gender || '');
            setLocationAddress(sub.locationAddress || '');
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Persist text draft on change while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem(KYC_DRAFT_KEY, JSON.stringify({
        fullLegalName, gender, locationAddress, documentType, wizardStep,
      }));
    } catch { /* quota or private mode — ignore */ }
  }, [isOpen, fullLegalName, gender, locationAddress, documentType, wizardStep]);

  useEffect(() => {
    if (wizardStep !== 2 && cameraMode === 'live') stopCamera();
  }, [wizardStep]);

  // Preload MediaPipe while the user is on Step 1 so Step 2 is instant.
  // ~5MB download happens in the background; if the user is on slow mobile data
  // it can take 10–30s, but hopefully finishes before they reach Step 2.
  useEffect(() => {
    if (!isOpen || wizardStep !== 1) return;
    if (landmarkerRef.current || preloadState === 'loading' || preloadState === 'ready') return;
    setPreloadState('loading');
    ensureLandmarker()
      .then(() => setPreloadState('ready'))
      .catch(() => setPreloadState('failed'));
  }, [isOpen, wizardStep]);

  useEffect(() => () => stopCamera(), []);

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfiePhoto(file);
    const reader = new FileReader();
    reader.onload = () => setSelfiePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const readFilePreview = (file: File, setPreview: (s: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Center-crop an uploaded image to the expected aspect ratio for the selected
  // document type. Keeps uploaded files visually consistent with camera captures.
  // Target ratios:
  //   PASSPORT     → 1.40:1 (photo-page)
  //   NATIONAL_ID  → 1.58:1 (credit-card)
  //   DRIVER_LICENSE → 1.58:1 (credit-card)
  const autoCropToDocRatio = (file: File, type: DocumentType): Promise<File> => {
    return new Promise((resolve) => {
      if (!type) { resolve(file); return; }
      const targetRatio = type === 'PASSPORT' ? 1.40 : 1.58;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const srcRatio = img.width / img.height;
          // If the image is already close to the target (±3%), skip the crop
          if (Math.abs(srcRatio - targetRatio) / targetRatio < 0.03) {
            URL.revokeObjectURL(url);
            resolve(file);
            return;
          }
          let cropW: number, cropH: number;
          if (srcRatio > targetRatio) {
            // Image is wider than target → crop horizontally
            cropH = img.height;
            cropW = cropH * targetRatio;
          } else {
            // Image is taller than target → crop vertically
            cropW = img.width;
            cropH = cropW / targetRatio;
          }
          const sx = (img.width - cropW) / 2;
          const sy = (img.height - cropH) / 2;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(cropW);
          canvas.height = Math.round(cropH);
          const ctx = canvas.getContext('2d');
          if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
          ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            URL.revokeObjectURL(url);
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.92);
        } catch {
          URL.revokeObjectURL(url);
          resolve(file);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  // Server-side side-check — asks backend whether the image looks like FRONT or BACK.
  // Clear rejection (SIDE_WRONG) blocks Next; anything else passes through.
  const checkDocSideOnServer = async (file: File, side: 'FRONT' | 'BACK') => {
    setGovIdSideCheckStatus('checking');
    try {
      const apiUrl = getApiUrl();
      const fd = new FormData();
      fd.append('side', side);
      fd.append('image', file);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/kyc/validate-doc-side`, {
        method: 'POST', body: fd,
      });
      const data = await res.json();
      const msg = data.status === 'SIDE_WRONG' ? (data.message || 'Wrong side uploaded.') : '';
      if (side === 'FRONT') setGovIdFrontSideWarning(msg);
      else setGovIdBackSideWarning(msg);
    } catch {
      // Network error — don't block; backend submit will still run the same check.
    } finally {
      setGovIdSideCheckStatus('ok');
    }
  };

  // Lazily create a second FaceLandmarker in IMAGE mode for checking still photos
  // (the main one is VIDEO mode, used for liveness). Model weights are cached so
  // the second instance loads almost instantly after the first.
  const ensureImageLandmarker = async () => {
    if (imageLandmarkerRef.current) return imageLandmarkerRef.current;
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
      );
      const lm = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
      });
      imageLandmarkerRef.current = lm;
      return lm;
    } catch {
      return null;
    }
  };

  // Server-side OCR document-type check. Runs as soon as the user captures or
  // uploads the front image so we can gate Next right here (instead of at submit).
  const checkDocTypeOnServer = async (file: File, type: DocumentType) => {
    if (!type) return;
    setGovIdOcrStatus('checking');
    setGovIdOcrWarning('');
    try {
      const apiUrl = getApiUrl();
      const fd = new FormData();
      fd.append('documentType', type);
      fd.append('image', file);
      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/kyc/validate-doc-type`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      const status = data.status;
      if (status === 'MISMATCH' || status === 'NOT_A_DOCUMENT') {
        // Clear rejection — the image is not the selected document type.
        setGovIdOcrWarning(data.message || 'The uploaded document does not match the selected type.');
        setGovIdOcrStatus('error');
      } else if (status === 'MATCH') {
        // Positive confirmation — user sees green "verified" state.
        setGovIdOcrWarning('');
        setGovIdOcrStatus('ok');
      } else {
        // UNCERTAIN / SKIPPED / ERROR — let through; backend final-check on submit,
        // admin review catches anything actually wrong via risk score.
        setGovIdOcrWarning('');
        setGovIdOcrStatus('ok');
      }
    } catch {
      // Network error or endpoint unavailable — don't block on this, backend will
      // still run the same check at final submission.
      setGovIdOcrStatus('idle');
    }
  };

  // Run face detection on the ID image. Real IDs have a small face photo
  // (<15% of card area). A webcam selfie used as ID has a face filling 25-50%+
  // of the frame. If detected coverage is high, flag as a face photo.
  const checkIdFaceCoverage = async (file: File) => {
    const lm = await ensureImageLandmarker() as {
      detect: (img: ImageBitmap) => {
        faceLandmarks: Array<Array<{ x: number; y: number }>>;
      };
    } | null;
    if (!lm) return;
    try {
      const bitmap = await createImageBitmap(file);
      const result = lm.detect(bitmap);
      bitmap.close();
      if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
        setGovIdFaceWarning('');
        return;
      }
      const pts = result.faceLandmarks[0];
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const p of pts) {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      }
      const faceArea = (maxX - minX) * (maxY - minY);
      if (faceArea > 0.20) {
        setGovIdFaceWarning('This looks like a face photo, not an identification document. The face fills too much of the image. Please photograph the entire document (ID card or passport page).');
      } else {
        setGovIdFaceWarning('');
      }
    } catch {
      setGovIdFaceWarning('');
    }
  };

  // Quick client-side heuristic: credit-card IDs are ~1.58:1, passport photo
  // pages are closer to 1.4:1. If the image doesn't match the selected type,
  // we show a non-blocking warning before the user submits.
  const checkGovIdRatio = (file: File, selectedType: DocumentType) => {
    if (!selectedType) { setGovIdRatioWarning(''); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      URL.revokeObjectURL(url);
      // Normalise: compare the wider-over-taller ratio regardless of orientation
      const normalized = Math.max(ratio, 1 / ratio);
      const isCardShape = normalized >= 1.45 && normalized <= 1.75;
      const isPassportShape = normalized >= 1.25 && normalized <= 1.55;
      if (selectedType === 'PASSPORT' && isCardShape && !isPassportShape) {
        setGovIdRatioWarning('This image looks like a credit-card shaped ID, not a passport page. Double-check your selection.');
      } else if ((selectedType === 'NATIONAL_ID' || selectedType === 'DRIVER_LICENSE')
                 && isPassportShape && !isCardShape) {
        setGovIdRatioWarning('This image looks like a passport page, not a credit-card shaped ID. Double-check your selection.');
      } else {
        setGovIdRatioWarning('');
      }
    };
    img.src = url;
  };

  const handleGovIdFrontChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    const file = await autoCropToDocRatio(raw, documentType);
    setGovIdFront(file);
    readFilePreview(file, setGovIdFrontPreview);
    checkGovIdRatio(file, documentType);
    checkIdFaceCoverage(file);
    checkDocTypeOnServer(file, documentType);
    checkDocSideOnServer(file, 'FRONT');
  };

  const handleGovIdBackChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    const file = await autoCropToDocRatio(raw, documentType);
    setGovIdBack(file);
    readFilePreview(file, setGovIdBackPreview);
    checkDocSideOnServer(file, 'BACK');
  };

  // ID card camera: open, capture, stop
  const startIdCamera = async (side: 'front' | 'back') => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      idStreamRef.current = stream;
      setIdCameraSide(side);
    } catch {
      setCameraError('Camera access denied or unavailable.');
    }
  };

  const stopIdCamera = () => {
    if (idStreamRef.current) {
      idStreamRef.current.getTracks().forEach(t => t.stop());
      idStreamRef.current = null;
    }
    setIdCameraSide(null);
  };

  const captureIdFrame = () => {
    const video = idVideoRef.current;
    const side = idCameraSide;
    if (!video || !video.videoWidth || !side) return;
    // ID card aspect ratio ~1.58:1 — crop a centered rectangle from the video
    const targetRatio = 1.58;
    const videoRatio = video.videoWidth / video.videoHeight;
    let cropW: number, cropH: number;
    if (videoRatio > targetRatio) {
      cropH = video.videoHeight;
      cropW = cropH * targetRatio;
    } else {
      cropW = video.videoWidth;
      cropH = cropW / targetRatio;
    }
    const sx = (video.videoWidth - cropW) / 2;
    const sy = (video.videoHeight - cropH) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cropW);
    canvas.height = Math.round(cropH);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `id-${side}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      if (side === 'front') {
        setGovIdFront(file); setGovIdFrontPreview(url);
        checkGovIdRatio(file, documentType);
        checkIdFaceCoverage(file);
        checkDocTypeOnServer(file, documentType);
        checkDocSideOnServer(file, 'FRONT');
      } else {
        setGovIdBack(file); setGovIdBackPreview(url);
        checkDocSideOnServer(file, 'BACK');
      }
      stopIdCamera();
    }, 'image/jpeg', 0.92);
  };

  // Stop ID camera when leaving step 3
  useEffect(() => {
    if (wizardStep !== 3 && idCameraSide) stopIdCamera();
  }, [wizardStep]);

  // Attach ID stream to video element when it mounts
  useEffect(() => {
    if (!idCameraSide) return;
    const v = idVideoRef.current;
    const s = idStreamRef.current;
    if (!v || !s) return;
    if (v.srcObject !== s) v.srcObject = s;
    v.play().catch(() => {});
  }, [idCameraSide]);

  const handleSubmit = async () => {
    if (!fullLegalName.trim()) { setError('Full legal name is required'); return; }
    if (!gender) { setError('Gender is required'); return; }
    if (!selfiePhoto) { setError('Selfie photo is required'); return; }
    if (!documentType) { setError('Document type is required'); return; }
    if (!govIdFront) { setError('Government ID front is required'); return; }
    if (documentType !== 'PASSPORT' && !govIdBack) {
      setError('Back side of document is required'); return;
    }

    setError('');
    setStep('uploading');

    try {
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('fullLegalName', fullLegalName.trim());
      formData.append('gender', gender);
      if (locationAddress.trim()) formData.append('locationAddress', locationAddress.trim());
      formData.append('documentType', documentType);
      if (challengeTokenRef.current) {
        formData.append('challengeToken', challengeTokenRef.current);
      }
      // Forensic metadata — challenge order and per-challenge timings
      if (challengeOrderRef.current.length > 0) {
        formData.append('challengeOrder', challengeOrderRef.current.join(','));
      }
      if (challengeTimingsRef.current.length > 0) {
        formData.append('challengeTimingsMs', JSON.stringify(challengeTimingsRef.current));
      }
      formData.append('selfiePhoto', selfiePhoto);
      // Append multi-frame captures from liveness challenges
      capturedFramesRef.current.forEach((blob, idx) => {
        formData.append('livenessFrames', new File([blob], `liveness-frame-${idx}.jpg`, { type: 'image/jpeg' }));
      });
      formData.append('governmentIdDocument', govIdFront);
      if (govIdBack) formData.append('governmentIdDocumentBack', govIdBack);

      const res = await dashboardAuthFetch(`${apiUrl}/api/remote/customer/kyc/submit`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();

      if (result.action === 1) {
        try { localStorage.removeItem(KYC_DRAFT_KEY); } catch { /* ignore */ }
        setStep('success');
        onSuccess?.();
      } else {
        setError(result.message || 'Failed to submit KYC verification');
        setStep('failed');
      }
    } catch {
      setError('Network error. Please try again.');
      setStep('failed');
    }
  };

  const isStepValid = (s: WizardStep): boolean => {
    if (s === 1) return !!fullLegalName.trim() && !!gender;
    if (s === 2) return !!selfiePhoto;
    if (s === 3) {
      if (!documentType || !govIdFront) return false;
      if (documentType !== 'PASSPORT' && !govIdBack) return false;
      // Hard-block when any client or server check flagged the image:
      //  - aspect-ratio mismatch
      //  - face fills too much of the frame
      //  - server-side OCR says the document type doesn't match
      //  - server-side OCR check still in progress
      //  - side-detection found user uploaded FRONT in BACK slot (or vice versa)
      if (govIdRatioWarning) return false;
      if (govIdFaceWarning) return false;
      if (govIdOcrWarning) return false;
      if (govIdOcrStatus === 'checking') return false;
      if (govIdFrontSideWarning) return false;
      if (govIdBackSideWarning) return false;
      if (govIdSideCheckStatus === 'checking') return false;
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!isStepValid(wizardStep)) {
      if (wizardStep === 1) setError('Full legal name and gender are required');
      else if (wizardStep === 2) setError('Selfie photo is required');
      else if (wizardStep === 3) setError('Government ID document is required');
      return;
    }
    setError('');
    setWizardStep((wizardStep + 1) as WizardStep);
  };

  const handleBack = () => {
    setError('');
    setWizardStep((wizardStep - 1) as WizardStep);
  };

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.95rem', border: `1.5px solid ${colors.borderPrimary}`,
    borderRadius: 11, fontSize: '0.9rem', color: colors.textPrimary,
    outline: 'none', backgroundColor: colors.bgCard, boxSizing: 'border-box',
    transition: 'border-color 0.18s, box-shadow 0.18s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 700,
    color: colors.textSecondary, marginBottom: '0.4rem',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <style>{`
        /* Keyboard accessibility — visible focus outline on all interactive KYC elements */
        .kyc-modal button:focus-visible {
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(242, 12, 143, 0.30) !important;
        }
        .kyc-modal input:focus,
        .kyc-modal select:focus,
        .kyc-modal textarea:focus {
          border-color: #083A85 !important;
          box-shadow: 0 0 0 3px rgba(8, 58, 133, 0.14) !important;
        }
        .kyc-modal input:focus-visible,
        .kyc-modal select:focus-visible,
        .kyc-modal textarea:focus-visible {
          outline: none !important;
        }
        /* Footer primary button hover lift */
        .kyc-footer button:not([disabled]):hover {
          transform: translateY(-1px);
        }
        /* Disabled primary button stays readable in high-contrast / low-vision setups */
        .kyc-footer button[disabled] {
          filter: saturate(0.85);
        }
        /* Reduced motion — users who opt out get instant transitions, no animations */
        @media (prefers-reduced-motion: reduce) {
          .kyc-modal *, .kyc-modal *::before, .kyc-modal *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
        @media (max-width: 560px) {
          .kyc-modal {
            border-radius: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            /* Use JS-computed --kyc-vh as authoritative — visualViewport.height is
               reliable on iOS Safari where 100dvh and 100vh both misbehave. */
            max-height: var(--kyc-vh, 100dvh) !important;
            min-height: var(--kyc-vh, 100dvh) !important;
            position: relative !important;
          }
          /* Respect iPhone notch + home indicator */
          .kyc-header {
            padding: calc(1rem + env(safe-area-inset-top)) 1rem 0 1rem !important;
          }
          .kyc-body { padding: 1rem !important; }
          /* Footer stays as a flex-sibling at the bottom of the modal. Since the
             modal height is driven by visualViewport.height, the footer naturally
             sits just above the iOS URL bar / Android nav bar. */
          .kyc-footer {
            padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom)) 1rem !important;
          }
          .kyc-step-label { display: none !important; }
          .kyc-stepper { gap: 0.35rem !important; margin-bottom: 1rem !important; }
          .kyc-doctype-row { flex-direction: column !important; }
          .kyc-doctype-btn { flex: 1 1 auto !important; flex-direction: row !important; justify-content: space-between !important; padding: 0.6rem 0.75rem !important; }
          .kyc-id-row { flex-direction: column !important; gap: 1rem !important; }
          .kyc-review-media { flex-direction: column !important; }
          /* Prevent iOS zoom on input focus — font-size must be >= 16px */
          .kyc-body input[type="text"],
          .kyc-body input[type="file"],
          .kyc-body select,
          .kyc-body textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
      <div className="kyc-modal" style={{
        position: 'relative',
        backgroundColor: colors.bgCard, borderRadius: 18, width: '560px', maxWidth: '95vw',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 60px -12px rgba(8, 58, 133, 0.30)',
        border: `1px solid ${colors.borderPrimary}`,
      }} onClick={e => e.stopPropagation()}>
        {/* Brand top stripe */}
        <span aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #083A85 0%, #F20C8F 100%)',
        }} />

        {/* Header */}
        <div className="kyc-header" style={{
          padding: '1.4rem 1.5rem 0.25rem 1.5rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'rgba(8,58,133,0.10)',
              border: '1px solid rgba(8,58,133,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: '#083A85',
            }}>
              <ShieldIcon />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#F20C8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                Identity check
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
                KYC verification
              </h3>
              <p style={{ fontSize: '0.82rem', color: colors.textSecondary, margin: '3px 0 0 0', lineHeight: 1.45 }}>
                Verify your identity to unlock withdrawals and full platform features.
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'transparent', border: `1px solid ${colors.borderPrimary}`, cursor: 'pointer',
            width: 32, height: 32, padding: 0, borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: colors.textSecondary, flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.color = '#DC2626'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.borderPrimary; e.currentTarget.style.color = colors.textSecondary; }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Screen-reader live region — announces step changes to assistive tech. */}
        <div role="status" aria-live="polite" aria-atomic="true" style={{
          position: 'absolute', width: '1px', height: '1px',
          padding: 0, margin: '-1px', overflow: 'hidden',
          clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
        }}>
          {stepAnnouncement}
        </div>

        <div className="kyc-body" style={{
          flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem',
        }}>

          {/* Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', boxShadow: '0 10px 24px rgba(22,163,74,0.32)',
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                KYC submitted successfully
              </h3>
              <p style={{ fontSize: '0.88rem', color: colors.textSecondary, lineHeight: 1.5, marginBottom: '1.5rem', maxWidth: 380, margin: '0 auto 1.5rem' }}>
                Your verification is under review. We&apos;ll notify you as soon as it&apos;s approved.
              </p>
              <button onClick={onClose} className="ck-btn ck-btn-primary" style={{
                padding: '0.65rem 1.6rem', fontSize: '0.9rem',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <i className="bi bi-check2-circle" style={{ fontSize: 13 }} />
                Done
              </button>
            </div>
          )}

          {/* Failed */}
          {step === 'failed' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', boxShadow: '0 10px 24px rgba(220,38,38,0.32)',
              }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: colors.textPrimary, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                Submission failed
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#DC2626', marginBottom: '1.5rem', lineHeight: 1.5, maxWidth: 420, margin: '0 auto 1.5rem' }}>{error}</p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setStep('form')} className="ck-btn ck-btn-primary" style={{
                  padding: '0.6rem 1.3rem', fontSize: '0.88rem',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  <i className="bi bi-arrow-counterclockwise" style={{ fontSize: 13 }} />
                  Try again
                </button>
                <button onClick={onClose} className="ck-btn ck-btn-soft" style={{ padding: '0.6rem 1.3rem', fontSize: '0.88rem' }}>
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Uploading */}
          {step === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{
                position: 'relative',
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(8,58,133,0.10) 0%, rgba(242,12,143,0.06) 100%)',
                border: '1px solid rgba(8,58,133,0.20)',
                margin: '0 auto 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="ck-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              </div>
              <p style={{ fontSize: '0.98rem', fontWeight: 700, color: colors.textPrimary, marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>
                Submitting your verification
              </p>
              <p style={{ fontSize: '0.84rem', color: colors.textSecondary }}>Uploading your documents. This only takes a moment.</p>
            </div>
          )}

          {/* Form wizard */}
          {step === 'form' && (
            <>
              {/* Stepper */}
              <div className="kyc-stepper" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {WIZARD_LABELS.map((label, idx) => {
                  const stepNum = (idx + 1) as WizardStep;
                  const isActive = stepNum === wizardStep;
                  const isComplete = stepNum < wizardStep;
                  const canJump = stepNum < wizardStep || (stepNum === wizardStep);
                  return (
                    <React.Fragment key={label}>
                      <button
                        onClick={() => { if (canJump) { setError(''); setWizardStep(stepNum); } }}
                        disabled={!canJump}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                          background: 'transparent', border: 'none', padding: 0,
                          cursor: canJump ? 'pointer' : 'default', flex: '0 0 auto',
                        }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.82rem', fontWeight: 800,
                          background: isComplete
                            ? 'linear-gradient(135deg, #10B981 0%, #16A34A 100%)'
                            : isActive
                            ? 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)'
                            : colors.bgTertiary,
                          color: (isComplete || isActive) ? 'white' : colors.textSecondary,
                          border: `1px solid ${isComplete ? 'transparent' : isActive ? 'transparent' : colors.borderPrimary}`,
                          boxShadow: isActive ? '0 4px 12px rgba(8,58,133,0.30)' : 'none',
                          transition: 'all 0.18s',
                        }}>
                          {isComplete ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : stepNum}
                        </div>
                        <span className="kyc-step-label" style={{
                          fontSize: '0.66rem', fontWeight: isActive ? 700 : 600,
                          color: isActive ? colors.textPrimary : colors.textSecondary,
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.02em',
                        }}>{label}</span>
                      </button>
                      {idx < WIZARD_LABELS.length - 1 && (
                        <div style={{
                          flex: 1, height: 3, marginTop: 13.5,
                          background: stepNum < wizardStep
                            ? 'linear-gradient(90deg, #10B981 0%, #16A34A 100%)'
                            : colors.borderPrimary,
                          borderRadius: 9999,
                          transition: 'background 0.2s',
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Rejection notice */}
              {existingKyc?.status === 'REJECTED' && existingKyc.reviewComment && wizardStep === 1 && (
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  padding: '0.85rem 1rem 0.85rem 1.1rem',
                  marginBottom: '1.25rem', borderRadius: 11,
                  background: actualTheme === 'dark' ? 'rgba(220,38,38,0.10)' : '#FEF2F2',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.30)' : '#FECACA'}`,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <span aria-hidden style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: 'linear-gradient(180deg, #DC2626 0%, #F20C8F 130%)',
                  }} />
                  <i className="bi bi-x-octagon-fill" style={{ color: '#DC2626', fontSize: 15, marginTop: 1, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#DC2626', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Previous submission rejected
                    </div>
                    <p style={{ fontSize: '0.82rem', color: actualTheme === 'dark' ? '#FCA5A5' : '#991B1B', margin: '4px 0 0', lineHeight: 1.45 }}>
                      {existingKyc.reviewComment}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '0.7rem 0.95rem', marginBottom: '1rem', borderRadius: 10,
                  background: actualTheme === 'dark' ? 'rgba(220,38,38,0.10)' : '#FEF2F2',
                  border: `1px solid ${actualTheme === 'dark' ? 'rgba(220,38,38,0.32)' : '#FECACA'}`,
                  color: actualTheme === 'dark' ? '#FCA5A5' : '#DC2626',
                  fontSize: '0.85rem',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Personal Info */}
              {wizardStep === 1 && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Full Legal Name *</label>
                    <input type="text" placeholder="As it appears on your ID" value={fullLegalName}
                      onChange={e => setFullLegalName(e.target.value)} style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Gender *</label>
                    <select value={gender} onChange={e => setGender(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={labelStyle}>Location / Address</label>
                    <input type="text" placeholder="City, Country" value={locationAddress}
                      onChange={e => setLocationAddress(e.target.value)} style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = '#083A85'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = colors.borderPrimary; }}
                    />
                  </div>
                </>
              )}

              {/* Step 2: Smart Selfie */}
              {wizardStep === 2 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={labelStyle}>Selfie Photo *</label>
                  <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: '0 0 0.75rem 0' }}>
                    Take a clear, well-lit selfie. Center your face inside the oval.
                  </p>
                  <input ref={selfieInputRef} type="file" accept="image/jpeg,image/png,image/jpg"
                    onChange={handleSelfieChange} style={{ display: 'none' }} />

                  {/* Captured preview */}
                  {selfiePreview && cameraMode !== 'live' && (
                    <div style={{ position: 'relative', textAlign: 'center' }}>
                      <img src={selfiePreview} alt="Selfie preview"
                        style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '0.75rem', border: `2px solid ${colors.borderPrimary}` }} />
                      <div style={{
                        position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                      }}>
                        <button onClick={() => { setSelfiePhoto(null); setSelfiePreview(''); startCamera(); }} style={{
                          padding: '0.5rem 1rem', background: '#083A85', color: 'white', border: 'none',
                          borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                        }}>Retake</button>
                      </div>
                    </div>
                  )}

                  {/* Live camera view with liveness challenges */}
                  {cameraMode === 'live' && (() => {
                    const isChallenge = livenessStage === 'blink' || livenessStage === 'turn-left' || livenessStage === 'turn-right';
                    const ovalColor = tooDark
                      ? '#EF4444'
                      : livenessStage === 'timeout' ? '#EF4444'
                      : livenessStage === 'success'
                      ? '#16A34A'
                      : faceDetected ? '#10B981' : '#F59E0B';
                    const timerStr = isChallenge && challengeTimeLeft > 0 ? ` (${challengeTimeLeft}s)` : '';
                    const stageInstruction = tooDark
                      ? 'Too dark. Move to a well-lit area'
                      : livenessStage === 'loading' ? 'Loading liveness model…'
                      : livenessStage === 'searching' ? (faceDetected ? 'Center your face in the oval' : 'Looking for your face…')
                      : livenessStage === 'timeout' ? 'Too slow. Retrying this step…'
                      : livenessStage === 'blink' ? `Blink once${timerStr}`
                      : livenessStage === 'turn-left' ? `Slowly turn your head LEFT${timerStr}`
                      : livenessStage === 'turn-right' ? `Now turn your head RIGHT${timerStr}`
                      : 'Liveness verified! Capturing…';
                    const completedCount = challengeIndexRef.current;
                    const totalChallenges = challengeOrderRef.current.length || 3;
                    const progressPct =
                      livenessStage === 'loading' || livenessStage === 'searching' ? 0 :
                      livenessStage === 'timeout' ? 0 :
                      livenessStage === 'success' ? 100 :
                      Math.round((completedCount / totalChallenges) * 100);

                    // On portrait phones, use a taller 3:4 container so the face-guide
                    // matches the natural orientation of the front camera feed.
                    const svgW = isPortrait ? 75 : 100;
                    const svgH = 100;
                    const ovalCx = svgW / 2;
                    const ovalCy = isPortrait ? 50 : 48;
                    const ovalRx = isPortrait ? 26 : 28;
                    const ovalRy = isPortrait ? 40 : 36;

                    return (
                      <div style={{
                        position: 'relative', width: '100%',
                        aspectRatio: isPortrait ? '3 / 4' : '1 / 1',
                        borderRadius: '0.75rem', overflow: 'hidden',
                        backgroundColor: '#000', border: `2px solid ${colors.borderPrimary}`,
                      }}>
                        <video ref={videoRef} playsInline muted autoPlay
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            transform: 'scaleX(-1)',
                          }} />
                        {/* Face-guide oval overlay (color reflects detection state) */}
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
                        }}>
                          <defs>
                            <mask id="kyc-face-mask">
                              <rect width={svgW} height={svgH} fill="white" />
                              <ellipse cx={ovalCx} cy={ovalCy} rx={ovalRx} ry={ovalRy} fill="black" />
                            </mask>
                          </defs>
                          <rect width={svgW} height={svgH} fill="rgba(0,0,0,0.55)" mask="url(#kyc-face-mask)" />
                          <ellipse cx={ovalCx} cy={ovalCy} rx={ovalRx} ry={ovalRy} fill="none"
                            stroke={ovalColor} strokeWidth="0.7"
                            strokeDasharray={livenessStage === 'success' ? '0' : '2 1.5'} />
                        </svg>

                        {/* Stage instruction pill — includes a color-blind-safe glyph so
                            state is conveyed by shape + text, not color alone. */}
                        <div role="status" aria-live="polite" style={{
                          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
                          backgroundColor: (tooDark || livenessStage === 'timeout') ? 'rgba(220,38,38,0.9)' : 'rgba(0,0,0,0.75)',
                          color: 'white', padding: '0.5rem 1rem',
                          borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
                          maxWidth: '90%', textAlign: 'center',
                          transition: prefersReducedMotion ? 'none' : 'background-color 0.3s',
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        }}>
                          <span aria-hidden="true">
                            {tooDark ? '\u26A0'
                              : livenessStage === 'timeout' ? '\u26A0'
                              : livenessStage === 'success' ? '\u2713'
                              : livenessStage === 'loading' || livenessStage === 'searching' ? '\u25CB'
                              : '\u25CF'}
                          </span>
                          <span>{stageInstruction}</span>
                        </div>

                        {/* Progress bar */}
                        <div style={{
                          position: 'absolute', top: '52px', left: '10%', right: '10%',
                          height: '4px', backgroundColor: 'rgba(255,255,255,0.25)',
                          borderRadius: '999px', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${progressPct}%`, height: '100%',
                            backgroundColor: livenessStage === 'success' ? '#16A34A' : '#10B981',
                            transition: 'width 0.3s',
                          }} />
                        </div>

                        {/* Cancel only — capture is automatic on success */}
                        <div style={{
                          position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
                        }}>
                          <button onClick={stopCamera} style={{
                            padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.65)', color: 'white',
                            border: '1px solid rgba(255,255,255,0.5)', borderRadius: '0.5rem',
                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          }}>Cancel</button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Idle: start camera */}
                  {cameraMode !== 'live' && !selfiePreview && (
                    <>
                      <button onClick={startCamera} style={{
                        width: '100%', padding: '2rem 1.5rem', border: `2px dashed ${colors.borderPrimary}`,
                        borderRadius: '0.75rem', background: 'transparent', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                        color: colors.textSecondary,
                      }}>
                        <CameraIcon />
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary }}>
                          Take a selfie with your camera
                        </span>
                        <span style={{ fontSize: '0.72rem' }}>
                          Look straight • Good lighting • No glasses or hat
                        </span>
                      </button>
                      {/* Preload status — tells users whether liveness model is ready */}
                      <div style={{
                        marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.72rem', color: colors.textSecondary,
                      }}>
                        {preloadState === 'loading' && (
                          <>
                            <div style={{
                              width: '10px', height: '10px', border: '2px solid #E5E7EB',
                              borderTopColor: '#083A85', borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                            }} />
                            <span>Preparing camera (downloading liveness model...)</span>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          </>
                        )}
                        {preloadState === 'ready' && (
                          <>
                            <span style={{ color: '#10B981' }}>&#10003;</span>
                            <span>Camera ready</span>
                          </>
                        )}
                        {preloadState === 'failed' && (
                          <span style={{ color: '#DC2626' }}>
                            Liveness model failed to load. Check your connection and try starting the camera.
                          </span>
                        )}
                      </div>
                      {cameraError && (
                        <p style={{ fontSize: '0.75rem', color: '#DC2626', margin: '0.5rem 0 0 0' }}>
                          {cameraError}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Government ID — type selector + front/back capture */}
              {wizardStep === 3 && (() => {
                const backRequired = documentType && documentType !== 'PASSPORT';
                const docOptions: Array<{ value: DocumentType; label: string; hint: string }> = [
                  { value: 'PASSPORT', label: 'Passport', hint: 'Photo page only' },
                  { value: 'NATIONAL_ID', label: 'National ID', hint: 'Front & back' },
                  { value: 'DRIVER_LICENSE', label: "Driver's License", hint: 'Front & back' },
                ];

                const renderSideCard = (
                  side: 'front' | 'back',
                  preview: string,
                  inputRef: React.RefObject<HTMLInputElement | null>,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
                  label: string,
                  disabled: boolean,
                ) => (
                  <div style={{
                    flex: 1, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto',
                  }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textPrimary, margin: '0 0 0.4rem 0' }}>
                      {label} {disabled ? '' : '*'}
                    </p>
                    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/jpg"
                      onChange={onChange} style={{ display: 'none' }} />
                    {preview ? (
                      <div style={{ position: 'relative' }}>
                        <img src={preview} alt={label}
                          style={{
                            width: '100%', aspectRatio: '1.58 / 1', objectFit: 'cover',
                            borderRadius: '0.5rem', border: `2px solid ${colors.borderPrimary}`,
                          }} />
                        <div style={{
                          position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
                          display: 'flex', gap: '0.35rem',
                        }}>
                          <button onClick={() => startIdCamera(side)} style={{
                            padding: '0.3rem 0.6rem', background: '#083A85', color: 'white',
                            border: 'none', borderRadius: '0.35rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                          }}>Retake</button>
                          <button onClick={() => inputRef.current?.click()} style={{
                            padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.95)', color: '#083A85',
                            border: '1px solid #083A85', borderRadius: '0.35rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                          }}>Upload</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => startIdCamera(side)} style={{
                          width: '100%', aspectRatio: '1.58 / 1', border: `2px dashed ${colors.borderPrimary}`,
                          borderRadius: '0.5rem', background: 'transparent', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: '0.4rem', color: colors.textSecondary,
                        }}>
                          <CameraIcon />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textPrimary }}>Capture</span>
                        </button>
                        <button onClick={() => inputRef.current?.click()} style={{
                          width: '100%', marginTop: '0.35rem', padding: '0.4rem', border: `1px solid ${colors.borderPrimary}`,
                          borderRadius: '0.35rem', background: colors.bgTertiary, color: colors.textPrimary,
                          fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer',
                        }}>or upload image</button>
                      </>
                    )}
                  </div>
                );

                return (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={labelStyle}>Document Type *</label>
                    <div className="kyc-doctype-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      {docOptions.map(opt => {
                        const selected = documentType === opt.value;
                        return (
                          <button key={opt.value} onClick={() => {
                            // Switching document type wipes any uploaded ID images
                            // and clears all validation warnings. Users should start
                            // fresh for the new type — old uploads would be invalid.
                            if (documentType && documentType !== opt.value) {
                              setGovIdFront(null);
                              setGovIdFrontPreview('');
                              setGovIdBack(null);
                              setGovIdBackPreview('');
                              setGovIdRatioWarning('');
                              setGovIdFaceWarning('');
                              setGovIdOcrWarning('');
                              setGovIdOcrStatus('idle');
                              setGovIdFrontSideWarning('');
                              setGovIdBackSideWarning('');
                              setGovIdSideCheckStatus('idle');
                              if (govIdFrontInputRef.current) govIdFrontInputRef.current.value = '';
                              if (govIdBackInputRef.current) govIdBackInputRef.current.value = '';
                            }
                            setDocumentType(opt.value);
                          }} className="kyc-doctype-btn" style={{
                            flex: 1, padding: '0.75rem 0.5rem',
                            border: `2px solid ${selected ? '#083A85' : colors.borderPrimary}`,
                            borderRadius: '0.5rem',
                            background: selected ? 'rgba(8,58,133,0.08)' : colors.bgCard,
                            color: colors.textPrimary, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                          }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{opt.label}</span>
                            <span style={{ fontSize: '0.65rem', color: colors.textSecondary }}>{opt.hint}</span>
                          </button>
                        );
                      })}
                    </div>

                    {documentType && (
                      <>
                        <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: '0 0 0.75rem 0' }}>
                          Place your document on a flat surface with good lighting. Align it inside the frame.
                        </p>

                        {govIdOcrStatus === 'checking' && !govIdRatioWarning && !govIdFaceWarning && (
                          <div style={{
                            padding: '0.6rem 0.85rem', marginBottom: '0.75rem',
                            borderRadius: '0.5rem',
                            background: colors.bgTertiary, border: `1px solid ${colors.borderPrimary}`,
                            color: colors.textSecondary, fontSize: '0.8rem',
                            display: 'flex', gap: '0.6rem', alignItems: 'center',
                          }}>
                            <div style={{
                              width: '12px', height: '12px',
                              border: '2px solid #E5E7EB', borderTopColor: '#083A85',
                              borderRadius: '50%',
                              animation: prefersReducedMotion ? 'none' : 'spin 0.8s linear infinite',
                            }} />
                            <span>Checking that the document matches the selected type…</span>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          </div>
                        )}

                        {(govIdRatioWarning || govIdFaceWarning || govIdOcrWarning) && (
                          <div role="alert" style={{
                            padding: '0.75rem 1rem', marginBottom: '0.75rem',
                            borderRadius: '0.5rem',
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            color: '#991B1B', fontSize: '0.82rem',
                            display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                          }}>
                            <span aria-hidden="true" style={{ fontSize: '1rem' }}>&#9888;</span>
                            <div>
                              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
                                {govIdOcrWarning ? 'Wrong document. Cannot continue'
                                  : govIdFaceWarning ? 'This does not look like a document. Cannot continue'
                                  : 'Document type mismatch. Cannot continue'}
                              </strong>
                              <span>
                                {govIdOcrWarning || govIdFaceWarning || govIdRatioWarning}
                                {' '}Retake the photo, upload a different one, or change the document type above.
                              </span>
                            </div>
                          </div>
                        )}

                        {govIdFrontSideWarning && (
                          <div role="alert" style={{
                            padding: '0.75rem 1rem', marginBottom: '0.75rem',
                            borderRadius: '0.5rem',
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            color: '#991B1B', fontSize: '0.82rem',
                            display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                          }}>
                            <span aria-hidden="true" style={{ fontSize: '1rem' }}>&#9888;</span>
                            <div>
                              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Wrong side in FRONT slot</strong>
                              <span>{govIdFrontSideWarning}</span>
                            </div>
                          </div>
                        )}

                        {govIdBackSideWarning && (
                          <div role="alert" style={{
                            padding: '0.75rem 1rem', marginBottom: '0.75rem',
                            borderRadius: '0.5rem',
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            color: '#991B1B', fontSize: '0.82rem',
                            display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                          }}>
                            <span aria-hidden="true" style={{ fontSize: '1rem' }}>&#9888;</span>
                            <div>
                              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Wrong side in BACK slot</strong>
                              <span>{govIdBackSideWarning}</span>
                            </div>
                          </div>
                        )}

                        {/* Positive confirmation when OCR verifies the document matches. */}
                        {govIdOcrStatus === 'ok' && !govIdRatioWarning && !govIdFaceWarning
                          && !govIdOcrWarning && govIdFront && (
                          <div style={{
                            padding: '0.6rem 0.85rem', marginBottom: '0.75rem',
                            borderRadius: '0.5rem',
                            background: '#ECFDF5', border: '1px solid #A7F3D0',
                            color: '#065F46', fontSize: '0.82rem',
                            display: 'flex', gap: '0.5rem', alignItems: 'center',
                          }}>
                            <span aria-hidden="true" style={{ fontSize: '0.95rem' }}>&#10003;</span>
                            <span>Document verified. You can continue.</span>
                          </div>
                        )}

                        <div className="kyc-id-row" style={{ display: 'flex', gap: '0.75rem' }}>
                          {renderSideCard(
                            'front', govIdFrontPreview, govIdFrontInputRef,
                            handleGovIdFrontChange, 'Front', false,
                          )}
                          {renderSideCard(
                            'back', govIdBackPreview, govIdBackInputRef,
                            handleGovIdBackChange,
                            documentType === 'PASSPORT' ? 'Back (not needed)' : 'Back',
                            documentType === 'PASSPORT',
                          )}
                        </div>

                        {!backRequired && documentType === 'PASSPORT' && (
                          <p style={{ fontSize: '0.7rem', color: colors.textSecondary, margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                            Passports only require the photo page.
                          </p>
                        )}
                      </>
                    )}

                    {cameraError && (
                      <p style={{ fontSize: '0.75rem', color: '#DC2626', margin: '0.5rem 0 0 0' }}>
                        {cameraError}
                      </p>
                    )}

                    {/* ID camera overlay */}
                    {idCameraSide && (
                      <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
                        zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem',
                      }}>
                        {/* On portrait phones, use a taller container so the rear camera
                            feed doesn't get squashed into a thin letterbox. The ID card
                            guide stays horizontal (IDs are always landscape) — centered. */}
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: isPortrait ? '100%' : '640px',
                          aspectRatio: isPortrait ? '3 / 4' : '16 / 9',
                          borderRadius: '0.75rem',
                          overflow: 'hidden',
                          backgroundColor: '#000',
                        }}>
                          <video ref={idVideoRef} playsInline muted autoPlay
                            style={{
                              width: '100%', height: '100%', objectFit: 'cover',
                              backgroundColor: '#000',
                            }} />
                          {/* Rectangular card guide — horizontal ID shape centered.
                              viewBox height adapts so the card shows at the same physical proportions. */}
                          {(() => {
                            // Card is 80 wide × 32 tall within a 100 × H viewBox.
                            const vbH = isPortrait ? 133 : 56;
                            const cardY = (vbH - 32) / 2;
                            return (
                              <svg viewBox={`0 0 100 ${vbH}`} preserveAspectRatio="none" style={{
                                position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
                              }}>
                                <defs>
                                  <mask id="kyc-card-mask">
                                    <rect width="100" height={vbH} fill="white" />
                                    <rect x="10" y={cardY} width="80" height="32" rx="2" fill="black" />
                                  </mask>
                                </defs>
                                <rect width="100" height={vbH} fill="rgba(0,0,0,0.55)" mask="url(#kyc-card-mask)" />
                                <rect x="10" y={cardY} width="80" height="32" rx="2" fill="none"
                                  stroke="#10B981" strokeWidth="0.4" strokeDasharray="1.5 1" />
                              </svg>
                            );
                          })()}
                          {/* Instructions */}
                          <div style={{
                            position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.75)', color: 'white', padding: '0.45rem 1rem',
                            borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
                          }}>
                            Align {idCameraSide === 'front' ? 'FRONT' : 'BACK'} of document inside the frame
                          </div>
                          {/* Controls */}
                          <div style={{
                            position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                            display: 'flex', gap: '0.75rem', alignItems: 'center',
                          }}>
                            <button onClick={stopIdCamera} style={{
                              padding: '0.55rem 1rem', background: 'rgba(0,0,0,0.65)', color: 'white',
                              border: '1px solid rgba(255,255,255,0.5)', borderRadius: '0.5rem',
                              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={captureIdFrame} aria-label="Capture"
                              style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'white', border: '4px solid rgba(255,255,255,0.5)',
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                              }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Step 4: Review */}
              {wizardStep === 4 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: '0 0 1rem 0' }}>
                    Please review your information before submitting.
                  </p>

                  <div style={{
                    padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${colors.borderPrimary}`,
                    backgroundColor: colors.bgTertiary, marginBottom: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Full Legal Name</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary, textAlign: 'right' }}>{fullLegalName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Gender</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary }}>{gender}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Document Type</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary }}>
                        {documentType === 'PASSPORT' ? 'Passport'
                          : documentType === 'NATIONAL_ID' ? 'National ID'
                          : documentType === 'DRIVER_LICENSE' ? "Driver's License"
                          : '-'}
                      </span>
                    </div>
                    {locationAddress && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: colors.textSecondary }}>Location</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.textPrimary, textAlign: 'right' }}>{locationAddress}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: '0 0 0.35rem 0', fontWeight: 600 }}>Selfie</p>
                    {selfiePreview && (
                      <img src={selfiePreview} alt="Selfie"
                        style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '0.5rem', border: `1px solid ${colors.borderPrimary}` }} />
                    )}
                  </div>

                  <div className="kyc-review-media" style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: '0 0 0.35rem 0', fontWeight: 600 }}>ID · Front</p>
                      {govIdFrontPreview && (
                        <img src={govIdFrontPreview} alt="ID front"
                          style={{ width: '100%', aspectRatio: '1.58 / 1', objectFit: 'cover', borderRadius: '0.5rem', border: `1px solid ${colors.borderPrimary}` }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', color: colors.textSecondary, margin: '0 0 0.35rem 0', fontWeight: 600 }}>
                        ID · Back {documentType === 'PASSPORT' && <span style={{ fontWeight: 400, fontStyle: 'italic' }}>(not needed)</span>}
                      </p>
                      {govIdBackPreview ? (
                        <img src={govIdBackPreview} alt="ID back"
                          style={{ width: '100%', aspectRatio: '1.58 / 1', objectFit: 'cover', borderRadius: '0.5rem', border: `1px solid ${colors.borderPrimary}` }} />
                      ) : (
                        <div style={{
                          width: '100%', aspectRatio: '1.58 / 1', borderRadius: '0.5rem',
                          border: `1px dashed ${colors.borderPrimary}`, backgroundColor: colors.bgTertiary,
                        }} />
                      )}
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* Footer — always visible on form step. Buttons render in disabled state
            when the current step isn't valid yet so users always know what's available. */}
        {step === 'form' && (() => {
          const stepValid = isStepValid(wizardStep);
          const isLastStep = wizardStep === 4;
          const showPrevious = wizardStep > 1;

          const primaryDisabled = !stepValid;
          const primaryCursor = primaryDisabled ? 'not-allowed' : 'pointer';

          const secondaryButton: React.CSSProperties = {
            flex: 1, minHeight: 46, padding: '0.7rem 1rem',
            border: `1px solid ${colors.borderPrimary}`,
            borderRadius: 11,
            background: colors.bgCard, color: colors.textPrimary,
            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          };
          const primaryButton: React.CSSProperties = {
            flex: showPrevious ? 2 : 1, minHeight: 46, padding: '0.7rem 1.2rem',
            border: 'none', borderRadius: 11,
            background: primaryDisabled
              ? colors.bgTertiary
              : 'linear-gradient(135deg, #083A85 0%, #F20C8F 130%)',
            color: primaryDisabled ? colors.textSecondary : '#fff',
            fontSize: '0.92rem', fontWeight: 700, cursor: primaryCursor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: primaryDisabled ? 0.65 : 1,
            boxShadow: primaryDisabled ? 'none' : '0 6px 18px rgba(8,58,133,0.28)',
            letterSpacing: '-0.005em',
            transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
          };

          return (
            <div className="kyc-footer" role="group" aria-label="Wizard navigation" style={{
              display: 'flex', gap: '0.6rem',
              padding: '0.9rem 1.5rem', borderTop: `1px solid ${colors.borderPrimary}`,
              backgroundColor: colors.bgCard,
              boxShadow: '0 -8px 16px -8px rgba(8,58,133,0.10)',
              // Lift above virtual keyboard on mobile when one is open
              transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
              transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
            }}>
              {showPrevious && (
                <button onClick={handleBack} aria-label="Go to previous step"
                  style={secondaryButton}>
                  <i className="bi bi-arrow-left" style={{ fontSize: 13 }} /> Previous
                </button>
              )}
              {isLastStep ? (
                <button onClick={handleSubmit} disabled={primaryDisabled}
                  aria-label="Submit KYC verification"
                  aria-disabled={primaryDisabled}
                  style={primaryButton}>
                  <i className="bi bi-shield-check" style={{ fontSize: 14 }} />
                  Submit verification
                </button>
              ) : (
                <button onClick={handleNext} disabled={primaryDisabled}
                  aria-label={primaryDisabled ? 'Complete current step to continue' : 'Go to next step'}
                  aria-disabled={primaryDisabled}
                  style={primaryButton}>
                  Next <i className="bi bi-arrow-right" style={{ fontSize: 13 }} />
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
