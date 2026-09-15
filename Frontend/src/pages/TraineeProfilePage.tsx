import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Edit2, Save, X, Award, CheckCircle2, BookOpen, Clock } from 'lucide-react';
import { getFileUrl } from '../services/api';
import { toast } from 'sonner';
import traineeService from '../services/traineeService';
import certificateService, { Certificate } from '../services/certificateService';
import CertificateViewer from '../components/CertificateViewer';
import { DashboardSkeletonLoader } from '../components/LoadingSkeletons';
import { Skeleton } from '../components/ui/skeleton';
import logger from '../utils/logger';
import { TraineeStatusCard } from '../components/trainee/TraineeStatusCard';
import TraineeStatusModal from '../components/TraineeStatusModal';
import { useTraineeStatus } from '../hooks/useTraineeStatus';

interface TraineeProfile {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  address: string;
  birth_date: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  photo_path?: string;
  program_id?: string;
  status: string;
  enrollment_date: string;
  program?: {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date_earned: string;
  type: 'certificate' | 'badge' | 'completion';
}

export default function TraineeProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [traineeProfile, setTraineeProfile] = useState<TraineeProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<TraineeProfile>>({});
  const [achievements] = useState<Achievement[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const { record: statusRecord, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useTraineeStatus(
    traineeProfile?.program_id ? `${traineeProfile.program_id}-${traineeProfile.id}` : undefined
  );

  useEffect(() => {
    traineeService.clearProfileCache?.();
    loadProfileData();
    loadCertificates();
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profile = await traineeService.getMyProfile();
      const address = `${profile.street}, ${profile.barangay}, ${profile.municipality}, ${profile.province}`;
      const profileData: TraineeProfile = {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        middle_name: profile.middle_name,
        email: profile.email,
        phone: profile.phone,
        address: address,
        birth_date: profile.birth_date,
        emergency_contact_name: profile.emergency_contact_name ?? '',
        emergency_contact_phone: profile.emergency_contact_phone ?? '',
        photo_path: profile.photo_path || '',
        program_id: profile.program_id,
        status: profile.status,
        enrollment_date: profile.enrollment_date,
        program: (profile as any).program || undefined
      };
      setTraineeProfile(profileData);
      setEditForm(profileData);
    } catch (error: any) {
      logger.error('Failed to load profile data', { error });
      toast.error(error?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      setLoadingCertificates(true);
      const certs = await certificateService.getMyCertificates();
      setCertificates(certs);
    } catch (error: any) {
      logger.error('Failed to load certificates', { error });
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      setEditForm(traineeProfile || {});
    }
    setEditing(!editing);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      let updateData: any = {};
      
      if (editForm.phone !== traineeProfile?.phone) {
        updateData.phone = editForm.phone;
      }
      if (editForm.address !== traineeProfile?.address && editForm.address) {
        const parts = editForm.address.split(',').map(p => p.trim());
        if (parts.length >= 4) {
          updateData.street = parts[0];
          updateData.barangay = parts[1];
          updateData.municipality = parts[2];
          updateData.province = parts[3];
        }
      }
      if (editForm.emergency_contact_name !== traineeProfile?.emergency_contact_name) {
        updateData.emergency_contact_name = editForm.emergency_contact_name ?? null;
      }
      if (editForm.emergency_contact_phone !== traineeProfile?.emergency_contact_phone) {
        updateData.emergency_contact_phone = editForm.emergency_contact_phone ?? null;
      }
      
      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to save');
        setEditing(false);
        return;
      }
      
      await traineeService.updateMyProfile(updateData);
      await loadProfileData();
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      logger.error('Failed to save profile', { error });
      toast.error(error?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return <Award className="size-5 text-yellow-500" />;
      case 'badge':
        return <CheckCircle2 className="size-5 text-green-500" />;
      case 'completion':
        return <BookOpen className="size-5 text-blue-500" />;
      default:
        return <Award className="size-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <DashboardSkeletonLoader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">
      <main className="w-full">
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-10">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-2 border-gray-200 dark:border-gray-700">
                <AvatarImage src={traineeProfile?.photo_path ? getFileUrl(traineeProfile.photo_path) : ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {traineeProfile?.first_name?.[0]}{traineeProfile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {traineeProfile?.first_name} {traineeProfile?.last_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{traineeProfile?.program?.name || 'Trainee'}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={traineeProfile?.status === 'active' ? 'default' : 'secondary'}>
                    {traineeProfile?.status === 'active' ? 'Active' : traineeProfile?.status}
                  </Badge>
                  <Badge variant="outline">Joined {formatDate(traineeProfile?.enrollment_date || '')}</Badge>
                </div>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-3">
              {!editing && (
                <Button onClick={handleEditToggle}>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {editing && (
                <>
                  <Button variant="outline" onClick={handleEditToggle} disabled={saving}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <div className="animate-spin h-4 w-4 border-2 border-transparent border-t-white rounded-full" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* CONTENT TABS */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="certificates">Certs</TabsTrigger>
              <TabsTrigger value="achievements">Awards</TabsTrigger>
            </TabsList>

            {/* PERSONAL TAB */}
            <TabsContent value="personal" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">First Name</Label>
                      {editing ? (
                        <Input value={editForm.first_name || ''} onChange={(e) => handleInputChange('first_name', e.target.value)} />
                      ) : (
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.first_name}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Last Name</Label>
                      {editing ? (
                        <Input value={editForm.last_name || ''} onChange={(e) => handleInputChange('last_name', e.target.value)} />
                      ) : (
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.last_name}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Middle Name</Label>
                      {editing ? (
                        <Input value={editForm.middle_name || ''} onChange={(e) => handleInputChange('middle_name', e.target.value)} />
                      ) : (
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.middle_name || '—'}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Birth Date</Label>
                      {editing ? (
                        <Input type="date" value={editForm.birth_date || ''} onChange={(e) => handleInputChange('birth_date', e.target.value)} />
                      ) : (
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.birth_date ? formatDate(traineeProfile.birth_date) : '—'}</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Address</Label>
                    {editing ? (
                      <Input value={editForm.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Street, Barangay, Municipality, Province" />
                    ) : (
                      <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.address || '—'}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONTACT TAB */}
            <TabsContent value="contact" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Email Address</Label>
                      <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.email}</div>
                      <p className="text-xs text-gray-500">Cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Phone Number</Label>
                      {editing ? (
                        <Input value={editForm.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} />
                      ) : (
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.phone || '—'}</div>
                      )}
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <h4 className="font-semibold text-base">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Contact Name</Label>
                      {editing ? (
                        <Input value={editForm.emergency_contact_name || ''} onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)} />
                      ) : (
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.emergency_contact_name || '—'}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Contact Phone</Label>
                      {editing ? (
                        <Input value={editForm.emergency_contact_phone || ''} onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)} />
                      ) : (
                        <div className="py-2 px-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">{traineeProfile?.emergency_contact_phone || '—'}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CERTIFICATES TAB */}
            <TabsContent value="certificates" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCertificates ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full"></div>
                    </div>
                  ) : (
                    <CertificateViewer certificates={certificates} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACHIEVEMENTS TAB */}
            <TabsContent value="achievements" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements & Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  {achievements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Award className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="font-semibold text-gray-900 dark:text-white">No achievements yet</p>
                      <p className="text-sm text-gray-500">Complete modules to earn achievements</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {achievements.map((achievement) => (
                        <div key={achievement.id} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded">
                          <div className="p-2 rounded bg-primary/10">{getAchievementIcon(achievement.type)}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-sm">{achievement.title}</h4>
                              <Badge variant="outline" className="text-xs">{achievement.type}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{achievement.description}</p>
                            <p className="text-xs text-gray-500 mt-2">Earned on {formatDate(achievement.date_earned)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* SIDEBAR INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {traineeProfile?.program && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Program</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold">{traineeProfile.program.name}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{traineeProfile.program.description}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Start Date</span>
                      <span className="font-semibold">{formatDate(traineeProfile.program.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">End Date</span>
                      <span className="font-semibold">{formatDate(traineeProfile.program.end_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <Badge variant={traineeProfile.program.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {traineeProfile.program.status === 'active' ? 'Active' : traineeProfile.program.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <TraineeStatusCard
              statusRecord={statusRecord}
              isLoading={statusLoading}
              error={statusError?.message}
              onViewDetails={() => setStatusModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* STATUS MODAL */}
      <TraineeStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        enrollmentId={traineeProfile?.program_id ? `${traineeProfile.program_id}-${traineeProfile.id}` : ''}
        traineeId={traineeProfile?.id || ''}
        traineeName={traineeProfile ? `${traineeProfile.first_name} ${traineeProfile.last_name}` : undefined}
        programName={traineeProfile?.program?.name}
        existingStatus={statusRecord || undefined}
        onStatusCreated={() => {
          refetchStatus();
          setStatusModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
}
