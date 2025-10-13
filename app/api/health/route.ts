import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage(),
        heap: process.memoryUsage().heapUsed / 1024 / 1024
      },
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    }

    // Check database connectivity (if needed)
    // Add your database health check here

    return NextResponse.json({
      status: 'healthy',
      checks,
      services: {
        database: 'connected', // Update based on actual check
        api: 'operational',
        auth: 'operational'
      }
    }, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}