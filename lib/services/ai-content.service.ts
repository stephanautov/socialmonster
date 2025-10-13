/**
 * AI Content Generation Service
 * Integrates with OpenAI and Anthropic APIs for content creation
 */

import OpenAI from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { ApiResponse } from '@/types/api-responses'

export interface ContentGenerationRequest {
  prompt: string
  contentType: 'social_post' | 'caption' | 'brand_copy' | 'blog_post'
  platform?: 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'facebook' | 'youtube'
  tone?: 'professional' | 'casual' | 'friendly' | 'formal' | 'creative'
  maxLength?: number
  brandContext?: {
    companyName: string
    industry: string
    targetAudience: string
    brandPersonality: string
  }
}

export interface GeneratedContent {
  content: string
  variants?: string[]
  hashtags?: string[]
  platform_specific?: {
    [platform: string]: string
  }
  metadata: {
    wordCount: number
    characterCount: number
    estimatedReadTime: string
    generatedAt: Date
  }
}

export interface DesignGenerationRequest {
  companyInfo: {
    name: string
    description: string
    nameSignificance: string
    designPersonality: string
    targetAudience: string
    colorDirection: string
    typography: string
    competitiveExamples: string[]
  }
  assetTypes: ('wordmark' | 'icon' | 'logo' | 'business_card' | 'letterhead')[]
}

export class AIContentService {
  private openai: OpenAI
  private anthropic: Anthropic

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    }
  }

  async generateContent(request: ContentGenerationRequest): Promise<ApiResponse<GeneratedContent>> {
    try {
      logger.info('AIContentService.generateContent', { 
        contentType: request.contentType,
        platform: request.platform 
      })

      const systemPrompt = this.buildSystemPrompt(request)
      const userPrompt = this.buildUserPrompt(request)

      let generatedText: string

      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: request.maxLength ? Math.min(request.maxLength * 2, 2000) : 1000,
          temperature: 0.7
        })

        generatedText = completion.choices[0]?.message?.content || ''
      } else if (this.anthropic) {
        const completion = await this.anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: request.maxLength ? Math.min(request.maxLength * 2, 2000) : 1000,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
          ]
        })

        generatedText = completion.content[0]?.type === 'text' 
          ? completion.content[0].text 
          : ''
      } else {
        throw new Error('No AI service configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY')
      }

      const result = this.processGeneratedContent(generatedText, request)

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      }

    } catch (error) {
      logger.error('AIContentService.generateContent failed', { error })
      return {
        success: false,
        error: {
          code: 'CONTENT_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Content generation failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async generateBrandAssets(request: DesignGenerationRequest): Promise<ApiResponse<any>> {
    try {
      logger.info('AIContentService.generateBrandAssets', { 
        companyName: request.companyInfo.name,
        assetTypes: request.assetTypes 
      })

      const designPrompt = this.buildDesignPrompt(request)

      if (!this.openai) {
        throw new Error('OpenAI API key required for brand asset generation')
      }

      // Generate design concepts and descriptions
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional brand designer. Create detailed design specifications and concepts based on the provided company information.' 
          },
          { role: 'user', content: designPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.8
      })

      const designConcepts = completion.choices[0]?.message?.content || ''

      return {
        success: true,
        data: {
          designConcepts,
          companyInfo: request.companyInfo,
          assetTypes: request.assetTypes,
          generatedAt: new Date().toISOString(),
          // Note: Actual visual asset generation would require DALL-E or Midjourney integration
          mockups: request.assetTypes.map(type => ({
            type,
            description: `${type} design for ${request.companyInfo.name}`,
            specifications: designConcepts
          }))
        }
      }

    } catch (error) {
      logger.error('AIContentService.generateBrandAssets failed', { error })
      return {
        success: false,
        error: {
          code: 'BRAND_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Brand asset generation failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  private buildSystemPrompt(request: ContentGenerationRequest): string {
    const basePrompt = `You are an expert content creator specializing in ${request.contentType} for ${request.platform || 'various platforms'}.`

    const platformGuidelines = {
      instagram: 'Focus on visual storytelling with engaging captions. Use 3-5 relevant hashtags.',
      tiktok: 'Create engaging, trendy content that captures attention quickly. Use popular hashtags.',
      twitter: 'Keep it concise and engaging. Use relevant hashtags but don\'t overdo it.',
      linkedin: 'Professional tone, value-driven content. Focus on industry insights.',
      facebook: 'Conversational and community-focused. Encourage engagement.',
      youtube: 'Compelling titles and descriptions that improve discoverability.'
    }

    let guidelines = ''
    if (request.platform && platformGuidelines[request.platform]) {
      guidelines = platformGuidelines[request.platform]
    }

    return `${basePrompt} ${guidelines} Tone: ${request.tone || 'engaging'}. ${request.maxLength ? `Keep under ${request.maxLength} characters.` : ''}`
  }

  private buildUserPrompt(request: ContentGenerationRequest): string {
    let prompt = `Create ${request.contentType} content: ${request.prompt}`

    if (request.brandContext) {
      prompt += `\n\nBrand Context:
- Company: ${request.brandContext.companyName}
- Industry: ${request.brandContext.industry}
- Audience: ${request.brandContext.targetAudience}
- Brand Personality: ${request.brandContext.brandPersonality}`
    }

    return prompt
  }

  private buildDesignPrompt(request: DesignGenerationRequest): string {
    const { companyInfo } = request

    return `Create comprehensive design specifications for ${companyInfo.name}:

Company Details:
- Name: ${companyInfo.name}
- Description: ${companyInfo.description}
- Name Significance: ${companyInfo.nameSignificance}
- Design Personality: ${companyInfo.designPersonality}
- Target Audience: ${companyInfo.targetAudience}
- Color Direction: ${companyInfo.colorDirection}
- Typography: ${companyInfo.typography}
- Competitive Examples: ${companyInfo.competitiveExamples.join(', ')}

Asset Types Needed: ${request.assetTypes.join(', ')}

Please provide:
1. Logo concept with detailed description
2. Color palette with hex codes
3. Typography recommendations
4. Visual style guidelines
5. Application examples for each asset type
6. Design rationale based on the company's story and personality`
  }

  private processGeneratedContent(text: string, request: ContentGenerationRequest): GeneratedContent {
    const lines = text.split('\n').filter(line => line.trim())
    const content = lines[0] || text
    
    // Extract hashtags if present
    const hashtagPattern = /#\w+/g
    const hashtags = text.match(hashtagPattern) || []

    return {
      content,
      variants: lines.slice(1, 4), // Up to 3 variants
      hashtags,
      metadata: {
        wordCount: content.split(' ').length,
        characterCount: content.length,
        estimatedReadTime: `${Math.ceil(content.split(' ').length / 200)} min`,
        generatedAt: new Date()
      }
    }
  }
}

export const aiContentService = new AIContentService()