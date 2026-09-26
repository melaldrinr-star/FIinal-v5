import { useState } from 'react';
import { Eye, FileText, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import FilePreviewModal, { FilePreviewData } from './FilePreviewModal';
import { useRequirementSubmittedTrainees } from '../hooks/useRequirementSubmittedTrainees';
import { getFileUrl } from '../services/api';

interface RequirementSubmittedTraineesListProps {
  requirementId: string;
  requirementType: string;
}

export function RequirementSubmittedTraineesList({
  requirementId,
  requirementType,
}: RequirementSubmittedTraineesListProps) {
  const { data, isLoading, error, refetch } = useRequirementSubmittedTrainees(requirementId);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<{ file: FilePreviewData; traineeId: string } | null>(null);

  const filteredData = data.filter((record) => {
    const query = search.toLowerCase().trim();
    return !query || `${record.trainee_name} ${record.trainee_email}`.toLowerCase().includes(query);
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">Submitted Trainees</CardTitle>
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isLoading}>
          <RefreshCw className="mr-2 size-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search trainee name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading submitted trainees...</p>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button className="mt-3" variant="outline" size="sm" onClick={() => void refetch()}>
              Try Again
            </Button>
          </div>
        ) : filteredData.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No trainees have submitted this requirement.
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {filteredData.map((record) => (
              <div key={record.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <FileText className="mt-1 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{record.trainee_name}</p>
                    <p className="truncate text-sm text-muted-foreground">{record.trainee_email}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{record.file_name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setPreview({
                    file: {
                      file_id: record.id,
                      file_path: getFileUrl(record.file_path),
                      file_name: record.file_name,
                      requirement_type: requirementType,
                      uploaded_at: record.uploaded_at,
                    },
                    traineeId: record.trainee_id,
                  })}
                >
                  <Eye className="mr-2 size-4" />
                  View File
                </Button>
              </div>
            ))}
          </div>
        )}

        <FilePreviewModal
          file={preview?.file || null}
          open={preview !== null}
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
          traineeId={preview?.traineeId}
        />
      </CardContent>
    </Card>
  );
}
