import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle, Download } from 'lucide-react';
import { Button } from './ui/button';
import api from '../services/api';
import logger from '../utils/logger';

// FileMetadata interface for tracking uploaded files
interface FileMetadata {
  id?: string;
  file_name?: string;
  file_size_bytes?: number;
  uploaded_at?: string;
  requirement_type?: string;
  trainee_id?: string;
  file_path?: string;
  uploaded_by?: string;
}

// Props for the RequirementDropZone component
interface RequirementDropZoneProps {
  title: string;
  description: string;
  isRequired: boolean;
  file: File | FileMetadata | null;
  requirementType: string;
  traineeId?: string;
  onFileChange: (file: File | null) => void;
}

// Type guard to check if file is a File object
const isFileObject = (file: File | FileMetadata | null): file is File => {
  return file instanceof File;
};

// Type guard to check if file is FileMetadata
const isFileMetadata = (file: File | FileMetadata | null): file is FileMetadata => {
  return file !== null && !isFileObject(file) && 'file_name' in file;
};

export const RequirementDropZone: React.FC<RequirementDropZoneProps> = ({
  title,
  description,
  isRequired,
  file,
  requirementType,
  traineeId,
  onFileChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Debug logging when file prop changes
  React.useEffect(() => {
    if (file !== null) {
      const isFile = isFileObject(file);
      const isMeta = isFileMetadata(file);
      const debugMessage = 'RequirementDropZone file prop updated: ' + (isFile ? 'File object' : 'FileMetadata');
      console.log(debugMessage, {
        title,
        isFileObject: isFile,
        isFileMetadata: isMeta,
        fileName: isFile ? file.name : (isMeta ? file.file_name : 'N/A'),
        fileSize: isFile ? file.size : (isMeta ? file.file_size_bytes : 'N/A'),
      });
    }
  }, [file, title]);

  // Handle drag enter event
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileChange(files[0]);
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileChange(files[0]);
    }
  };

  // Remove selected file
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Download file from server
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isFileMetadata(file) || !traineeId) return;

    try {
      const downloadUrl = `/trainees/${traineeId}/requirements/${requirementType}/download`;
      const fileName = file.file_name || 'document';
      
      await api.downloadFile(downloadUrl, fileName);
    } catch (error) {
      logger.error('Failed to download file', { error });
      alert('Failed to download file. Please try again.');
    }
  };

  // Trigger file input click
  const handleClick = () => {
    inputRef.current?.click();
  };

  // Format file size for display
  const getFileSize = (size: number | undefined): string => {
    if (!size) return 'Unknown';
    const mb = size / 1024 / 1024;
    const kb = size / 1024;
    return mb < 1 ? kb.toFixed(2) + ' KB' : mb.toFixed(2) + ' MB';
  };

  // Get file name from file or metadata
  const getFileName = (): string => {
    if (isFileObject(file)) {
      return file.name;
    }
    if (isFileMetadata(file)) {
      return file.file_name || 'File';
    }
    return 'File';
  };

  // Get file size formatted
  const getFileSizeFormatted = (): string => {
    if (isFileObject(file)) {
      return getFileSize(file.size);
    }
    if (isFileMetadata(file)) {
      return getFileSize(file.file_size_bytes);
    }
    return 'Unknown';
  };

  // Build CSS classes for container
  const getContainerClass = (): string => {
    const baseClass = 'rounded-lg border-2 border-dashed transition-all cursor-pointer p-4';
    const dragClass = isDragging
      ? 'border-primary bg-primary/5 scale-[1.01]'
      : 'border-border hover:border-primary/50 hover:bg-muted/30';
    const fileClass = file ? 'bg-green-50 dark:bg-green-950/20' : '';
    return baseClass + ' ' + dragClass + ' ' + fileClass;
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={getContainerClass()}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleInputChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{title}</p>
            {isRequired ? (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Required
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Optional
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>

          {file ? (
            <div className="flex items-center gap-2 pt-2">
              <CheckCircle className="size-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                {getFileName()}
              </span>
              <span className="text-xs text-muted-foreground">
                (
                {getFileSizeFormatted()}
                )
              </span>
              {isFileMetadata(file) && file.uploaded_at && (
                <span className="text-xs text-muted-foreground">
                  • {new Date(file.uploaded_at).toLocaleDateString()}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-2 text-muted-foreground">
              <Upload className="size-4" />
              <span className="text-xs">
                {isDragging ? 'Drop file here' : 'Drag file here or click to browse'}
              </span>
            </div>
          )}
        </div>

        {file && (
          <div className="flex gap-1">
            {isFileMetadata(file) && traineeId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                title="Download file"
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                <Download className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementDropZone;
