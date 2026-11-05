export type Verification = 'location' | 'passcode' | 'email';
export type Status = 'Open' | 'Closed' | 'Cancelled';

export interface LatLng { lat: number; lng: number }
export interface Fix extends LatLng { accuracy: number }

export interface ParticipantSession {
  id: string; linkToken: string; title: string; description: string; venue: string;
  startsAt: string; endsAt: string; status: Status; location: LatLng; radius: number;
  verification: Verification; distance: number; checkedIn: boolean; sheet?: any; lateAfterTime?: string;
}

export interface SheetSettings {
  title: string; footer: string; rows: number;
  columns: { no: boolean; name: boolean; email: boolean; time: boolean; distance: boolean; signature: boolean };
}

export interface CreatorSession {
  id: string; title: string; description: string; venue: string;
  startsAt: string; endsAt: string; status: Status; location: LatLng; radius: number;
  verification: Verification; allowedEmails: string[]; shareLink: string;
  sheet: any | null; checkInCount: number; locked: boolean; sheetLocked: boolean; lateAfterTime?: string;
  schedule?: {
    enabled: boolean;
    daysOfWeek: number[];
    autoClose: boolean;
  };
}

export interface RecordRow {
  id: string; name: string; email: string; at: string; distance: number | null;
  accuracy: number | null; late: boolean; manual: boolean; lowAccuracy: boolean;
  customFields?: Record<string, string>; signature?: string;
}
export interface RecordsResponse {
  summary: { count: number; expected: number | null; absent: string[] };
  records: RecordRow[];
}

export interface HistoryItem {
  id: string; sessionId: string | null; title: string; venue: string;
  at: string; distance: number | null; accuracy: number | null; late: boolean;
}
export interface Me {
  id: string; name: string; email: string; verified: boolean; avatar?: string | null;
  notifications: { reminders: boolean; checkIn: boolean };
}

export interface SessionInput {
  title: string; description: string; venue: string;
  startsAt: string; endsAt: string; lat: number; lng: number; radius: number;
  verification: Verification; passcode?: string; allowedEmails?: string[]; lateAfterTime?: string;
  schedule?: {
    enabled: boolean;
    daysOfWeek: number[];
    autoClose: boolean;
  };
}
