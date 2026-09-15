import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface ProfileSectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function ProfileSectionCard({
  title,
  description,
  icon: Icon,
  children,
  action,
}: ProfileSectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
