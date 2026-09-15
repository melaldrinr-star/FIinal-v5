# Bug Condition Exploration Report
## Modal Preview All Enrollments

**Task ID**: 1. Write bug condition exploration test  
**Spec**: modal-preview-all-enrollments  
**Test File**: `Frontend/src/pages/__tests__/TraineesPage.modal-enrollments.test.tsx`  
**Status**: ✅ COMPLETED - Bug Condition Confirmed  
**Date**: 2024

---

## Executive Summary

The bug condition exploration test has been successfully written and executed on **UNFIXED CODE**. All 3 tests **FAILED AS EXPECTED**, confirming that the bug exists and surfaces the exact incomplete/stale enrollment data issues described in the specification.

The test failures provide concrete counterexamples that prove:
1. Modal displays incomplete enrollments (only shows 1 from trainee.program_id, ignores 2nd from API)
2. Modal displays stale data (shows deleted enrollment because trainee.program_id not cleared)
3. Modal doesn't call enrollmentService API (relies on cached trainee.program_id field)

---

## Bug Details

### Bug Condition (C)
The modal preview displays trainee data without fetching actual enrollments from the database. Instead, it constructs the `trainings` array from only `trainee.program_id` (a single cached field), causing the modal to show incomplete/stale enrollment data compared to the actual enrollments stored in the `enrollments` table.

### Root Cause
In `Frontend/src/pages/TraineesPage.tsx`, lines 86-96, the `openTraineeDetails` function constructs the trainings array as:
```typescript
trainings: trainee.program_id ? [{
  program: pMap[trainee.program_id] || trainee.program_id,
  status: trainee.status.charAt(0).toUpperCase() + trainee.status.slice(1),
  dateEnrolled: trainee.enrollment_date ? new Date(trainee.enrollment_date).toLocaleDateString() : '',
  dateCompleted: null,
}] : [],
```

This logic:
- Only creates 1 training object from `trainee.program_id`
- Never calls `enrollmentService.fetchEnrollments()` to get actual enrollments
- Results in modal showing incomplete/stale data instead of fresh API data

---

## Test Results

### Test 1: Multiple Enrollments Scenario ❌ FAILED (Expected)

**Test Name**: "should show all enrollments from API for trainee with multiple enrollments"

**Setup**:
- Trainee Alice Johnson has `program_id = 'prog-1'` (only one reference)
- API `enrollmentService.fetchEnrollments()` returns **2 enrollments**:
  1. Enrollment in "JavaScript 101" (prog-1)
  2. Enrollment in "React Fundamentals" (prog-2)

**Assertion**:
```typescript
expect(count).toBe(2);  // Modal should show 2 trainings
```

**Result**: ❌ FAILED
```
AssertionError: expected 1 to be 2
- Expected: 2
+ Received: 1
```

**Counterexample Found**:
- **Expected Behavior** (after fix): Modal displays both enrollments from API
- **Actual Behavior** (unfixed code): Modal displays only 1 training from trainee.program_id
- **Bug Proof**: Modal constructs trainings from cached `trainee.program_id` instead of fetching all enrollments

---

### Test 2: Stale Data Scenario ❌ FAILED (Expected)

**Test Name**: "should show no enrollments when enrollment was deleted but program_id is stale"

**Setup**:
- Trainee Bob Smith has stale `program_id = 'prog-3'` reference (enrollment was deleted from DB)
- API `enrollmentService.fetchEnrollments()` returns **empty array** (0 enrollments)

**Assertion**:
```typescript
expect(count).toBe(0);  // Modal should show 0 trainings (no enrollments)
```

**Result**: ❌ FAILED
```
AssertionError: expected 1 to be 0
- Expected: 0
+ Received: 1
```

**Counterexample Found**:
- **Expected Behavior** (after fix): Modal displays empty (0 trainings) - matches actual API state
- **Actual Behavior** (unfixed code): Modal displays 1 training from stale trainee.program_id
- **Bug Proof**: Stale trainee.program_id field is never cleared when enrollment deleted, so modal shows ghost enrollment

---

### Test 3: API Not Called Scenario ❌ FAILED (Expected)

**Test Name**: "should call enrollmentService when opening modal"

**Setup**:
- Trainee Charlie Brown with 1 enrollment
- Mock `enrollmentService.fetchEnrollments()` to track if it's called

**Assertion**:
```typescript
expect(vi.mocked(enrollmentService.fetchEnrollments)).toHaveBeenCalledWith('3');
// Modal should fetch enrollments from API when opening
```

**Result**: ❌ FAILED
```
AssertionError: expected "vi.fn()" to be called with arguments: [ '3' ]
Number of calls: 0
```

**Counterexample Found**:
- **Expected Behavior** (after fix): enrollmentService.fetchEnrollments() is called with trainee ID
- **Actual Behavior** (unfixed code): enrollmentService.fetchEnrollments() is NOT called (0 calls)
- **Bug Proof**: Modal opens without fetching from API - no API calls to refresh enrollment data

