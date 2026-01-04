import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface BkcliRecord {
  cli: string;
  nom?: string;
  tcli?: string;
  pre?: string;
  viln?: string;
  dna?: string;
  nat?: string;
  sext?: string;
  nid?: string;
  did?: string;
  resd?: string;
  nmer?: string;
  nrc?: string;
  npa?: string;
  rso?: string;
  sig?: string;
  seg?: string;
  age?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const data = await req.json();
    const records: BkcliRecord[] = data.records;

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error("Invalid data format: Expected non-empty array of records");
    }

    // Validate required fields
    for (const record of records) {
      if (!record.cli) {
        throw new Error("Invalid record: Missing required field 'cli'");
      }
    }

    // Insert records in batches of 100
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { data: insertedData, error } = await supabase
        .from("bkcli")
        .upsert(batch, {
          onConflict: "cli",
          ignoreDuplicates: false,
        });

      if (error) {
        throw error;
      }

      results.push(...(insertedData || []));
    }

    // Log the successful upload
    await supabase.from("app_logs").insert({
      action_type: "upload_data",
      entity_type: "bkcli",
      details: {
        records_processed: records.length,
        records_inserted: results.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data uploaded successfully",
        records_processed: records.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Upload error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
});