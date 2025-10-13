import { NextRequest, NextResponse } from 'next/server'
import { aiContentService } from '@/lib/services/ai-content.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await aiContentService.generateBrandAssets({
      companyInfo: {
        name: body.companyName,
        description: body.companyDescription,
        nameSignificance: body.nameSignificance,
        designPersonality: body.designPersonality,
        targetAudience: body.targetAudience,
        colorDirection: body.colorDirection,
        typography: body.typography,
        competitiveExamples: body.competitiveExamples || []
      },
      assetTypes: body.assetTypes || ['wordmark', 'icon', 'logo']
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
        message: 'Brand asset generation failed',
        details: [],
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}