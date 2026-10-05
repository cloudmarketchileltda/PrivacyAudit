// Generated from actual phase 1 and 2 migrations in PostgreSQL PGlite. Regenerate: npm run types:local.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export interface Database {
  public: {
    Tables: {
      assessment_controls: {
        Row: {
          id: string;
          assessment_id: string;
          organization_id: string;
          control_id: string;
          snapshot: Json;
          status: Database['public']['Enums']['control_status'];
          auditor_comment: string;
          client_comment: string;
          evaluated_by: string | null;
          evaluated_at: string | null;
          applicability_reason: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          organization_id: string;
          control_id: string;
          snapshot: Json;
          status?: Database['public']['Enums']['control_status'];
          auditor_comment?: string;
          client_comment?: string;
          evaluated_by?: string | null;
          evaluated_at?: string | null;
          applicability_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          organization_id?: string;
          control_id?: string;
          snapshot?: Json;
          status?: Database['public']['Enums']['control_status'];
          auditor_comment?: string;
          client_comment?: string;
          evaluated_by?: string | null;
          evaluated_at?: string | null;
          applicability_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string;
          status: Database['public']['Enums']['assessment_status'];
          started_at: string | null;
          completed_at: string | null;
          consultant_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string;
          status?: Database['public']['Enums']['assessment_status'];
          started_at?: string | null;
          completed_at?: string | null;
          consultant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string;
          status?: Database['public']['Enums']['assessment_status'];
          started_at?: string | null;
          completed_at?: string | null;
          consultant_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      controls: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string;
          category: string;
          objective: string;
          guidance: string;
          normative_reference: string;
          legal_review_status: string;
          severity_if_failed: Database['public']['Enums']['severity'];
          requires_evidence: boolean;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description?: string;
          category: string;
          objective?: string;
          guidance?: string;
          normative_reference?: string;
          legal_review_status?: string;
          severity_if_failed?: Database['public']['Enums']['severity'];
          requires_evidence?: boolean;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          description?: string;
          category?: string;
          objective?: string;
          guidance?: string;
          normative_reference?: string;
          legal_review_status?: string;
          severity_if_failed?: Database['public']['Enums']['severity'];
          requires_evidence?: boolean;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          token_hash: string;
          created_by: string;
          expires_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          token_hash: string;
          created_by: string;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          token_hash?: string;
          created_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['app_role'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
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
          status: Database['public']['Enums']['organization_status'];
          treats_clients: boolean;
          treats_employees: boolean;
          treats_suppliers: boolean;
          sensitive_data: string;
          uses_cameras: boolean;
          marketing: boolean;
          external_providers: boolean;
          international_transfers: string;
          has_website: boolean;
          web_forms: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          legal_name: string;
          rut: string;
          trade_name?: string;
          industry?: string;
          employee_count?: number | null;
          website?: string;
          address?: string;
          contact_name?: string;
          contact_email?: string;
          contact_phone?: string;
          privacy_officer?: string;
          status?: Database['public']['Enums']['organization_status'];
          treats_clients?: boolean;
          treats_employees?: boolean;
          treats_suppliers?: boolean;
          sensitive_data?: string;
          uses_cameras?: boolean;
          marketing?: boolean;
          external_providers?: boolean;
          international_transfers?: string;
          has_website?: boolean;
          web_forms?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          legal_name?: string;
          rut?: string;
          trade_name?: string;
          industry?: string;
          employee_count?: number | null;
          website?: string;
          address?: string;
          contact_name?: string;
          contact_email?: string;
          contact_phone?: string;
          privacy_officer?: string;
          status?: Database['public']['Enums']['organization_status'];
          treats_clients?: boolean;
          treats_employees?: boolean;
          treats_suppliers?: boolean;
          sensitive_data?: string;
          uses_cameras?: boolean;
          marketing?: boolean;
          external_providers?: boolean;
          international_transfers?: string;
          has_website?: boolean;
          web_forms?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: Database['public']['Enums']['app_role'];
          consultant_enrollment_allowed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: Database['public']['Enums']['app_role'];
          consultant_enrollment_allowed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: Database['public']['Enums']['app_role'];
          consultant_enrollment_allowed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_invitation: { Args: { token: string }; Returns: string };
      can_manage_organization: { Args: { org: string }; Returns: boolean };
      create_assessment: {
        Args: { org: string; title: string; details?: string };
        Returns: string;
      };
      create_organization: { Args: { payload: Json }; Returns: string };
      invite_client: { Args: { org: string; target_email: string }; Returns: string };
      manage_member: {
        Args: {
          org: string;
          target: string;
          member_role: Database['public']['Enums']['app_role'] | null;
        };
        Returns: undefined;
      };
      register_consultant: { Args: Record<string, never>; Returns: undefined };
      revoke_invitation: { Args: { invitation_id: string }; Returns: undefined };
      set_user_role: {
        Args: { target: string; new_role: Database['public']['Enums']['app_role'] };
        Returns: undefined;
      };
      update_client_comment: {
        Args: { response_id: string; comment_text: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: 'SUPER_ADMIN' | 'CONSULTANT' | 'CLIENT';
      assessment_status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
      control_status: 'PENDING' | 'CONFORM' | 'PARTIAL' | 'NON_CONFORM' | 'NOT_APPLICABLE';
      organization_status: 'ACTIVE' | 'ARCHIVED';
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
    CompositeTypes: Record<string, never>;
  };
}
