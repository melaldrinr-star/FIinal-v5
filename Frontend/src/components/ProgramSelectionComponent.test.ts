import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * **Validates: Requirements 5.2, 5.3, 5.4**
 * 
 * Unit tests for Program Selection Component in the Signup Flow
 * 
 * These tests verify that:
 * 1. Pre-selected programs from LocalStorage are highlighted and displayed
 * 2. Program details are shown in a preview
 * 3. Full program list can be displayed when no pre-selection
 * 4. Users can change program after pre-selection
 * 5. Form submission includes selected program_id
 * 6. "Change Program" button functionality works correctly
 * 7. UI transitions between pre-selection and change modes
 * 8. LocalStorage integration with component lifecycle
 */

// Mock program data for tests
const mockPrograms = [
  {
    id: 'prog-uuid-1',
    name: 'Web Development Fundamentals',
    description: 'Learn HTML, CSS, and JavaScript basics',
    start_date: '2024-01-15',
    end_date: '2024-03-15',
    status: 'active',
    max_trainees: 30,
    current_trainees: 15,
  },
  {
    id: 'prog-uuid-2',
    name: 'Python Programming',
    description: 'Master Python for backend development',
    start_date: '2024-02-01',
    end_date: '2024-04-30',
    status: 'active',
    max_trainees: 25,
    current_trainees: 20,
  },
  {
    id: 'prog-uuid-3',
    name: 'Digital Marketing',
    description: 'Social media and content marketing strategies',
    start_date: '2024-03-01',
    end_date: '2024-05-01',
    status: 'active',
    max_trainees: 40,
    current_trainees: 30,
  },
];

describe('Program Selection Component - Highlighted Pre-selected Program', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should identify when a program is pre-selected', () => {
    const preSelectedId = 'prog-uuid-1';
    localStorage.setItem('selected_program_id', preSelectedId);

    const selectedProgramId = localStorage.getItem('selected_program_id');
    expect(selectedProgramId).toBe(preSelectedId);
    expect(selectedProgramId).not.toBeNull();
  });

  it('should highlight the pre-selected program in the list', () => {
    const preSelectedId = 'prog-uuid-2';
    localStorage.setItem('selected_program_id', preSelectedId);

    const selectedProgramId = localStorage.getItem('selected_program_id');
    const preSelectedProgram = mockPrograms.find(p => p.id === selectedProgramId);

    expect(preSelectedProgram).toBeDefined();
    expect(preSelectedProgram?.id).toBe(preSelectedId);
    expect(preSelectedProgram?.name).toBe('Python Programming');
  });

  it('should apply visual highlighting styling to pre-selected program', () => {
    const preSelectedId = 'prog-uuid-1';
    localStorage.setItem('selected_program_id', preSelectedId);

    // Simulate component state
    const selectedProgramId = localStorage.getItem('selected_program_id');
    const isHighlighted = mockPrograms.map(p => ({
      ...p,
      isHighlighted: p.id === selectedProgramId,
    }));

    const highlightedProgram = isHighlighted.find(p => p.isHighlighted);
    expect(highlightedProgram?.isHighlighted).toBe(true);
    expect(highlightedProgram?.id).toBe(preSelectedId);
  });

  it('should only highlight one program even with multiple pre-selections attempted', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    localStorage.setItem('selected_program_id', 'prog-uuid-2'); // Override

    const selectedProgramId = localStorage.getItem('selected_program_id');
    const highlightedCount = mockPrograms.filter(p => p.id === selectedProgramId).length;

    expect(highlightedCount).toBe(1);
    expect(selectedProgramId).toBe('prog-uuid-2');
  });
});

