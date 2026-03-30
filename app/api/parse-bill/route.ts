import { NextRequest, NextResponse } from 'next/server'
import { parseBillFromBase64, parseBillFromText } from '@/lib/claude'
import { DEMO_CASES } from '@/lib/demo-data'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, employerId } = body

    // Demo mode
    if (type === 'demo') {
      const id = employerId as keyof typeof DEMO_CASES
      const data = DEMO_CASES[id] || DEMO_CASES['meridian']
      await new Promise(r => setTimeout(r, 800)) // simulate processing
      return NextResponse.json({ success: true, data })
    }

    // Real PDF/image upload
    if (type === 'image') {
      const { base64, mediaType } = body
      if (!base64 || !mediaType) {
        return NextResponse.json({ success: false, error: 'Missing file data' }, { status: 400 })
      }
      const data = await parseBillFromBase64(base64, mediaType, employerId || 'uploaded')
      return NextResponse.json({ success: true, data })
    }

    // Text/CSV
    if (type === 'text') {
      const { content } = body
      if (!content) {
        return NextResponse.json({ success: false, error: 'Missing content' }, { status: 400 })
      }
      const data = await parseBillFromText(content, employerId || 'uploaded')
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: 'Invalid request type' }, { status: 400 })

  } catch (err) {
    console.error('Parse bill error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to parse bill'
    }, { status: 500 })
  }
}
