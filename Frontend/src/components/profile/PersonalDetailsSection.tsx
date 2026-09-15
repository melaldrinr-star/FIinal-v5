import React from 'react';
import { ProfileSectionCard } from './ProfileSectionCard';
import { ProfileFieldDisplay } from './ProfileFieldDisplay';
import { ProfileFieldEdit } from './ProfileFieldEdit';
import { User } from 'lucide-react';

interface PersonalDetails {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

interface PersonalDetailsSectionProps {
  data: PersonalDetails;
  isEditMode?: boolean;
  isLoading?: boolean;
  errors?: Record<string, string>;
  onChange?: (field: string, value: string) => void;
}

export function PersonalDetailsSection({
  data,
  isEditMode = false,
  isLoading = false,
  errors = {},
  onChange,
}: PersonalDetailsSectionProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not provided';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ProfileSectionCard
      title="Personal Details"
      description="Your basic personal information"
      icon={User}
    >
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 w-full rounded bg-muted" />
          ))}
        </div>
      ) : isEditMode ? (
        <div className="space-y-4">
          <ProfileFieldEdit
            label="First Name"
            name="firstName"
            value={data.firstName}
            onChange={onChange!}
            error={errors.firstName}
            required
          />
          <ProfileFieldEdit
            label="Last Name"
            name="lastName"
            value={data.lastName}
            onChange={onChange!}
            error={errors.lastName}
            required
          />
          <ProfileFieldEdit
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={data.dateOfBirth || ''}
            onChange={onChange!}
            error={errors.dateOfBirth}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileFieldDisplay label="First Name" value={data.firstName} />
            <ProfileFieldDisplay label="Last Name" value={data.lastName} />
          </div>
          <ProfileFieldDisplay label="Date of Birth" value={formatDate(data.dateOfBirth)} />
        </div>
      )}
    </ProfileSectionCard>
  );
}
