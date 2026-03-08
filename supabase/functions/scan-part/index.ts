import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, scan_type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt: string;
    let userText: string;

    if (scan_type === "bill") {
      systemPrompt = `You are a vehicle service bill analyzer. Extract structured data from service bills/invoices/receipts.
Return a JSON object with these fields:
- vendor: string (shop/service center name)
- date: string (YYYY-MM-DD format)
- total_amount: number (total cost)
- parts: array of objects with { name: string, part_number: string|null, price: number|null }
- category: "routine" | "emergency" | "upgrade" (best guess)
- notes: string (any additional relevant info)

If a field cannot be determined, use null. Always return valid JSON.`;
      userText = "Extract all billing data from this service bill/receipt/invoice image.";
    } else if (scan_type === "inspection") {
      systemPrompt = `You are an expert vehicle inspector. Analyze the photo of a vehicle engine bay, dashboard, or exterior and assess its visual condition.

Return a JSON object with:
- overall_health_percent: number (0-100, your overall assessment)
- findings: array of objects, each with:
  - area: string (e.g., "Engine Bay", "Belts", "Hoses", "Battery", "Dashboard Warning Lights", "Rust", "Fluid Levels")
  - condition: "good" | "fair" | "poor" | "critical"
  - detail: string (brief observation)
  - health_percent: number (0-100 for this specific area)
- summary: string (2-3 sentence overall assessment)
- urgent_issues: array of strings (anything needing immediate attention)
- recommended_inspections: array of strings (components that should be professionally inspected)

Be thorough but realistic. Base your assessment on visible evidence only. Always return valid JSON.`;
      userText = "Analyze this vehicle photo and provide a detailed visual condition inspection report. Look for rust, belt wear, hose condition, fluid leaks, warning lights, corrosion, and general cleanliness/maintenance level.";
    } else {
      systemPrompt = `You are a vehicle part identifier. Analyze the image to identify the vehicle part or component shown.
Return a JSON object with these fields:
- part_name: string (identified part name)
- condition: "good" | "worn" | "damaged" | "unknown"
- recommended_action: string (e.g., "Replace soon", "OK for now", "Needs immediate attention")
- estimated_life_remaining_percent: number (0-100, best estimate)
- category: "routine" | "emergency" | "upgrade"
- notes: string (observations about the part)

Always return valid JSON.`;
      userText = "Identify this vehicle part and assess its condition.";
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${image_base64}` },
                },
                {
                  type: "text",
                  text: scan_type === "bill"
                    ? "Extract all billing data from this service bill/receipt/invoice image."
                    : "Identify this vehicle part and assess its condition.",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (may be wrapped in markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      parsed = { raw_response: content, parse_error: true };
    }

    return new Response(
      JSON.stringify({ scan_type, result: parsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scan-part error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