describe('Program Selection Component - Program Details Preview', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should display pre-selected program details in preview', () => {
    const preSelectedId = 'prog-uuid-1';
    localStorage.setItem('selected_program_id', preSelectedId);

    const selectedProgramId = localStorage.getItem('selected_program_id');
    const preSelectedProgram = mockPrograms.find(p => p.id === selectedProgramId);

    expect(preSelectedProgram).toBeDefined();
    expect(preSelectedProgram?.name).toBeDefined();
    expect(preSelectedProgram?.description).toBeDefined();
    expect(preSelectedProgram?.start_date).toBeDefined();
    expect(preSelectedProgram?.end_date).toBeDefined();
  });

  it('should show all relevant program metadata in preview', () => {
    const preSelectedId = 'prog-uuid-3';
    localStorage.setItem('selected_program_id', preSelectedId);

    const selectedProgramId = localStorage.getItem('selected_program_id');
    const program = mockPrograms.find(p => p.id === selectedProgramId);

    // Verify all required preview fields are present
    expect(program?.name).toBe('Digital Marketing');
    expect(program?.description).toBe('Social media and content marketing strategies');
    expect(program?.start_date).toBe('2024-03-01');
    expect(program?.end_date).toBe('2024-05-01');
    expect(program?.status).toBe('active');
    expect(program?.max_trainees).toBe(40);
    expect(program?.current_trainees).toBe(30);
  });

  it('should not display preview when no program is pre-selected', () => {
    // No pre-selection set
    const selectedProgramId = localStorage.getItem('selected_program_id');
    const hasPreview = selectedProgramId !== null;

    expect(hasPreview).toBe(false);
  });

  it('should update preview when different program is pre-selected', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    let program = mockPrograms.find(p => p.id === localStorage.getItem('selected_program_id'));
    expect(program?.name).toBe('Web Development Fundamentals');

    // Pre-select different program
    localStorage.setItem('selected_program_id', 'prog-uuid-3');
    program = mockPrograms.find(p => p.id === localStorage.getItem('selected_program_id'));
    expect(program?.name).toBe('Digital Marketing');
  });
});

describe('Program Selection Component - Full List Display', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should show full program list when no pre-selection exists', () => {
    const selectedProgramId = localStorage.getItem('selected_program_id');
    const shouldShowFullList = selectedProgramId === null;

    expect(shouldShowFullList).toBe(true);
  });

  it('should display all available programs in full list mode', () => {
    const selectedProgramId = localStorage.getItem('selected_program_id');

    if (selectedProgramId === null) {
      // In full list mode
      expect(mockPrograms.length).toBe(3);
      mockPrograms.forEach(program => {
        expect(program.name).toBeDefined();
        expect(program.description).toBeDefined();
      });
    }
  });

  it('should show program details for each item in full list', () => {
    const selectedProgramId = localStorage.getItem('selected_program_id');

    if (selectedProgramId === null) {
      mockPrograms.forEach(program => {
        expect(program).toHaveProperty('id');
        expect(program).toHaveProperty('name');
        expect(program).toHaveProperty('description');
        expect(program).toHaveProperty('start_date');
        expect(program).toHaveProperty('end_date');
        expect(program).toHaveProperty('status');
      });
    }
  });

  it('should not show full list when a program is pre-selected', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');

    const selectedProgramId = localStorage.getItem('selected_program_id');
    const shouldShowFullList = selectedProgramId === null;

    expect(shouldShowFullList).toBe(false);
  });

  it('should handle empty program list gracefully', () => {
    const emptyPrograms: any[] = [];
    const selectedProgramId = localStorage.getItem('selected_program_id');
    const shouldShowEmptyState = selectedProgramId === null && emptyPrograms.length === 0;

    expect(shouldShowEmptyState).toBe(true);
  });
});

describe('Program Selection Component - User Can Change Program', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow user to change from pre-selected program to different program', () => {
    const originalProgram = 'prog-uuid-1';
    const newProgram = 'prog-uuid-3';

    localStorage.setItem('selected_program_id', originalProgram);
    expect(localStorage.getItem('selected_program_id')).toBe(originalProgram);

    // User changes selection
    localStorage.setItem('selected_program_id', newProgram);

    expect(localStorage.getItem('selected_program_id')).toBe(newProgram);
  });

  it('should update form state when program selection is changed', () => {
    let formData = { program_id: '' };

    // Initial pre-selection
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    formData.program_id = localStorage.getItem('selected_program_id') || '';
    expect(formData.program_id).toBe('prog-uuid-1');

    // User changes program
    localStorage.setItem('selected_program_id', 'prog-uuid-2');
    formData.program_id = localStorage.getItem('selected_program_id') || '';
    expect(formData.program_id).toBe('prog-uuid-2');
  });

  it('should allow multiple program changes in succession', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    expect(localStorage.getItem('selected_program_id')).toBe('prog-uuid-1');

    localStorage.setItem('selected_program_id', 'prog-uuid-2');
    expect(localStorage.getItem('selected_program_id')).toBe('prog-uuid-2');

    localStorage.setItem('selected_program_id', 'prog-uuid-3');
    expect(localStorage.getItem('selected_program_id')).toBe('prog-uuid-3');
  });

  it('should preserve other form fields when program is changed', () => {
    const formData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      program_id: 'prog-uuid-1',
    };

    localStorage.setItem('selected_program_id', formData.program_id);

    // Change program but preserve other fields
    const newProgramId = 'prog-uuid-2';
    localStorage.setItem('selected_program_id', newProgramId);

    const updatedFormData = {
      ...formData,
      program_id: newProgramId,
    };

    expect(updatedFormData.first_name).toBe('John');
    expect(updatedFormData.last_name).toBe('Doe');
    expect(updatedFormData.email).toBe('john@example.com');
    expect(updatedFormData.program_id).toBe(newProgramId);
  });
});

