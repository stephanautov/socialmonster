import { router } from '../trpc'
import { publicProcedure } from '../trpc'

// Entity routers
import { userRouter } from './routers/users.router'
import { socialMediaConnectionRouter } from './routers/socialmediaconnections.router'
import { brandProjectRouter } from './routers/brandprojects.router'
import { brandAssetRouter } from './routers/brandassets.router'
import { contentPostRouter } from './routers/contentposts.router'
import { scheduledPostRouter } from './routers/scheduledposts.router'
import { contentOptimizationRouter } from './routers/contentoptimizations.router'
import { apiUsageRouter } from './routers/apiusages.router'
import { assetDownloadRouter } from './routers/assetdownloads.router'
// Custom routers
import { customRouter } from './routers/custom.router'

export const appRouter = router({
  // Health check
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),

  // Entity CRUD routers
  user: userRouter,
  socialMediaConnection: socialMediaConnectionRouter,
  brandProject: brandProjectRouter,
  brandAsset: brandAssetRouter,
  contentPost: contentPostRouter,
  scheduledPost: scheduledPostRouter,
  contentOptimization: contentOptimizationRouter,
  apiUsage: apiUsageRouter,
  assetDownload: assetDownloadRouter,

  // Custom endpoints
  custom: customRouter,
})

export type AppRouter = typeof appRouter