---

## Summary of Counterexamples

| Scenario | Expected | Actual (Unfixed) | Bug Demonstrated |
|----------|----------|------------------|------------------|
| Multiple Enrollments | 2 trainings shown | 1 training shown | Modal shows incomplete data from program_id |
| Stale Enrollment | 0 trainings shown | 1 training shown | Modal shows deleted enrollment (stale data) |
| API Invocation | API called once | API never called | Modal doesn't fetch fresh data |

---

## Expected Behavior Properties (Validated by Tests)

### Property 1: Bug Condition - Modal Shows Incomplete Enrollment Data
For any trainee that is clicked to open the modal preview, the **UNFIXED** TraineesPage component SHALL construct trainings array from `trainee.program_id` only (not from API), resulting in incomplete or stale enrollment information being displayed.

**Validation**: ✅ CONFIRMED
- Test 1 and Test 2 prove modal shows incomplete/stale data
- Multiple enrollments reduced to 1
- Deleted enrollments still shown

### Property 2: Root Cause - No API Call
For any modal opening action, the **UNFIXED** code SHALL NOT call `enrollmentService.fetchEnrollments()`, instead relying entirely on cached `trainee.program_id` field.

**Validation**: ✅ CONFIRMED  
- Test 3 proves enrollmentService.fetchEnrollments() is never called
- No fresh enrollment data retrieved from database

### Property 3: Stale Data Vulnerability
For any trainee with deleted enrollment but non-null `trainee.program_id` field, the **UNFIXED** modal SHALL display the stale/deleted enrollment indefinitely because `trainee.program_id` is never cleared or refreshed.

**Validation**: ✅ CONFIRMED
- Test 2 demonstrates this exact scenario
- Deleted enrollment appears in modal as 1 training
- API returns empty, but modal shows stale data

---

## Conclusion

All 3 bug condition exploration tests **FAILED on UNFIXED CODE**, which is the CORRECT and EXPECTED outcome for this exploration phase. The test failures provide concrete, reproducible counterexamples that:

1. **Confirm the bug exists** - Modal definitely shows incomplete/stale enrollment data
2. **Identify the root cause** - Code uses `trainee.program_id` instead of calling API
3. **Prove the impact** - Users see wrong/incomplete enrollment information in modal

These test cases will serve as the specification for the fix. Once the fix is implemented (modifying `openTraineeDetails()` to call `enrollmentService.fetchEnrollments()`), these same tests should **PASS**, confirming that:

1. Modal displays all enrollments from API (not just program_id)
2. Modal shows "No Enrollments" when enrollment deleted (fetches fresh data)
3. enrollmentService.fetchEnrollments() is called to fetch fresh data

---

## Next Steps

This bug exploration test file is ready for use in:
- **Task 3.2**: Re-run this test after fix implementation - should **PASS** when modal correctly fetches all enrollments
- **Task 3.3**: Verify preservation tests still pass - non-modal functionality unchanged
- **Task 4**: Final validation - all tests pass with fix applied

---

## Test Metrics

- **Test File**: `Frontend/src/pages/__tests__/TraineesPage.modal-enrollments.test.tsx`
- **Total Tests**: 3
- **Tests Passed**: 0 (expected on unfixed code)
- **Tests Failed**: 3 (CORRECT - proves bug exists)
- **Counterexamples Found**: 3 concrete scenarios proving the bug
- **Requirements Validated**: 1.1, 1.2, 1.3

---

## Counterexample Documentation

**Counterexample 1 - Multiple Enrollments**:
```
Input: Trainee {id: '1', program_id: 'prog-1', name: 'Alice Johnson'}
Enrollments API returns: [
  {program: 'JavaScript 101', status: 'active'},
  {program: 'React Fundamentals', status: 'active'}
]
Expected Modal Display: 2 trainings shown
Actual Modal Display: 1 training shown (only JavaScript 101)
Bug Proof: Modal uses program_id instead of API enrollments
```

**Counterexample 2 - Stale Data**:
```
Input: Trainee {id: '2', program_id: 'prog-3', name: 'Bob Smith'}
Enrollments API returns: [] (empty - enrollment was deleted)
Expected Modal Display: 0 trainings shown (No Enrollments)
Actual Modal Display: 1 training shown (stale prog-3 reference)
Bug Proof: Stale program_id causes deleted enrollment to appear
```

**Counterexample 3 - Missing API Call**:
```
Input: Modal opens for Trainee {id: '3'}
Expected: enrollmentService.fetchEnrollments('3') is called
Actual: enrollmentService.fetchEnrollments() NOT called (0 invocations)
Bug Proof: Modal constructs data without fetching from API
```

---

**Report Completed**: ✅ All bug conditions confirmed and documented  
**Test Status**: Ready for implementation phase
