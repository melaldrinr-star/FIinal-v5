/**
 * AttendanceSubmitFlow
 *
 * Orchestrates the full trainee self-service submission flow:
 *   idle → capturing → submitting → success | error
 *
 * - Opens CameraModal when triggered
 * - Collects GPS (soft — proceeds without if denied/timeout)
 * - Collects device info (userAgent, timezone, connection, battery)
 * - Builds FormData and calls attendanceService.submitAttendance
 * - Checks navigator.onLine before opening camera
 * - Shows full-screen loading overlay during submission
 * - Renders AttendanceConfirmation on success
 */
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CameraModal from './CameraModal';
import AttendanceConfirmation from './AttendanceConfirmation';
import attendanceService from '../../services/attendanceService';
import type {
  AttendanceWindowStatus,
  AttendanceRecord,
} from '../../services/attendanceService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttendanceSubmitFlowProps {
  /** Current window status — used to know which session label to submit */
  windowStatus: AttendanceWindowStatus | null;
  /** Called after successful submission AND the user clicks "Back to Calendar" */
  onComplete: () => void;
  /** Children render prop: receives the triggerAttendance fn to open the flow */
  children: (triggerAttendance: () => void) => React.ReactNode;
}

type FlowState = 'idle' | 'capturing' | 'submitting' | 'success' | 'error';

// ---------------------------------------------------------------------------
// GPS helper (soft — never blocks)
// ---------------------------------------------------------------------------

function collectGps(): Promise<GeolocationCoordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      ()    => resolve(null),
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

// ---------------------------------------------------------------------------
// Device info helper
// ---------------------------------------------------------------------------

async function collectDeviceInfo(): Promise<Record<string, unknown>> {
  const info: Record<string, unknown> = {
    browser:   navigator.userAgent,
    os:        (navigator as any).userAgentData?.platform ?? navigator.platform ?? 'unknown',
    timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone,
    networkType: (navigator as any).connection?.effectiveType ?? 'unknown',
    appVersion: '1.0',
  };

  // Optional battery level
  try {
    const battery = await (navigator as any).getBattery?.();
    if (battery) {
      info.batteryLevel = Math.round(battery.level * 100);
    }
  } catch {
    // battery API not available — ignore
  }

  return info;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AttendanceSubmitFlow({
  windowStatus,
  onComplete,
  children,
}: AttendanceSubmitFlowProps) {
  const [flowState,   setFlowState]   = useState<FlowState>('idle');
  const [successRecord, setSuccessRecord] = useState<AttendanceRecord | null>(null);

  const sessionLabel = windowStatus?.session_label ?? 'morning';

  // ── Trigger (called by parent via children render prop) ──────────────────
  const triggerAttendance = useCallback(() => {
    if (!navigator.onLine) {
      toast.error('You must be online to submit attendance');
      return;
    }
    if (!windowStatus?.isOpen) {
      toast.error('Attendance window is currently closed');
      return;
    }
    setFlowState('capturing');
  }, [windowStatus]);

  // ── Camera captured a blob ────────────────────────────────────────────────
  const handleCapture = useCallback(async (blob: Blob) => {
    setFlowState('submitting');

    try {
      // Collect GPS (8s timeout, soft)
      const gps = await collectGps();

      // Collect device info
      const deviceInfo = await collectDeviceInfo();

      // Build FormData
      const fd = new FormData();
      fd.append('selfie',        blob, 'selfie.jpg');
      fd.append('session_label', sessionLabel);
      fd.append('device_info',   JSON.stringify(deviceInfo));

      if (gps) {
        fd.append('gps_lat',      String(gps.latitude));
        fd.append('gps_lng',      String(gps.longitude));
        fd.append('gps_accuracy', String(gps.accuracy));
      }

      // Submit
      const response = await attendanceService.submitAttendance(fd);

      if (!response.success || !response.data) {
        throw new Error(response.message ?? 'Submission failed');
      }

      setSuccessRecord(response.data);
      setFlowState('success');
    } catch (err: unknown) {
      const msg =
        (err as any)?.message ??
        (err as any)?.error   ??
        'Failed to submit attendance. Please try again.';
      toast.error(msg);
      setFlowState('idle');
    }
  }, [sessionLabel]);

  // ── User closed camera without capturing ─────────────────────────────────
  const handleCameraClose = useCallback(() => {
    setFlowState('idle');
  }, []);

  // ── User clicks "Back to Calendar" on confirmation ───────────────────────
  const handleComplete = useCallback(() => {
    setSuccessRecord(null);
    setFlowState('idle');
    onComplete();
  }, [onComplete]);

  // ── Render ────────────────────────────────────────────────────────────────

  // Success screen — takes over the whole flow area
  if (flowState === 'success' && successRecord) {
    return (
      <AttendanceConfirmation
        record={successRecord}
        sessionLabel={sessionLabel}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <>
      {/* Render the trigger (e.g. the calendar's Take Attendance button) */}
      {children(triggerAttendance)}

      {/* Camera modal */}
      <CameraModal
        isOpen={flowState === 'capturing'}
        sessionLabel={sessionLabel}
        onCapture={handleCapture}
        onClose={handleCameraClose}
      />

      {/* Submitting overlay */}
      {flowState === 'submitting' && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Submitting attendance"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm"
        >
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-base font-medium text-foreground">Submitting attendance…</p>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </div>
      )}
    </>
  );
}
