// Generated from actual local migrations in PostgreSQL PGlite. Regenerate: npm run types:local.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export interface Database {
  public: {
    Tables: {
      account_details: {
        Row: {
          user_id: string;
          address: string;
          phone: string;
          city: string;
          country: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          address?: string;
          phone?: string;
          city?: string;
          country?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          address?: string;
          phone?: string;
          city?: string;
          country?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
          deletion_pending: boolean;
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
          deletion_pending?: boolean;
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
          deletion_pending?: boolean;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string | null;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          created_at: string;
          organization_ref: string | null;
          organization_name: string;
          actor_name: string;
          actor_role: string;
          actor_ref: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
          organization_ref?: string | null;
          organization_name?: string;
          actor_name?: string;
          actor_role?: string;
          actor_ref?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: Json;
          created_at?: string;
          organization_ref?: string | null;
          organization_name?: string;
          actor_name?: string;
          actor_role?: string;
          actor_ref?: string | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          organization_id: string;
          finding_id: string | null;
          task_id: string | null;
          evidence_id: string | null;
          body: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          finding_id?: string | null;
          task_id?: string | null;
          evidence_id?: string | null;
          body: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          finding_id?: string | null;
          task_id?: string | null;
          evidence_id?: string | null;
          body?: string;
          created_by?: string;
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
      evidence: {
        Row: {
          id: string;
          organization_id: string;
          control_id: string | null;
          finding_id: string | null;
          task_id: string | null;
          previous_evidence_id: string | null;
          uploaded_by: string;
          file_path: string;
          original_filename: string;
          mime_type: string;
          file_size: number;
          description: string;
          review_status: Database['public']['Enums']['evidence_review_status'];
          reviewer_comment: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          uploaded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          control_id?: string | null;
          finding_id?: string | null;
          task_id?: string | null;
          previous_evidence_id?: string | null;
          uploaded_by?: string;
          file_path: string;
          original_filename: string;
          mime_type: string;
          file_size: number;
          description: string;
          review_status?: Database['public']['Enums']['evidence_review_status'];
          reviewer_comment?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          uploaded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          control_id?: string | null;
          finding_id?: string | null;
          task_id?: string | null;
          previous_evidence_id?: string | null;
          uploaded_by?: string;
          file_path?: string;
          original_filename?: string;
          mime_type?: string;
          file_size?: number;
          description?: string;
          review_status?: Database['public']['Enums']['evidence_review_status'];
          reviewer_comment?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          uploaded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      findings: {
        Row: {
          id: string;
          organization_id: string;
          assessment_id: string;
          control_id: string | null;
          code: number;
          title: string;
          description: string;
          recommendation: string;
          area: string;
          severity: Database['public']['Enums']['severity'];
          status: Database['public']['Enums']['finding_status'];
          assigned_to: string | null;
          due_date: string | null;
          closure_note: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          assessment_id: string;
          control_id?: string | null;
          code?: number;
          title: string;
          description: string;
          recommendation?: string;
          area?: string;
          severity?: Database['public']['Enums']['severity'];
          status?: Database['public']['Enums']['finding_status'];
          assigned_to?: string | null;
          due_date?: string | null;
          closure_note?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          assessment_id?: string;
          control_id?: string | null;
          code?: number;
          title?: string;
          description?: string;
          recommendation?: string;
          area?: string;
          severity?: Database['public']['Enums']['severity'];
          status?: Database['public']['Enums']['finding_status'];
          assigned_to?: string | null;
          due_date?: string | null;
          closure_note?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          organization_id: string;
          task_id: string | null;
          finding_id: string | null;
          evidence_id: string | null;
          event_type: string;
          title: string;
          message: string;
          event_key: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          organization_id: string;
          task_id?: string | null;
          finding_id?: string | null;
          evidence_id?: string | null;
          event_type: string;
          title: string;
          message: string;
          event_key: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          organization_id?: string;
          task_id?: string | null;
          finding_id?: string | null;
          evidence_id?: string | null;
          event_type?: string;
          title?: string;
          message?: string;
          event_key?: string;
          read_at?: string | null;
          created_at?: string;
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
      processing_activities: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          area: string;
          owner: string;
          purpose: string;
          data_subject_categories: string[];
          personal_data_categories: string[];
          sensitive_data: Database['public']['Enums']['processing_tristate'];
          source: string;
          legal_basis: string;
          legal_basis_details: string;
          systems: string;
          recipients: string;
          processors: string;
          international_transfer: Database['public']['Enums']['processing_tristate'];
          international_transfer_details: string;
          retention_period: string;
          retention_criteria: string;
          security_measures: string;
          notes: string;
          status: Database['public']['Enums']['processing_status'];
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          area?: string;
          owner?: string;
          purpose: string;
          data_subject_categories: string[];
          personal_data_categories: string[];
          sensitive_data?: Database['public']['Enums']['processing_tristate'];
          source?: string;
          legal_basis?: string;
          legal_basis_details?: string;
          systems?: string;
          recipients?: string;
          processors?: string;
          international_transfer?: Database['public']['Enums']['processing_tristate'];
          international_transfer_details?: string;
          retention_period?: string;
          retention_criteria?: string;
          security_measures?: string;
          notes?: string;
          status?: Database['public']['Enums']['processing_status'];
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          area?: string;
          owner?: string;
          purpose?: string;
          data_subject_categories?: string[];
          personal_data_categories?: string[];
          sensitive_data?: Database['public']['Enums']['processing_tristate'];
          source?: string;
          legal_basis?: string;
          legal_basis_details?: string;
          systems?: string;
          recipients?: string;
          processors?: string;
          international_transfer?: Database['public']['Enums']['processing_tristate'];
          international_transfer_details?: string;
          retention_period?: string;
          retention_criteria?: string;
          security_measures?: string;
          notes?: string;
          status?: Database['public']['Enums']['processing_status'];
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
      reports: {
        Row: {
          id: string;
          organization_id: string;
          assessment_id: string;
          created_by: string;
          title: string;
          snapshot: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          assessment_id: string;
          created_by: string;
          title: string;
          snapshot: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          assessment_id?: string;
          created_by?: string;
          title?: string;
          snapshot?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          finding_id: string;
          title: string;
          description: string;
          assigned_to: string | null;
          status: Database['public']['Enums']['task_status'];
          priority: Database['public']['Enums']['severity'];
          due_date: string | null;
          reviewer_comment: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          finding_id: string;
          title: string;
          description?: string;
          assigned_to?: string | null;
          status?: Database['public']['Enums']['task_status'];
          priority?: Database['public']['Enums']['severity'];
          due_date?: string | null;
          reviewer_comment?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          finding_id?: string;
          title?: string;
          description?: string;
          assigned_to?: string | null;
          status?: Database['public']['Enums']['task_status'];
          priority?: Database['public']['Enums']['severity'];
          due_date?: string | null;
          reviewer_comment?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_invitation: { Args: { token: string }; Returns: string };
      account_mutation_completed: { Args: { reservation_id: string }; Returns: boolean };
      admin_accounts: { Args: { term: string; page_number: number }; Returns: Json };
      admin_membership_organizations: { Args: Record<string, never>; Returns: Json };
      admin_membership_users: {
        Args: {
          member_role: Database['public']['Enums']['app_role'];
          term: string;
          page_number: number;
        };
        Returns: Json;
      };
      assessment_deletion_files: { Args: { assessment: string }; Returns: string[] };
      can_manage_organization: { Args: { org: string }; Returns: boolean };
      cancel_account_mutation: { Args: { reservation_id: string }; Returns: undefined };
      cancel_account_provisioning: { Args: { reservation_id: string }; Returns: undefined };
      cancel_password_reset: { Args: { receipt: string }; Returns: undefined };
      create_assessment: {
        Args: { org: string; title: string; details?: string };
        Returns: string;
      };
      create_organization: { Args: { payload: Json }; Returns: string };
      create_report: {
        Args: {
          assessment: string;
          report_title: string;
          executive_summary: string;
          report_scope: string;
          conclusions: string;
        };
        Returns: string;
      };
      dashboard_summary: {
        Args: { search?: string; org_status?: string; attention?: string; page?: number };
        Returns: Json;
      };
      finalize_evidence: { Args: { item: string }; Returns: undefined };
      finding_progress: { Args: { finding: string }; Returns: Json };
      finish_assessment_deletion: { Args: { assessment: string }; Returns: undefined };
      finish_organization_deletion: { Args: { org: string }; Returns: undefined };
      invite_client: { Args: { org: string; target_email: string }; Returns: string };
      manage_member: {
        Args: {
          org: string;
          target: string;
          member_role: Database['public']['Enums']['app_role'] | null;
        };
        Returns: undefined;
      };
      organization_deletion_files: { Args: { org: string }; Returns: string[] };
      password_reset_completed: { Args: { receipt: string }; Returns: boolean };
      prepare_assessment_deletion: {
        Args: { assessment: string; confirmation: string };
        Returns: undefined;
      };
      prepare_organization_deletion: {
        Args: { org: string; confirmation: string };
        Returns: undefined;
      };
      purge_audit_logs: {
        Args: { before_time: string; reason: string; confirmation: string };
        Returns: number;
      };
      read_notifications: { Args: { notification?: string }; Returns: undefined };
      record_audit_export: { Args: { filters: Json; record_count: number }; Returns: undefined };
      record_evidence_download: { Args: { evidence: string }; Returns: undefined };
      record_report_download: { Args: { report: string }; Returns: undefined };
      register_consultant: { Args: Record<string, never>; Returns: undefined };
      reserve_account_contact_mutation: {
        Args: {
          target: string;
          operation: string;
          account_email: string;
          account_name: string;
          contact: Json;
        };
        Returns: string;
      };
      reserve_account_contact_provisioning: {
        Args: {
          account_email: string;
          account_name: string;
          account_role: Database['public']['Enums']['app_role'];
          contact: Json;
        };
        Returns: string;
      };
      reserve_account_mutation: {
        Args: { target: string; operation: string; account_email: string; account_name: string };
        Returns: string;
      };
      reserve_account_provisioning: {
        Args: {
          account_email: string;
          account_name: string;
          account_role: Database['public']['Enums']['app_role'];
        };
        Returns: string;
      };
      reserve_password_reset: { Args: { target: string }; Returns: string };
      revoke_invitation: { Args: { invitation_id: string }; Returns: undefined };
      save_my_account: { Args: { account_name: string; contact: Json }; Returns: undefined };
      set_user_organizations: {
        Args: {
          target: string;
          expected_role: Database['public']['Enums']['app_role'];
          organizations: string[];
          expected_organizations: string[];
        };
        Returns: undefined;
      };
      set_user_role: {
        Args: { target: string; new_role: Database['public']['Enums']['app_role'] };
        Returns: undefined;
      };
      submit_task: {
        Args: { task: string; new_status: Database['public']['Enums']['task_status'] };
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
      evidence_review_status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'CHANGES_REQUESTED';
      finding_status: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'CLOSED' | 'ACCEPTED_RISK';
      organization_status: 'ACTIVE' | 'ARCHIVED';
      processing_status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
      processing_tristate: 'YES' | 'NO' | 'UNKNOWN';
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      task_status: 'TODO' | 'IN_PROGRESS' | 'WAITING_REVIEW' | 'DONE';
    };
    CompositeTypes: Record<string, never>;
  };
}
