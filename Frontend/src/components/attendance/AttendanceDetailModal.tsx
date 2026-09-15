/**
 * AttendanceDetailModal - Compact, mobile-friendly modal
 */
import { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { MapPin, Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getFileUrl } from '../../services/api';
import attendanceService from '../../services/attendanceService';
import type { AttendanceRecord } from '../../services/attendanceService';

interface TraineeSummary {
  id: string;
  first_name: string;
  last_name: string;
  photo_path?: string;
}

interface Props {
  record: AttendanceRecord | null;
  trainee: TraineeSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export default function AttendanceDetailModal({ record, trainee, isOpen, onClose, onStatusUpdated }: Props) {
  const [saving, setSaving] = useState(false);

  const effectiveTrainee = trainee || (record?.trainee as any);
  const traineeName = effectiveTrainee ? `${effectiveTrainee.first_name} ${effectiveTrainee.last_name}` : 'Unknown';
  const hasGps = record?.gps_lat != null && record?.gps_lng != null;

  if (!isOpen) return null;

  function formatTime(iso?: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-xl overflow-hidden flex flex-col max-w-[min(90vw,450px)] max-h-[min(90vh,85vh)]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3 shrink-0">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {effectiveTrainee?.photo_path ? (
              <img src={getFileUrl(effectiveTrainee.photo_path)} alt="" className="size-14 rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{effectiveTrainee?.first_name?.[0]}{effectiveTrainee?.last_name?.[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{traineeName}</h2>
            <div className="flex items-center gap-2 mt-1">
              {record ? (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  record.status === 'present' ? 'bg-[var(--secondary)]/20 text-[var(--secondary)]' :
                  record.status === 'late' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
                  record.status === 'absent' ? 'bg-[var(--destructive)]/20 text-[var(--destructive)]' : 'bg-muted'
                }`}>
                  {record.status}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">No record</span>
              )}
              {record?.late_duration_minutes ? (
                <span className="text-xs text-[var(--accent)]">Late {record.late_duration_minutes}m</span>
              ) : null}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full shrink-0">
            <X className="size-5" />
          </Button>
        </div>

        {/* Content - Adaptive scrolling */}
        <div className="overflow-y-auto p-4 pt-2 space-y-4 min-h-0">
          
          {!record ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No attendance record for this date</p>
            </div>
          ) : (
            <>
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">🌅 Morning</p>
                  <p className="text-sm font-semibold">{formatTime(record.morning_time_in ?? record.check_in_time)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">🌆 Afternoon</p>
                  <p className="text-sm font-semibold">{formatTime(record.afternoon_time_out ?? record.check_out_time)}</p>
                </div>
              </div>

              {/* Selfies */}
              <div className="flex gap-2">
                <div className="flex-1 aspect-square rounded-lg border bg-muted/20 flex items-center justify-center overflow-hidden">
                  {record.selfie_morning_path ? (
                    <img src={getFileUrl(record.selfie_morning_path)} alt="Morning" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="size-6 text-muted-foreground/50 mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground">No morning selfie</p>
                    </div>
                  )}
                </div>
                <div className="flex-1 aspect-square rounded-lg border bg-muted/20 flex items-center justify-center overflow-hidden">
                  {record.selfie_afternoon_path ? (
                    <img src={getFileUrl(record.selfie_afternoon_path)} alt="Afternoon" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="size-6 text-muted-foreground/50 mx-auto mb-1" />
                      <p className="text-[10px] text-muted-foreground">No afternoon selfie</p>
                    </div>
                  )}
                </div>
              </div>

              {/* GPS Info */}
              {hasGps && (
                <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span className="text-xs truncate">
                    {record.gps_lat?.toFixed(4)}, {record.gps_lng?.toFixed(4)}
                    {record.gps_accuracy && ` (±${record.gps_accuracy.toFixed(0)}m)`}
                  </span>
                </div>
              )}

              {/* Device Info Row */}
              {record.device_info && (
                <div className="flex gap-2 flex-wrap">
                  {record.device_info.timezone && (
                    <span className="text-[10px] px-2 py-1 bg-muted rounded">{record.device_info.timezone}</span>
                  )}
                  {record.device_info.ip && (
                    <span className="text-[10px] px-2 py-1 bg-muted rounded truncate max-w-[100px]">{record.device_info.ip}</span>
                  )}
                  {record.attempt_number && (
                    <span className="text-[10px] px-2 py-1 bg-muted rounded">Attempt #{record.attempt_number}</span>
                  )}
                </div>
              )}

              <Separator />

              {/* Override Section - Only show if canOverride */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-9" onClick={async () => {
                    if (!record) return;
                    setSaving(true);
                    try {
                      await attendanceService.markAttendance({ session_id: record.session_id, trainee_id: record.trainee_id, status: 'present', notes: 'Manual override' });
                      toast.success('Marked present');
                      onStatusUpdated();
                      onClose();
                    } catch { toast.error('Failed'); }
                    finally { setSaving(false); }
                  }} disabled={saving}>
                    Present
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-9" onClick={async () => {
                    if (!record) return;
                    setSaving(true);
                    try {
                      await attendanceService.markAttendance({ session_id: record.session_id, trainee_id: record.trainee_id, status: 'absent', notes: 'Manual override' });
                      toast.success('Marked absent');
                      onStatusUpdated();
                      onClose();
                    } catch { toast.error('Failed'); }
                    finally { setSaving(false); }
                  }} disabled={saving}>
                    Absent
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-9" onClick={async () => {
                    if (!record) return;
                    setSaving(true);
                    try {
                      await attendanceService.markAttendance({ session_id: record.session_id, trainee_id: record.trainee_id, status: 'excused', notes: 'Manual override' });
                      toast.success('Marked excused');
                      onStatusUpdated();
                      onClose();
                    } catch { toast.error('Failed'); }
                    finally { setSaving(false); }
                  }} disabled={saving}>
                    Excused
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}