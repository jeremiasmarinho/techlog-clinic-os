# 🗄️ Archiving Feature - Patient Management System

## Overview

Implemented a complete archiving system to keep the main patient list clean while preserving all
legal data. Patients can be moved to an "Archive" without permanent deletion.

---

## Backend Implementation

### Modified Files

#### 1. **src/controllers/LeadController.ts**

**Updated `index()` Method:**

- **Default Behavior**: Excludes patients with `status === 'archived'`
- **Archive View**: Supports `?show_archived=true` parameter to return ONLY archived patients
- **Kanban View**: Updated to exclude archived patients from Kanban board

```typescript
// Query Logic:
// Default: SELECT * FROM leads WHERE status != 'archived'
// Archive: SELECT * FROM leads WHERE status = 'archived'
// Kanban: Excludes archived + applies existing 24h finalized filter
```

**New Methods Added:**

1. **`archive()`** - PUT /api/leads/:id/archive
   - Sets `status = 'archived'`
   - Removes patient from active list
   - Preserves all data for legal compliance

2. **`unarchive()`** - PUT /api/leads/:id/unarchive
   - Sets `status = 'novo'` (restores to active)
   - Returns patient to main list

#### 2. **src/routes/lead.routes.ts**

**New Routes Added:**

```typescript
router.put('/:id/archive', LeadController.archive);
router.put('/:id/unarchive', LeadController.unarchive);
```

---

## Frontend Implementation

### Modified Files

#### **public/patients.html**

**New State Variable:**

```javascript
let viewingArchive = false; // Track if viewing archived patients
```

**Updated Functions:**

1. **`loadPatients()`**
   - Dynamically switches between active and archived views
   - Uses `?show_archived=true` parameter when viewing archive

2. **`toggleArchiveView()`**
   - Switches between "Lista de Pacientes 📋" and "Arquivo Morto 🗑️"
   - Updates button text: "Ver Arquivo Morto" ↔ "Voltar para Pacientes Ativos"
   - Reloads data with appropriate view

3. **`archivePatient(patientId)`**
   - Confirmation dialog: "Tem certeza que deseja arquivar?"
   - API call to PUT /api/leads/:id/archive
   - Removes from current view instantly
   - Success notification

4. **`unarchivePatient(patientId)`**
   - API call to PUT /api/leads/:id/unarchive
   - Removes from archive view
   - Returns patient to active list
   - Success notification

**UI Updates:**

1. **Table Header**
   - Added dynamic title: `<h2 id="tableTitle">`
   - Changes between "Lista de Pacientes 📋" and "Arquivo Morto 🗑️"

2. **Toggle Button**
   - Location: Below filter bar
   - Icon changes based on state
   - Text: "Ver Arquivo Morto" or "Voltar para Pacientes Ativos"

3. **Actions Column**
   - **Active View**: Shows Archive button (red, fa-archive icon)
   - **Archive View**: Shows Restore button (green, fa-undo icon)
   - Both actions have hover tooltips

---

## User Workflow

### Archive a Patient

1. Navigate to Patients page
2. Find patient in table
3. Click red **Archive** button (🗄️)
4. Confirm: "Tem certeza que deseja arquivar?"
5. Patient disappears from main list
6. Success notification appears

### View Archived Patients

1. Click "Ver Arquivo Morto" button below filters
2. Table title changes to "Arquivo Morto 🗑️"
3. Only archived patients are displayed
4. Button changes to "Voltar para Pacientes Ativos"

### Restore a Patient

1. While viewing archive
2. Click green **Restore** button (↶)
3. Patient removed from archive view
4. Patient returns to main active list with status "novo"
5. Success notification appears

---

## API Endpoints

### GET /api/leads

- **Default**: Returns active patients (excludes archived)
- **With `?view=kanban`**: Returns Kanban view (active + last 24h finalized, excludes archived)
- **With `?show_archived=true`**: Returns ONLY archived patients

### PUT /api/leads/:id/archive

- **Purpose**: Archive a patient
- **Body**: None required
- **Headers**: `x-access-token: eviva2026`
- **Response**: `{ message: 'Lead arquivado com sucesso!', changes: 1 }`

### PUT /api/leads/:id/unarchive

- **Purpose**: Restore an archived patient
- **Body**: None required
- **Headers**: `x-access-token: eviva2026`
- **Response**: `{ message: 'Lead restaurado com sucesso!', changes: 1 }`

---

## Data Integrity

### What Happens on Archive?

- `status` field changes to `'archived'`
- Patient excluded from:
  - Main patient list
  - Kanban board
  - Dashboard metrics
- All data preserved (name, phone, history, etc.)
- No data deletion occurs

### What Happens on Restore?

- `status` field changes to `'novo'`
- Patient returns to active list
- Visible in main view
- Can be interacted with normally

---

## Benefits

✅ **Clean Main List**: Keep active patient list focused and manageable ✅ **Legal Compliance**: No
data deletion, all records preserved ✅ **Easy Recovery**: One-click restore for archived patients
✅ **Clear Separation**: Dedicated view for archived records ✅ **No Data Loss**: Archive instead of
delete ✅ **User-Friendly**: Simple toggle between views

---

## Testing Checklist

- [ ] Archive a patient from main list
- [ ] Verify patient removed from main list
- [ ] Toggle to archive view
- [ ] Verify archived patient appears in archive
- [ ] Restore a patient from archive
- [ ] Verify patient returns to main list with status "novo"
- [ ] Check Kanban board excludes archived patients
- [ ] Verify filters work in both views
- [ ] Test search in archive view

---

## Future Enhancements

- [ ] Bulk archive/restore operations
- [ ] Auto-archive patients after X months of inactivity
- [ ] Archive reason/notes field
- [ ] Archive history log
- [ ] Export archived data to CSV

---

**Implementation Date**: January 27, 2026  
**Status**: ✅ Complete and Deployed
