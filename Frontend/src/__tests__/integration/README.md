# Integration Tests: Trainee Deletion UI

This directory contains comprehensive integration tests for the trainee deletion feature.

## Test File: DeleteConfirmationDialog.integration.test.tsx

**Status**: ✅ All 25 tests passing

**Purpose**: Tests the integration of the DeleteConfirmationDialog component with parent components through props and callbacks, following React Testing Library best practices.

### Test Coverage

#### Dialog Display and Content (5 tests)
- 6.6.1: Displays trainee name and deletion warning message
- 6.6.2: Displays soft-delete explanation text  
- 6.6.3: Displays active programs list when trainee has enrollments
- 6.6.4: Does not display programs section when trainee has no enrollments
- 6.6.5: Does not render when trainee prop is null

#### Button States and Loading (5 tests)
- 6.6.6: Delete button shows normal state with trash icon when not deleting
- 6.6.7: Delete button shows loading state with spinner during deletion
- 6.6.8: Delete button is disabled while deleting
- 6.6.9: Cancel button is disabled while deleting
- 6.6.10: Cancel button is enabled when not deleting

#### Callback Interactions (3 tests)
- 6.6.11: Calls onConfirm callback when delete button is clicked
- 6.6.12: Calls onCancel callback when cancel button is clicked
- 6.6.13: Does not call onCancel when dialog tries to close via backdrop while deleting

#### Dialog Visibility and Open State (3 tests)
- 6.6.14: Dialog is visible when open prop is true
- 6.6.15: Dialog is hidden when open prop is false
- 6.6.16: Dialog transitions from closed to open state

#### Error Scenario Handling (2 tests)
- 6.6.17: Dialog remains visible when parent controls open state during errors
- 6.6.18: Buttons remain interactive for retry scenarios

#### Multiple Trainee Scenarios (2 tests)
- 6.6.19: Correctly displays different trainee names when prop changes
- 6.6.20: Programs list updates when trainee prop changes

#### Accessibility and Styling (3 tests)
- 6.6.21: Delete button has destructive styling
- 6.6.22: Warning message has appropriate visual styling
- 6.6.23: Dialog header has alert icon

#### Props Validation (2 tests)
- 6.6.24: Handles missing trainings array gracefully
- 6.6.25: Handles empty trainings array

### Requirements Validation

These integration tests validate compliance with the following requirements:

- **Requirement 2**: Confirmation Dialog displays warning message, soft-delete explanation, and active programs
- **Requirement 3**: Dialog manages deletion state correctly (loading, disabled buttons)
- **Requirement 4**: Dialog callbacks work properly for user interactions
- **Requirement 8**: Error scenarios allow retry with proper state management
- **Requirement 10**: Dialog interaction and state management is predictable

### Running the Tests

```bash
# Run all integration tests
npm test -- integration/DeleteConfirmationDialog.integration.test.tsx --run

# Run with watch mode
npm test -- integration/DeleteConfirmationDialog.integration.test.tsx

# Run with coverage
npm test:coverage -- integration/DeleteConfirmationDialog.integration.test.tsx
```

### Test Philosophy

These tests follow React Testing Library best practices:

1. **User-Centric**: Tests focus on what users see and interact with, not implementation details
2. **Accessible**: Tests use accessible queries (getByRole, getByText) to ensure accessibility
3. **Realistic Interactions**: Uses userEvent for realistic user interactions
4. **Props-Based**: Tests props changes to verify component behavior matches specifications
5. **Component Integration**: Tests how DeleteConfirmationDialog integrates with parent components through callback props

### Mock Data

- **mockTrainee**: Trainee with 2 active training programs
- **mockTraineeNoPrograms**: Trainee with no active programs

This provides coverage for all conditional rendering paths in the component.

### Future Test Coverage

Additional integration tests for task 6.6 should include:

- **TraineesPage Integration**: Test DeleteConfirmationDialog + TraineesPage together
  - Full deletion flow from page to confirmation to list removal
  - Error scenarios with API failures  
  - Pagination adjustment after deletion

- **TraineeDetailsModal Integration**: Test DeleteConfirmationDialog + TraineeDetailsModal together
  - Modal and dialog interaction
  - Modal closes after successful deletion
  - Modal remains open after cancel

- **Full E2E Scenarios**: Test complete user workflows
  - Delete from table view
  - Delete from card view  
  - Delete from modal
  - Handle network errors and retries

## Test Statistics

- **Total Tests**: 25
- **Passing**: 25 ✅
- **Failing**: 0
- **Coverage**: Core component behavior, edge cases, error scenarios, prop validation
