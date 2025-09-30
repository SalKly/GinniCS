# Company Form Management System - Setup Guide

## Overview

This system has been enhanced with a company-based form management interface. Users can now:

1. **Create New Forms**: Start fresh with a new company form
2. **Search Companies**: Find existing companies and manage their forms
3. **Edit Forms**: Modify existing company forms
4. **View Trees**: Visualize form data as interactive trees

## Database Setup

### 1. Run the Database Schema

Execute the SQL commands in `database_schema.sql` in your Supabase SQL editor:

```sql
-- This will create the companies and forms tables
-- with proper relationships and indexes
```

### 2. Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## New Features

### Company Form Entrance

- **Location**: `/` (Home page)
- **Features**:
  - Create new forms with company context
  - Search existing companies
  - View company status (form created or not)
  - Direct actions to edit forms or view trees

### Form Creation/Editing with Manual Save

- **New Form**: `/form/new` or `/form/new?company=CompanyName`
- **Edit Form**: `/form/edit/[companyName]`
- **Save Features**:
  - **Manual save only**: "Save Progress" button saves current form state without navigation
  - **Fixed save button**: Always accessible in top-right corner of form
  - **Real-time save status**: Visual indicators show saving progress and last saved time
  - **Progress persistence**: Form data persists through browser refresh and navigation
  - **Company creation**: Company is created when first save is performed

### Form Progress Management

- **Step-based navigation**: Form navigates between steps without URL changes
- **Outcome tracking**: Navigate between different outcome configurations
- **Manual save control**: Users decide when to save progress
- **Data merging**: New data is intelligently merged with existing form data
- **Error handling**: Save failures show clear error messages with retry options
- **Loading states**: Save operations show loading indicators

### Tree Visualization

- **Location**: `/tree/[id]`
- **Features**:
  - Works with both legacy blueprints and new forms
  - Enhanced error handling and loading states
  - Back navigation to home

## Database Structure

### Companies Table

```sql
- id: UUID (Primary Key)
- name: VARCHAR(255) UNIQUE (Company name)
- website: VARCHAR(255) (Optional website)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Forms Table

```sql
- id: UUID (Primary Key)
- company_id: UUID (Foreign Key to companies)
- form_data: JSONB (Complete form structure)
- tree_url: VARCHAR(500) (URL to tree visualization)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## API Services

### Company Services (`src/services/companies.ts`)

- `searchCompanies(searchTerm)`: Search companies by name
- `getCompanyByName(name)`: Get company by exact name
- `createOrUpdateCompanyForm(name, formData, website)`: Create/update company and form
- `getCompanyWithForm(companyId)`: Get company with associated form

### Legacy Support

The system maintains backward compatibility with existing blueprints while transitioning to the new company-based structure.

## Usage Flow with Manual Save

### New Form Creation

1. **User visits home page** → Sees company entrance interface
2. **Clicks "Create New Form"** → Redirected to `/form/new`
3. **Fills out form fields** → Can save anytime with "Save Progress" button
   - **Manual save**: Company created in database, form progress saved
   - **URL updates** to `/form/edit/[companyName]` after first save
4. **Navigation between steps** → Form navigates internally without URL changes
   - **Step 1**: Business Info
   - **Step 2**: Outcomes
   - **Step 3**: General Template
   - **Step 4**: Outcome Details
5. **Form completion** → Final save and redirect to tree view

### Editing Existing Form

1. **User searches for company** → Finds existing company in results
2. **Clicks "Edit Form"** → Redirected to `/form/edit/[companyName]`
3. **Form loads existing data** → Previous progress restored from database
4. **User navigates to any step** → Form handles navigation internally
5. **User makes changes** → Clicks "Save Progress" to save current state
6. **Progress preserved** → Data persists through browser refresh

### Manual Save Benefits

- **User control**: Users decide when to save, reducing unnecessary API calls
- **Form state management**: Current form step is maintained internally
- **Efficient saving**: Only saves when user explicitly requests it
- **Clear feedback**: Visual indicators show save status and timestamp
- **Error resilience**: Failed saves show clear error messages with retry options

## Migration Notes

- Existing blueprints will continue to work through the legacy system
- New forms are stored in the enhanced company-based structure
- Tree visualization supports both old and new data formats

## Development

To run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Key Components

- `CompanyFormEntrance`: Main entrance interface
- `BlueprintForm`: Enhanced form component with company context
- `BlueprintFlow`: Tree visualization (unchanged)
- Company services: Database interaction layer

This system provides a much more organized and user-friendly approach to managing forms with proper company association and database persistence.
