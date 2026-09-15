import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Calendar,
  User,
  GraduationCap,
  ClipboardList,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  Dashboard,
  EventNote,
  Person,
  School,
  AssignmentTurnedIn,
  ChevronRight,
  Bolt,
} from '@mui/icons-material';

interface QuickActionItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  gradient: string;
  iconBg: string;
}

interface TraineeProfile {
  id: string;
  first_name: string;
  last_name: string;
  [key: string]: any;
}

const quickActions: QuickActionItem[] = [
  {
    label: 'Attendance',
    href: '/trainee/attendance',
    icon: <Calendar className="h-5 w-5" />,
    description: 'Check attendance',
    gradient: 'from-blue-500/10 via-blue-400/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  {
    label: 'Profile',
    href: '/trainee/profile',
    icon: <User className="h-5 w-5" />,
    description: 'Edit profile',
    gradient: 'from-purple-500/10 via-purple-400/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
  },
  {
    label: 'Programs',
    href: '/trainee/programs',
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Browse programs',
    gradient: 'from-emerald-500/10 via-emerald-400/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
  {
    label: 'Applications',
    href: '/trainee/applications',
    icon: <ClipboardList className="h-5 w-5" />,
    description: 'View applications',
    gradient: 'from-amber-500/10 via-amber-400/5 to-transparent',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
  },
];

interface QuickActionsCardProps {
  traineeProfile?: TraineeProfile | null;
}

export default function QuickActionsCard({ traineeProfile }: QuickActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Quick Access</CardTitle>
        <CardDescription>Jump to your most-used sections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} to={action.href}>
              <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  {React.cloneElement(action.icon as React.ReactElement, {
                    className: 'h-5 w-5 text-primary',
                  })}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-center">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
