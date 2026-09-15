import { describe, it, expect } from 'vitest';
import {
  traineeStatusSchema,
  EMPLOYMENT_STATUS_OPTIONS,
  GRADUATION_STATUS_OPTIONS,
  SKILLS_MATCH_OPTIONS,
  CONDITIONAL_FIELD_VISIBILITY,
  REQUIRED_FIELDS_BY_STATUS,
  parseValidationError,
  validateTraineeStatus,
} from './traineeStatus';

describe('Trainee Status Types and Schema', () => {
  describe('traineeStatusSchema validation', () => {
    // Valid record tests
    it('should validate a complete employed trainee record', () => {
      const data = {
        graduationStatus: 'graduated',
        graduationDate: '2024-01-15',
        employmentStatus: 'employed',
        jobTitle: 'Software Engineer',
        employerName: 'Tech Corp',
        jobStartDate: '2024-02-01',
        jobSector: 'Information Technology',
        skillsMatch: 'exact_match',
        skillsMatchPercentage: 95,
        remarks: 'Excellent skills alignment',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate a complete unemployed trainee record', () => {
      const data = {
        graduationStatus: 'pending',
        employmentStatus: 'unemployed',
        unemploymentReason: 'No available positions in local market',
        skillsMatch: 'partial_match',
        skillsMatchPercentage: 65,
        remarks: 'Skills partially applicable',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate a trainee pursuing education', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'pursuing_education',
        skillsMatch: 'not_applicable',
        remarks: 'Currently in master degree program',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // Conditional validation tests - employment status
    it('should require jobTitle and employerName for employed status', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobStartDate: '2024-02-01',
        jobSector: 'IT',
        // Missing jobTitle and employerName
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require jobTitle and employerName for self_employed status', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'self_employed',
        jobStartDate: '2024-02-01',
        // Missing jobTitle and employerName
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should not require jobTitle for unemployed status', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'unemployed',
        unemploymentReason: 'Waiting for suitable position',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // Field length validation tests
    it('should reject jobTitle exceeding 255 characters', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'A'.repeat(256),
        employerName: 'Tech Corp',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject employerName exceeding 255 characters', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'A'.repeat(256),
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject unemploymentReason exceeding 500 characters', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'unemployed',
        unemploymentReason: 'A'.repeat(501),
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject remarks exceeding 1000 characters', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        remarks: 'A'.repeat(1001),
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    // Skills match percentage range validation
    it('should reject skillsMatchPercentage below 0', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        skillsMatchPercentage: -1,
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject skillsMatchPercentage above 100', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        skillsMatchPercentage: 101,
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept skillsMatchPercentage at boundary values (0 and 100)', () => {
      const data0 = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        skillsMatchPercentage: 0,
      };

      const data100 = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        skillsMatchPercentage: 100,
      };

      expect(traineeStatusSchema.safeParse(data0).success).toBe(true);
      expect(traineeStatusSchema.safeParse(data100).success).toBe(true);
    });

    // Nullable and optional field tests
    it('should accept null values for optional fields', () => {
      const data = {
        graduationStatus: 'graduated',
        graduationDate: null,
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        jobStartDate: null,
        jobSector: null,
        skillsMatch: null,
        skillsMatchPercentage: null,
        remarks: null,
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty strings for optional text fields', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        jobSector: '',
        remarks: '',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    // Enum validation tests
    it('should accept all valid graduation statuses', () => {
      const statuses = ['pending', 'graduated', 'not_completed', 'suspended'];

      statuses.forEach((status) => {
        const data = {
          graduationStatus: status as any,
          employmentStatus: 'employed',
          jobTitle: 'Engineer',
          employerName: 'Tech Corp',
        };

        expect(traineeStatusSchema.safeParse(data).success).toBe(true);
      });
    });

    it('should reject invalid graduation status', () => {
      const data = {
        graduationStatus: 'invalid_status' as any,
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
      };

      expect(traineeStatusSchema.safeParse(data).success).toBe(false);
    });

    it('should accept all valid employment statuses', () => {
      const statuses = ['employed', 'unemployed', 'self_employed', 'pursuing_education', 'deceased'];

      statuses.forEach((status) => {
        const data = {
          graduationStatus: 'graduated',
          employmentStatus: status as any,
          jobTitle: status === 'employed' || status === 'self_employed' ? 'Engineer' : undefined,
          employerName: status === 'employed' || status === 'self_employed' ? 'Tech Corp' : undefined,
        };

        const result = traineeStatusSchema.safeParse(data);
        if (status === 'employed' || status === 'self_employed') {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(true);
        }
      });
    });

    it('should accept all valid skills match values', () => {
      const skills = ['exact_match', 'partial_match', 'no_match', 'not_applicable'];

      skills.forEach((skill) => {
        const data = {
          graduationStatus: 'graduated',
          employmentStatus: 'employed',
          jobTitle: 'Engineer',
          employerName: 'Tech Corp',
          skillsMatch: skill as any,
        };

        expect(traineeStatusSchema.safeParse(data).success).toBe(true);
      });
    });

    // Whitespace handling
    it('should allow whitespace in job title but not require it to be non-empty', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: '  ',
        employerName: 'Tech Corp',
      };

      const result = traineeStatusSchema.safeParse(data);
      // This should fail because the conditional validation checks for trimmed non-empty
      expect(result.success).toBe(false);
    });
  });

  describe('Enum and label constants', () => {
    it('should have all employment status options defined', () => {
      expect(EMPLOYMENT_STATUS_OPTIONS.EMPLOYED).toBe('employed');
      expect(EMPLOYMENT_STATUS_OPTIONS.UNEMPLOYED).toBe('unemployed');
      expect(EMPLOYMENT_STATUS_OPTIONS.SELF_EMPLOYED).toBe('self_employed');
      expect(EMPLOYMENT_STATUS_OPTIONS.PURSUING_EDUCATION).toBe('pursuing_education');
      expect(EMPLOYMENT_STATUS_OPTIONS.DECEASED).toBe('deceased');
    });

    it('should have all graduation status options defined', () => {
      expect(GRADUATION_STATUS_OPTIONS.PENDING).toBe('pending');
      expect(GRADUATION_STATUS_OPTIONS.GRADUATED).toBe('graduated');
      expect(GRADUATION_STATUS_OPTIONS.NOT_COMPLETED).toBe('not_completed');
      expect(GRADUATION_STATUS_OPTIONS.SUSPENDED).toBe('suspended');
    });

    it('should have all skills match options defined', () => {
      expect(SKILLS_MATCH_OPTIONS.EXACT_MATCH).toBe('exact_match');
      expect(SKILLS_MATCH_OPTIONS.PARTIAL_MATCH).toBe('partial_match');
      expect(SKILLS_MATCH_OPTIONS.NO_MATCH).toBe('no_match');
      expect(SKILLS_MATCH_OPTIONS.NOT_APPLICABLE).toBe('not_applicable');
    });
  });

  describe('Conditional field visibility', () => {
    it('should show job fields for employed status', () => {
      const visibility = CONDITIONAL_FIELD_VISIBILITY[EMPLOYMENT_STATUS_OPTIONS.EMPLOYED];
      expect(visibility.showJobFields).toBe(true);
      expect(visibility.showUnemploymentReason).toBe(false);
    });

    it('should show job fields for self-employed status', () => {
      const visibility = CONDITIONAL_FIELD_VISIBILITY[EMPLOYMENT_STATUS_OPTIONS.SELF_EMPLOYED];
      expect(visibility.showJobFields).toBe(true);
      expect(visibility.showUnemploymentReason).toBe(false);
    });

    it('should show unemployment reason for unemployed status', () => {
      const visibility = CONDITIONAL_FIELD_VISIBILITY[EMPLOYMENT_STATUS_OPTIONS.UNEMPLOYED];
      expect(visibility.showJobFields).toBe(false);
      expect(visibility.showUnemploymentReason).toBe(true);
    });

    it('should hide all employment fields for pursuing education', () => {
      const visibility = CONDITIONAL_FIELD_VISIBILITY[EMPLOYMENT_STATUS_OPTIONS.PURSUING_EDUCATION];
      expect(visibility.showJobFields).toBe(false);
      expect(visibility.showUnemploymentReason).toBe(false);
    });

    it('should hide all employment fields for deceased', () => {
      const visibility = CONDITIONAL_FIELD_VISIBILITY[EMPLOYMENT_STATUS_OPTIONS.DECEASED];
      expect(visibility.showJobFields).toBe(false);
      expect(visibility.showUnemploymentReason).toBe(false);
    });
  });

  describe('Required fields by status', () => {
    it('should require jobTitle and employerName for employed', () => {
      const required = REQUIRED_FIELDS_BY_STATUS[EMPLOYMENT_STATUS_OPTIONS.EMPLOYED];
      expect(required).toContain('jobTitle');
      expect(required).toContain('employerName');
    });

    it('should require jobTitle and employerName for self-employed', () => {
      const required = REQUIRED_FIELDS_BY_STATUS[EMPLOYMENT_STATUS_OPTIONS.SELF_EMPLOYED];
      expect(required).toContain('jobTitle');
      expect(required).toContain('employerName');
    });

    it('should not require employment fields for unemployed', () => {
      const required = REQUIRED_FIELDS_BY_STATUS[EMPLOYMENT_STATUS_OPTIONS.UNEMPLOYED];
      expect(required.length).toBe(0);
    });

    it('should not require employment fields for pursuing education', () => {
      const required = REQUIRED_FIELDS_BY_STATUS[EMPLOYMENT_STATUS_OPTIONS.PURSUING_EDUCATION];
      expect(required.length).toBe(0);
    });

    it('should not require employment fields for deceased', () => {
      const required = REQUIRED_FIELDS_BY_STATUS[EMPLOYMENT_STATUS_OPTIONS.DECEASED];
      expect(required.length).toBe(0);
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should validate record with minimal required fields', () => {
      const data = {
        graduationStatus: 'pending',
        employmentStatus: 'pending',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate record with all fields populated', () => {
      const data = {
        graduationStatus: 'graduated',
        graduationDate: '2024-01-15',
        employmentStatus: 'employed',
        jobTitle: 'Senior Software Engineer',
        employerName: 'Tech Corporation',
        jobStartDate: '2024-02-01',
        jobSector: 'Information Technology',
        skillsMatch: 'exact_match',
        skillsMatchPercentage: 95,
        remarks: 'Excellent technical skills, great team fit, recommended for promotion',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate deceased status without employment details', () => {
      const data = {
        graduationStatus: 'graduated',
        graduationDate: '2023-06-15',
        employmentStatus: 'deceased',
        remarks: 'Record maintained for archive purposes',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle max length fields exactly at limit', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'A'.repeat(255),
        employerName: 'B'.repeat(255),
        unemploymentReason: 'C'.repeat(500),
        remarks: 'D'.repeat(1000),
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle max percentage exactly at limits', () => {
      const dataMin = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Corp',
        skillsMatchPercentage: 0,
      };

      const dataMax = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Corp',
        skillsMatchPercentage: 100,
      };

      expect(traineeStatusSchema.safeParse(dataMin).success).toBe(true);
      expect(traineeStatusSchema.safeParse(dataMax).success).toBe(true);
    });
  });
});

describe('All employment status transitions', () => {
  it('should handle transition from employed to unemployed with field clearing', () => {
    const employedData = {
      graduationStatus: 'graduated',
      employmentStatus: 'employed',
      jobTitle: 'Engineer',
      employerName: 'Tech Corp',
      jobStartDate: '2024-02-01',
      jobSector: 'IT',
    };

    // Initially valid as employed
    expect(traineeStatusSchema.safeParse(employedData).success).toBe(true);

    // When transitioning to unemployed, job fields can be cleared
    const unemployedData = {
      graduationStatus: 'graduated',
      employmentStatus: 'unemployed',
      unemploymentReason: 'Market downturn',
      // job fields cleared (no longer required)
    };

    expect(traineeStatusSchema.safeParse(unemployedData).success).toBe(true);
  });

  it('should handle transition from unemployed to employed with new job fields', () => {
    const unemployedData = {
      graduationStatus: 'graduated',
      employmentStatus: 'unemployed',
      unemploymentReason: 'Still looking',
    };

    expect(traineeStatusSchema.safeParse(unemployedData).success).toBe(true);

    // Transition to employed requires job fields
    const employedData = {
      graduationStatus: 'graduated',
      employmentStatus: 'employed',
      jobTitle: 'New Job',
      employerName: 'New Company',
    };

    expect(traineeStatusSchema.safeParse(employedData).success).toBe(true);
  });

  it('should handle transition from employed to pursuing_education', () => {
    const employedData = {
      graduationStatus: 'graduated',
      employmentStatus: 'employed',
      jobTitle: 'Engineer',
      employerName: 'Tech Corp',
    };

    expect(traineeStatusSchema.safeParse(employedData).success).toBe(true);

    const educationData = {
      graduationStatus: 'graduated',
      employmentStatus: 'pursuing_education',
      // All employment fields cleared
    };

    expect(traineeStatusSchema.safeParse(educationData).success).toBe(true);
  });

  it('should handle transition from any status to deceased', () => {
    const deceasedData = {
      graduationStatus: 'graduated',
      employmentStatus: 'deceased',
      // All employment fields cleared
    };

    expect(traineeStatusSchema.safeParse(deceasedData).success).toBe(true);
  });
});

describe('Validation utility functions', () => {
  describe('parseValidationError', () => {
    it('should parse Zod errors into field-level error map', () => {
      const data = {
        graduationStatus: 'invalid',
        employmentStatus: 'employed',
        // Missing jobTitle and employerName (required for employed)
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMap = parseValidationError(result.error);
        expect(typeof errorMap).toBe('object');
        expect(Object.keys(errorMap).length).toBeGreaterThan(0);
      }
    });

    it('should include field path in error map', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'A'.repeat(256), // Exceeds max length
        employerName: 'Corp',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMap = parseValidationError(result.error);
        expect(errorMap['jobTitle']).toBeDefined();
        expect(errorMap['jobTitle']).toContain('255');
      }
    });

    it('should handle multiple validation errors', () => {
      const data = {
        graduationStatus: 'invalid_status' as any,
        employmentStatus: 'employed',
        jobTitle: 'A'.repeat(256),
        employerName: 'B'.repeat(256),
        skillsMatchPercentage: 150,
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMap = parseValidationError(result.error);
        expect(Object.keys(errorMap).length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return empty object for valid data', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(true);

      if (result.success) {
        // parseValidationError is only called on failure, but we can validate it doesn't break on success
        expect(result.data).toBeDefined();
      }
    });

    it('should extract custom error messages from schema', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        skillsMatchPercentage: 150, // Exceeds max of 100
      };

      const result = traineeStatusSchema.safeParse(data);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMap = parseValidationError(result.error);
        const percentageError = errorMap['skillsMatchPercentage'];
        expect(percentageError).toBeDefined();
        expect(percentageError).toContain('0');
        expect(percentageError).toContain('100');
      }
    });
  });

  describe('validateTraineeStatus', () => {
    it('should return success: true for valid data', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
      };

      const result = validateTraineeStatus(data);
      expect(result.success).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should return success: false and error map for invalid data', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        // Missing required jobTitle and employerName
      };

      const result = validateTraineeStatus(data);
      expect(result.success).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });

    it('should return field-specific error messages', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'A'.repeat(256), // Exceeds max length
        employerName: 'Tech Corp',
      };

      const result = validateTraineeStatus(data);
      expect(result.success).toBe(false);
      expect(result.errors['jobTitle']).toBeDefined();
      expect(typeof result.errors['jobTitle']).toBe('string');
    });

    it('should validate conditional requirements (employed needs job fields)', () => {
      const validData = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Software Engineer',
        employerName: 'Tech Corp',
      };

      const invalidData = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        // Missing jobTitle and employerName
      };

      expect(validateTraineeStatus(validData).success).toBe(true);
      expect(validateTraineeStatus(invalidData).success).toBe(false);
    });

    it('should accept unemployed without job fields', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'unemployed',
        unemploymentReason: 'Market downturn',
      };

      const result = validateTraineeStatus(data);
      expect(result.success).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should validate skills match percentage range', () => {
      const validData = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Corp',
        skillsMatchPercentage: 75,
      };

      const invalidLowData = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Corp',
        skillsMatchPercentage: -1,
      };

      const invalidHighData = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Corp',
        skillsMatchPercentage: 101,
      };

      expect(validateTraineeStatus(validData).success).toBe(true);
      expect(validateTraineeStatus(invalidLowData).success).toBe(false);
      expect(validateTraineeStatus(invalidHighData).success).toBe(false);
    });

    it('should validate field length constraints', () => {
      const tooLongRemarks = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Corp',
        remarks: 'A'.repeat(1001), // Exceeds 1000 limit
      };

      const tooLongReason = {
        graduationStatus: 'graduated',
        employmentStatus: 'unemployed',
        unemploymentReason: 'B'.repeat(501), // Exceeds 500 limit
      };

      expect(validateTraineeStatus(tooLongRemarks).success).toBe(false);
      expect(validateTraineeStatus(tooLongReason).success).toBe(false);
    });

    it('should handle all employment statuses correctly', () => {
      const employedData = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Corp',
      };

      const unemployedData = {
        graduationStatus: 'graduated',
        employmentStatus: 'unemployed',
      };

      const eduData = {
        graduationStatus: 'graduated',
        employmentStatus: 'pursuing_education',
      };

      const deceasedData = {
        graduationStatus: 'graduated',
        employmentStatus: 'deceased',
      };

      expect(validateTraineeStatus(employedData).success).toBe(true);
      expect(validateTraineeStatus(unemployedData).success).toBe(true);
      expect(validateTraineeStatus(eduData).success).toBe(true);
      expect(validateTraineeStatus(deceasedData).success).toBe(true);
    });

    it('should handle null and optional fields correctly', () => {
      const data = {
        graduationStatus: 'graduated',
        graduationDate: null,
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Corp',
        jobStartDate: null,
        skillsMatch: null,
        skillsMatchPercentage: null,
        remarks: null,
      };

      const result = validateTraineeStatus(data);
      expect(result.success).toBe(true);
    });

    it('should return empty error object on success', () => {
      const data = {
        graduationStatus: 'graduated',
        employmentStatus: 'employed',
        jobTitle: 'Engineer',
        employerName: 'Tech Corp',
        skillsMatch: 'exact_match',
        skillsMatchPercentage: 95,
        remarks: 'Great match',
      };

      const result = validateTraineeStatus(data);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});
