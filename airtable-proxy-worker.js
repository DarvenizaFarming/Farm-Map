// Darveniza's Tropical Fruit - Airtable proxy Worker
// Holds the Airtable API key server-side so it never ships to the browser.
// Deploy this on Cloudflare Workers (free tier). Set AIRTABLE_TOKEN as a
// Worker "Secret" in the dashboard - do NOT paste the key into this file.

const BASE_ID = "appqwWfRyJQ72H6On";

// Only allow requests from your GitHub Pages site. Update this to match
// exactly where the app is hosted (e.g. "https://darvenizafarming.github.io").
const ALLOWED_ORIGIN = "https://darvenizafarming.github.io";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    // Everything after the Worker's own domain (path + query string) is
    // forwarded straight through to Airtable, e.g.
    //   https://your-worker.workers.dev/tblXXXX?fields[]=Name
    // becomes
    //   https://api.airtable.com/v0/appqwWfRyJQ72H6On/tblXXXX?fields[]=Name
    const airtableUrl = "https://api.airtable.com/v0/" + BASE_ID + url.pathname + url.search;

    const init = {
      method: request.method,
      headers: {
        "Authorization": "Bearer " + env.AIRTABLE_TOKEN,
        "Content-Type": "application/json",
      },
    };
    if (request.method === "POST" || request.method === "PATCH") {
      init.body = await request.text();
    }

    const airtableRes = await fetch(airtableUrl, init);
    const body = await airtableRes.text();

    return new Response(body, {
      status: airtableRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
