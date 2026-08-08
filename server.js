import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import sequelize from './config/database.js'
import cookieParser from 'cookie-parser'
import otpRoutes from './routes/OtpRoutes.js'
import authRoutes from './routes/AuthRoutes.js'
import influencerRoutes from './routes/InfluencerRoutes.js'
import cityRoutes from './routes/CityRoutes.js'
import businessTypeRoutes from './routes/businessTypeRoutes.js'
import businessRoutes from './routes/businessRoutes.js'
import campaignRoutes from './routes/campaignRoutes.js'
import brandRoutes from './routes/brandRoutes.js'
import businessHackRoutes from './routes/businessHackRoutes.js'
import businessHackDetailRoutes from './routes/businessHackDetailRoutes.js'
import businessHackStep3Routes from './routes/businessHackDetail2Routes.js'
import businessHackStep4Routes from './routes/businessHackStep4Routes.js'
import influencerUserRoutes from './routes/InfluencerUserRoutes.js'
import influencerCategoryRoutes from './routes/InfluencerCategoryRoutes.js'
import profileRoutes from './routes/ProfileRoutes.js'
import BusinessRoutes from './routes/businessRoutes.js'
import cityRoutesTwo from './routes/CityRoutesTwo.js'
import influencerListRoutes from './routes/influencerListRoutes.js'
import inhacksRoutes from './routes/inhacksRoutes.js'
import businessHacksRoutes from './routes/businessHackRoutes.js'
import referralRoutes from './routes/referralRoutes.js'
import bannerRoutes from './routes/bannerRoutes.js'
import influencerDashboardRoutes from './routes/influencerDashboardRoutes.js'
import campaignDataRoutes from './routes/campaignRoutes.js'
import productRoutes from './routes/productRoutes.js'
import allCampaignDataRoutes from './routes/AllCampaignDataRoute.js'
import applicationRoutes from './routes/applicationRoutes.js'
import dealRoutes from './routes/dealRoutes.js'
import { seedCampaignTypes } from './seeders/seedCampaignTypes.js'
import { runAllSeeders } from './seeders/runAllSeeders.js'
import notificationRoutes from './routes/notification.routes.js'
import './models/Associations.js'

const app = express()

app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
)

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: 'Too many attempts, try again later'
})
app.use('/api/auth', authLimiter)

app.use((req, res, next) => {
  console.log('Incoming:', req.method, req.url)
  next()
})

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '1d',
    dotfiles: 'deny'
  })
)

app.get('/', (req, res) => {
  res.send('Collaby Backend Running ')
})

app.use('/api/auth', otpRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/influencers', influencerRoutes)
app.use('/api/cities', cityRoutes)
app.use('/api', businessTypeRoutes)
app.use('/api/business', businessRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/campaigns-step1', businessHackRoutes)
app.use('/api/campaigns-details', businessHackDetailRoutes)
app.use('/api/campaigns-step3', businessHackStep3Routes)
app.use('/api/campaigns-step4', businessHackStep4Routes)
app.use('/api/influencers-user', influencerUserRoutes)
app.use('/api/categories', influencerCategoryRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/business-profile', BusinessRoutes)
app.use('/api/city', cityRoutesTwo)
app.use('/api', influencerListRoutes)
app.use('/api/inhacks', inhacksRoutes)
app.use('/api/business-hacks-video', businessHacksRoutes)
app.use('/api/referrals', referralRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/influencer-dashboard', influencerDashboardRoutes)
app.use('/api/data', campaignDataRoutes)
app.use('/api/products', productRoutes)
app.use('/api/all-detail', allCampaignDataRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/deals', dealRoutes)
app.use('/api/notifications', notificationRoutes)

app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

console.log('ENV CHECK --->', process.env.RUN_SEEDER)

const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connected successfully')

    if (process.env.DB_FORCE_SYNC === 'true') {
      console.log('⚠️ DB_FORCE_SYNC=true')
      console.log('⚠️ Dropping and recreating all database tables...')

      await sequelize.sync({ force: true })

      console.log('✅ Tables recreated successfully')
    } else {
      console.log('🔄 Synchronizing database...')

      await sequelize.sync({ alter: true })

      console.log('✅ Tables synchronized successfully')
    }

    if (process.env.RUN_SEEDER === 'true') {
      console.log('🌱 Running seeders...')
      await runAllSeeders()
      console.log('✅ Seeders completed')
    }

    const PORT = process.env.PORT || 5000

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`)
    })
  } catch (error) {
    console.error('❌ DB Error:', error)

    if (error.errors) {
      console.log('Validation Errors:')

      error.errors.forEach(err => {
        console.log({
          message: err.message,
          field: err.path,
          value: err.value,
          type: err.type
        })
      })
    }

    process.exit(1)
  }
}

startServer()

const shutdown = async signal => {
  console.log(`Received ${signal}`)

  try {
    await sequelize.close()
    console.log('DB connection closed')
    process.exit(0)
  } catch (err) {
    console.error('Error closing DB:', err.message)
    process.exit(1)
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

process.on('SIGUSR2', async () => {
  console.log('Nodemon restart...')
  await sequelize.close()
  process.kill(process.pid, 'SIGUSR2')
})
