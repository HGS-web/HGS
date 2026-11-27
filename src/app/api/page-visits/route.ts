import { getPageVisits } from "@/lib/page-visits";

// Public read-only total of page views, for the footer figure on other sites (the CV at
// liaskos.eu, the shields.io badge on the GitHub profile). The upstream answer is cached for an
// hour in src/lib/page-visits.ts.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

export async function GET() {
  const pageviews = await getPageVisits();
  if (pageviews === null) {
    return Response.json({ error: "Page visits are not available" }, { status: 503, headers: CORS });
  }
  return Response.json({ pageviews }, { headers: CORS });
}
