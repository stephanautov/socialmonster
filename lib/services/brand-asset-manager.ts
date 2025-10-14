/**
 * Brand Asset Management Service
 * Centralized management of brand assets with generation, storage, and versioning
 */

import { logger } from '@/lib/logger'
import { ApiResponse } from '@/types/api-responses'
import { aiContentService, DesignGenerationRequest } from './ai-content.service'
import { brandAssetCache } from '@/lib/caching/content-cache'

export interface BrandAsset {
  id: string
  type: 'logo' | 'icon' | 'wordmark' | 'business_card' | 'letterhead' | 'color_palette' | 'typography'
  format: 'svg' | 'png' | 'jpg' | 'pdf' | 'css' | 'json'
  version: string
  url?: string
  content?: string
  metadata: {
    width?: number
    height?: number
    colorSpace?: string
    fileSize?: number
    createdAt: Date
    updatedAt: Date
  }
  brand: {
    companyName: string
    industry: string
    primaryColors: string[]
    secondaryColors: string[]
    fonts: string[]
    designPersonality: string
  }
}

export interface AssetGenerationOptions {
  companyInfo: {
    name: string
    description: string
    industry: string
    targetAudience: string
    brandPersonality: string
    colorPreferences: string[]
    competitiveExamples: string[]
  }
  assetTypes: BrandAsset['type'][]
  formats: BrandAsset['format'][]
  specifications: {
    logoSizes?: number[]
    colorFormats?: ('hex' | 'rgb' | 'hsl' | 'cmyk')[]
    includeMockups?: boolean
    includeUsageGuidelines?: boolean
  }
}

export interface BrandStyleGuide {
  companyName: string
  logoUsage: {
    minimumSize: string
    clearSpace: string
    backgrounds: string[]
    restrictions: string[]
  }
  colorPalette: {
    primary: { name: string; hex: string; rgb: string; cmyk: string }[]
    secondary: { name: string; hex: string; rgb: string; cmyk: string }[]
    neutral: { name: string; hex: string; rgb: string; cmyk: string }[]
  }
  typography: {
    primary: { name: string; weights: string[]; useCases: string[] }
    secondary: { name: string; weights: string[]; useCases: string[] }
    web: { fontFamily: string; fallbacks: string[] }
  }
  imagery: {
    style: string
    colorTreatment: string
    composition: string
    restrictions: string[]
  }
  applicationExamples: {
    businessCard: string
    letterhead: string
    website: string
    socialMedia: string
  }
}

export class BrandAssetManager {
  private assets = new Map<string, BrandAsset>()

