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
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      applications: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          match_score: number
          reasons: string[]
          stage: string
          status: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          match_score?: number
          reasons?: string[]
          stage?: string
          status?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number
          reasons?: string[]
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          company_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          job_id: string | null
          meeting_url: string | null
          notes: string | null
          specialist_id: string
          start_time: string
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          job_id?: string | null
          meeting_url?: string | null
          notes?: string | null
          specialist_id: string
          start_time: string
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          job_id?: string | null
          meeting_url?: string | null
          notes?: string | null
          specialist_id?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          name: string
          score: number | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          name: string
          score?: number | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          name?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          appointment_id: string | null
          created_at: string
          diagnosis: Json | null
          id: string
          job_id: string | null
          status: string
          transcript: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          diagnosis?: Json | null
          id?: string
          job_id?: string | null
          status?: string
          transcript?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          diagnosis?: Json | null
          id?: string
          job_id?: string | null
          status?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          auto_apply: boolean
          bio: string | null
          created_at: string
          education: string | null
          email: string
          full_name: string
          github_username: string | null
          headline: string | null
          id: string
          location: string | null
          portfolio_url: string | null
          profile_completion: number
          resume_name: string | null
          resume_url: string | null
          seniority: string | null
          skills: string[]
        }
        Insert: {
          auto_apply?: boolean
          bio?: string | null
          created_at?: string
          education?: string | null
          email: string
          full_name: string
          github_username?: string | null
          headline?: string | null
          id?: string
          location?: string | null
          portfolio_url?: string | null
          profile_completion?: number
          resume_name?: string | null
          resume_url?: string | null
          seniority?: string | null
          skills?: string[]
        }
        Update: {
          auto_apply?: boolean
          bio?: string | null
          created_at?: string
          education?: string | null
          email?: string
          full_name?: string
          github_username?: string | null
          headline?: string | null
          id?: string
          location?: string | null
          portfolio_url?: string | null
          profile_completion?: number
          resume_name?: string | null
          resume_url?: string | null
          seniority?: string | null
          skills?: string[]
        }
        Relationships: []
      }
      challenge_submissions: {
        Row: {
          answer: string | null
          candidate_id: string
          challenge_id: string
          created_at: string
          feedback: string | null
          file_name: string | null
          id: string
          link: string | null
          score: number | null
          video_url: string | null
        }
        Insert: {
          answer?: string | null
          candidate_id: string
          challenge_id: string
          created_at?: string
          feedback?: string | null
          file_name?: string | null
          id?: string
          link?: string | null
          score?: number | null
          video_url?: string | null
        }
        Update: {
          answer?: string | null
          candidate_id?: string
          challenge_id?: string
          created_at?: string
          feedback?: string | null
          file_name?: string | null
          id?: string
          link?: string | null
          score?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          company_id: string
          competencies: string[]
          context: string | null
          created_at: string
          deadline: string | null
          id: string
          job_id: string | null
          problem: string | null
          status: string
          title: string
        }
        Insert: {
          company_id: string
          competencies?: string[]
          context?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          job_id?: string | null
          problem?: string | null
          status?: string
          title: string
        }
        Update: {
          company_id?: string
          competencies?: string[]
          context?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          job_id?: string | null
          problem?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          about: string | null
          created_at: string
          email: string
          id: string
          industry: string | null
          name: string
          size: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          email: string
          id?: string
          industry?: string | null
          name: string
          size?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string | null
          name?: string
          size?: string | null
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          accepted_at: string
          email: string
          id: string
          kind: string
        }
        Insert: {
          accepted_at?: string
          email: string
          id?: string
          kind: string
        }
        Update: {
          accepted_at?: string
          email?: string
          id?: string
          kind?: string
        }
        Relationships: []
      }
      github_profiles: {
        Row: {
          candidate_id: string
          connected_at: string
          id: string
          is_mock: boolean
          languages: Json | null
          repos: number | null
          stars: number | null
          username: string
        }
        Insert: {
          candidate_id: string
          connected_at?: string
          id?: string
          is_mock?: boolean
          languages?: Json | null
          repos?: number | null
          stars?: number | null
          username: string
        }
        Update: {
          candidate_id?: string
          connected_at?: string
          id?: string
          is_mock?: boolean
          languages?: Json | null
          repos?: number | null
          stars?: number | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          area: string | null
          company_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          diagnosis: Json | null
          dna: Json | null
          id: string
          location: string | null
          modality: string | null
          salary_range: string | null
          seniority: string | null
          status: string
          title: string
          urgency: string | null
        }
        Insert: {
          area?: string | null
          company_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          diagnosis?: Json | null
          dna?: Json | null
          id?: string
          location?: string | null
          modality?: string | null
          salary_range?: string | null
          seniority?: string | null
          status?: string
          title: string
          urgency?: string | null
        }
        Update: {
          area?: string | null
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          diagnosis?: Json | null
          dna?: Json | null
          id?: string
          location?: string | null
          modality?: string | null
          salary_range?: string | null
          seniority?: string | null
          status?: string
          title?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          recipient_email: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          recipient_email: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          recipient_email?: string
          title?: string
        }
        Relationships: []
      }
      plus_experiences: {
        Row: {
          candidate_id: string | null
          company_id: string
          created_at: string
          id: string
          job_id: string | null
          location: string | null
          notes: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
        }
        Insert: {
          candidate_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          location?: string | null
          notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
        }
        Update: {
          candidate_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          location?: string | null
          notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "plus_experiences_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plus_experiences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plus_experiences_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          kind: string | null
          title: string
          url: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          kind?: string | null
          title: string
          url?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          kind?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          author_type: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_id: string
          author_type: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string
          author_type?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          candidate_id: string
          created_at: string
          description: string | null
          github_url: string | null
          id: string
          link: string | null
          name: string
          problem: string | null
          result: string | null
          solution: string | null
          technologies: string[]
        }
        Insert: {
          candidate_id: string
          created_at?: string
          description?: string | null
          github_url?: string | null
          id?: string
          link?: string | null
          name: string
          problem?: string | null
          result?: string | null
          solution?: string | null
          technologies?: string[]
        }
        Update: {
          candidate_id?: string
          created_at?: string
          description?: string | null
          github_url?: string | null
          id?: string
          link?: string | null
          name?: string
          problem?: string | null
          result?: string | null
          solution?: string | null
          technologies?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "projects_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          candidate_id: string
          company_id: string
          created_at: string
          id: string
          job_id: string | null
          note: string | null
        }
        Insert: {
          candidate_id: string
          company_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          note?: string | null
        }
        Update: {
          candidate_id?: string
          company_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_attempts: {
        Row: {
          answers: Json
          candidate_id: string
          completed_at: string
          feedback: string | null
          id: string
          score: number | null
          simulation_id: string
        }
        Insert: {
          answers?: Json
          candidate_id: string
          completed_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          simulation_id: string
        }
        Update: {
          answers?: Json
          candidate_id?: string
          completed_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          simulation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_attempts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_attempts_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          created_at: string
          id: string
          intro: string | null
          job_id: string
          questions: Json
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          intro?: string | null
          job_id: string
          questions?: Json
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          intro?: string | null
          job_id?: string
          questions?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_availability: {
        Row: {
          active: boolean
          day_of_week: number
          end_time: string
          id: string
          specialist_id: string
          start_time: string
        }
        Insert: {
          active?: boolean
          day_of_week: number
          end_time: string
          id?: string
          specialist_id: string
          start_time: string
        }
        Update: {
          active?: boolean
          day_of_week?: number
          end_time?: string
          id?: string
          specialist_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_availability_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialists: {
        Row: {
          created_at: string
          email: string
          focus: string | null
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          focus?: string | null
          full_name: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          focus?: string | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
