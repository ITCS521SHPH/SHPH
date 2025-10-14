# Healthcare System - Mock API Setup

This setup allows you to run the web application locally without the NestJS API backend by using synthetic mock data.

## Demo Login Accounts

The following demo accounts are available for testing different user roles:

### Admin Account
- **Email:** `admin@demo.com`
- **Password:** `admin123`
- **Access:** Admin dashboard with user management, statistics, and system settings

### Doctor Account  
- **Email:** `doctor@demo.com`
- **Password:** `doctor123`
- **Access:** Doctor dashboard for reviewing patient intakes and medical records

### VHV (Village Health Volunteer) Account
- **Email:** `vhv@demo.com`
- **Password:** `vhv123`
- **Access:** VHV dashboard for patient intake submissions and case management

### Patient Account
- **Email:** `patient@demo.com`
- **Password:** `patient123`
- **Access:** Patient dashboard for viewing personal health records

## Additional Demo Users

For more realistic testing, additional accounts are available:
- `dr.smith@demo.com` / `smith123` (Doctor)
- `vhv.jane@demo.com` / `jane123` (VHV)

## Mock Data Features

The mock system includes:

### ✅ Complete User Authentication
- Login/logout functionality
- Role-based access control
- Session management with localStorage

### ✅ Patient Management
- 5 demo patients with realistic medical data
- CRUD operations (Create, Read, Update, Delete)
- Patient-VHV assignments

### ✅ Intake Submissions
- 4 sample intake forms with different statuses:
  - Draft intake (in progress)
  - Submitted intake (pending review)
  - Approved intake
  - Changes requested intake
- Complete medical questionnaires with vitals, symptoms, chronic conditions

### ✅ Review Queue System
- Doctors can approve, request changes, or reject intakes
- Comment system for feedback
- Status tracking and workflow management

### ✅ Admin Dashboard
- User creation (doctors and VHVs)
- System statistics and metrics
- Patient-doctor assignments
- Recent activity logs

### ✅ File Upload Simulation
- Mock file upload functionality
- Returns simulated file URLs

## How to Use

### 1. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

The application will be available at: http://localhost:3000

### 2. Login Process
1. Navigate to http://localhost:3000/login
2. Use any of the demo accounts listed above
3. You'll be redirected to the appropriate dashboard based on your role

### 3. Testing Different Roles

**Admin Dashboard:**
- Create new doctors and VHVs
- View system statistics
- Manage user assignments

**Doctor Dashboard:**
- Review patient intake submissions
- Approve, request changes, or reject cases
- View patient medical histories

**VHV Dashboard:**
- View assigned patients
- Create and submit patient intakes
- Manage ongoing cases

**Patient Dashboard:**
- View personal health records
- See intake history and status

### 4. API Behavior

All API calls are intercepted and served with realistic mock responses:
- **Realistic delays:** 300-1000ms to simulate network requests
- **Persistent data:** Changes are stored in memory during the session
- **Error handling:** Proper error responses for invalid operations
- **Authentication:** Token-based auth with localStorage persistence

## Development Notes

- **No Backend Required:** The entire system works without the NestJS API
- **Data Persistence:** Mock data persists during the browser session but resets on refresh
- **Type Safety:** All TypeScript interfaces are maintained for proper development experience
- **Environment Detection:** Automatically uses mock API in development mode

## Switching Back to Real API

To use a real API backend later, simply set the `NEXT_PUBLIC_API_URL` environment variable:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

When this is set, the application will use real HTTP requests instead of mock data.

## Mock Data Structure

The mock data includes:
- **Users:** 6 demo users across all roles
- **Patients:** 5 patients with realistic medical profiles
- **Health Workers:** 4 health workers (doctors and VHVs)
- **Intakes:** 4 intake submissions with various statuses
- **Assignments:** Patient-VHV relationships

All data follows the same TypeScript interfaces as the real application, ensuring seamless transitions between mock and real data.

## Troubleshooting

### Build Issues
The production build may show errors for error pages (404/500) due to styled-jsx compatibility issues. This doesn't affect the main application functionality. The development server works perfectly.

### Login Issues
Make sure to use the exact email and password combinations listed above. The system is case-sensitive.

### Data Reset
If you need to reset the mock data to its original state, simply refresh the browser page.

---

This mock setup provides a complete, functional healthcare management system for local development and testing without requiring any backend infrastructure.
