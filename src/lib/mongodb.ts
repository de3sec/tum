import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose.connection
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect

// Analytics Event Schema
const AnalyticsEventSchema = new mongoose.Schema({
  websiteId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true },
  userId: { type: String, sparse: true },
  eventType: { 
    type: String, 
    required: true,
    enum: ['pageview', 'click', 'scroll', 'resize', 'form_submit', 'engagement', 'custom']
  },
  eventData: {
    // For pageview events
    url: String,
    title: String,
    referrer: String,
    
    // For click events
    x: Number,
    y: Number,
    element: String,
    elementText: String,
    elementClasses: String,
    elementId: String,
    
    // For scroll events
    scrollDepth: Number,
    maxScroll: Number,
    
    // For resize events
    windowWidth: Number,
    windowHeight: Number,
    
    // For engagement events
    timeOnPage: Number,
    interactionCount: Number,
    
    // Device/browser info
    userAgent: String,
    screenWidth: Number,
    screenHeight: Number,
    deviceType: String,
    browserName: String,
    browserVersion: String,
    os: String,
    
    // Geographic info
    country: String,
    city: String,
    region: String,
    
    // Custom properties
    customProperties: mongoose.Schema.Types.Mixed
  },
  timestamp: { type: Date, default: Date.now, index: true },
  ip: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// Website Schema
const WebsiteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  domain: { type: String, required: true },
  name: { type: String, required: true },
  trackingId: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  settings: {
    trackClicks: { type: Boolean, default: true },
    trackScrolls: { type: Boolean, default: true },
    trackPageViews: { type: Boolean, default: true },
    trackUserSessions: { type: Boolean, default: true },
    samplingRate: { type: Number, default: 1.0, min: 0, max: 1 },
    excludePaths: [String],
    allowedDomains: [String]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// Session Schema
const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  websiteId: { type: String, required: true, index: true },
  userId: String,
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number,
  pageViews: { type: Number, default: 0 },
  events: { type: Number, default: 0 },
  bounced: { type: Boolean, default: false },
  exitPage: String,
  entryPage: String,
  deviceInfo: {
    userAgent: String,
    screenWidth: Number,
    screenHeight: Number,
    deviceType: String,
    browserName: String,
    browserVersion: String,
    os: String
  },
  geoInfo: {
    country: String,
    city: String,
    region: String,
    ip: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// Create indexes for performance
AnalyticsEventSchema.index({ websiteId: 1, timestamp: -1 })
AnalyticsEventSchema.index({ sessionId: 1, timestamp: 1 })
AnalyticsEventSchema.index({ websiteId: 1, eventType: 1, timestamp: -1 })

WebsiteSchema.index({ userId: 1, createdAt: -1 })
SessionSchema.index({ websiteId: 1, startTime: -1 })

export const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema)
export const Website = mongoose.models.Website || mongoose.model('Website', WebsiteSchema)
export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema) 