import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { CheckCircle2, XCircle, Clock, Mail, Phone, MapPin, BookOpen, User, Calendar } from 'lucide-react';
import { PendingRegistration } from '../services/registrationService';
import { toast } from 'sonner';
import registrationService from '../services/registrationService';

interface TraineePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainee: PendingRegistration | null;
  onApprove?: () => void;
  onReject?: () => void;
  isAdminMode?: boolean;
}

export default function TraineePreviewModal({
  open,
  onOpenChange,
  trainee,
  onApprove,
  onReject,
  isAdminMode = false,
}: TraineePreviewModalProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!trainee) return null;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await registrationService.approveRegistration(trainee.id);
      toast.success(`Registration approved! Account created for ${trainee.first_name} ${trainee.last_name}.`);
      onOpenChange(false);
      onApprove?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await registrationService.rejectRegistration(trainee.id, rejectReason.trim());
      toast.success('Registration rejected.');
      onOpenChange(false);
      onReject?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject registration');
    } finally {
      setActionLoading(false);
      setRejectReason('');
      setShowRejectForm(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'pending') return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="mr-1 size-3" />Pending</Badge>;
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="mr-1 size-3" />Approved</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="mr-1 size-3" />Rejected</Badge>;
  };

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) => (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-medium break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl">
                {trainee.first_name} {trainee.last_name}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm flex flex-col gap-1 mt-1">
                <span>@{trainee.username} • {trainee.email}</span>
                {trainee.program && <span className="text-muted-foreground">{trainee.program.name}</span>}
              </DialogDescription>
            </div>
            {statusBadge(trainee.status)}
          </div>
        </DialogHeader>

        <Separator className="my-2" />

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm mb-4">
            <TabsTrigger value="personal" className="truncate">Personal</TabsTrigger>
            <TabsTrigger value="address" className="truncate">Address</TabsTrigger>
            <TabsTrigger value="education" className="truncate">Education</TabsTrigger>
            <TabsTrigger value="program" className="truncate">Program</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-3 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
              <InfoRow label="First Name" value={trainee.first_name} icon={User} />
              <InfoRow label="Middle Name" value={trainee.middle_name || '—'} />
              <InfoRow label="Last Name" value={trainee.last_name} />
              <Separator className="my-2" />
              <InfoRow label="Email" value={trainee.email} icon={Mail} />
              <InfoRow label="Phone" value={trainee.phone} icon={Phone} />
              <Separator className="my-2" />
              <InfoRow label="Birth Date" value={trainee.birth_date ? new Date(trainee.birth_date).toLocaleDateString() : '—'} icon={Calendar} />
              <InfoRow label="Birth Place" value={trainee.birth_place} />
              <Separator className="my-2" />
              <InfoRow label="Sex" value={trainee.sex} />
              <InfoRow label="Civil Status" value={trainee.civil_status} />
              <InfoRow label="Disability" value={trainee.disability || 'None'} />
            </div>
          </TabsContent>

          <TabsContent value="address" className="space-y-3 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
              <InfoRow label="Street" value={trainee.street} icon={MapPin} />
              <InfoRow label="Barangay" value={trainee.barangay} />
              <InfoRow label="Municipality" value={trainee.municipality} />
              <InfoRow label="Province" value={trainee.province} />
              <Separator className="my-2" />
              <div className="rounded-lg border border-muted-foreground/20 bg-background p-2 text-xs leading-relaxed">
                <p className="font-medium text-muted-foreground mb-1">Full Address</p>
                <p>{trainee.street}, {trainee.barangay}, {trainee.municipality}, {trainee.province}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="education" className="space-y-3 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
              <InfoRow label="Educational Attainment" value={trainee.educational_attainment} icon={BookOpen} />
              <InfoRow label="Course" value={trainee.course} />
              <InfoRow label="Year Graduated" value={trainee.year_graduated} />
              <Separator className="my-2" />
              <InfoRow label="Employment Status" value={trainee.employment_status} />
              <InfoRow label="Classification" value={trainee.classification} />
            </div>
          </TabsContent>

          <TabsContent value="program" className="space-y-3 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
              {trainee.program && (
                <>
                  <InfoRow label="Program Name" value={trainee.program.name} icon={BookOpen} />
                  <InfoRow label="Description" value={trainee.program.description} />
                  <Separator className="my-2" />
                  <InfoRow label="Start Date" value={trainee.program.start_date ? new Date(trainee.program.start_date).toLocaleDateString() : '—'} icon={Calendar} />
                  <InfoRow label="End Date" value={trainee.program.end_date ? new Date(trainee.program.end_date).toLocaleDateString() : '—'} />
                  <InfoRow label="Status" value={trainee.program.status} />
                </>
              )}
              {!trainee.program && (
                <p className="text-xs text-muted-foreground">No program information available</p>
              )}
              <Separator className="my-2" />
              <InfoRow label="Registration Date" value={new Date(trainee.created_at).toLocaleDateString()} />
              {trainee.reviewed_at && (
                <InfoRow label="Reviewed Date" value={new Date(trainee.reviewed_at).toLocaleDateString()} />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {trainee.status === 'rejected' && trainee.rejection_reason && (
          <>
            <Separator className="my-4" />
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
              <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason</p>
              <p className="text-xs sm:text-sm text-red-700 leading-relaxed">{trainee.rejection_reason}</p>
            </div>
          </>
        )}

        {isAdminMode && trainee.status === 'pending' && (
          <>
            <Separator className="my-4" />
            {!showRejectForm ? (
              <DialogFooter className="gap-2 sm:gap-3 flex-col sm:flex-row">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={actionLoading} className="text-xs sm:text-sm">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => setShowRejectForm(true)} disabled={actionLoading} className="text-xs sm:text-sm">
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm">
                  {actionLoading ? 'Processing...' : 'Approve'}
                </Button>
              </DialogFooter>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
                  <label className="text-xs font-medium text-amber-800 block mb-2">Reason for Rejection *</label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explain why this registration is being rejected..."
                    rows={3}
                    className="w-full p-2 text-xs border rounded bg-background text-foreground placeholder-muted-foreground"
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-3 flex-col sm:flex-row">
                  <Button variant="outline" onClick={() => { setShowRejectForm(false); setRejectReason(''); }} disabled={actionLoading} className="text-xs sm:text-sm">
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="text-xs sm:text-sm">
                    {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}

        {trainee.status !== 'pending' && (
          <>
            <Separator className="my-4" />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


