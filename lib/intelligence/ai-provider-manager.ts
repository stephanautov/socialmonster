/**
 * AI Provider Management System
 * Intelligent management of multiple AI providers with failover, load balancing, and cost optimization
 */

import OpenAI from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import { apiCache } from '@/lib/caching/content-cache'

export interface AIProvider {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'google' | 'azure' | 'cohere'
  client: any
  models: AIModel[]
  pricing: {
    inputTokens: number  // cost per 1K tokens
    outputTokens: number // cost per 1K tokens
  }
  limits: {
    requestsPerMinute: number
    tokensPerMinute: number
    dailySpend: number
  }
  performance: {
    averageLatency: number
    successRate: number
    lastFailure?: Date
  }
  status: 'active' | 'degraded' | 'offline'
}

export interface AIModel {
  id: string
  name: string
  type: 'text' | 'image' | 'embedding' | 'audio'
  maxTokens: number
  contextWindow: number
  capabilities: string[]
  costTier: 'low' | 'medium' | 'high' | 'premium'
}

export interface AIRequest {
  type: 'text_generation' | 'image_generation' | 'embedding' | 'analysis'
  prompt: string
  maxTokens?: number
  temperature?: number
  model?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  budget?: number // maximum cost in cents
  requirements?: {
    minQuality?: number
    maxLatency?: number
    requiresReasoning?: boolean
  }
}

export interface AIResponse {
  content: string
  model: string
  provider: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cost: number // in cents
  }
  metrics: {
    latency: number
    quality?: number
    satisfaction?: number
  }
}

export interface LoadBalancingStrategy {
  type: 'round_robin' | 'least_cost' | 'best_performance' | 'adaptive'
  weights?: { [providerId: string]: number }
}

export class AIProviderManager {
  private providers = new Map<string, AIProvider>()
  private requestHistory: Array<{ timestamp: Date; providerId: string; success: boolean; cost: number; latency: number }> = []
  private loadBalancer: LoadBalancingStrategy = { type: 'adaptive' }
  private failoverEnabled = true

  constructor() {
    this.initializeProviders()
    this.startHealthMonitoring()
  }

  private initializeProviders(): void {
    // Initialize OpenAI provider
    if (process.env.OPENAI_API_KEY) {
      const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      this.registerProvider({
        id: 'openai',
        name: 'OpenAI',
        type: 'openai',
        client: openaiClient,
        models: [
          {
            id: 'gpt-4-turbo-preview',
            name: 'GPT-4 Turbo',
            type: 'text',
            maxTokens: 4096,
            contextWindow: 128000,
            capabilities: ['reasoning', 'code', 'analysis'],
            costTier: 'premium'
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            type: 'text',
            maxTokens: 4096,
            contextWindow: 16384,
            capabilities: ['conversation', 'summarization'],
            costTier: 'medium'
          }
        ],
        pricing: {
          inputTokens: 0.01, // $0.01 per 1K input tokens
          outputTokens: 0.03  // $0.03 per 1K output tokens
        },
        limits: {
          requestsPerMinute: 500,
          tokensPerMinute: 90000,
          dailySpend: 10000 // $100 daily limit
        },
        performance: {
          averageLatency: 2500,
          successRate: 0.99
        },
        status: 'active'
      })
    }

    // Initialize Anthropic provider
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      this.registerProvider({
        id: 'anthropic',
        name: 'Anthropic',
        type: 'anthropic',
        client: anthropicClient,
        models: [
          {
            id: 'claude-3-sonnet-20240229',
            name: 'Claude 3 Sonnet',
            type: 'text',
            maxTokens: 4096,
            contextWindow: 200000,
            capabilities: ['reasoning', 'analysis', 'safety'],
            costTier: 'high'
          },
          {
            id: 'claude-3-haiku-20240307',
            name: 'Claude 3 Haiku',
            type: 'text',
            maxTokens: 4096,
            contextWindow: 200000,
            capabilities: ['speed', 'efficiency'],
            costTier: 'low'
          }
        ],
        pricing: {
          inputTokens: 0.003,
          outputTokens: 0.015
        },
        limits: {
          requestsPerMinute: 1000,
          tokensPerMinute: 100000,
          dailySpend: 5000
        },
        performance: {
          averageLatency: 3000,
          successRate: 0.98
        },
        status: 'active'
      })
    }

