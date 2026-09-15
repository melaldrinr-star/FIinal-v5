# StatusBadge Component

## Overview

The `StatusBadge` component is a reusable, color-coded badge system for displaying trainee status information throughout the application. It supports three main categories of status:

1. **Graduation Status** - Tracks completion state of training programs
2. **Employment Status** - Displays post-graduation employment outcomes  
3. **Skills Match** - Shows job-to-training alignment

## Requirements

- **Requirement 2.0** - Display status in card layout with color-coded badges
- **Requirement 5.0** - Display graduation status with distinct color-coded badges
- **Requirement 6.0** - Display employment status with distinct visual styling
- **Requirement 7.0** - Track job-skills alignment with color-coded badges

## Installation

The component is located at:
```typescript
import { 
  StatusBadge, 
  GraduationStatusBadge, 
  EmploymentStatusBadge, 
  SkillsMatchBadge 
} from '@/components/StatusBadge';
```

## Basic Usage

### Graduation Status Badge

```typescript
import { StatusBadge } from '@/components/StatusBadge';

// Default styles
<StatusBadge variant="graduated" type="graduation" />
<StatusBadge variant="pending" type="graduation" />
<StatusBadge variant="not_completed" type="graduation" />
<StatusBadge variant="suspended" type="graduation" />

// Or use the helper component
import { GraduationStatusBadge } from '@/components/StatusBadge';
<GraduationStatusBadge status="graduated" />
```

**Graduation Status Variants & Colors:**
- `pending` - Yellow badge (training in progress)
- `graduated` - Green badge (training completed successfully)
- `not_completed` - Red badge (did not complete training)
- `suspended` - Orange badge (training suspended)

### Employment Status Badge

```typescript
import { StatusBadge } from '@/components/StatusBadge';

// Default styles
<StatusBadge variant="employed" type="employment" />
<StatusBadge variant="unemployed" type="employment" />
<StatusBadge variant="self_employed" type="employment" />
<StatusBadge variant="pursuing_education" type="employment" />
<StatusBadge variant="deceased" type="employment" />

// Or use the helper component
import { EmploymentStatusBadge } from '@/components/StatusBadge';
<EmploymentStatusBadge status="employed" />
```

**Employment Status Variants & Colors:**
- `pending` - Gray badge (status not yet determined)
- `employed` - Green badge (employed full-time/part-time)
- `unemployed` - Gray badge (currently without employment)
- `self_employed` - Green badge (self-employed/freelance)
- `pursuing_education` - Yellow badge (continuing education)
- `deceased` - Slate badge (training alumnus deceased)

### Skills Match Badge

```typescript
import { StatusBadge } from '@/components/StatusBadge';

// Without percentage
<StatusBadge variant="exact_match" type="skills" />
<StatusBadge variant="partial_match" type="skills" />
<StatusBadge variant="no_match" type="skills" />
<StatusBadge variant="not_applicable" type="skills" />

// With percentage
<StatusBadge variant="exact_match" type="skills" percentage={95} />
<StatusBadge variant="partial_match" type="skills" percentage={65} />

// Or use the helper component
import { SkillsMatchBadge } from '@/components/StatusBadge';
<SkillsMatchBadge match="partial_match" percentage={65} />
```

**Skills Match Variants & Colors:**
- `exact_match` - Green badge with ✓ icon (job perfectly aligns with training)
- `partial_match` - Yellow badge with ◐ icon (job uses some acquired skills)
- `no_match` - Gray badge with ✗ icon (job unrelated to training)
- `not_applicable` - Blue badge with — icon (not applicable status)

## API Reference

### StatusBadge Props

```typescript
interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  type?: 'graduation' | 'employment' | 'skills';  // Default: 'employment'
  label?: string;                                    // Custom label (overrides default)
  percentage?: number | null;                        // For skills match display
  className?: string;                                // Additional CSS classes
  children?: React.ReactNode;                        // Custom content
}
```

### Type Definitions

```typescript
type GraduationStatusValue = 'pending' | 'graduated' | 'not_completed' | 'suspended';

type EmploymentStatusValue = 'pending' | 'employed' | 'unemployed' | 'self_employed' | 'pursuing_education' | 'deceased';

type SkillsMatchValue = 'exact_match' | 'partial_match' | 'no_match' | 'not_applicable';

type StatusBadgeVariant = GraduationStatusValue | EmploymentStatusValue | SkillsMatchValue;
```

## Examples

### In a Card Component

