const ENV_URL = "NEXT_PUBLIC_SUPABASE_URL";
const ENV_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  return { supabaseUrl, supabaseAnonKey };
}

export function isSupabaseConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseEnvOrThrow() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  if (process.env.NODE_ENV === "development") {
    console.log("Supabase URL:", supabaseUrl || "(not set)");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing ${ENV_URL} or ${ENV_KEY} in .env.local. Copy .env.local.example, add your Supabase project credentials, then restart the dev server (npm run dev).`,
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseConfigError(): string | null {
  if (isSupabaseConfigured()) {
    return null;
  }

  return `Thiếu cấu hình Supabase. Thêm ${ENV_URL} và ${ENV_KEY} vào file .env.local, sau đó khởi động lại dev server.`;
}