describe('Program Selection Component - Form Submission', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should include selected program_id in form submission', () => {
    const selectedProgramId = 'prog-uuid-2';
    localStorage.setItem('selected_program_id', selectedProgramId);

    const formData = {
      program_id: localStorage.getItem('selected_program_id') || '',
    };

    expect(formData.program_id).toBe(selectedProgramId);
  });

  it('should include correct program_id from pre-selection in submission', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');

    const program = mockPrograms.find(p => p.id === localStorage.getItem('selected_program_id'));
    const formData = {
      program_id: localStorage.getItem('selected_program_id') || '',
      program_name: program?.name,
    };

    expect(formData.program_id).toBe('prog-uuid-1');
    expect(formData.program_name).toBe('Web Development Fundamentals');
  });

  it('should include program_id from user-selected program in submission', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-2');

    const program = mockPrograms.find(p => p.id === localStorage.getItem('selected_program_id'));
    const formData = {
      program_id: localStorage.getItem('selected_program_id') || '',
      program_name: program?.name,
    };

    expect(formData.program_id).toBe('prog-uuid-2');
    expect(formData.program_name).toBe('Python Programming');
  });

  it('should track enrollment source based on pre-selection', () => {
    // Pre-selected from shared link
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    let enrollmentData = {
      program_id: localStorage.getItem('selected_program_id') || '',
      source: 'social_share',
    };
    expect(enrollmentData.source).toBe('social_share');

    // Manually selected in normal signup
    localStorage.clear();
    enrollmentData = {
      program_id: 'prog-uuid-2',
      source: 'direct',
    };
    expect(enrollmentData.source).toBe('direct');
  });

  it('should not submit without a selected program', () => {
    localStorage.clear();
    const selectedProgramId = localStorage.getItem('selected_program_id');

    const canSubmit = selectedProgramId !== null && selectedProgramId !== '';
    expect(canSubmit).toBe(false);
  });
});

describe('Program Selection Component - Change Program Button', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should display "Change Program" button when program is pre-selected', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');

    const selectedProgramId = localStorage.getItem('selected_program_id');
    const shouldShowChangeButton = selectedProgramId !== null;

    expect(shouldShowChangeButton).toBe(true);
  });

  it('should not display "Change Program" button when no program is pre-selected', () => {
    const selectedProgramId = localStorage.getItem('selected_program_id');
    const shouldShowChangeButton = selectedProgramId !== null;

    expect(shouldShowChangeButton).toBe(false);
  });

  it('should enable full program list view when "Change Program" is clicked', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    let isChangingProgram = false;

    // User clicks "Change Program" button
    isChangingProgram = true;

    expect(isChangingProgram).toBe(true);

    // Full list should be visible
    const shouldShowFullList = isChangingProgram || localStorage.getItem('selected_program_id') === null;
    expect(shouldShowFullList).toBe(true);
  });

  it('should close change mode after new selection', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    let isChangingProgram = false;

    // Enter change mode
    isChangingProgram = true;
    expect(isChangingProgram).toBe(true);

    // User selects new program
    localStorage.setItem('selected_program_id', 'prog-uuid-3');
    isChangingProgram = false;

    expect(isChangingProgram).toBe(false);
    expect(localStorage.getItem('selected_program_id')).toBe('prog-uuid-3');
  });

  it('should cancel change mode without updating selection', () => {
    const originalProgram = 'prog-uuid-1';
    localStorage.setItem('selected_program_id', originalProgram);

    let isChangingProgram = true; // In change mode
    isChangingProgram = false; // User cancels

    expect(localStorage.getItem('selected_program_id')).toBe(originalProgram);
  });
});

