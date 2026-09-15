import { useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '../ui/utils';

interface ProfileImageUploadProps {
  currentImage?: string;
  currentInitials?: string;
  isEditable?: boolean;
  onImageSelect?: (file: File) => Promise<void>;
  onImageDelete?: () => Promise<void>;
}

export function ProfileImageUpload({
  currentImage,
  currentInitials = 'U',
  isEditable = true,
  onImageSelect,
  onImageDelete,
}: ProfileImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Call upload handler
    if (onImageSelect) {
      setIsLoading(true);
      setError(null);
      try {
        await onImageSelect(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image');
        setPreview(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (onImageDelete) {
      setIsLoading(true);
      setError(null);
      try {
        await onImageDelete();
        setPreview(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete image');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Avatar Container */}
      <div
        className={cn(
          'relative',
          isEditable && 'transition-all duration-200'
        )}
        onMouseEnter={() => isEditable && setIsHovering(true)}
        onMouseLeave={() => isEditable && setIsHovering(false)}
      >
        <Avatar className="h-32 w-32 border-4 border-border">
          <AvatarImage src={displayImage} alt="Profile" />
          <AvatarFallback className="text-2xl font-semibold">
            {currentInitials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay on Hover (Desktop) or Always (Mobile) */}
        {isEditable && (
          <>
            {/* Desktop hover overlay */}
            <div
              className={cn(
                'absolute inset-0 rounded-full bg-black/40 transition-all duration-200 flex items-center justify-center',
                isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none',
                'hidden sm:flex'
              )}
            >
              <Upload className="h-6 w-6 text-white" />
            </div>

            {/* Mobile button - always visible */}
            <Button
              size="sm"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0 sm:hidden"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Click area for desktop */}
      {isEditable && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Click to upload or drag and drop
        </button>
      )}

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={isLoading}
        className="hidden"
      />

      {/* Action buttons */}
      {isEditable && (
        <div className="flex gap-2 sm:flex-col sm:gap-1 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            <Upload className="h-4 w-4 mr-1" />
            Change Photo
          </Button>

          {currentImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 sm:flex-none text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-destructive text-center">
          {error}
          {error.includes('Failed to upload') && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setError(null);
                if (preview) {
                  // Retry upload - would need the file again in real implementation
                }
              }}
              className="ml-2 text-destructive"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* File info */}
      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG or GIF (MAX. 5MB)
      </p>
    </div>
  );
}
