# SHPH - Subdistrict Health Promotion Hospital

A comprehensive healthcare management system for Village Health Volunteers (VHVs), doctors, patients, and caregivers.

## Features

### Authentication & Role-Based Access Control
- Secure login system with role-based access
- Four distinct user roles: Doctor, VHV, Patient, Caregiver
- Middleware-based route protection
- Automatic role-based dashboard redirection

### VHV Multi-Step Visit Form
- 4-stage form: Symptoms, Vitals, Notes, Review
- Real-time validation for vital signs:
  - Blood Pressure: ###/## format
  - Heart Rate: 40-220 BPM
  - Temperature: 30.0-43.0°C
- Minimum 5 characters for symptom descriptions
- Draft saving and resuming functionality
- Offline submission with automatic sync

### Doctor Review Dashboard
- Pending queue with filtering and sorting
- Individual record review with patient history
- Approve/reject functionality with notes
- Urgency indicators based on record age
- Comprehensive patient information display

### Patient & Caregiver Portals
- Read-only access to visit records
- Status tracking with clear indicators
- Doctor notes and feedback display
- Search and filter capabilities
- Expandable record details

### Offline Functionality
- Automatic offline detection
- Local data queuing when offline
- Background sync when connection restored
- Visual indicators for sync status
- Service worker for offline caching

### Quality of Life Features
- Toast notifications for user feedback
- Status chips with icons
- Loading spinners and empty states
- Mobile-friendly responsive design
- Real-time sync status indicators

## Technology Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui with Tailwind CSS
- **Offline Support**: Service Worker with background sync
- **State Management**: React Context with useReducer

## Database Schema

### Users Table
- Role-based user management (doctor, vhv, patient, caregiver)
- Profile information and contact details

### Patients Table
- Patient records with assigned VHVs
- Demographics and emergency contacts

### Visit Records Table
- Comprehensive visit data with validation
- Status tracking (draft, pending, approved, rejected)
- Doctor review notes and timestamps

### Offline Queue Table
- Local data storage for offline submissions
- Automatic sync when connection restored

## Security Features

- Row Level Security (RLS) policies
- Server-side role validation
- Secure API endpoints
- Protected routes with middleware
- Data encryption in transit and at rest

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase project and configure environment variables
4. Run database migrations in order:
   - Execute `scripts/001_create_tables.sql`
   - Execute `scripts/002_seed_data.sql`
   - Execute `scripts/003_create_auth_trigger.sql`
   - Execute `scripts/004_create_demo_auth_accounts.sql`
   - Execute `scripts/005_update_user_data.sql`
5. Start development server: `npm run dev`

## Authentication Setup

### Demo Account Fix
If you encounter "Invalid login credentials" errors with demo accounts, ensure you've run all database scripts in the correct order. The authentication system requires both the public user records and the corresponding Supabase auth accounts to be properly synchronized.

### Troubleshooting Authentication Issues

1. **Invalid Login Credentials**: 
   - Verify all database scripts have been executed in order
   - Check that `scripts/004_create_demo_auth_accounts.sql` completed successfully
   - Ensure Supabase project has proper permissions for auth table access

2. **Role-Based Access Issues**:
   - Confirm Row Level Security policies are enabled
   - Verify user roles are correctly set in both auth metadata and public.users table
   - Check middleware configuration for route protection

3. **Database Connection Issues**:
   - Verify Supabase environment variables are correctly set
   - Ensure database URL and service role key are valid
   - Check network connectivity to Supabase instance

### Manual Account Creation
If demo accounts still don't work, you can create accounts manually through the Supabase dashboard:
1. Go to Authentication > Users in your Supabase dashboard
2. Create new users with the demo email addresses
3. Set passwords to "password123"
4. Add user metadata: `{"full_name": "User Name", "role": "user_role"}`

## Deployment

The application is designed for deployment on Vercel with Supabase backend:

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD pipeline

## Testing Checklist

### Authentication
- [ ] Login with different user roles
- [ ] Role-based access control
- [ ] Logout functionality
- [ ] Unauthorized access protection

### VHV Functionality
- [ ] Multi-step form navigation
- [ ] Form validation (symptoms, vitals)
- [ ] Draft saving and loading
- [ ] Form submission
- [ ] Offline form submission

### Doctor Functionality
- [ ] Pending queue display
- [ ] Record filtering and sorting
- [ ] Individual record review
- [ ] Patient history viewing
- [ ] Approve/reject with notes

### Patient/Caregiver Functionality
- [ ] View own/assigned patient records
- [ ] Record status display
- [ ] Doctor notes visibility
- [ ] Search and filter records

### Offline Functionality
- [ ] Offline detection
- [ ] Local data queuing
- [ ] Automatic sync on reconnection
- [ ] Sync status indicators

### Quality of Life
- [ ] Toast notifications
- [ ] Loading states
- [ ] Empty states
- [ ] Mobile responsiveness
- [ ] Status indicators

## Demo Accounts

**Important**: Run all database scripts before testing these accounts.

- **Doctor**: dr.smith@shph.com / password123
- **VHV**: vhv.anna@shph.com / password123  
- **Patient**: patient1@example.com / password123
- **Caregiver**: caregiver1@example.com / password123

Additional demo accounts are available for each role. See the database seed scripts for the complete list.

## Support

For technical support or questions, please contact the development team or refer to the project documentation.
