# 📋 REQUIREMENT FILES HANDLING FLOW - Complete Architecture

## 🔄 COMPLETE END-TO-END FLOW

### 1️⃣ FRONTEND - USER SELECTS FILES
**Location:** RegistrationModal.tsx (Step 6) & TraineeFormPage.tsx (Step 7)

Files are selected via HTML input elements and stored in React state:

\\\	ypescript
const [requirementFiles, setRequirementFiles] = useState<Record<string, File | null>>({
  accomplished_learners_profile_form: null,
  birth_certificate_copy: null,
  marriage_certificate_copy: null,
  id_pictures: null,
  valid_id_copy: null,
  report_card_tor_copy: null,
  barangay_no_grade_certification: null,
});
\\\

When user selects a file:
- File object stored in state
- Green checkmark displayed with filename
- Can re-select to replace
- Marriage Certificate is optional


### 2️⃣ FRONTEND - VALIDATION
**Location:** TraineeFormPage.tsx (Case 7) & RegistrationModal.tsx (Step 6 validation)

Validation checks all 6 mandatory files are present:

\\\	ypescript
const requiredFiles = [
  'accomplished_learners_profile_form',
  'birth_certificate_copy',
  'id_pictures',
  'valid_id_copy',
  'report_card_tor_copy',
  'barangay_no_grade_certification',
];

const missingFiles = requiredFiles.filter(key => !requirementFiles[key]);

if (missingFiles.length > 0) {
  errors.email = \Please upload all required documents (\ missing)\;
}
\\\

Behavior:
- ✅ Cannot proceed without all 6 mandatory files
- ✅ Marriage Certificate is optional (only 6/7 required)
- ✅ Shows error preventing navigation


### 3️⃣ FRONTEND - FORM SUBMISSION

**Step A:** Trainee data is saved first
\\\	ypescript
const traineeData = { first_name, last_name, phone, ... };
const savedTrainee = await traineeService.createTrainee(traineeData);
// Returns: { id: "uuid-of-trainee", ... }
\\\

**Step B:** Requirement files are uploaded
\\\	ypescript
const uploadRequirementFiles = async (traineeId: string) => {
  const fileKeys = ['accomplished_learners_profile_form', ...];
  
  for (const key of fileKeys) {
    const file = requirementFiles[key];
    if (file) {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('requirement_type', key);
      
      await api.post(\/trainees/\/requirements\, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  }
};

await uploadRequirementFiles(savedTrainee.id);
\\\


### 4️⃣ FRONTEND - API REQUEST
**Location:** api.ts (Frontend service)

**Endpoint Called:**
\\\
POST /trainees/{traineeId}/requirements
\\\

**Request:**
- Headers: \Authorization: Bearer {token}\ (auto-added by interceptor)
- Body: FormData with file + requirement_type
- Token decrypted from sessionStorage automatically


### 5️⃣ BACKEND - RECEIVE FILE UPLOAD
**Endpoint:** POST /api/trainees/{id}/requirements
**Status:** ❌ NOT YET CREATED

Expected flow:
1. Extract trainee ID from URL
2. Verify JWT token → get tenantId
3. Verify trainee belongs to this tenant
4. Receive multipart FormData with file + requirement_type
5. Generate unique filename: \{requirement_type}_{timestamp}_{random}.pdf\
6. Store to disk: \/uploads/{tenantId}/documents/trainees/{traineeId}/{filename}\
7. Save metadata to database


### 6️⃣ BACKEND - FILE STORAGE
**Pattern (Tenant-Scoped):**
\\\
/uploads/{tenantId}/documents/trainees/{traineeId}/
├── accomplished_learners_profile_form_20240911_abc123.pdf
├── birth_certificate_copy_20240911_def456.pdf
├── id_pictures_20240911_ghi789.pdf
├── valid_id_copy_20240911_jkl012.pdf
├── report_card_tor_copy_20240911_mno345.pdf
└── barangay_no_grade_certification_20240911_pqr678.pdf
\\\

**Size Limits:**
- DEFAULT_MAX_DOCUMENT_SIZE: 10 MB
- Per-tenant limits configurable in CMS


### 7️⃣ DATABASE - STORE METADATA
**Table:** training_requirement_files (TO BE CREATED)

\\\sql
CREATE TABLE training_requirement_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  trainee_id UUID NOT NULL REFERENCES trainees(id),
  requirement_type VARCHAR(255) NOT NULL,
  file_path VARCHAR(1024) NOT NULL,
  file_name VARCHAR(255),
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(trainee_id, requirement_type, deleted_at),
  CONSTRAINT fk_tenant FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_trainee FOREIGN KEY(trainee_id) REFERENCES trainees(id),
  CONSTRAINT fk_uploaded_by FOREIGN KEY(uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_training_requirements_trainee ON training_requirement_files(trainee_id);
CREATE INDEX idx_training_requirements_tenant ON training_requirement_files(tenant_id);
\\\


### 8️⃣ FRONTEND - DISPLAY/RETRIEVE FILES
**Endpoint:** GET /api/trainees/{id}/requirements
**Status:** ❌ NOT YET CREATED

**Response Example:**
\\\json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "requirement_type": "birth_certificate_copy",
      "file_path": "/uploads/{tenantId}/documents/trainees/{traineeId}/birth_certificate_copy.pdf",
      "file_name": "NSO-Birth-Certificate.pdf",
      "uploaded_at": "2024-09-11T10:30:00Z",
      "uploaded_by": "staff-user-id"
    }
  ]
}
\\\


## ✅ IMPLEMENTED vs ❌ NOT IMPLEMENTED

### ✅ FRONTEND IMPLEMENTATION (COMPLETE)
- UI for selecting 7 requirement files in RegistrationModal (Step 6)
- UI for selecting 7 requirement files in TraineeFormPage (Step 7)
- State management (requirementFiles state)
- Validation requiring 6/7 mandatory files
- FormData submission to POST /trainees/{id}/requirements
- Error handling and user feedback
- Displays checkmarks for uploaded files

### ❌ BACKEND IMPLEMENTATION (NEEDED)

**1. Create Endpoint: POST /api/trainees/{id}/requirements**
   - Handle multipart file upload
   - Store to /uploads/{tenantId}/documents/trainees/{traineeId}/
   - Save metadata to database
   - Validate tenant_id ownership

**2. Create Database Table: training_requirement_files**
   - Schema with all columns
   - Indices for performance
   - Constraints for integrity

**3. Create Endpoint: GET /api/trainees/{id}/requirements**
   - Retrieve uploaded files for a trainee
   - Verify tenant_id access control
   - Return metadata with URLs

**4. Modify File Serving: GET /api/files/**
   - Support documents category for trainees
   - Ensure tenant isolation
   - Add access control

**5. Admin Features (Future)**
   - View all uploaded requirements for trainee
   - Delete/replace files
   - Download files or archive
   - Track upload history


## 🔐 SECURITY & ISOLATION

- **Tenant Isolation:** Each tenant's files stored separately
- **Token Verification:** JWT token required for all requests
- **Access Control:** Verify user belongs to trainee's tenant
- **File Validation:** Check MIME types and file signatures
- **Size Limits:** Enforce 10MB per document
- **Soft Deletes:** Maintain audit trail of deleted files
