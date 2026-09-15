import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ChevronRight, GraduationCap, Calendar, User, BookOpen } from 'lucide-react';

interface TraineeProfile {
  id: string;
  first_name: string;
  last_name: string;
  program?: {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    instructor?: string | null;
    duration_weeks?: number;
    max_trainees?: number;
  };
  [key: string]: any;
}

interface ActiveProgramsCardProps {
  traineeProfile?: TraineeProfile | null;
}

const calculateProgress = (startDate: string, endDate: string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const progress = (elapsed / total) * 100;
  return Math.min(100, Math.max(0, progress));
};

export default function ActiveProgramsCard({ traineeProfile }: ActiveProgramsCardProps) {
  if (!traineeProfile?.program) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Active Program</CardTitle>
          <CardDescription>Currently enrolled programs</CardDescription>
        </CardHeader>
        <CardContent className="py-12 sm:py-16 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-bold mb-2">No active programs yet</p>
          <p className="text-muted-foreground mb-6">Start your learning journey by enrolling in a program</p>
          <Link to="/trainee/programs">
            <Button className="gap-2">
              <BookOpen className="h-4 w-4" />
              Browse Programs
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const program = traineeProfile.program;
  const progressPercent = calculateProgress(program.start_date, program.end_date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Active Program</CardTitle>
        <CardDescription>Currently enrolled programs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Program Details */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">{program.name}</h3>
              {program.description && (
                <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
              )}
            </div>
            <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
              {program.status === 'active' ? 'In Progress' : program.status}
            </Badge>
          </div>

          {/* Program Info Grid */}
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{program.start_date} to {program.end_date}</span>
            </div>
            {program.instructor && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span>{program.instructor}</span>
              </div>
            )}
            {program.duration_weeks && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>{program.duration_weeks} weeks</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {program.status === 'active' && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Progress</span>
                <span className="text-primary font-bold">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} />
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Link to="/trainee/programs" className="block">
          <Button variant="outline" className="w-full gap-2">
            <span>View All Programs</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
