# Analytics SaaS Platform

A comprehensive web analytics platform that tracks user behavior, generates heatmaps, and provides AI-powered insights. Built with Next.js, Supabase, MongoDB, and Gemini AI.

## Features

### 🔍 Advanced Analytics
- **Real-time tracking** of page views, clicks, scrolls, and user sessions
- **Device and browser detection** with detailed breakdowns
- **Geographic data collection** for visitor insights
- **Custom event tracking** with flexible API

### 🎯 Heatmap Visualization
- **Click heatmaps** showing user interaction patterns
- **Scroll depth tracking** to understand content engagement
- **Interactive visualization** with filtering and date ranges
- **Element-specific analytics** for UI optimization

### 🤖 AI-Powered Insights
- **Gemini AI integration** for intelligent analysis
- **Actionable recommendations** based on data patterns
- **Performance optimization** suggestions
- **Content strategy** insights

### 👥 Multi-Website Management
- **Multiple website tracking** per user account
- **Supabase authentication** with secure user management
- **Individual tracking codes** for each website
- **Granular permission controls**

### 📊 Real-Time Dashboard
- **Live analytics** with 30-second updates
- **Interactive charts** using Recharts
- **Beautiful UI** with Tailwind CSS and shadcn/ui
- **Responsive design** for all devices

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Supabase Auth
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini API
- **Charts**: Recharts
- **Animation**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB database (local or cloud)
- Supabase project
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd analytics-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/analytics-saas
   # For production: mongodb+srv://username:password@cluster.mongodb.net/analytics-saas

   # Gemini AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here

   # App Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Copy the URL and anon key from your project settings
   - Authentication is handled automatically

5. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Create a database named `analytics-saas`
   - The schemas will be created automatically on first run

6. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your environment variables

### Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Create an account**
   Sign up with email/password through the authentication interface

4. **Add your first website**
   - Click "Add Website" in the dashboard
   - Enter your website name and domain
   - Copy the tracking code provided

## Usage

### Adding Tracking to Your Website

1. **Get tracking code** from your dashboard
2. **Add to your website** before the closing `</head>` tag:
   ```html
   <!-- Analytics Tracking Code -->
   <script>
     window.ANALYTICS_CONFIG = {
       trackingId: 'your_tracking_id_here',
       endpoint: 'http://localhost:3000/api/tracking/collect'
     };
   </script>
   <script src="http://localhost:3000/api/tracking/script?id=your_tracking_id_here" async></script>
   <!-- End Analytics Tracking Code -->
   ```

### Tracking Features

The tracking script automatically captures:
- **Page views** with title, URL, and referrer
- **Click events** with precise coordinates and element details
- **Scroll behavior** with depth percentages
- **Session data** with duration and bounce rate
- **Device information** including browser, OS, and screen size
- **Form submissions** (non-sensitive data only)

### Custom Event Tracking

You can also track custom events using the global analytics object:

```javascript
// Track custom events
analytics.track('button_click', {
  button_id: 'cta_button',
  page: 'homepage'
})

// Identify users
analytics.identify('user_123', {
  email: 'user@example.com',
  plan: 'premium'
})

// Track page views manually
analytics.page('Custom Page Name', {
  category: 'ecommerce',
  product_id: '12345'
})
```

## API Reference

### Tracking Endpoints

- `POST /api/tracking/collect` - Collect analytics events
- `GET /api/tracking/script` - Serve tracking script

### Website Management

- `GET /api/websites` - List user's websites
- `POST /api/websites` - Create new website
- `GET /api/websites/[id]` - Get website details
- `PUT /api/websites/[id]` - Update website
- `DELETE /api/websites/[id]` - Delete website

### Analytics Data

- `GET /api/analytics/[websiteId]?type=overview` - Get overview stats
- `GET /api/analytics/[websiteId]?type=heatmap` - Get heatmap data
- `GET /api/analytics/[websiteId]?type=realtime` - Get real-time data

### AI Insights

- `GET /api/insights/[websiteId]` - Generate AI insights

## Performance & Privacy

### Performance Optimizations

- **Sampling rate** control to manage data volume
- **Efficient indexing** for fast MongoDB queries
- **Background processing** for heavy analytics operations
- **CDN-ready** static assets

### Privacy Features

- **No sensitive data** collection (passwords, payment info)
- **Bot detection** and filtering
- **GDPR compliance** ready with data export
- **Do Not Track** header respect
- **IP anonymization** options

## Deployment

### Vercel Deployment

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will handle the build automatically

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
MONGODB_URI=your_production_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Support

For support, email support@youranalytics.com or create an issue in the GitHub repository.

---

Built with ❤️ using Next.js, Supabase, MongoDB, and Gemini AI
