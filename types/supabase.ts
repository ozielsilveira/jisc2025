export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          cpf: string
          phone: string
          gender: string
          role: "buyer" | "athlete" | "athletic" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          cpf: string
          phone: string
          gender: string
          role: "buyer" | "athlete" | "athletic" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          cpf?: string
          phone?: string
          gender?: string
          role?: "buyer" | "athlete" | "athletic" | "admin"
          created_at?: string
          updated_at?: string
        }
      }
      athletes: {
        Row: {
          id: string
          user_id: string
          athletic_id: string
          photo_url: string
          enrollment_document_url: string
          status: "pending" | "approved" | "rejected"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          athletic_id: string
          photo_url: string
          enrollment_document_url: string
          status?: "pending" | "approved" | "rejected"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          athletic_id?: string
          photo_url?: string
          enrollment_document_url?: string
          status?: "pending" | "approved" | "rejected"
          created_at?: string
          updated_at?: string
        }
      }
      athletics: {
        Row: {
          id: string
          name: string
          logo_url: string
          university: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url: string
          university: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string
          university?: string
          created_at?: string
          updated_at?: string
        }
      }
      sports: {
        Row: {
          id: string
          name: string
          type: "sport" | "bar_game"
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: "sport" | "bar_game"
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: "sport" | "bar_game"
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      athlete_sports: {
        Row: {
          id: string
          athlete_id: string
          sport_id: string
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          sport_id: string
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          sport_id?: string
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          sport_id: string
          location: string
          start_time: string
          end_time: string
          status: "scheduled" | "in_progress" | "completed" | "cancelled"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sport_id: string
          location: string
          start_time: string
          end_time: string
          status?: "scheduled" | "in_progress" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sport_id?: string
          location?: string
          start_time?: string
          end_time?: string
          status?: "scheduled" | "in_progress" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
        }
      }
      game_participants: {
        Row: {
          id: string
          game_id: string
          athletic_id: string
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          athletic_id: string
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          athletic_id?: string
          created_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category: "games" | "party" | "combined"
          includes_party: boolean
          includes_games: boolean
          discount_percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          category: "games" | "party" | "combined"
          includes_party: boolean
          includes_games: boolean
          discount_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category?: "games" | "party" | "combined"
          includes_party?: boolean
          includes_games?: boolean
          discount_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      athlete_packages: {
        Row: {
          id: string
          athlete_id: string
          package_id: string
          payment_status: "pending" | "completed" | "refunded"
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          athlete_id: string
          package_id: string
          payment_status?: "pending" | "completed" | "refunded"
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          package_id?: string
          payment_status?: "pending" | "completed" | "refunded"
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          event_name: string
          price: number
          date: string
          location: string
          total_quantity: number
          remaining_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_name: string
          price: number
          date: string
          location: string
          total_quantity: number
          remaining_quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          price?: number
          date?: string
          location?: string
          total_quantity?: number
          remaining_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      ticket_purchases: {
        Row: {
          id: string
          user_id: string
          ticket_id: string
          quantity: number
          total_price: number
          payment_status: "pending" | "completed" | "refunded"
          payment_date: string | null
          qr_code: string
          athletic_referral_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticket_id: string
          quantity: number
          total_price: number
          payment_status?: "pending" | "completed" | "refunded"
          payment_date?: string | null
          qr_code: string
          athletic_referral_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ticket_id?: string
          quantity?: number
          total_price?: number
          payment_status?: "pending" | "completed" | "refunded"
          payment_date?: string | null
          qr_code?: string
          athletic_referral_id?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}

