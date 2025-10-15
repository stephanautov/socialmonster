import { NextRequest, NextResponse } from 'next/server'
import { socialMediaIntegrationService } from '@/lib/services/social-media-integration.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const postData: any = {
      platform: body.platform,
      content: body.content,
      mediaUrls: body.mediaUrls,
      hashtags: body.hashtags,
      connectionId: body.connectionId
    }
    
    if (body.scheduledAt) {
      postData.scheduledAt = new Date(body.scheduledAt)
    }

    const result = await socialMediaIntegrationService.postToSocialMedia(postData)

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
        message: 'Social media posting failed',
        details: [],
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}