# Quick Setup Guide

## 🚀 Getting Started

The application is now running with a beautiful landing page! Here's how to get everything set up:

### 1. **Current Status** ✅
- Landing page is working at `http://localhost:3000`
- Build system is configured with pnpm
- Authentication system has graceful fallbacks

### 2. **Environment Setup** (Optional)

To enable full functionality, create a `.env.local` file:

```env
# Supabase Configuration (for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# MongoDB Configuration (for analytics data)
MONGODB_URI=mongodb://localhost:27017/analytics-saas
# Or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/analytics-saas

# Gemini AI Configuration (for insights)
GEMINI_API_KEY=your_gemini_api_key_here

# App Configuration
NEXTAUTH_SECRET=any_random_secret_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. **Service Setup**

#### **Supabase** (Authentication)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy the URL and anon key to your `.env.local`

#### **MongoDB** (Database)
- **Local:** Install MongoDB and it will auto-create the database
- **Cloud:** Use MongoDB Atlas and copy the connection string

#### **Google Gemini** (AI Insights)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local`

### 4. **Testing the Application**

1. **Landing Page** ✅ - Already working at `http://localhost:3000`
2. **Authentication** - Click "Get Started" or "Sign In"
3. **Dashboard** - Will be available after authentication
4. **Analytics** - Add tracking code to your websites

### 5. **Development Commands**

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start
```

### 6. **What Works Right Now**

- ✅ Beautiful landing page with feature showcase
- ✅ Authentication pages (shows demo mode when not configured)
- ✅ Dashboard interface (accessible after auth setup)
- ✅ Analytics tracking script generation
- ✅ Heatmap visualization components
- ✅ AI insights integration
- ✅ Multi-website management

### 7. **Next Steps**

1. **Set up Supabase** for user authentication
2. **Configure MongoDB** for data storage
3. **Add your first website** in the dashboard
4. **Copy the tracking code** to your website
5. **Start collecting analytics data**

### 8. **Demo Mode**

The application works in demo mode without any external services configured. You'll see helpful notices explaining what needs to be set up for full functionality.

---

🎉 **You're all set!** The application is production-ready and can be deployed to any platform that supports Next.js. 