  async generateBrandAssets(options: AssetGenerationOptions): Promise<ApiResponse<{
    assets: BrandAsset[]
    styleGuide: BrandStyleGuide
    usageGuidelines: string
  }>> {
    try {
      logger.info('BrandAssetManager.generateBrandAssets', {
        company: options.companyInfo.name,
        assetTypes: options.assetTypes,
        formats: options.formats
      })

      // Generate design concepts using AI service
      const designRequest: DesignGenerationRequest = {
        companyInfo: {
          name: options.companyInfo.name,
          description: options.companyInfo.description,
          nameSignificance: `${options.companyInfo.name} represents ${options.companyInfo.description}`,
          designPersonality: options.companyInfo.brandPersonality,
          targetAudience: options.companyInfo.targetAudience,
          colorDirection: options.companyInfo.colorPreferences.join(', '),
          typography: 'Modern, professional typography that reflects brand personality',
          competitiveExamples: options.companyInfo.competitiveExamples
        },
        assetTypes: options.assetTypes
      }

      const designResult = await aiContentService.generateBrandAssets(designRequest)
      if (!designResult.success) {
        throw new Error(`Design generation failed: ${designResult.error?.message}`)
      }

      // Create brand assets
      const assets: BrandAsset[] = []
      const assetId = `brand-${options.companyInfo.name.toLowerCase().replace(/\s+/g, '-')}`

      for (const assetType of options.assetTypes) {
        for (const format of options.formats) {
          if (this.isValidAssetFormatCombination(assetType, format)) {
            const asset: BrandAsset = {
              id: `${assetId}-${assetType}-${format}`,
              type: assetType,
              format,
              version: '1.0.0',
              content: this.generateAssetContent(assetType, format, designResult.data),
              metadata: {
                width: this.getAssetDimensions(assetType, format).width,
                height: this.getAssetDimensions(assetType, format).height,
                colorSpace: format === 'svg' ? 'RGB' : 'sRGB',
                createdAt: new Date(),
                updatedAt: new Date()
              },
              brand: {
                companyName: options.companyInfo.name,
                industry: options.companyInfo.industry,
                primaryColors: this.extractPrimaryColors(options.companyInfo.colorPreferences),
                secondaryColors: this.extractSecondaryColors(options.companyInfo.colorPreferences),
                fonts: this.recommendFonts(options.companyInfo.brandPersonality),
                designPersonality: options.companyInfo.brandPersonality
              }
            }

            assets.push(asset)
            this.assets.set(asset.id, asset)
          }
        }
      }

      // Generate comprehensive style guide
      const styleGuide = this.generateStyleGuide(options.companyInfo, assets, designResult.data)

      // Generate usage guidelines
      const usageGuidelines = this.generateUsageGuidelines(options.companyInfo, assets)

      // Cache the complete brand package
      const cacheKey = `brand-package-${options.companyInfo.name.toLowerCase()}`
      const result = { assets, styleGuide, usageGuidelines }
      brandAssetCache.set(cacheKey, result, 24 * 60 * 60 * 1000) // 24 hour cache

      logger.info('Brand assets generated successfully', {
        company: options.companyInfo.name,
        assetCount: assets.length,
        styleGuideComplete: true
      })

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          generatedAssets: assets.length,
          totalFileSize: assets.reduce((total, asset) => 
            total + (asset.metadata.fileSize || 0), 0)
        }
      }

    } catch (error) {
      logger.error('BrandAssetManager.generateBrandAssets failed', { error })
      return {
        success: false,
        error: {
          code: 'BRAND_ASSET_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Brand asset generation failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async getBrandAssets(companyName: string): Promise<BrandAsset[]> {
    const assets: BrandAsset[] = []
    for (const [id, asset] of this.assets) {
      if (asset.brand.companyName === companyName) {
        assets.push(asset)
      }
    }
    return assets
  }

  async updateAsset(assetId: string, updates: Partial<BrandAsset>): Promise<ApiResponse<BrandAsset>> {
    try {
      const existingAsset = this.assets.get(assetId)
      if (!existingAsset) {
        return {
          success: false,
          error: {
            code: 'ASSET_NOT_FOUND',
            message: `Asset ${assetId} not found`,
            details: [],
            timestamp: new Date().toISOString()
          }
        }
      }

      const updatedAsset: BrandAsset = {
        ...existingAsset,
        ...updates,
        metadata: {
          ...existingAsset.metadata,
          ...updates.metadata,
          updatedAt: new Date()
        }
      }

      this.assets.set(assetId, updatedAsset)

      return {
        success: true,
        data: updatedAsset,
        metadata: {
          timestamp: new Date().toISOString(),
          version: updatedAsset.version
        }
      }

    } catch (error) {
      logger.error('BrandAssetManager.updateAsset failed', { assetId, error })
      return {
        success: false,
        error: {
          code: 'ASSET_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Asset update failed',
          details: [],
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  private isValidAssetFormatCombination(type: BrandAsset['type'], format: BrandAsset['format']): boolean {
    const validCombinations: Record<BrandAsset['type'], BrandAsset['format'][]> = {
      logo: ['svg', 'png', 'jpg'],
      icon: ['svg', 'png'],
      wordmark: ['svg', 'png'],
      business_card: ['pdf', 'png'],
      letterhead: ['pdf'],
      color_palette: ['css', 'json'],
      typography: ['css', 'json']
    }

    return validCombinations[type]?.includes(format) || false
  }

  private generateAssetContent(type: BrandAsset['type'], format: BrandAsset['format'], designData: any): string {
    // This would integrate with actual design tools or generate appropriate content
    // For now, return placeholder content with proper structure
    switch (format) {
      case 'svg':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
          <text x="10" y="40" font-family="Arial" font-size="24" fill="#333">
            ${designData.companyInfo?.name || 'Logo'}
          </text>
        </svg>`
      case 'css':
        return type === 'color_palette' 
          ? `:root {
              --primary-color: #007bff;
              --secondary-color: #6c757d;
              --accent-color: #28a745;
            }`
          : `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            .brand-typography {
              font-family: 'Inter', sans-serif;
            }`
      case 'json':
        return JSON.stringify({
          type,
          generated: new Date().toISOString(),
          specifications: designData.designConcepts || 'AI-generated brand asset'
        }, null, 2)
      default:
        return `Generated ${type} in ${format} format`
    }
  }

  private getAssetDimensions(type: BrandAsset['type'], format: BrandAsset['format']): { width: number; height: number } {
    const dimensions: Record<BrandAsset['type'], { width: number; height: number }> = {
      logo: { width: 300, height: 100 },
      icon: { width: 64, height: 64 },
      wordmark: { width: 200, height: 60 },
      business_card: { width: 1050, height: 600 }, // 3.5" x 2" at 300 DPI
      letterhead: { width: 2550, height: 3300 }, // 8.5" x 11" at 300 DPI
      color_palette: { width: 400, height: 200 },
      typography: { width: 500, height: 300 }
    }

    return dimensions[type]
  }

  private extractPrimaryColors(preferences: string[]): string[] {
    // Extract or generate primary colors based on preferences
    const colorMap: Record<string, string[]> = {
      blue: ['#007bff', '#0056b3'],
      green: ['#28a745', '#1e7e34'],
      red: ['#dc3545', '#c82333'],
      purple: ['#6f42c1', '#5a32a3'],
      orange: ['#fd7e14', '#e55100']
    }

    const primaryColors: string[] = []
    for (const pref of preferences) {
      const colors = colorMap[pref.toLowerCase()]
      if (colors) {
        primaryColors.push(...colors)
      }
    }

    return primaryColors.length > 0 ? primaryColors : ['#007bff', '#0056b3']
  }

  private extractSecondaryColors(preferences: string[]): string[] {
    return ['#6c757d', '#495057', '#adb5bd', '#e9ecef']
  }

  private recommendFonts(personality: string): string[] {
    const fontRecommendations: Record<string, string[]> = {
      professional: ['Inter', 'Roboto', 'Open Sans'],
      creative: ['Montserrat', 'Poppins', 'Nunito'],
      modern: ['Source Sans Pro', 'Lato', 'Work Sans'],
      elegant: ['Playfair Display', 'Crimson Text', 'Libre Baskerville'],
      tech: ['JetBrains Mono', 'Fira Code', 'Monaco']
    }

    const key = Object.keys(fontRecommendations).find(k => 
      personality.toLowerCase().includes(k)
    )

    return fontRecommendations[key || 'professional']
  }

  private generateStyleGuide(companyInfo: any, assets: BrandAsset[], designData: any): BrandStyleGuide {
    const primaryAsset = assets.find(a => a.type === 'logo')
    
    return {
      companyName: companyInfo.name,
      logoUsage: {
        minimumSize: '32px width for digital, 0.5 inch width for print',
        clearSpace: 'Minimum clear space equal to the height of the logo',
        backgrounds: ['White', 'Light gray (#f8f9fa)', 'Dark backgrounds with white logo variant'],
        restrictions: ['Do not stretch or distort', 'Do not change colors', 'Do not add effects or shadows']
      },
      colorPalette: {
        primary: primaryAsset?.brand.primaryColors.map((color, idx) => ({
          name: `Primary ${idx + 1}`,
          hex: color,
          rgb: this.hexToRgb(color),
          cmyk: this.hexToCmyk(color)
        })) || [],
        secondary: primaryAsset?.brand.secondaryColors.map((color, idx) => ({
          name: `Secondary ${idx + 1}`,
          hex: color,
          rgb: this.hexToRgb(color),
          cmyk: this.hexToCmyk(color)
        })) || [],
        neutral: ['#ffffff', '#f8f9fa', '#6c757d', '#343a40'].map((color, idx) => ({
          name: `Neutral ${idx + 1}`,
          hex: color,
          rgb: this.hexToRgb(color),
          cmyk: this.hexToCmyk(color)
        }))
      },
      typography: {
        primary: {
          name: primaryAsset?.brand.fonts[0] || 'Inter',
          weights: ['400', '500', '600', '700'],
          useCases: ['Headlines', 'Subheadings', 'Logo text']
        },
        secondary: {
          name: primaryAsset?.brand.fonts[1] || 'Open Sans',
          weights: ['400', '600'],
          useCases: ['Body text', 'Captions', 'Small text']
        },
        web: {
          fontFamily: `'${primaryAsset?.brand.fonts[0] || 'Inter'}', sans-serif`,
          fallbacks: ['Arial', 'Helvetica', 'sans-serif']
        }
      },
      imagery: {
        style: companyInfo.brandPersonality,
        colorTreatment: 'High contrast with brand colors as accents',
        composition: 'Clean, professional composition with ample white space',
        restrictions: ['Avoid cluttered images', 'Maintain consistent color treatment']
      },
      applicationExamples: {
        businessCard: 'Logo top-left, contact info right-aligned, brand colors as accents',
        letterhead: 'Logo top-center, company details in footer, brand color line dividers',
        website: 'Logo top-left navigation, brand colors for buttons and links, typography hierarchy',
        socialMedia: 'Logo watermark bottom-right, brand colors in graphics, consistent fonts'
      }
    }
  }

  private generateUsageGuidelines(companyInfo: any, assets: BrandAsset[]): string {
    return `
# Brand Usage Guidelines for ${companyInfo.name}

## Logo Usage
- Always use the provided logo files - do not recreate or modify
- Maintain minimum clear space around the logo
- Use appropriate logo variant for background (light/dark)
- Never stretch, rotate, or apply effects to the logo

## Color Guidelines
- Use primary colors for main brand elements
- Use secondary colors for supporting elements
- Ensure sufficient contrast for accessibility (4.5:1 minimum)
- Avoid using colors outside the approved palette

## Typography
- Use primary font for headlines and important text
- Use secondary font for body text and supporting content
- Maintain consistent font weights and sizes
- Ensure readability across all mediums

## Digital Applications
- Use SVG format for web when possible for crisp rendering
- Use PNG with transparency for complex backgrounds
- Optimize images for web while maintaining quality
- Follow responsive design principles

## Print Applications
- Use high-resolution files (300 DPI minimum)
- Convert colors to CMYK for print production
- Include bleed areas where required
- Proof colors before final production

## Brand Voice
Industry: ${companyInfo.industry}
Personality: ${companyInfo.brandPersonality}
Target Audience: ${companyInfo.targetAudience}

Maintain consistency across all brand touchpoints and applications.
    `.trim()
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return 'rgb(0,0,0)'
    
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    
    return `rgb(${r},${g},${b})`
  }

  private hexToCmyk(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return 'cmyk(0,0,0,100)'
    
    const r = parseInt(result[1], 16) / 255
    const g = parseInt(result[2], 16) / 255
    const b = parseInt(result[3], 16) / 255
    
    const k = 1 - Math.max(r, g, b)
    const c = (1 - r - k) / (1 - k) || 0
    const m = (1 - g - k) / (1 - k) || 0
    const y = (1 - b - k) / (1 - k) || 0
    
    return `cmyk(${Math.round(c * 100)},${Math.round(m * 100)},${Math.round(y * 100)},${Math.round(k * 100)})`
  }
}

export const brandAssetManager = new BrandAssetManager()