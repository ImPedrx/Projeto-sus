// Hand-written from supabase/migrations/0001_initial_schema.sql so the app can
// be typed before the Supabase project exists. Replace with the generated file
// once the migrations are applied:
//   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BeatStatus = "draft" | "published" | "sold";

export type OrderStatus = "pending" | "approved" | "paid" | "cancelled";

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: never;
          name: string;
          slug: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: never;
          name?: string;
          slug?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      beats: {
        Row: {
          id: number;
          title: string;
          slug: string;
          price_cents: number;
          bpm: number | null;
          musical_key: string | null;
          duration_seconds: number | null;
          description: string | null;
          cover_path: string | null;
          preview_path: string;
          master_mp3_path: string;
          master_wav_path: string | null;
          status: BeatStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          title: string;
          slug: string;
          price_cents: number;
          bpm?: number | null;
          musical_key?: string | null;
          duration_seconds?: number | null;
          description?: string | null;
          cover_path?: string | null;
          preview_path: string;
          master_mp3_path: string;
          master_wav_path?: string | null;
          status?: BeatStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          title?: string;
          slug?: string;
          price_cents?: number;
          bpm?: number | null;
          musical_key?: string | null;
          duration_seconds?: number | null;
          description?: string | null;
          cover_path?: string | null;
          preview_path?: string;
          master_mp3_path?: string;
          master_wav_path?: string | null;
          status?: BeatStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      beat_categories: {
        Row: { beat_id: number; category_id: number };
        Insert: { beat_id: number; category_id: number };
        Update: { beat_id?: number; category_id?: number };
        Relationships: [
          {
            foreignKeyName: "beat_categories_beat_id_fkey";
            columns: ["beat_id"];
            referencedRelation: "beats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "beat_categories_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: number;
          code: string;
          customer_name: string;
          customer_email: string;
          artist_name: string | null;
          instagram: string | null;
          note: string | null;
          total_cents: number;
          status: OrderStatus;
          created_at: string;
          updated_at: string;
        };
        // Rows are written by place_order(), never by a client insert, so the
        // Insert type exists only to satisfy the client's generics.
        Insert: never;
        Update: { status?: OrderStatus };
        Relationships: [];
      };
      order_items: {
        Row: {
          order_id: number;
          beat_id: number;
          title: string;
          price_cents: number;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_beat_id_fkey";
            columns: ["beat_id"];
            referencedRelation: "beats";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      // Takes beat ids and contact details and returns the order code. The
      // total is computed inside the function, which is why no amount appears
      // in the argument type.
      place_order: {
        Args: { payload: Json };
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
