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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          created_at: string
          doc_name: string
          doc_type: string
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          notes: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          doc_name: string
          doc_type: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          doc_name?: string
          doc_type?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          created_at: string
          fuel_date: string
          fuel_type: string | null
          id: string
          liters: number
          notes: string | null
          odometer_at_fill: number | null
          price_per_liter: number | null
          station: string | null
          total_cost: number | null
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          fuel_date?: string
          fuel_type?: string | null
          id?: string
          liters: number
          notes?: string | null
          odometer_at_fill?: number | null
          price_per_liter?: number | null
          station?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          fuel_date?: string
          fuel_type?: string | null
          id?: string
          liters?: number
          notes?: string | null
          odometer_at_fill?: number | null
          price_per_liter?: number | null
          station?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      modifications: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          id: string
          mod_date: string
          mod_name: string
          photo_url: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
          wiring_notes: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          mod_date?: string
          mod_name: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          wiring_notes?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          mod_date?: string
          mod_name?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          wiring_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_logs: {
        Row: {
          brand_used: string | null
          created_at: string
          id: string
          location_shop: string | null
          notes: string | null
          odometer_at_service: number | null
          part_name: string
          part_number: string | null
          price: number | null
          replacement_interval_km: number | null
          service_category: string
          service_date: string
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          brand_used?: string | null
          created_at?: string
          id?: string
          location_shop?: string | null
          notes?: string | null
          odometer_at_service?: number | null
          part_name: string
          part_number?: string | null
          price?: number | null
          replacement_interval_km?: number | null
          service_category?: string
          service_date?: string
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          brand_used?: string | null
          created_at?: string
          id?: string
          location_shop?: string | null
          notes?: string | null
          odometer_at_service?: number | null
          part_name?: string
          part_number?: string | null
          price?: number | null
          replacement_interval_km?: number | null
          service_category?: string
          service_date?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          notes: string | null
          part_name: string
          part_number: string | null
          quantity: number
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          part_name: string
          part_number?: string | null
          quantity?: number
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          part_name?: string
          part_number?: string | null
          quantity?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          distance_km: number
          end_odometer: number | null
          end_time: string | null
          id: string
          is_active: boolean
          start_odometer: number | null
          start_time: string
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          distance_km?: number
          end_odometer?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          start_odometer?: number | null
          start_time?: string
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          distance_km?: number
          end_odometer?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          start_odometer?: number | null
          start_time?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brake_fluid_capacity: string | null
          chassis_number: string | null
          color: string | null
          coolant_capacity: string | null
          created_at: string
          current_odometer: number
          cylinder_head_torque: string | null
          engine_number: string | null
          engine_oil_capacity: string | null
          gear_oil_capacity: string | null
          id: string
          image_url: string | null
          make: string
          model: string
          nickname: string | null
          oil_grade: string | null
          paint_code: string | null
          plate_no: string
          power_steering_fluid: string | null
          tire_pressure_psi: number | null
          updated_at: string
          user_id: string
          wheel_nut_torque: string | null
          year: number
        }
        Insert: {
          brake_fluid_capacity?: string | null
          chassis_number?: string | null
          color?: string | null
          coolant_capacity?: string | null
          created_at?: string
          current_odometer?: number
          cylinder_head_torque?: string | null
          engine_number?: string | null
          engine_oil_capacity?: string | null
          gear_oil_capacity?: string | null
          id?: string
          image_url?: string | null
          make: string
          model: string
          nickname?: string | null
          oil_grade?: string | null
          paint_code?: string | null
          plate_no: string
          power_steering_fluid?: string | null
          tire_pressure_psi?: number | null
          updated_at?: string
          user_id: string
          wheel_nut_torque?: string | null
          year: number
        }
        Update: {
          brake_fluid_capacity?: string | null
          chassis_number?: string | null
          color?: string | null
          coolant_capacity?: string | null
          created_at?: string
          current_odometer?: number
          cylinder_head_torque?: string | null
          engine_number?: string | null
          engine_oil_capacity?: string | null
          gear_oil_capacity?: string | null
          id?: string
          image_url?: string | null
          make?: string
          model?: string
          nickname?: string | null
          oil_grade?: string | null
          paint_code?: string | null
          plate_no?: string
          power_steering_fluid?: string | null
          tire_pressure_psi?: number | null
          updated_at?: string
          user_id?: string
          wheel_nut_torque?: string | null
          year?: number
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
    Enums: {},
  },
} as const
