import type { IntakeSubmission, Patient, CreatePatient } from './types';
import { mockApi } from './mock-api';

const isBrowser = typeof window !== 'undefined';

const safeStorage = {
  get(key: string) {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* noop */
    }
  },
  remove(key: string) {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

// Reviews API
export const reviewsApi = {
  getQueue: async (): Promise<IntakeSubmission[]> => {
    return mockApi.reviews.getQueue();
  },

  approve: async (submissionId: string): Promise<void> => {
    await mockApi.reviews.approve(submissionId);
  },

  requestChanges: async (submissionId: string, comment: string): Promise<void> => {
    await mockApi.reviews.requestChanges(submissionId, comment);
  },

  reject: async (submissionId: string, comment: string): Promise<void> => {
    await mockApi.reviews.reject(submissionId, comment);
  },
};

// Patients API
export const patientsApi = {
  getAll: async (): Promise<Patient[]> => {
    return mockApi.patients.getAll();
  },

  getById: async (id: string): Promise<Patient> => {
    return mockApi.patients.getById(id);
  },

  create: async (patient: CreatePatient): Promise<Patient> => {
    return mockApi.patients.create(patient);
  },

  update: async (id: string, patient: Partial<CreatePatient>): Promise<Patient> => {
    return mockApi.patients.update(id, patient);
  },

  delete: async (id: string): Promise<void> => {
    // Note: Mock API doesn't implement delete, so we'll just log it
    console.log(`Would delete patient ${id}`);
  },
};

// Intakes API
export const intakesApi = {
  getAll: async (): Promise<IntakeSubmission[]> => {
    return mockApi.reviews.getQueue(); // Return all for now
  },

  getById: async (id: string): Promise<IntakeSubmission> => {
    return mockApi.intakes.getById(id);
  },

  create: async (intake: any): Promise<IntakeSubmission> => {
    return mockApi.intakes.create(intake.patientId);
  },

  update: async (id: string, payload: any): Promise<IntakeSubmission> => {
    return mockApi.intakes.update(id, payload);
  },

  submit: async (id: string): Promise<IntakeSubmission> => {
    return mockApi.intakes.submit(id);
  },
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    return mockApi.auth.login({ email, password });
  },

  refresh: async (refreshToken: string) => {
    // Mock refresh - just return current tokens
    const accessToken = safeStorage.get('accessToken');
    return { accessToken, refreshToken };
  },

  logout: async () => {
    await mockApi.auth.logout();
  },
};

// Mock default export for compatibility
const apiClient = {
  // Provide mock methods that throw descriptive errors
  get: () => { throw new Error('Direct API client usage not supported in mock mode'); },
  post: () => { throw new Error('Direct API client usage not supported in mock mode'); },
  put: () => { throw new Error('Direct API client usage not supported in mock mode'); },
  delete: () => { throw new Error('Direct API client usage not supported in mock mode'); },
};

export default apiClient;
