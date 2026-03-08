import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let vehicleId = url.searchParams.get("id");

    if (!vehicleId && req.method !== "GET" && req.method !== "HEAD") {
      try {
        const body = await req.json();
        if (typeof body?.id === "string") {
          vehicleId = body.id;
        }
      } catch {
        // Ignore invalid JSON body and fall through to validation error
      }
    }

    if (!vehicleId) {
      return new Response(JSON.stringify({ error: "Missing vehicle ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [vRes, sRes, mRes] = await Promise.all([
      supabase.from("vehicles").select("*").eq("id", vehicleId).single(),
      supabase.from("service_logs").select("*").eq("vehicle_id", vehicleId).order("service_date", { ascending: false }),
      supabase.from("modifications").select("*").eq("vehicle_id", vehicleId).order("mod_date", { ascending: false }),
    ]);

    if (vRes.error || !vRes.data) {
      return new Response(JSON.stringify({ error: "Vehicle not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip sensitive fields
    const { user_id, ...vehicle } = vRes.data;

    return new Response(
      JSON.stringify({
        vehicle,
        services: (sRes.data || []).map(({ user_id, ...rest }: any) => rest),
        modifications: (mRes.data || []).map(({ user_id, ...rest }: any) => rest),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