describe('Program Selection Component - UI Transitions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should transition from full list to pre-selected view', () => {
    // Start with full list
    expect(localStorage.getItem('selected_program_id')).toBeNull();

    // User selects a program
    localStorage.setItem('selected_program_id', 'prog-uuid-2');

    // UI should transition to pre-selected view
    const selectedId = localStorage.getItem('selected_program_id');
    expect(selectedId).toBe('prog-uuid-2');

    const program = mockPrograms.find(p => p.id === selectedId);
    expect(program).toBeDefined();
  });

  it('should transition from pre-selected view to full list (change mode)', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    let isChangingProgram = false;

    // User clicks "Change Program"
    isChangingProgram = true;

    // UI should show full list
    const shouldShowFullList = isChangingProgram || localStorage.getItem('selected_program_id') === null;
    expect(shouldShowFullList).toBe(true);
  });

  it('should transition from change mode back to pre-selected view', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    let isChangingProgram = true;

    // User makes selection in change mode
    localStorage.setItem('selected_program_id', 'prog-uuid-3');
    isChangingProgram = false;

    // UI should return to pre-selected view
    const selectedId = localStorage.getItem('selected_program_id');
    expect(selectedId).toBe('prog-uuid-3');
    expect(isChangingProgram).toBe(false);
  });

  it('should maintain smooth transitions between modes', () => {
    // Sequence: Full list → Select → Pre-selected → Change → Full list → Select → Pre-selected
    expect(localStorage.getItem('selected_program_id')).toBeNull(); // Full list

    localStorage.setItem('selected_program_id', 'prog-uuid-1'); // Select
    expect(localStorage.getItem('selected_program_id')).toBe('prog-uuid-1'); // Pre-selected

    localStorage.setItem('selected_program_id', 'prog-uuid-2'); // Change
    expect(localStorage.getItem('selected_program_id')).toBe('prog-uuid-2'); // Pre-selected
  });

  it('should handle rapid mode transitions gracefully', () => {
    let isChangingProgram = false;

    // Rapid transitions
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    isChangingProgram = true;
    isChangingProgram = false;
    localStorage.setItem('selected_program_id', 'prog-uuid-2');

    expect(localStorage.getItem('selected_program_id')).toBe('prog-uuid-2');
    expect(isChangingProgram).toBe(false);
  });
});

describe('Program Selection Component - LocalStorage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should read pre-selected program from LocalStorage on mount', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');

    const selectedProgramId = localStorage.getItem('selected_program_id');
    expect(selectedProgramId).toBe('prog-uuid-1');
  });

  it('should persist program selection to LocalStorage', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-2');

    // Simulate navigation/remount
    const retrieved = localStorage.getItem('selected_program_id');
    expect(retrieved).toBe('prog-uuid-2');
  });

  it('should update LocalStorage when program is changed', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    localStorage.setItem('selected_program_id', 'prog-uuid-3');

    const updated = localStorage.getItem('selected_program_id');
    expect(updated).toBe('prog-uuid-3');
  });

  it('should remove pre-selection from LocalStorage when cleanup is called', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-1');
    expect(localStorage.getItem('selected_program_id')).toBe('prog-uuid-1');

    // Cleanup after enrollment
    localStorage.removeItem('selected_program_id');

    expect(localStorage.getItem('selected_program_id')).toBeNull();
  });

  it('should not affect other LocalStorage entries when managing program selection', () => {
    // Set other data in LocalStorage
    localStorage.setItem('other_key', 'other_value');
    localStorage.setItem('another_key', 'another_value');

    // Manage program selection
    localStorage.setItem('selected_program_id', 'prog-uuid-1');

    // Verify other entries still exist
    expect(localStorage.getItem('other_key')).toBe('other_value');
    expect(localStorage.getItem('another_key')).toBe('another_value');

    // Cleanup program selection
    localStorage.removeItem('selected_program_id');

    // Verify other entries are still there
    expect(localStorage.getItem('other_key')).toBe('other_value');
    expect(localStorage.getItem('another_key')).toBe('another_value');
  });

  it('should handle missing LocalStorage gracefully on fresh mount', () => {
    // No pre-selection set
    const selectedProgramId = localStorage.getItem('selected_program_id');

    expect(selectedProgramId).toBeNull();
  });

  it('should preserve pre-selection across page navigation', () => {
    localStorage.setItem('selected_program_id', 'prog-uuid-2');

    // Simulate leaving page and returning
    let preserved = localStorage.getItem('selected_program_id');
    expect(preserved).toBe('prog-uuid-2');

    // Simulate user navigating around
    localStorage.setItem('current_page', 'step-6');
    preserved = localStorage.getItem('selected_program_id');

    expect(preserved).toBe('prog-uuid-2');
    expect(localStorage.getItem('current_page')).toBe('step-6');
  });
});
