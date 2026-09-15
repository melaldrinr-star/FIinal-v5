/**
 * ScheduleOverrideModal
 * Create a single-day override for an attendance schedule.
 * Full-day-off also creates a non_attendance_dates entry (handled on backend).
 */
import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import attendanceService from '../../services/attendanceService';
import type { CreateOverrideData } from '../../services/attendanceService';

interface ScheduleOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  scheduleId: string;
  /** Restrict date picker to within schedule's effective dates */
  effectiveDateStart?: string;
  effectiveDateEnd?: string;
}

export default function ScheduleOverrideModal({
  isOpen, onClose, onSaved, scheduleId, effectiveDateStart, effectiveDateEnd,
}: ScheduleOverrideModalProps) {
  const [date,        setDate]        = useState('');
  const [reason,      setReason]      = useState('');
  const [type,        setType]        = useState<'full_day_off' | 'custom'>('full_day_off');
  const [customMorningOpen,    setCMO] = useState('');
  const [customMorningClose,   setCMC] = useState('');
  const [customAfternoonOpen,  setCAO] = useState('');
  const [customAfternoonClose, setCAC] = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(''); setReason(''); setType('full_day_off');
      setCMO(''); setCMC(''); setCAO(''); setCAC('');
      setErrors({});
    }
  }, [isOpen]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!date)         e.date   = 'Date is required';
    if (!reason.trim()) e.reason = 'Reason is required';
    if (type === 'custom') {
      if (customMorningOpen && customMorningClose && customMorningClose <= customMorningOpen)
        e.customMorningClose = 'Close must be after open';
      if (customAfternoonOpen && customAfternoonClose && customAfternoonClose <= customAfternoonOpen)
        e.customAfternoonClose = 'Close must be after open';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const data: CreateOverrideData = {
        date,
        reason,
        is_full_day_off:        type === 'full_day_off',
        custom_morning_open:    type === 'custom' ? (customMorningOpen    || null) : null,
        custom_morning_close:   type === 'custom' ? (customMorningClose   || null) : null,
        custom_afternoon_open:  type === 'custom' ? (customAfternoonOpen  || null) : null,
        custom_afternoon_close: type === 'custom' ? (customAfternoonClose || null) : null,
      };
      await attendanceService.createOverride(scheduleId, data);
      toast.success('Override created');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create override');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Date Override</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="ov-date">Date *</Label>
            <Input id="ov-date" type="date" value={date}
              min={effectiveDateStart} max={effectiveDateEnd}
              onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: '' })); }} />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <Label htmlFor="ov-reason">Reason *</Label>
            <Input id="ov-reason" value={reason} placeholder="e.g. Holiday, School event"
              onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: '' })); }} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Override Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as any)} className="space-y-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="full_day_off" id="ov-full" />
                <Label htmlFor="ov-full" className="cursor-pointer">Full day off</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="custom" id="ov-custom" />
                <Label htmlFor="ov-custom" className="cursor-pointer">Custom window times</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Full day off note */}
          {type === 'full_day_off' && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>This will also mark the date as a non-attendance day across the system.</span>
            </div>
          )}

          {/* Custom window inputs */}
          {type === 'custom' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Morning window (leave blank to use schedule default)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="cmo" className="text-xs">Open</Label>
                    <Input id="cmo" type="time" value={customMorningOpen} onChange={(e) => setCMO(e.target.value)} className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cmc" className="text-xs">Close</Label>
                    <Input id="cmc" type="time" value={customMorningClose} onChange={(e) => setCMC(e.target.value)} className="h-8" />
                    {errors.customMorningClose && <p className="text-xs text-destructive">{errors.customMorningClose}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Afternoon window</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="cao" className="text-xs">Open</Label>
                    <Input id="cao" type="time" value={customAfternoonOpen} onChange={(e) => setCAO(e.target.value)} className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cac" className="text-xs">Close</Label>
                    <Input id="cac" type="time" value={customAfternoonClose} onChange={(e) => setCAC(e.target.value)} className="h-8" />
                    {errors.customAfternoonClose && <p className="text-xs text-destructive">{errors.customAfternoonClose}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Create Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
