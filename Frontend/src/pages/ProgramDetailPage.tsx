import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePrograms } from '../contexts/ProgramsContext';
import DashboardLayout from '../components/DashboardLayout';
import ProgramDetailsModal from '../components/ProgramDetailsModal';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import logger from '../utils/logger';

/**
 * ProgramDetailPage - Display a specific program with auto-open modal capability
 * 
 * Responsibilities:
 * 1. Extract program_id from URL params
 * 2. Fetch program details
 * 3. Check LocalStorage for selected_program_id
 * 4. If matches URL program_id, set autoOpen=true
 * 5. Pass autoOpen prop to ProgramModal component
 * 6. Display program details automatically when autoOpen=true
 * 7. Allow user to close modal if desired
 * 
 * Requirements: 4.3, 4.4
 */
export default function ProgramDetailPage() {
  const { id: programId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const { programs, loading: contextLoading } = usePrograms();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [autoOpenModal, setAutoOpenModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Check LocalStorage and set autoOpen state when component mounts
  useEffect(() => {
    if (!programId) {
      navigate('/programs', { replace: true });
      return;
    }

    // Check LocalStorage for selected_program_id
    const selectedProgramId = localStorage.getItem('selected_program_id');
    console.log('[ProgramDetailPage] programId from URL:', programId);
    console.log('[ProgramDetailPage] selectedProgramId from localStorage:', selectedProgramId);

    // If selected_program_id matches URL program_id, set autoOpen=true
    if (selectedProgramId === programId) {
      setAutoOpenModal(true);
      // Open modal automatically
      setModalOpen(true);
    }

    setLoading(false);
  }, [programId, navigate]);

  // Find the program from context
  useEffect(() => {
    if (!contextLoading && programId) {
      const program = programs.find(p => p.id === programId);
      
      if (program) {
        setSelectedProgram(program);
      } else {
        logger.warn('Program not found', { programId });
        navigate('/programs', { replace: true });
      }
    }
  }, [programId, programs, contextLoading, navigate]);

  const canManage = hasPermission('canManagePrograms');

  const handleEdit = (program: any) => {
    navigate(`/programs/${program.id}/edit`);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setAutoOpenModal(false);
  };

  if (loading || contextLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate('/programs')} className="mb-4">
            <ArrowLeft className="mr-2 size-4" />
            Back to Programs
          </Button>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedProgram) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate('/programs')} className="mb-4">
            <ArrowLeft className="mr-2 size-4" />
            Back to Programs
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="size-12 text-muted-foreground mb-4" />
              <h3 className="mb-2 text-lg font-semibold">Program Not Found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                The program you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/programs')}>
                View All Programs
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/programs')} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Programs
        </Button>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{selectedProgram.name}</h1>
                <p className="text-muted-foreground">{selectedProgram.description}</p>
              </div>
              <Button 
                onClick={() => setModalOpen(true)}
                size="lg"
                className="w-full sm:w-auto"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Details Modal - auto-opens if autoOpenModal=true */}
      <ProgramDetailsModal
        program={selectedProgram}
        open={modalOpen}
        onOpenChange={handleCloseModal}
        onEdit={canManage ? handleEdit : undefined}
        canManage={canManage}
      />
    </DashboardLayout>
  );
}
