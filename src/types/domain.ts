export type Role = 'SUPER_ADMIN' | 'CONSULTANT' | 'CLIENT';
export interface Profile {
  id: string;
  full_name: string;
  role: Role;
}
export interface Organization {
  id: string;
  legal_name: string;
  rut: string;
  trade_name: string;
  industry: string;
  employee_count: number | null;
  website: string;
  address: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  privacy_officer: string;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
  treats_clients: boolean;
  treats_employees: boolean;
  treats_suppliers: boolean;
  sensitive_data: 'YES' | 'NO' | 'UNKNOWN';
  uses_cameras: boolean;
  marketing: boolean;
  external_providers: boolean;
  international_transfers: 'YES' | 'NO' | 'UNKNOWN';
  has_website: boolean;
  web_forms: boolean;
}
