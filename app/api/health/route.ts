/**
 * Coolify's container health check. It answers without calling Reddit or reading
 * the session, so checking every few seconds costs nothing against Reddit's budget.
 * The Datadog Agent drops its traces (`DD_APM_IGNORE_RESOURCES`).
 */
export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
}
