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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_summaries: {
        Row: {
          generated_at: string
          generated_by: string | null
          id: string
          period_month: number
          period_year: number
          summary: Json
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          period_month: number
          period_year: number
          summary: Json
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          period_month?: number
          period_year?: number
          summary?: Json
        }
        Relationships: []
      }
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          contract_pdf_url: string | null
          contract_signed_at: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          instructor_amount: number
          instructor_id: string
          payment_intent_id: string | null
          payment_status: string | null
          platform_fee: number
          price: number
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id: string | null
          student_id: string
          updated_at: string | null
          vehicle_type: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          contract_pdf_url?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          instructor_amount: number
          instructor_id: string
          payment_intent_id?: string | null
          payment_status?: string | null
          platform_fee: number
          price: number
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          student_id: string
          updated_at?: string | null
          vehicle_type?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          contract_pdf_url?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          instructor_amount?: number
          instructor_id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          platform_fee?: number
          price?: number
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_payment_intent_id?: string | null
          student_id?: string
          updated_at?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey_profiles"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_results: {
        Row: {
          category: string | null
          correct_answers: number
          created_at: string | null
          id: string
          score_percentage: number
          time_seconds: number
          total_questions: number
          user_id: string
        }
        Insert: {
          category?: string | null
          correct_answers: number
          created_at?: string | null
          id?: string
          score_percentage: number
          time_seconds: number
          total_questions: number
          user_id: string
        }
        Update: {
          category?: string | null
          correct_answers?: number
          created_at?: string | null
          id?: string
          score_percentage?: number
          time_seconds?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          id: string
          role: string
          session_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          content: string
          id?: string
          role: string
          session_id: string
          timestamp?: string
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          role?: string
          session_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          booking_id: string
          contract_text: string
          created_at: string | null
          id: string
          instructor_id: string
          instructor_signature: string | null
          instructor_signed_at: string | null
          student_id: string
          student_signature: string | null
          student_signed_at: string | null
        }
        Insert: {
          booking_id: string
          contract_text: string
          created_at?: string | null
          id?: string
          instructor_id: string
          instructor_signature?: string | null
          instructor_signed_at?: string | null
          student_id: string
          student_signature?: string | null
          student_signed_at?: string | null
        }
        Update: {
          booking_id?: string
          contract_text?: string
          created_at?: string | null
          id?: string
          instructor_id?: string
          instructor_signature?: string | null
          instructor_signed_at?: string | null
          student_id?: string
          student_signature?: string | null
          student_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          created_at: string
          handled_by: string | null
          id: string
          notes: string | null
          requested_at: string
          resolved_at: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handled_by?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          resolved_at?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handled_by?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          resolved_at?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          category: string
          chapter_id: string
          created_at: string | null
          difficulty: string | null
          due_date: string | null
          ease_factor: number | null
          id: string
          image_url: string | null
          interval_days: number | null
          lapses: number | null
          last_reviewed: string | null
          lesson_id: string | null
          question: string
          repetitions: number | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          category: string
          chapter_id: string
          created_at?: string | null
          difficulty?: string | null
          due_date?: string | null
          ease_factor?: number | null
          id?: string
          image_url?: string | null
          interval_days?: number | null
          lapses?: number | null
          last_reviewed?: string | null
          lesson_id?: string | null
          question: string
          repetitions?: number | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string
          chapter_id?: string
          created_at?: string | null
          difficulty?: string | null
          due_date?: string | null
          ease_factor?: number | null
          id?: string
          image_url?: string | null
          interval_days?: number | null
          lapses?: number | null
          last_reviewed?: string | null
          lesson_id?: string | null
          question?: string
          repetitions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "study_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "study_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          instructor_id: string
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          instructor_id: string
          is_active?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availability_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          instructor_id: string
          processed_at: string | null
          status: string | null
          type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructor_id: string
          processed_at?: string | null
          status?: string | null
          type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructor_id?: string
          processed_at?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_transactions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          availability: Json | null
          average_rating: number | null
          background_check_url: string | null
          bio: string | null
          categories: Database["public"]["Enums"]["cnh_category"][]
          city: string
          cnh_document_url: string | null
          cpf: string
          created_at: string | null
          documents_status: string | null
          full_name: string
          id: string
          is_verified: boolean | null
          latitude: number | null
          lesson_duration_minutes: number
          longitude: number | null
          phone: string
          photo_url: string | null
          price_instructor_car: number | null
          price_per_lesson: number
          price_student_car: number | null
          state: string
          status: Database["public"]["Enums"]["instructor_status"] | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          total_lessons: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          vehicle_document_url: string | null
          vehicle_model: string | null
          vehicle_transmission: string | null
        }
        Insert: {
          availability?: Json | null
          average_rating?: number | null
          background_check_url?: string | null
          bio?: string | null
          categories?: Database["public"]["Enums"]["cnh_category"][]
          city: string
          cnh_document_url?: string | null
          cpf: string
          created_at?: string | null
          documents_status?: string | null
          full_name: string
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          lesson_duration_minutes?: number
          longitude?: number | null
          phone: string
          photo_url?: string | null
          price_instructor_car?: number | null
          price_per_lesson: number
          price_student_car?: number | null
          state: string
          status?: Database["public"]["Enums"]["instructor_status"] | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          total_lessons?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_document_url?: string | null
          vehicle_model?: string | null
          vehicle_transmission?: string | null
        }
        Update: {
          availability?: Json | null
          average_rating?: number | null
          background_check_url?: string | null
          bio?: string | null
          categories?: Database["public"]["Enums"]["cnh_category"][]
          city?: string
          cnh_document_url?: string | null
          cpf?: string
          created_at?: string | null
          documents_status?: string | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          lesson_duration_minutes?: number
          longitude?: number | null
          phone?: string
          photo_url?: string | null
          price_instructor_car?: number | null
          price_per_lesson?: number
          price_student_car?: number | null
          state?: string
          status?: Database["public"]["Enums"]["instructor_status"] | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          total_lessons?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_document_url?: string | null
          vehicle_model?: string | null
          vehicle_transmission?: string | null
        }
        Relationships: []
      }
      lesson_contents: {
        Row: {
          content_data: Json
          content_type: string
          created_at: string | null
          id: string
          lesson_id: string
          metadata: Json | null
          order_position: number
          updated_at: string | null
        }
        Insert: {
          content_data: Json
          content_type: string
          created_at?: string | null
          id?: string
          lesson_id: string
          metadata?: Json | null
          order_position: number
          updated_at?: string | null
        }
        Update: {
          content_data?: Json
          content_type?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          metadata?: Json | null
          order_position?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_contents_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "study_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_packages: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          name: string
          total_lessons: number
          total_price: number
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          name: string
          total_lessons: number
          total_price: number
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          name?: string
          total_lessons?: number
          total_price?: number
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_packages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          correct_answers: number | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          study_progress: number | null
          total_flashcards_studied: number | null
          total_questions_answered: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          correct_answers?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          study_progress?: number | null
          total_flashcards_studied?: number | null
          total_questions_answered?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          correct_answers?: number | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          study_progress?: number | null
          total_flashcards_studied?: number | null
          total_questions_answered?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          chapter_id: string
          correct_option: string
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          image_url: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          updated_at: string | null
        }
        Insert: {
          chapter_id: string
          correct_option: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string
          correct_option?: string
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "study_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          id: string
          instructor_id: string
          is_approved: boolean | null
          rating: number
          student_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          instructor_id: string
          is_approved?: boolean | null
          rating: number
          student_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          instructor_id?: string
          is_approved?: boolean | null
          rating?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      student_packages: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          id: string
          instructor_id: string | null
          lessons_total: number
          lessons_used: number | null
          package_id: string | null
          purchased_at: string | null
          status: string | null
          student_id: string | null
          total_paid: number
          vehicle_type: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string
          instructor_id?: string | null
          lessons_total: number
          lessons_used?: number | null
          package_id?: string | null
          purchased_at?: string | null
          status?: string | null
          student_id?: string | null
          total_paid: number
          vehicle_type: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string
          instructor_id?: string | null
          lessons_total?: number
          lessons_used?: number | null
          package_id?: string | null
          purchased_at?: string | null
          status?: string | null
          student_id?: string | null
          total_paid?: number
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_packages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "lesson_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_packages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_chapters: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_time: string | null
          icon: string | null
          id: string
          module_id: string | null
          order_number: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_time?: string | null
          icon?: string | null
          id?: string
          module_id?: string | null
          order_number: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_time?: string | null
          icon?: string | null
          id?: string
          module_id?: string | null
          order_number?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_chapters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "study_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      study_lessons: {
        Row: {
          chapter_id: string
          created_at: string | null
          estimated_time: string | null
          id: string
          order_number: number
          title: string
          updated_at: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          estimated_time?: string | null
          id?: string
          order_number: number
          title: string
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          estimated_time?: string | null
          id?: string
          order_number?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "study_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      study_modules: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          icon: string | null
          id: string
          order_number: number
          title: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          order_number: number
          title: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          order_number?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      traffic_signs: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          meaning: string | null
          name: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          meaning?: string | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          meaning?: string | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_daily_goals: {
        Row: {
          created_at: string | null
          daily_goal_minutes: number | null
          goal_completed_today: boolean | null
          id: string
          last_goal_date: string | null
          minutes_studied_today: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          daily_goal_minutes?: number | null
          goal_completed_today?: boolean | null
          id?: string
          last_goal_date?: string | null
          minutes_studied_today?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          daily_goal_minutes?: number | null
          goal_completed_today?: boolean | null
          id?: string
          last_goal_date?: string | null
          minutes_studied_today?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_flashcard_stats: {
        Row: {
          created_at: string | null
          flashcard_id: string
          id: string
          last_reviewed: string | null
          next_review: string | null
          times_correct: number | null
          times_incorrect: number | null
          times_reviewed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flashcard_id: string
          id?: string
          last_reviewed?: string | null
          next_review?: string | null
          times_correct?: number | null
          times_incorrect?: number | null
          times_reviewed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          flashcard_id?: string
          id?: string
          last_reviewed?: string | null
          next_review?: string | null
          times_correct?: number | null
          times_incorrect?: number | null
          times_reviewed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcard_stats_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          related_content: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          related_content?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          related_content?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_passes: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          pass_type: Database["public"]["Enums"]["pass_type"]
          payment_status: string
          price: number
          purchased_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          pass_type: Database["public"]["Enums"]["pass_type"]
          payment_status?: string
          price: number
          purchased_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          pass_type?: Database["public"]["Enums"]["pass_type"]
          payment_status?: string
          price?: number
          purchased_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          notification_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed: boolean | null
          completion_date: string | null
          created_at: string | null
          id: string
          lesson_id: string
          time_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          time_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "study_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option: string
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "user_quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          chapter_id: string | null
          completed_at: string | null
          correct_answers: number
          created_at: string | null
          id: string
          quiz_type: string
          score_percentage: number
          time_taken: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          completed_at?: string | null
          correct_answers: number
          created_at?: string | null
          id?: string
          quiz_type: string
          score_percentage: number
          time_taken?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          id?: string
          quiz_type?: string
          score_percentage?: number
          time_taken?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "study_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sign_progress: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          id: string
          last_reviewed: string | null
          sign_id: string
          times_correct: number | null
          times_incorrect: number | null
          times_reviewed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          last_reviewed?: string | null
          sign_id: string
          times_correct?: number | null
          times_incorrect?: number | null
          times_reviewed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          last_reviewed?: string | null
          sign_id?: string
          times_correct?: number | null
          times_incorrect?: number | null
          times_reviewed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sign_progress_sign_id_fkey"
            columns: ["sign_id"]
            isOneToOne: false
            referencedRelation: "traffic_signs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sign_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          streak_freeze_available: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_freeze_available?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_freeze_available?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          created_at: string | null
          id: string
          last_xp_date: string | null
          level: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string | null
          xp_today: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_xp_date?: string | null
          level?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_today?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_xp_date?: string | null
          level?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_today?: number | null
        }
        Relationships: []
      }
      xp_history: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          user_id: string | null
          xp_amount: number
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          user_id?: string | null
          xp_amount: number
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          user_id?: string | null
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_xp: {
        Args: {
          p_action_type: string
          p_description?: string
          p_user_id: string
          p_xp_amount: number
        }
        Returns: Json
      }
      generate_audit_summary: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_category_progress: {
        Args: { p_category: string; p_user_id: string }
        Returns: {
          average_confidence: number
          mastered_signs: number
          reviewed_signs: number
          total_signs: number
        }[]
      }
      get_user_gamification_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      has_active_pass: { Args: { user_id: string }; Returns: boolean }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      is_dpo: { Args: { user_id?: string }; Returns: boolean }
      is_instructor: { Args: { check_user_id?: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_entity_id?: string
          p_entity_type: string
          p_ip_address?: string
          p_new_values?: Json
          p_old_values?: Json
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      save_challenge_result: {
        Args: {
          p_category: string
          p_correct_answers: number
          p_time_seconds: number
          p_total_questions: number
          p_user_id: string
        }
        Returns: Json
      }
      update_user_sign_progress: {
        Args: { p_correct: boolean; p_sign_id: string; p_user_id: string }
        Returns: undefined
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user" | "dpo"
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "disputed"
      cnh_category: "A" | "B" | "AB" | "C" | "D" | "E"
      instructor_status: "pending" | "approved" | "rejected" | "suspended"
      message_sender_type: "user" | "support"
      pass_type: "30_days" | "90_days" | "family_90_days"
      ticket_priority: "low" | "medium" | "high"
      ticket_priority_support: "normal" | "high" | "critical"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      ticket_status_support: "open" | "in_progress" | "resolved"
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
      app_role: ["admin", "user", "dpo"],
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "disputed",
      ],
      cnh_category: ["A", "B", "AB", "C", "D", "E"],
      instructor_status: ["pending", "approved", "rejected", "suspended"],
      message_sender_type: ["user", "support"],
      pass_type: ["30_days", "90_days", "family_90_days"],
      ticket_priority: ["low", "medium", "high"],
      ticket_priority_support: ["normal", "high", "critical"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      ticket_status_support: ["open", "in_progress", "resolved"],
    },
  },
} as const
