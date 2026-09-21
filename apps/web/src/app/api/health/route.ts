import { NextResponse } from 'next/server';
import { savantStore } from '@/lib/data-store';

export async function GET() {
  let verifierStatus = 'offline';
  try {
    const res = await fetch('http://localhost:8001/health', { next: { revalidate: 0 } });
    if (res.ok) {
      verifierStatus = 'online';
    }
  } catch (err) {
    verifierStatus = 'unreachable (local mode)';
  }

  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    model: savantStore.tutorService.getClient().getModel(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    verifierService: verifierStatus,
    seededNodes: savantStore.graphManager.getAllNodes().length,
    seededEdges: savantStore.graphManager.getAllEdges().length,
    seededItems: savantStore.items.length,
    seededBridges: savantStore.bridges.length
  });
}
