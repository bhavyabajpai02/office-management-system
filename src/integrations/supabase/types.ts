export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          field: string | null
          goal_id: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          field?: string | null
          goal_id?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          field?: string | null
          goal_id?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          actual: number | null
          created_at: string
          goal_id: string
          id: string
          manager_comment: string | null
          quarter: Database["public"]["Enums"]["quarter_label"]
          self_comment: string | null
          status: Database["public"]["Enums"]["checkin_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual?: number | null
          created_at?: string
          goal_id: string
          id?: string
          manager_comment?: string | null
          quarter: Database["public"]["Enums"]["quarter_label"]
          self_comment?: string | null
          status?: Database["public"]["Enums"]["checkin_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual?: number | null
          created_at?: string
          goal_id?: string
          id?: string
          manager_comment?: string | null
          quarter?: Database["public"]["Enums"]["quarter_label"]
          self_comment?: string | null
          status?: Database["public"]["Enums"]["checkin_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          created_at: string
          employee_id: string
          escalation_type: Database["public"]["Enums"]["escalation_type"]
          id: string
          level: number
          note: string | null
          resolved: boolean
        }
        Insert: {
          created_at?: string
          employee_id: string
          escalation_type: Database["public"]["Enums"]["escalation_type"]
          id?: string
          level?: number
          note?: string | null
          resolved?: boolean
        }
        Update: {
          created_at?: string
          employee_id?: string
          escalation_type?: Database["public"]["Enums"]["escalation_type"]
          id?: string
          level?: number
          note?: string | null
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "escalations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_sheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          id: string
          locked_at: string | null
          rework_comment: string | null
          status: Database["public"]["Enums"]["sheet_status"]
          submitted_at: string | null
          updated_at: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          locked_at?: string | null
          rework_comment?: string | null
          status?: Database["public"]["Enums"]["sheet_status"]
          submitted_at?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          locked_at?: string | null
          rework_comment?: string | null
          status?: Database["public"]["Enums"]["sheet_status"]
          submitted_at?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_sheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_sheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          employee_id: string
          id: string
          is_shared: boolean
          last_synced_at: string | null
          q1_planned: number | null
          q2_planned: number | null
          q3_planned: number | null
          q4_planned: number | null
          shared_goal_id: string | null
          sheet_id: string
          status: Database["public"]["Enums"]["goal_status"]
          target: number
          thrust_area: string
          title: string
          uom_direction: Database["public"]["Enums"]["uom_direction"]
          uom_type: Database["public"]["Enums"]["uom_type"]
          updated_at: string
          weightage: number
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          employee_id: string
          id?: string
          is_shared?: boolean
          last_synced_at?: string | null
          q1_planned?: number | null
          q2_planned?: number | null
          q3_planned?: number | null
          q4_planned?: number | null
          shared_goal_id?: string | null
          sheet_id: string
          status?: Database["public"]["Enums"]["goal_status"]
          target?: number
          thrust_area: string
          title: string
          uom_direction?: Database["public"]["Enums"]["uom_direction"]
          uom_type: Database["public"]["Enums"]["uom_type"]
          updated_at?: string
          weightage?: number
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          employee_id?: string
          id?: string
          is_shared?: boolean
          last_synced_at?: string | null
          q1_planned?: number | null
          q2_planned?: number | null
          q3_planned?: number | null
          q4_planned?: number | null
          shared_goal_id?: string | null
          sheet_id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target?: number
          thrust_area?: string
          title?: string
          uom_direction?: Database["public"]["Enums"]["uom_direction"]
          uom_type?: Database["public"]["Enums"]["uom_type"]
          updated_at?: string
          weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "goal_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          job_title: string | null
          manager_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id: string
          job_title?: string | null
          manager_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          job_title?: string | null
          manager_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_goals: {
        Row: {
          assigned_employee_ids: string[]
          created_at: string
          deadline: string | null
          default_weightage: number
          department: string | null
          description: string | null
          id: string
          manager_id: string
          primary_owner_id: string | null
          target: number
          thrust_area: string
          title: string
          uom_direction: Database["public"]["Enums"]["uom_direction"]
          uom_type: Database["public"]["Enums"]["uom_type"]
          updated_at: string
        }
        Insert: {
          assigned_employee_ids?: string[]
          created_at?: string
          deadline?: string | null
          default_weightage?: number
          department?: string | null
          description?: string | null
          id?: string
          manager_id: string
          primary_owner_id?: string | null
          target?: number
          thrust_area: string
          title: string
          uom_direction?: Database["public"]["Enums"]["uom_direction"]
          uom_type: Database["public"]["Enums"]["uom_type"]
          updated_at?: string
        }
        Update: {
          assigned_employee_ids?: string[]
          created_at?: string
          deadline?: string | null
          default_weightage?: number
          department?: string | null
          description?: string | null
          id?: string
          manager_id?: string
          primary_owner_id?: string | null
          target?: number
          thrust_area?: string
          title?: string
          uom_direction?: Database["public"]["Enums"]["uom_direction"]
          uom_type?: Database["public"]["Enums"]["uom_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_goals_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "employee" | "manager" | "admin"
      checkin_status: "not_started" | "on_track" | "completed"
      escalation_type:
        | "goals_not_submitted"
        | "approval_pending"
        | "checkin_incomplete"
      goal_status:
        | "draft"
        | "submitted"
        | "rework_requested"
        | "approved"
        | "locked"
      notification_type:
        | "goal_submitted"
        | "goal_approved"
        | "rework_requested"
        | "quarterly_reminder"
        | "escalation"
      quarter_label: "Q1" | "Q2" | "Q3" | "Q4"
      sheet_status: "draft" | "submitted" | "approved" | "locked"
      uom_direction: "min" | "max" | "timeline" | "zero"
      uom_type: "numeric" | "percentage" | "timeline" | "zero_based"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["employee", "manager", "admin"],
      checkin_status: ["not_started", "on_track", "completed"],
      escalation_type: [
        "goals_not_submitted",
        "approval_pending",
        "checkin_incomplete",
      ],
      goal_status: [
        "draft",
        "submitted",
        "rework_requested",
        "approved",
        "locked",
      ],
      notification_type: [
        "goal_submitted",
        "goal_approved",
        "rework_requested",
        "quarterly_reminder",
        "escalation",
      ],
      quarter_label: ["Q1", "Q2", "Q3", "Q4"],
      sheet_status: ["draft", "submitted", "approved", "locked"],
      uom_direction: ["min", "max", "timeline", "zero"],
      uom_type: ["numeric", "percentage", "timeline", "zero_based"],
    },
  },
} as const
