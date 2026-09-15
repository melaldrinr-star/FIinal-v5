# RequirementDefinitionForm Component

A controlled form component for creating and editing requirement definitions with comprehensive validation.

## Features

- **Dual Mode**: Automatically handles both create and edit modes based on `requirementId` prop
- **Form Validation**: Uses Zod schema for robust client-side validation
- **Loading States**: Shows loading indicators during data fetch and submission
- **Error Handling**: Displays user-friendly error messages and toast notifications
- **Field-Level Errors**: Validates each field with specific error messages
- **JSON Validation**: Validates applicability rules as valid JSON
- **Accessibility**: Follows WAI-ARIA patterns with proper labels and descriptions
- **Responsive Design**: Built with Tailwind CSS, works on all screen sizes

## Component Signature

```tsx
interface RequirementDefinitionFormProps {
  requirementId?: string;  // Optional: ID for editing mode
  onSuccess?: () => void;   // Optional: Callback after successful save
}

export function RequirementDefinitionForm(
  props: RequirementDefinitionFormProps
): React.ReactElement
```

## Usage

### Create Mode

```tsx
import { RequirementDefinitionForm } from '@/components/RequirementDefinitionForm';

export function CreateRequirementPage() {
  return (
    <RequirementDefinitionForm
      onSuccess={() => {
        // Navigate back to requirements list
        navigate('/requirements');
      }}
    />
  );
}
```

### Edit Mode

```tsx
export function EditRequirementPage() {
  const { id } = useParams();

  return (
    <RequirementDefinitionForm
      requirementId={id}
      onSuccess={() => {
        navigate('/requirements');
      }}
    />
  );
}
```

## Form Fields

### Display Name (Required)
- **Type**: Text input
- **Validation**: 1-255 characters, trimmed
- **Example**: "Accomplished Learner's Profile Form"

### Description (Required)
- **Type**: Textarea
- **Validation**: 1-1000 characters, trimmed
- **Purpose**: Instructions for trainees about the requirement
- **Example**: "Submit a completed Accomplished Learner's Profile form..."

### Is Mandatory (Required)
- **Type**: Toggle switch
- **Default**: `true`
- **Purpose**: Whether all trainees must submit this requirement
- **Note**: If false, only trainees matching applicability rules must submit

### Is Active (Required)
- **Type**: Toggle switch
- **Default**: `true`
- **Purpose**: Whether this requirement is currently visible and enforced

### Applicability Rules (Optional, Create Mode Only)
- **Type**: JSON textarea
- **Validation**: Valid JSON or empty
- **Example**: `{"marital_status": "married"}`
- **Purpose**: Conditions for when a requirement applies to trainees
- **Note**: Not editable in edit mode (set during creation)

## Form States

### Loading States
- **Data Fetch Loading**: Shows spinner while loading requirement in edit mode
- **Submission Loading**: Shows spinner while creating/updating requirement

### Error States
- **Load Error**: Shows error message if requirement fetch fails
- **Not Found**: Shows error if requirement doesn't exist
- **Validation Error**: Shows field-specific error messages
- **Submission Error**: Shows error message if create/update fails

### Success States
- **Creation Success**: Shows toast notification, clears form, calls onSuccess callback
- **Update Success**: Shows toast notification, calls onSuccess callback

## Validation Rules

### Display Name
```
- Required
- Min: 1 character
- Max: 255 characters
- Auto-trimmed
```

### Description
```
- Required
- Min: 1 character
- Max: 1000 characters
- Auto-trimmed
```

### Applicability Rules
```
- Optional
- Must be valid JSON or empty string
- Auto-parsed to object or null
```

## Integration with Hooks

The component uses three main hooks:

### useRequirementDefinition (Edit Mode)
- Fetches existing requirement definition
- Provides loading and error states
- Auto-enables when `requirementId` is provided

### useCreateRequirementDefinition
- POST `/api/requirement-definitions`
- Called in create mode
- Invalidates requirement queries on success

### useUpdateRequirementDefinition
- PATCH `/api/requirement-definitions/{id}`
- Called in edit mode
- Only allows updating: displayName, description, isMandatory, isActive
- applicabilityRules cannot be changed after creation

## API Integration

### Create Request
```typescript
POST /api/requirement-definitions
{
  display_name: string,
  description: string,
  is_mandatory: boolean,
  is_active: boolean,
  applicability_rules?: object | null
}
```

### Update Request
```typescript
PATCH /api/requirement-definitions/{id}
{
  display_name?: string,
  description?: string,
  is_mandatory?: boolean,
  is_active?: boolean
}
```

## Toast Notifications

- **Success**: "Requirement created/updated successfully"
- **Error**: "Failed to save requirement" with error details
- **Validation**: Field-level error messages inline

## Accessibility Features

- Proper label associations with form fields
- Required field indicators (red asterisk)
- Descriptive helper text for each field
- Error messages linked to form fields
- Loading indicator with aria-label
- Keyboard navigable form controls

## Testing

The component includes comprehensive unit tests covering:
- Rendering in create and edit modes
- Form validation
- Error handling
- Loading states
- Success callbacks
- JSON validation for applicability rules

Run tests with:
```bash
npm run test -- RequirementDefinitionForm.test.tsx
```

## Example: Full Integration

```tsx
import { RequirementDefinitionForm } from '@/components/RequirementDefinitionForm';
import { useParams, useNavigate } from 'react-router-dom';

export function RequirementFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    // User will see success toast
    // Close form or navigate away
    setTimeout(() => {
      navigate('/requirements');
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <RequirementDefinitionForm
        requirementId={id}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

## Performance Considerations

- Form validation runs on blur (not on every keystroke)
- Submission state prevents double-submits
- Loading states prevent user confusion
- Query invalidation is targeted to specific queries
- Component memoization can be added if needed

## Dependencies

- `react-hook-form`: Form state management
- `zod`: Schema validation
- `@hookform/resolvers/zod`: Zod resolver for react-hook-form
- `react-hot-toast`: Toast notifications
- `@tanstack/react-query`: Server state management
- `lucide-react`: Icons
- `shadcn/ui`: UI components

## Related Components

- **RequirementDefinitionsList**: List all requirements with stats
- **RequirementDefinitionDetail**: View/edit requirement with submission list
- **RequirementSubmissionList**: Paginated submissions for a requirement
- **RequirementAnalyticsDashboard**: Analytics and charts

## Notes

- Applicability rules cannot be modified after creation (edit mode doesn't show this field)
- Only admins can create/update requirements (enforced by API)
- Form auto-resets after successful creation (create mode only)
- Edit mode preserves form data when switching requirements
- Unsaved changes are not protected (user must manually save)
