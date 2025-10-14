import { UserRole } from './types';
import { authApi } from './api';

export type { UserRole };

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

// Get current user from API
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userData = await authApi.getCurrentUser();
    return {
      id: userData.id,
      email: userData.email,
      name: userData.email, // Use email as name for now
      role: userData.role,
    };
  } catch (error) {
    // Try to get from localStorage as fallback
    const storedUser = getCurrentUserFromStorage();
    return storedUser;
  }
}

// Login function
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const loginResponse = await authApi.login({ email, password });

    // Get user details after login
    const user = await getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    return null;
  }
}

// Set current user in storage
export function setCurrentUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}

// Get current user from storage
export function getCurrentUserFromStorage(): User | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
}

// Clear current user
export function clearCurrentUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  // Use the mock API logout
  authApi.logout();
}

// Role-based route protection
export const roleRoutes: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ["/admin"],
  [UserRole.DOCTOR]: ["/doctor"],
  [UserRole.VHV]: ["/vhv"],
  [UserRole.PATIENT]: ["/patient"],
};

export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/admin/dashboard";
    case UserRole.DOCTOR:
      return "/doctor/dashboard";
    case UserRole.VHV:
      return "/vhv/dashboard";
    case UserRole.PATIENT:
      return "/patient/dashboard";
    default:
      return "/login";
  }
}

export function canAccessRoute(userRole: UserRole, path: string): boolean {
  const allowedRoutes = roleRoutes[userRole];
  return allowedRoutes.some(route => path.startsWith(route));
}
