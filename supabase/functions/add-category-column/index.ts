import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'car';"
  });

  // Fallback: try direct query via REST
  if (error) {
    // Use PostgREST won't work for DDL, so let's use the management API
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (dbUrl) {
      try {
        // Connect via postgres
        const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
        const client = new Client(dbUrl);
        await client.connect();
        await client.queryArray("ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'car'");
        await client.end();
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
});
