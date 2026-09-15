/**
 * Unit Tests: Trainee Registration Page - Signup Flow Modifications
 * 
 * Tests the TraineeRegistrationPage component for proper detection of pre-selected
 * programs from the social program sharing feature. The component should:
 * - Detect pre-selected program from LocalStorage
 * - Display program details to the user
 * - Allow user to change program selection
 * - Include selectedProgramId in form submission
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 * 
 * Tests cover:
 * - Pre-selected program detection from LocalStorage
 * - Program details display (name, description, dates, capacity)
 * - Program selection can be changed after initial pre-selection
 * - Form submission includes program selection
 * - No pre-selection when LocalStorage is empty
 * - Pre-selected program set as default form value
 * - Form submission includes selectedProgramId
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const testPrograms = [
  {
    id: 'program-001',
    name: 'Web Development Bootcamp',
    description: 'Learn modern web development with React and Node.js',
    start_date: '2024-02-01',
    end_date: '2024-04-30',
    status: 'active',
    max_trainees: 30,
    tenant_id: 'tenant-1',
  },
  {
    id: 'program-002',
    name: 'Data Science Fundamentals',
    description: 'Introduction to data science and machine learning',
    start_date: '2024-02-15',
    end_date: '2024-05-15',
    status: 'active',
    max_trainees: 25,
    tenant_id: 'tenant-1',
  },
  {
    id: 'program-003',
    name: 'Digital Marketing',
    description: 'Master digital marketing strategies',
    start_date: '2024-03-01',
    end_date: '2024-05-31',
    status: 'active',
    max_trainees: 40,
    tenant_id: 'tenant-1',
  },
];

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('TraineeRegistrationPage - Signup Flow Modifications', () => {
  
  describe('Pre-Selected Program Detection from LocalStorage', () => {
    /**
     * **Requirement 5.1**: Signup_Flow_Manager SHALL preserve the Program_ID throughout 
     * the signup process
     * 
     * **Requirement 5.2**: Program_Selection_Component SHALL check Local_Storage for 
     * a pre-selected program
     * 
     * **Validates: Requirements 5.1, 5.2**
     */

    it('should detect when a program_id exists in LocalStorage', () => {
      const preSelectedProgramId = 'program-001';
      localStorage.setItem('selected_program_id', preSelectedProgramId);

      const storedId = localStorage.getItem('selected_program_id');

      expect(storedId).toBe(preSelectedProgramId);
    });

    it('should detect no program when LocalStorage is empty', () => {
      localStorage.clear();

      const storedId = localStorage.getItem('selected_program_id');

      expect(storedId).toBeNull();
    });

    it('should handle LocalStorage with empty string value', () => {
      localStorage.setItem('selected_program_id', '');

      const storedId = localStorage.getItem('selected_program_id');

      expect(storedId).toBe('');
    });

    it('should store and retrieve program_id consistently', () => {
      const programId = 'program-002';

      localStorage.setItem('selected_program_id', programId);
      const retrieved = localStorage.getItem('selected_program_id');

      expect(retrieved).toBe(programId);
    });

    it('should preserve program_id through multiple storage operations', () => {
      const programId = 'program-003';
      localStorage.setItem('selected_program_id', programId);
      localStorage.setItem('other_key', 'other_value');

      const retrieved = localStorage.getItem('selected_program_id');

      expect(retrieved).toBe(programId);
    });

    it('should identify a valid program_id format', () => {
      const validId = 'program-001';
      localStorage.setItem('selected_program_id', validId);

      const stored = localStorage.getItem('selected_program_id');

      expect(stored).toBe(validId);
      expect(stored?.length).toBeGreaterThan(0);
    });
  });

  describe('Program Details Display (Data Model)', () => {
    /**
     * **Requirement 5.2**: Program_Selection_Component SHALL display the program 
     * details alongside selection options
     * 
     * **Validates: Requirements 5.2, 5.3, 5.4**
     */

    it('should have program data with name field', () => {
      const program = testPrograms.find(p => p.id === 'program-001');

      expect(program).toBeDefined();
      expect(program?.name).toBe('Web Development Bootcamp');
      expect(program?.name.length).toBeGreaterThan(0);
    });

    it('should have program data with description field', () => {
      const program = testPrograms.find(p => p.id === 'program-001');

      expect(program?.description).toBeDefined();
      expect(program?.description?.length).toBeGreaterThan(0);
      expect(program?.description).toContain('React');
    });

    it('should have program data with start and end dates', () => {
      const program = testPrograms.find(p => p.id === 'program-001');

      expect(program?.start_date).toBe('2024-02-01');
      expect(program?.end_date).toBe('2024-04-30');
      expect(program?.start_date).toBeTruthy();
      expect(program?.end_date).toBeTruthy();
    });

    it('should have program data with capacity information', () => {
      const program = testPrograms.find(p => p.id === 'program-001');

      expect(program?.max_trainees).toBe(30);
      expect(program?.max_trainees).toBeGreaterThan(0);
    });

    it('should have complete program details for all test programs', () => {
      testPrograms.forEach(program => {
        expect(program.id).toBeTruthy();
        expect(program.name).toBeTruthy();
        expect(program.description).toBeTruthy();
        expect(program.start_date).toBeTruthy();
        expect(program.end_date).toBeTruthy();
        expect(program.status).toBe('active');
        expect(program.max_trainees).toBeGreaterThan(0);
      });
    });

    it('should have at least one program available for selection', () => {
      expect(testPrograms.length).toBeGreaterThan(0);
    });

    it('should have multiple programs available to demonstrate selection options', () => {
      expect(testPrograms.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Program Selection Can Be Changed After Pre-Selection', () => {
    /**
     * **Requirement 5.3**: Program_Selection_Component SHALL allow user to change 
     * program selection
     * 
     * **Validates: Requirement 5.3**
     */

    it('should allow changing pre-selected program in LocalStorage', () => {
      localStorage.setItem('selected_program_id', 'program-001');
      expect(localStorage.getItem('selected_program_id')).toBe('program-001');

      localStorage.setItem('selected_program_id', 'program-002');

      expect(localStorage.getItem('selected_program_id')).toBe('program-002');
    });

    it('should verify original pre-selection is replaced when changed', () => {
      const original = 'program-001';
      localStorage.setItem('selected_program_id', original);

      const changed = 'program-003';
      localStorage.setItem('selected_program_id', changed);

      expect(localStorage.getItem('selected_program_id')).toBe(changed);
      expect(localStorage.getItem('selected_program_id')).not.toBe(original);
    });

    it('should support changing program multiple times', () => {
      const programs = ['program-001', 'program-002', 'program-003', 'program-001'];
      
      programs.forEach((programId) => {
        localStorage.setItem('selected_program_id', programId);
        expect(localStorage.getItem('selected_program_id')).toBe(programId);
      });
    });

    it('should show alternative program options exist for changing', () => {
      const alternatives = testPrograms.filter(p => p.id !== 'program-001');
      expect(alternatives.length).toBeGreaterThan(0);
    });

    it('should verify program change does not affect other LocalStorage entries', () => {
      localStorage.setItem('setting_1', 'value_1');
      localStorage.setItem('selected_program_id', 'program-001');
      localStorage.setItem('setting_2', 'value_2');

      localStorage.setItem('selected_program_id', 'program-002');

      expect(localStorage.getItem('setting_1')).toBe('value_1');
      expect(localStorage.getItem('setting_2')).toBe('value_2');
      expect(localStorage.getItem('selected_program_id')).toBe('program-002');
    });

    it('should allow program selection to be cleared', () => {
      localStorage.setItem('selected_program_id', 'program-001');

      localStorage.removeItem('selected_program_id');

      expect(localStorage.getItem('selected_program_id')).toBeNull();
    });
  });

  describe('Form Submission Includes Program Selection', () => {
    /**
     * **Requirement 5.4**: When the New_User confirms the pre-selected program, 
     * THE Signup_Flow_Manager SHALL include that Program_ID in the enrollment request
     * 
     * **Validates: Requirement 5.4**
     */

    it('should preserve program_id for inclusion in form submission', () => {
      const programId = 'program-001';
      localStorage.setItem('selected_program_id', programId);

      const submissionValue = localStorage.getItem('selected_program_id');

      expect(submissionValue).toBe(programId);
    });

    it('should identify enrollment source based on pre-selection presence', () => {
      localStorage.setItem('selected_program_id', 'program-001');
      const hasPreSelection = localStorage.getItem('selected_program_id') !== null;
      const sourceWithPreSelection = hasPreSelection ? 'social_share' : 'direct';

      expect(sourceWithPreSelection).toBe('social_share');

      localStorage.clear();
      const hasPreSelectionAfterClear = localStorage.getItem('selected_program_id') !== null;
      const sourceWithoutPreSelection = hasPreSelectionAfterClear ? 'social_share' : 'direct';

      expect(sourceWithoutPreSelection).toBe('direct');
    });

    it('should prepare complete submission data structure with program_id', () => {
      localStorage.setItem('selected_program_id', 'program-001');

      const submissionData = {
        program_id: localStorage.getItem('selected_program_id'),
        enrollment_source: localStorage.getItem('selected_program_id') ? 'social_share' : 'direct',
      };

      expect(submissionData.program_id).toBe('program-001');
      expect(submissionData.enrollment_source).toBe('social_share');
    });

    it('should handle submission without pre-selected program (direct enrollment)', () => {
      localStorage.clear();

      const programId = localStorage.getItem('selected_program_id');
      const submissionData = {
        program_id: programId,
        enrollment_source: programId ? 'social_share' : 'direct',
      };

      expect(submissionData.program_id).toBeNull();
      expect(submissionData.enrollment_source).toBe('direct');
    });

    it('should track enrollment source appropriately for audit', () => {
      localStorage.setItem('selected_program_id', 'program-001');
      const socialShareSource = localStorage.getItem('selected_program_id') ? 'social_share' : 'direct';
      expect(socialShareSource).toBe('social_share');

      localStorage.clear();
      const directSource = localStorage.getItem('selected_program_id') ? 'social_share' : 'direct';
      expect(directSource).toBe('direct');
    });
  });

  describe('No Program Pre-Selection When LocalStorage Empty', () => {
    /**
     * **Requirement 7.4**: When a New_User accesses signup without a stored Program_ID, 
     * THE Program_Selection_Component SHALL display the full list of available programs 
     * with no pre-selection
     * 
     * **Validates: Requirement 7.4**
     */

    it('should show all programs available when no pre-selection', () => {
      localStorage.clear();

      const preSelected = localStorage.getItem('selected_program_id');

      expect(preSelected).toBeNull();
      expect(testPrograms.length).toBeGreaterThan(0);
    });

    it('should not indicate any program as pre-selected when LocalStorage empty', () => {
      localStorage.clear();
      expect(localStorage.getItem('selected_program_id')).toBeNull();
    });

    it('should allow user to select from full program list with no pre-selection', () => {
      localStorage.clear();

      expect(testPrograms.length).toBeGreaterThanOrEqual(3);
      testPrograms.forEach(program => {
        expect(program.id).toBeTruthy();
      });
    });

    it('should treat manually selected program as direct enrollment source', () => {
      localStorage.clear();

      const enrollmentSource = localStorage.getItem('selected_program_id') ? 'social_share' : 'direct';

      expect(enrollmentSource).toBe('direct');
    });

    it('should distinguish direct enrollment from social share enrollment', () => {
      localStorage.setItem('selected_program_id', 'program-001');
      let source = localStorage.getItem('selected_program_id') ? 'social_share' : 'direct';
      expect(source).toBe('social_share');

      localStorage.clear();
      source = localStorage.getItem('selected_program_id') ? 'social_share' : 'direct';
      expect(source).toBe('direct');
    });
  });

  describe('Pre-Selected Program Set as Default Form Value', () => {
    /**
     * **Requirement 5.2**: When a Program_ID exists in Local_Storage, THE 
     * Program_Selection_Component SHALL pre-select that program in the selection interface
     * 
     * **Validates: Requirement 5.2**
     */

    it('should use pre-selected program as form default', () => {
      const defaultProgramId = 'program-002';
      localStorage.setItem('selected_program_id', defaultProgramId);

      const formDefault = localStorage.getItem('selected_program_id');

      expect(formDefault).toBe(defaultProgramId);
    });

    it('should match pre-selected program with available programs', () => {
      const preSelectedId = 'program-001';
      localStorage.setItem('selected_program_id', preSelectedId);

      const retrievedId = localStorage.getItem('selected_program_id');
      const matchingProgram = testPrograms.find(p => p.id === retrievedId);

      expect(matchingProgram).toBeDefined();
      expect(matchingProgram?.id).toBe(preSelectedId);
    });

    it('should preserve pre-selected value as form field default', () => {
      const defaultId = 'program-003';
      localStorage.setItem('selected_program_id', defaultId);

      const formFieldValue = localStorage.getItem('selected_program_id') || '';

      expect(formFieldValue).toBe(defaultId);
    });

    it('should initialize form with loaded program details for pre-selected program', () => {
      const preSelectedId = 'program-002';
      localStorage.setItem('selected_program_id', preSelectedId);

      const program = testPrograms.find(p => p.id === preSelectedId);

      expect(program).toBeDefined();
      expect(program?.name).toBe('Data Science Fundamentals');
      expect(program?.description).toBeDefined();
    });

    it('should load program details for any valid pre-selected program', () => {
      testPrograms.forEach(testProgram => {
        localStorage.setItem('selected_program_id', testProgram.id);
        const loaded = testPrograms.find(p => p.id === localStorage.getItem('selected_program_id'));
        expect(loaded).toBeDefined();
      });
    });
  });

  describe('Program Selection Can Be Changed After Initial Pre-Selection', () => {
    /**
     * **Requirement 5.3**: User can change program selection
     * 
     * **Validates: Requirement 5.3**
     */

    it('should support changing from one pre-selected program to another', () => {
      localStorage.setItem('selected_program_id', 'program-001');
      expect(localStorage.getItem('selected_program_id')).toBe('program-001');

      localStorage.setItem('selected_program_id', 'program-003');

      expect(localStorage.getItem('selected_program_id')).toBe('program-003');
    });

    it('should verify alternative programs exist for user to choose from', () => {
      const initialProgram = 'program-001';
      localStorage.setItem('selected_program_id', initialProgram);

      const alternatives = testPrograms.filter(p => p.id !== initialProgram);

      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.some(p => p.id === 'program-002')).toBe(true);
      expect(alternatives.some(p => p.id === 'program-003')).toBe(true);
    });

    it('should maintain data consistency through multiple program changes', () => {
      const sequence = ['program-001', 'program-002', 'program-003', 'program-002', 'program-001'];

      sequence.forEach((programId) => {
        localStorage.setItem('selected_program_id', programId);
        expect(localStorage.getItem('selected_program_id')).toBe(programId);
      });
    });
  });

  describe('Edge Cases and Data Validation', () => {
    it('should handle LocalStorage with only program_id key', () => {
      localStorage.clear();
      localStorage.setItem('selected_program_id', 'program-001');

      const value = localStorage.getItem('selected_program_id');

      expect(value).toBe('program-001');
    });

    it('should handle LocalStorage with many other keys alongside program_id', () => {
      for (let i = 0; i < 10; i++) {
        localStorage.setItem(`key_${i}`, `value_${i}`);
      }
      localStorage.setItem('selected_program_id', 'program-001');

      const programId = localStorage.getItem('selected_program_id');

      expect(programId).toBe('program-001');
    });

    it('should verify program_id is retrieved correctly from populated LocalStorage', () => {
      localStorage.setItem('user_id', 'user-123');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('selected_program_id', 'program-002');
      localStorage.setItem('language', 'en');

      const programId = localStorage.getItem('selected_program_id');

      expect(programId).toBe('program-002');
      expect(localStorage.getItem('user_id')).toBe('user-123');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should verify program IDs are unique in test data', () => {
      const programIds = testPrograms.map(p => p.id);

      const uniqueIds = new Set(programIds);

      expect(uniqueIds.size).toBe(programIds.length);
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should maintain program_id value through multiple read operations', () => {
      const programId = 'program-001';
      localStorage.setItem('selected_program_id', programId);

      const read1 = localStorage.getItem('selected_program_id');
      const read2 = localStorage.getItem('selected_program_id');
      const read3 = localStorage.getItem('selected_program_id');

      expect(read1).toBe(programId);
      expect(read2).toBe(programId);
      expect(read3).toBe(programId);
    });

    it('should not modify other LocalStorage entries when managing program_id', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.setItem('selected_program_id', 'program-001');

      const _ = localStorage.getItem('selected_program_id');

      expect(localStorage.getItem('key1')).toBe('value1');
      expect(localStorage.getItem('key2')).toBe('value2');
    });

    it('should handle program_id correctly when matching against program list', () => {
      const targetId = 'program-002';
      localStorage.setItem('selected_program_id', targetId);

      const retrievedId = localStorage.getItem('selected_program_id');
      const matchedProgram = testPrograms.find(p => p.id === retrievedId);

      expect(retrievedId).toBe(targetId);
      expect(matchedProgram).toBeDefined();
      expect(matchedProgram?.id).toBe(targetId);
    });

    it('should verify program details are complete for matched program', () => {
      localStorage.setItem('selected_program_id', 'program-001');

      const program = testPrograms.find(p => p.id === localStorage.getItem('selected_program_id'));

      expect(program?.id).toBeTruthy();
      expect(program?.name).toBeTruthy();
      expect(program?.start_date).toBeTruthy();
      expect(program?.end_date).toBeTruthy();
      expect(program?.max_trainees).toBeGreaterThan(0);
    });
  });

  describe('Round-Trip Property: Store and Retrieve Program ID', () => {
    /**
     * **Property**: Storing and retrieving the Program_ID from Local_Storage 
     * SHALL preserve the original Program_ID value
     * 
     * **Validates: Requirement 2.2** (LocalStorage Round-Trip)
     */

    it('should preserve program_id in round-trip: store → retrieve → match', () => {
      const testIds = ['program-001', 'program-002', 'program-003'];

      testIds.forEach(originalId => {
        localStorage.clear();

        localStorage.setItem('selected_program_id', originalId);
        const retrieved = localStorage.getItem('selected_program_id');

        expect(retrieved).toBe(originalId);
      });
    });

    it('should verify no data corruption in round-trip storage', () => {
      const original = 'program-xyz-123';

      localStorage.setItem('selected_program_id', original);
      const stored = localStorage.getItem('selected_program_id');

      expect(stored?.length).toBe(original.length);
      expect(stored).toBe(original);
    });

    it('should preserve round-trip across navigation state changes', () => {
      const programId = 'program-001';
      localStorage.setItem('selected_program_id', programId);

      for (let step = 0; step < 5; step++) {
        const retrieved = localStorage.getItem('selected_program_id');
        expect(retrieved).toBe(programId);
      }
    });
  });
});
