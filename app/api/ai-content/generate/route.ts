import { NextRequest, NextResponse } from 'next/server'
import { aiContentService } from '@/lib/services/ai-content.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await aiContentService.generateContent({
      prompt: body.prompt,
      contentType: body.contentType || 'social_post',
      platform: body.platform,
      tone: body.tone || 'engaging',
      maxLength: body.maxLength,
      brandContext: body.brandContext
    })

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Content generation failed',
        details: [],
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}