// ─────────────────────────────────────────────────
// GIREAPP — CSP Violation Report Endpoint (BE-SEC-006)
// POST /api/csp-report — logs CSP violations
// ─────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract the CSP violation report
    const report = body['csp-report'] ?? body;

    // Log the violation (in production, send to Sentry or a monitoring service)
    console.warn('[GIREAPP CSP Violation]', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      blockedUri: report['blocked-uri'],
      originalPolicy: report['original-policy']?.substring(0, 200),
      timestamp: new Date().toISOString(),
    });

    // In production, you could forward to Sentry:
    // Sentry.captureMessage('CSP Violation', {
    //   level: 'warning',
    //   extra: { report },
    // });

    return NextResponse.json({ received: true }, { status: 204 });
  } catch {
    // Silently accept malformed reports
    return NextResponse.json({ received: true }, { status: 204 });
  }
}
