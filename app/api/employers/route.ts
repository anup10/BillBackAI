import { NextResponse } from 'next/server'
import { DEMO_EMPLOYERS } from '@/lib/demo-data'

export async function GET() {
  return NextResponse.json({ employers: DEMO_EMPLOYERS })
}
