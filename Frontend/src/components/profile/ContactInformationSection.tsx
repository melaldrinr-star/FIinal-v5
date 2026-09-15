import React from 'react';
import { ProfileSectionCard } from './ProfileSectionCard';
import { ProfileFieldDisplay } from './ProfileFieldDisplay';
import { ProfileFieldEdit } from './ProfileFieldEdit';
import { Mail, Phone } from 'lucide-react';

interface ContactInformation {
  email: string;
  phone?: string;
}

interface ContactInformationSectionProps {
  data: ContactInformation;
  isEditMode?: boolean;
  isLoading?: boolean;
  errors?: Record<string, string>;
  onChange?: (field: string, value: string) => void;
}

export function ContactInformationSection({
  data,
  isEditMode = false,
  isLoading = false,
  errors = {},
  onChange,
}: ContactInformationSectionProps) {
  return (
    <ProfileSectionCard
      title="Contact Information"
      description="Your contact details"
      icon={Mail}
    >
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-12 w-full rounded bg-muted" />
          ))}
        </div>
      ) : isEditMode ? (
        <div className="space-y-4">
          <ProfileFieldEdit
            label="Email Address"
            name="email"
            type="email"
            value={data.email}
            onChange={onChange!}
            error={errors.email}
            required
          />
          <ProfileFieldEdit
            label="Phone Number"
            name="phone"
            type="tel"
            value={data.phone || ''}
            onChange={onChange!}
            error={errors.phone}
            placeholder="+1 (555) 000-0000"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <ProfileFieldDisplay label="Email Address" value={data.email} />
          <ProfileFieldDisplay label="Phone Number" value={data.phone || 'Not provided'} />
        </div>
      )}
    </ProfileSectionCard>
  );
}
