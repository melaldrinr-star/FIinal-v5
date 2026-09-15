import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && (
        action.href ? (
          <Link to={action.href}>
            <Button variant="default">{action.label}</Button>
          </Link>
        ) : (
          <Button variant="default" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

interface DashboardErrorStateProps {
  onRetry?: () => void;
}

export function DashboardErrorState({ onRetry }: DashboardErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-2xl font-bold text-destructive">!</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        Unable to Load Dashboard
      </h3>
      <p className="mb-6 text-sm text-muted-foreground max-w-sm">
        An error occurred while loading your dashboard data. Please try again.
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
