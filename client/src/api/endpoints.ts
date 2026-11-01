import { api } from './client';
import type {
  CreatorSession, Fix, HistoryItem, Me, ParticipantSession, RecordRow, RecordsResponse,
  SessionInput, SheetSettings, Status,
} from '../types';

export const sessionsApi = {
  // participant
  nearby: (fix: Fix) => api<ParticipantSession[]>('post', '/sessions/nearby', { data: fix }),
  detail: (id: string, fix: Fix, t?: string) =>
    api<ParticipantSession>('get', `/sessions/${id}`, { params: { ...fix, ...(t ? { t } : {}) } }),
  checkIn: (id: string, fix: Fix, extra: { passcode?: string; token?: string }) =>
    api<RecordRow>('post', `/sessions/${id}/check-in`, { data: { ...fix, ...extra } }),
  // creator
  create: (input: SessionInput) =>
    api<{ session: CreatorSession; passcode?: string }>('post', '/sessions', { data: input }),
  listMine: (status?: Status) => api<CreatorSession[]>('get', '/sessions/mine', { params: status ? { status } : {} }),
  getMine: (id: string) => api<CreatorSession>('get', `/sessions/mine/${id}`),
  update: (id: string, patch: Partial<SessionInput>) =>
    api<{ session: CreatorSession; passcode?: string }>('patch', `/sessions/${id}`, { data: patch }),
  setStatus: (id: string, action: 'open' | 'close' | 'cancel') =>
    api<CreatorSession>('post', `/sessions/${id}/${action}`),
  duplicate: (id: string) => api<{ session: CreatorSession; passcode?: string }>('post', `/sessions/${id}/duplicate`),
  newPasscode: (id: string) => api<{ passcode: string }>('post', `/sessions/${id}/passcode`),
  remove: (id: string) => api<void>('delete', `/sessions/${id}`),
  putSheet: (id: string, sheet: SheetSettings) => api<SheetSettings>('put', `/sessions/${id}/sheet`, { data: sheet }),
  // records
  records: (id: string) => api<RecordsResponse>('get', `/sessions/${id}/records`),
  addManual: (id: string, data: { name: string; email?: string }) =>
    api<RecordRow>('post', `/sessions/${id}/records`, { data }),
  removeRecord: (id: string, recordId: string) => api<void>('delete', `/sessions/${id}/records/${recordId}`),
  // CSV and live endpoints
  csvUrl: (id: string) => `/api/sessions/${id}/export.csv`,
  liveUrl: (id: string) => `/api/sessions/${id}/live`,
};

export const meApi = {
  get: () => api<Me>('get', '/me'),
  patch: (data: { name?: string; avatar?: string | null; notifications?: { reminders?: boolean; checkIn?: boolean } }) =>
    api<Me>('patch', '/me', { data }),
  remove: () => api<void>('delete', '/me'),
  history: () => api<{ attended: number; history: HistoryItem[] }>('get', '/me/history'),
};

// Real auth endpoints
export const authApi = {
  register: (name: string, email: string, password: string) =>
    api<{ user: Me; verificationToken: string }>('post', '/auth/register', { data: { name, email, password } }),
  login: (email: string, password: string) => api<{ user: Me }>('post', '/auth/login', { data: { email, password } }),
  logout: () => api<void>('post', '/auth/logout'),
  verify: (token: string) => api<{ user: Me }>('get', `/auth/verify/${encodeURIComponent(token)}`),
  forgot: (email: string) => api<{ sent: boolean }>('post', '/auth/forgot', { data: { email } }),
  reset: (token: string, password: string) =>
    api<{ user: Me }>('post', '/auth/reset', { data: { token, password } }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ message: string }>('post', '/me/password', { data: { currentPassword, newPassword } }),
};

