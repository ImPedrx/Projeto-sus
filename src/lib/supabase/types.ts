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
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