    logger.info('AI Provider Manager initialized', {
      providersCount: this.providers.size,
      activeProviders: Array.from(this.providers.values()).filter(p => p.status === 'active').length
    })
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider)
    logger.info('AI provider registered', {
      id: provider.id,
      name: provider.name,
      modelsCount: provider.models.length
    })
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = performance.now()

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(request)
      const cachedResponse = apiCache.get<AIResponse>(cacheKey)
      if (cachedResponse) {
        logger.info('AI request served from cache', { cacheKey })
        return cachedResponse
      }

      // Select optimal provider
      const selectedProvider = await this.selectProvider(request)
      if (!selectedProvider) {
        throw new Error('No available AI providers')
      }

      // Execute request with selected provider
      const response = await this.executeRequest(selectedProvider, request)
      
      // Update performance metrics
      const latency = performance.now() - startTime
      this.updateProviderMetrics(selectedProvider.id, true, response.usage.cost, latency)

      // Cache successful responses
      apiCache.set(cacheKey, response, 60 * 60 * 1000) // 1 hour cache

      logger.info('AI request completed successfully', {
        provider: selectedProvider.id,
        model: response.model,
        cost: response.usage.cost,
        latency: response.metrics.latency
      })

      return response

    } catch (error) {
      const latency = performance.now() - startTime
      logger.error('AI request failed', { error, latency })

      // Try failover if enabled
      if (this.failoverEnabled) {
        return this.attemptFailover(request, startTime)
      }

      throw error
    }
  }

  private async selectProvider(request: AIRequest): Promise<AIProvider | null> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.status !== 'offline')
      .filter(p => this.hasCapableModel(p, request))

    if (availableProviders.length === 0) {
      return null
    }

    switch (this.loadBalancer.type) {
      case 'least_cost':
        return this.selectByCost(availableProviders, request)
      case 'best_performance':
        return this.selectByPerformance(availableProviders)
      case 'adaptive':
        return this.selectAdaptively(availableProviders, request)
      case 'round_robin':
      default:
        return this.selectRoundRobin(availableProviders)
    }
  }

  private hasCapableModel(provider: AIProvider, request: AIRequest): boolean {
    return provider.models.some(model => {
      if (request.type === 'text_generation' && model.type !== 'text') return false
      if (request.maxTokens && model.maxTokens < request.maxTokens) return false
      if (request.requirements?.requiresReasoning && !model.capabilities.includes('reasoning')) return false
      return true
    })
  }

  private selectByCost(providers: AIProvider[], request: AIRequest): AIProvider {
    const estimatedTokens = this.estimateTokens(request.prompt)
    return providers.reduce((cheapest, current) => {
      const cheapestCost = this.calculateCost(cheapest, estimatedTokens, request.maxTokens || 1000)
      const currentCost = this.calculateCost(current, estimatedTokens, request.maxTokens || 1000)
      return currentCost < cheapestCost ? current : cheapest
    })
  }

  private selectByPerformance(providers: AIProvider[]): AIProvider {
    return providers.reduce((best, current) => {
      const bestScore = best.performance.successRate * (1000 / best.performance.averageLatency)
      const currentScore = current.performance.successRate * (1000 / current.performance.averageLatency)
      return currentScore > bestScore ? current : best
    })
  }

  private selectAdaptively(providers: AIProvider[], request: AIRequest): AIProvider {
    const scores = providers.map(provider => {
      let score = 0

      // Success rate weight (40%)
      score += provider.performance.successRate * 40

      // Latency weight (30%)
      score += (1000 / provider.performance.averageLatency) * 30

      // Cost weight (20%)
      const estimatedCost = this.calculateCost(provider, this.estimateTokens(request.prompt), request.maxTokens || 1000)
      score += (100 - estimatedCost) * 20 / 100

      // Priority adjustment (10%)
      if (request.priority === 'urgent') {
        score += provider.performance.successRate * 10
      } else if (request.priority === 'low') {
        score += (100 - estimatedCost) * 10 / 100
      }

      return { provider, score }
    })

    return scores.reduce((best, current) => current.score > best.score ? current : best).provider
  }

  private selectRoundRobin(providers: AIProvider[]): AIProvider {
    const activeProviders = providers.filter(p => p.status === 'active')
    const index = this.requestHistory.length % activeProviders.length
    return activeProviders[index]
  }

  private async executeRequest(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    const startTime = performance.now()

    try {
      let result: any
      let usage: any

      if (provider.type === 'openai') {
        const response = await provider.client.chat.completions.create({
          model: this.selectModel(provider, request).id,
          messages: [{ role: 'user', content: request.prompt }],
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7
        })

        result = response.choices[0]?.message?.content || ''
        usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

      } else if (provider.type === 'anthropic') {
        const response = await provider.client.messages.create({
          model: this.selectModel(provider, request).id,
          max_tokens: request.maxTokens || 1000,
          messages: [{ role: 'user', content: request.prompt }]
        })

        result = response.content[0]?.type === 'text' ? response.content[0].text : ''
        usage = response.usage || { input_tokens: 0, output_tokens: 0 }
      }

      const latency = performance.now() - startTime
      const cost = this.calculateCost(provider, usage.prompt_tokens || usage.input_tokens || 0, 
                                    usage.completion_tokens || usage.output_tokens || 0)

      return {
        content: result,
        model: this.selectModel(provider, request).id,
        provider: provider.id,
        usage: {
          inputTokens: usage.prompt_tokens || usage.input_tokens || 0,
          outputTokens: usage.completion_tokens || usage.output_tokens || 0,
          totalTokens: usage.total_tokens || (usage.input_tokens + usage.output_tokens) || 0,
          cost: cost
        },
        metrics: {
          latency: latency,
          quality: this.estimateQuality(result, request)
        }
      }

    } catch (error) {
      logger.error('Provider request execution failed', {
        provider: provider.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  private selectModel(provider: AIProvider, request: AIRequest): AIModel {
    const suitableModels = provider.models.filter(model => {
      if (request.type === 'text_generation' && model.type !== 'text') return false
      if (request.maxTokens && model.maxTokens < request.maxTokens) return false
      if (request.requirements?.requiresReasoning && !model.capabilities.includes('reasoning')) return false
      return true
    })

    if (suitableModels.length === 0) {
      return provider.models[0] // fallback
    }

    // Select based on priority and budget
    if (request.priority === 'urgent' || request.requirements?.minQuality) {
      return suitableModels.filter(m => m.costTier === 'premium')[0] || suitableModels[0]
    }

    if (request.priority === 'low' || request.budget) {
      return suitableModels.filter(m => m.costTier === 'low')[0] || suitableModels[0]
    }

    return suitableModels[0]
  }

  private async attemptFailover(request: AIRequest, originalStartTime: number): Promise<AIResponse> {
    const remainingProviders = Array.from(this.providers.values())
      .filter(p => p.status === 'active')
      .sort((a, b) => b.performance.successRate - a.performance.successRate)

    for (const provider of remainingProviders) {
      try {
        logger.info('Attempting failover to provider', { provider: provider.id })
        const response = await this.executeRequest(provider, request)
        
        const totalLatency = performance.now() - originalStartTime
        this.updateProviderMetrics(provider.id, true, response.usage.cost, totalLatency)
        
        return response
      } catch (error) {
        logger.warn('Failover attempt failed', { 
          provider: provider.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        continue
      }
    }

    throw new Error('All providers failed')
  }

  private updateProviderMetrics(providerId: string, success: boolean, cost: number, latency: number): void {
    const provider = this.providers.get(providerId)
    if (!provider) return

    // Update request history
    this.requestHistory.push({
      timestamp: new Date(),
      providerId,
      success,
      cost,
      latency
    })

    // Keep only recent history (last 1000 requests)
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000)
    }

    // Calculate new metrics
    const recentRequests = this.requestHistory
      .filter(r => r.providerId === providerId)
      .slice(-100) // Last 100 requests for this provider

    if (recentRequests.length > 0) {
      const successfulRequests = recentRequests.filter(r => r.success)
      provider.performance.successRate = successfulRequests.length / recentRequests.length
      provider.performance.averageLatency = recentRequests.reduce((sum, r) => sum + r.latency, 0) / recentRequests.length

      if (!success) {
        provider.performance.lastFailure = new Date()
      }
    }

    // Update provider status based on performance
    if (provider.performance.successRate < 0.8) {
      provider.status = 'degraded'
    } else if (provider.performance.successRate < 0.5) {
      provider.status = 'offline'
    } else {
      provider.status = 'active'
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  private calculateCost(provider: AIProvider, inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * provider.pricing.inputTokens
    const outputCost = (outputTokens / 1000) * provider.pricing.outputTokens
    return Math.round((inputCost + outputCost) * 100) // Return cost in cents
  }

  private estimateQuality(response: string, request: AIRequest): number {
    // Simple quality estimation based on response characteristics
    let score = 50

    // Length appropriateness
    if (response.length > 50 && response.length < 2000) score += 10
    
    // Coherence (basic check for complete sentences)
    const sentences = response.split('.').filter(s => s.trim().length > 0)
    if (sentences.length > 1) score += 10

    // Relevance (keyword matching)
    const requestKeywords = request.prompt.toLowerCase().split(' ').filter(w => w.length > 3)
    const responseKeywords = response.toLowerCase().split(' ').filter(w => w.length > 3)
    const overlap = requestKeywords.filter(w => responseKeywords.includes(w))
    score += Math.min(overlap.length * 5, 20)

    // Structure (presence of formatting)
    if (response.includes('\n') || response.includes('-') || response.includes('•')) score += 10

    return Math.min(score, 100)
  }

  private getCacheKey(request: AIRequest): string {
    return `ai-request-${Buffer.from(JSON.stringify({
      type: request.type,
      prompt: request.prompt.substring(0, 100),
      maxTokens: request.maxTokens,
      temperature: request.temperature
    })).toString('base64')}`
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const [id, provider] of this.providers) {
        try {
          // Simple health check with a minimal request
          const healthCheck = await this.executeRequest(provider, {
            type: 'text_generation',
            prompt: 'Hello',
            maxTokens: 5
          })
          
          if (provider.status === 'offline') {
            provider.status = 'active'
            logger.info('Provider recovered', { provider: id })
          }
        } catch (error) {
          if (provider.status === 'active') {
            provider.status = 'degraded'
            logger.warn('Provider degraded', { provider: id })
          }
        }
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
  }

  getProviderStats(): { [providerId: string]: any } {
    const stats: { [providerId: string]: any } = {}

    for (const [id, provider] of this.providers) {
      const recentRequests = this.requestHistory
        .filter(r => r.providerId === id)
        .slice(-100)

      stats[id] = {
        name: provider.name,
        status: provider.status,
        performance: provider.performance,
        recentRequests: recentRequests.length,
        totalCost: recentRequests.reduce((sum, r) => sum + r.cost, 0),
        averageCost: recentRequests.length > 0 
          ? recentRequests.reduce((sum, r) => sum + r.cost, 0) / recentRequests.length 
          : 0
      }
    }

    return stats
  }

  setLoadBalancingStrategy(strategy: LoadBalancingStrategy): void {
    this.loadBalancer = strategy
    logger.info('Load balancing strategy updated', { strategy: strategy.type })
  }
}

export const aiProviderManager = new AIProviderManager()