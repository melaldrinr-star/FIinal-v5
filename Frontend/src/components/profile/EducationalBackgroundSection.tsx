import React from 'react';
import { ProfileSectionCard } from './ProfileSectionCard';
import { ProfileFieldDisplay } from './ProfileFieldDisplay';
import { ProfileFieldEdit } from './ProfileFieldEdit';
import { BookOpen } from 'lucide-react';

interface EducationalBackground {
  educationLevel?: string;
  schoolName?: string;
  fieldOfStudy?: string;
}

interface EducationalBackgroundSectionProps {
  data: EducationalBackground;
  isEditMode?: boolean;
  isLoading?: boolean;
  errors?: Record<string, string>;
  onChange?: (field: string, value: string) => void;
}

const educationLevels = [
  { label: 'High School', value: 'high_school' },
  { label: 'Associate Degree', value: 'associate' },
  { label: 'Bachelor Degree', value: 'bachelor' },
  { label: 'Master Degree', value: 'master' },
  { label: 'PhD', value: 'phd' },
  { label: 'Other', value: 'other' },
];

export function EducationalBackgroundSection({
  data,
  isEditMode = false,
  isLoading = false,
  errors = {},
  onChange,
}: EducationalBackgroundSectionProps) {
  const getEducationLevelLabel = (value?: string) => {
    if (!value) return 'Not provided';
    const level = educationLevels.find((l) => l.value === value);
    return level?.label || value;
  };

  return (
    <ProfileSectionCard
      title="Educational Background"
      description="Your educational history"
      icon={BookOpen}
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
            label="Education Level"
            name="educationLevel"
            type="select"
            value={data.educationLevel || ''}
            onChange={onChange!}
            error={errors.educationLevel}
            options={educationLevels}
          />
          <ProfileFieldEdit
            label="School/University Name"
            name="schoolName"
            type="text"
            value={data.schoolName || ''}
            onChange={onChange!}
            error={errors.schoolName}
            placeholder="e.g., State University"
          />
          <ProfileFieldEdit
            label="Field of Study"
            name="fieldOfStudy"
            type="text"
            value={data.fieldOfStudy || ''}
            onChange={onChange!}
            error={errors.fieldOfStudy}
            placeholder="e.g., Computer Science"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <ProfileFieldDisplay
            label="Education Level"
            value={getEducationLevelLabel(data.educationLevel)}
          />
          <ProfileFieldDisplay label="School/University Name" value={data.schoolName} />
          <ProfileFieldDisplay label="Field of Study" value={data.fieldOfStudy} />
        </div>
      )}
    </ProfileSectionCard>
  );
}
