/**
 * CameraModal
 *
 * Full-screen live front-camera selfie capture.
 * - Uses getUserMedia({ video: { facingMode: 'user' } })
 * - No <input type="file"> — gallery upload is intentionally disabled
 * - States: loading → live preview → preview captured → permission denied → not supported
 * - SVG oval face-alignment guide overlay
 * - Session label badge ("Morning Time In" / "Afternoon Time Out")
 * - Cleanup: stops all media tracks on close/unmount
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, RotateCcw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CameraModalProps {
  isOpen: boolean;
  sessionLabel: 'morning' | 'afternoon';
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

type CameraState = 'loading' | 'live' | 'preview' | 'denied' | 'unsupported';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CameraModal({
  isOpen,
  sessionLabel,
  onCapture,
  onClose,
}: CameraModalProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const [state,      setState]      = useState<CameraState>('loading');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const sessionText = sessionLabel === 'morning' ? 'Morning Time In' : 'Afternoon Time Out';

  // ── Stop camera stream ────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Revoke object URL to avoid memory leaks ───────────────────────────────
  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // ── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setState('loading');
    revokePreview();
    setPreviewBlob(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setState('live');
      }
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setState('denied');
      } else {
        setState('unsupported');
      }
    }
  }, [revokePreview]);

  // ── Lifecycle: start/stop when modal opens/closes ─────────────────────────
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      revokePreview();
      setPreviewBlob(null);
      setState('loading');
    }
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Cleanup preview URL on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth  || 640;
    const h = video.videoHeight || 480;
    canvas.width  = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the canvas so the output matches what the user sees
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(url);
        stopStream();
        setState('preview');
      },
      'image/jpeg',
      0.85
    );
  }, [stopStream]);

  // ── Retake ────────────────────────────────────────────────────────────────
  const handleRetake = useCallback(() => {
    revokePreview();
    setPreviewBlob(null);
    startCamera();
  }, [revokePreview, startCamera]);

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (previewBlob) {
      onCapture(previewBlob);
    }
  }, [previewBlob, onCapture]);

  // ── Close ─────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    stopStream();
    revokePreview();
    setPreviewBlob(null);
    setState('loading');
    onClose();
  }, [stopStream, revokePreview, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Take attendance selfie"
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 z-10 absolute top-0 left-0 right-0">
        {/* Session label badge */}
        <Badge
          variant="secondary"
          className="bg-black/60 text-white border-white/30 backdrop-blur-sm text-xs"
        >
          {sessionLabel === 'morning' ? '☀' : '🌙'} {sessionText}
        </Badge>

        {/* Front camera indicator */}
        <span className="text-white/70 text-xs hidden sm:block">
          Front camera
        </span>

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close camera"
          className="flex items-center justify-center size-9 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">

        {/* LOADING state */}
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="size-10 animate-spin text-white/70" />
            <p className="text-sm text-white/70">Starting camera…</p>
          </div>
        )}

        {/* UNSUPPORTED state */}
        {state === 'unsupported' && (
          <div className="flex flex-col items-center gap-4 text-white px-8 text-center">
            <AlertCircle className="size-12 text-red-400" />
            <p className="text-base font-semibold">Camera not available</p>
            <p className="text-sm text-white/70">
              Your device or browser doesn't support camera access.
              Please use a modern browser (Chrome, Safari, Firefox) on a device with a camera.
            </p>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </div>
        )}

        {/* PERMISSION DENIED state */}
        {state === 'denied' && (
          <div className="flex flex-col items-center gap-4 text-white px-8 text-center max-w-sm">
            <AlertCircle className="size-12 text-yellow-400" />
            <p className="text-base font-semibold">Camera access denied</p>
            <p className="text-sm text-white/70">
              Please allow camera access in your browser settings, then try again.
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button variant="secondary" onClick={startCamera}>
                Try again
              </Button>
              <Button variant="outline" className="text-white border-white/30" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {/* LIVE PREVIEW state */}
        {(state === 'live' || state === 'loading') && (
          <div className={`relative w-full h-full flex items-center justify-center ${state === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
            {/* Mirrored video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* SVG oval face-alignment guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg
                viewBox="0 0 300 380"
                className="w-48 sm:w-64 opacity-70"
                aria-hidden="true"
              >
                <ellipse
                  cx="150" cy="190"
                  rx="120" ry="160"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeDasharray="8 4"
                />
              </svg>
            </div>

            {/* Instruction text */}
            <p className="absolute bottom-24 left-0 right-0 text-center text-white/80 text-xs pointer-events-none">
              Position your face within the guide
            </p>
          </div>
        )}

        {/* PREVIEW state */}
        {state === 'preview' && previewUrl && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Captured selfie preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <p className="absolute top-16 left-0 right-0 text-center text-white font-medium text-sm">
              Preview — looks good?
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom action bar ── */}
      <div className="flex items-center justify-center gap-6 py-6 px-4 z-10">

        {/* LIVE → Capture button */}
        {state === 'live' && (
          <button
            onClick={handleCapture}
            aria-label="Capture selfie"
            className={[
              'flex items-center justify-center',
              'size-16 rounded-full border-4 border-white bg-white/20',
              'hover:bg-white/30 active:scale-95 transition-all',
              'text-white shadow-lg',
            ].join(' ')}
          >
            <Camera className="size-7" />
          </button>
        )}

        {/* PREVIEW → Retake + Confirm */}
        {state === 'preview' && (
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleRetake}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
              aria-label="Retake selfie"
            >
              <RotateCcw className="size-4" />
              Retake
            </Button>

            <Button
              size="lg"
              onClick={handleConfirm}
              className="gap-2 bg-green-500 hover:bg-green-600 text-white border-0"
              aria-label="Confirm selfie"
            >
              <Check className="size-4" />
              Use Photo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