```typescript
import { 
  StatusBadge, 
  GraduationStatusBadge, 
  EmploymentStatusBadge, 
  SkillsMatchBadge 
} from '@/components/StatusBadge';

function TraineeStatusCard({ record }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{record.traineeName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Graduation:</span>
          <GraduationStatusBadge status={record.graduationStatus} />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Employment:</span>
          <EmploymentStatusBadge status={record.employmentStatus} />
        </div>
        
        {record.employmentStatus === 'employed' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Skills Match:</span>
            <SkillsMatchBadge 
              match={record.skillsMatch} 
              percentage={record.skillsMatchPercentage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### In a Table Row

```typescript
function TraineeStatusTableRow({ record }) {
  return (
    <TableRow>
      <TableCell>{record.traineeName}</TableCell>
      <TableCell>
        <GraduationStatusBadge status={record.graduationStatus} />
      </TableCell>
      <TableCell>
        <EmploymentStatusBadge status={record.employmentStatus} />
      </TableCell>
      <TableCell>{record.jobTitle}</TableCell>
      <TableCell>{record.employerName}</TableCell>
      <TableCell>
        {record.skillsMatch && (
          <SkillsMatchBadge 
            match={record.skillsMatch}
            percentage={record.skillsMatchPercentage}
          />
        )}
      </TableCell>
      <TableCell>{formatDate(record.recordedAt)}</TableCell>
    </TableRow>
  );
}
```

### With Custom Label

```typescript
// Override default labels
<StatusBadge 
  variant="employed" 
  type="employment"
  label="Gainfully Employed"
/>

// Custom content
<StatusBadge 
  variant="exact_match" 
  type="skills"
  percentage={95}
>
  <span className="font-bold">Perfect Fit (95%)</span>
</StatusBadge>
```

### With Custom Styling

```typescript
// Add additional CSS classes
<StatusBadge 
  variant="graduated" 
  type="graduation"
  className="text-lg font-bold"
/>

// Combine with Tailwind utilities
<div className="flex gap-2">
  <GraduationStatusBadge status="graduated" className="mr-2" />
  <EmploymentStatusBadge status="employed" className="mr-2" />
  <SkillsMatchBadge match="partial_match" percentage={65} />
</div>
```

## Color Scheme

### Light Mode

| Status | Background | Text | Usage |
|--------|-----------|------|-------|
| Green | bg-green-100 | text-green-700 | Positive outcomes (Graduated, Employed) |
| Yellow | bg-yellow-100 | text-yellow-700 | In-progress/Education (Pending, Pursuing) |
| Red | bg-red-100 | text-red-700 | Negative outcomes (Not Completed) |
| Orange | bg-orange-100 | text-orange-700 | Paused/Suspended |
| Gray | bg-gray-100 | text-gray-700 | Neutral (Unemployed, No Match) |
| Blue | bg-blue-100 | text-blue-700 | Not Applicable |
| Slate | bg-slate-100 | text-slate-700 | Deceased |

### Dark Mode

The component automatically includes dark mode variants:
- `dark:bg-green-900/40`
- `dark:text-green-300`
- And equivalent for all color variants

## Accessibility

The component includes:
- Semantic badge HTML with proper text contrast
- Support for screen readers through clear text labels
- Keyboard navigation support (badges are not interactive by default)
- ARIA-friendly structure

## Icons

Skills match variants include visual indicators:
- ✓ (Checkmark) - Exact Match
- ◐ (Semicircle) - Partial Match
- ✗ (X) - No Match
- — (Em Dash) - Not Applicable

Icons are sized proportionally with the badge text and include proper spacing.

## Testing

The component includes comprehensive test coverage:
- 36 unit tests covering all variants
- Tests for custom labels and content
- Tests for percentage display
- Tests for CSS class application
- Tests for dark mode compatibility

Run tests with:
```bash
npm test -- StatusBadge.test.tsx --run
```

## Helper Components

For convenience, three helper components are provided:

### GraduationStatusBadge

```typescript
<GraduationStatusBadge status="graduated" className="mr-2" />
```

Automatically sets `type="graduation"`, so you only need to pass the status.

### EmploymentStatusBadge

```typescript
<EmploymentStatusBadge status="employed" />
```

Automatically sets `type="employment"`, so you only need to pass the status.

### SkillsMatchBadge

```typescript
<SkillsMatchBadge match="partial_match" percentage={65} />
```

Automatically sets `type="skills"`, so you only need to pass the match and optional percentage.

## Performance Considerations

- Component is lightweight and renders quickly
- No external dependencies beyond existing ui/badge component
- Suitable for rendering multiple badges in tables with hundreds of rows
- Memoization recommended for table cells rendering badges

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential improvements:
- Tooltip with additional information on hover
- Clickable badges for filtering
- Animation transitions
- Custom icon support
- Badge grouping/clustering for multiple statuses
