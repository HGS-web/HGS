// Total page views of the production site since Vercel Web Analytics was enabled, read from the
// Web Analytics count endpoint. Unlike the dashboard, this count is not limited to the plan's
// reporting window. https://vercel.com/docs/rest-api/web-analytics/counts-page-views
//
// VERCEL_ANALYTICS_TOKEN (server-only, Vercel project settings) is an access token scoped to the
// hgs project. VERCEL_PROJECT_ID is a Vercel system variable, set automatically at runtime.

const ENDPOINT = "https://api.vercel.com/v1/query/web-analytics/visits/count";

// The Vercel team "Hellenic Geographical Society's projects", which owns the hgs project.
const TEAM_ID = "team_QOkRazaX4NujQ99cvAkJogYV";

// One request per hour at most; every page render in between reuses the cached answer.
const REVALIDATE_SECONDS = 3600;

export async function getPageVisits(): Promise<number | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;

  const params = new URLSearchParams({ projectId, teamId: TEAM_ID });

  try {
    const response = await fetch(`${ENDPOINT}?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const payload: { data?: { pageviews?: unknown } } = await response.json();
    const pageviews = payload.data?.pageviews;
    return typeof pageviews === "number" && Number.isInteger(pageviews) && pageviews >= 0
      ? pageviews
      : null;
  } catch {
    return null;
  }
}
