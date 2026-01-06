import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate") || "2024-01-01";
    const endDate = url.searchParams.get("endDate") || new Date().toISOString().split("T")[0];
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const page = parseInt(url.searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    // Execute the query to find corporate FATCA clients
    const { data, error, count } = await supabase
      .from("bkcli")
      .select(`
        cli,
        nom,
        tcli,
        rso,
        payn,
        nat,
        datc,
        dou,
        age,
        bkadcli!inner(adr1, adr2, adr3, ville, cpay),
        bktelcli!inner(num)
      `, { count: "exact" })
      .eq("tcli", "2") // Only corporate clients
      .gte("dou", startDate)
      .lte("dou", endDate)
      .or(
        `payn.eq.US,nat.eq.US,bkadcli.cpay.eq.US,bktelcli.num.like.+1%,bktelcli.num.like.001%,bktelcli.num.like.+01%,bktelcli.num.like.+001%`
      )
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Format the response
    const formattedData = data.map(client => {
      // Combine address fields
      const address = [
        client.bkadcli?.[0]?.adr1,
        client.bkadcli?.[0]?.adr2,
        client.bkadcli?.[0]?.adr3,
        client.bkadcli?.[0]?.ville
      ].filter(Boolean).join(", ");

      return {
        cli: client.cli,
        nom: client.nom,
        raisonSociale: client.rso,
        dateEntreeRelation: client.dou,
        statusClient: client.dou ? (new Date(client.dou) > new Date(new Date().setFullYear(new Date().getFullYear() - 1)) ? 'Client Actif' : 'Ancien Client') : 'Inconnu',
        paysImmatriculation: client.payn,
        paysResidenceFiscale: client.nat,
        adresse: address,
        paysAdresse: client.bkadcli?.[0]?.cpay || null,
        telephone: client.bktelcli?.[0]?.num || null,
        agence: client.age,
        fatcaStatus: "À vérifier",
        fatcaDate: null,
        fatcaUti: null,
        notes: "Détection automatique - Personne morale avec indices US"
      };
    });

    // Log the request
    await supabase.from("app_logs").insert({
      action_type: "corporate_fatca_query",
      details: {
        startDate,
        endDate,
        recordsFound: formattedData.length
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedData,
        total: count || 0,
        page,
        limit
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Corporate FATCA query error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
});