# FaceSwap AI Campaign Website

A Next.js 15 face-swap campaign website with AI-powered photo transformation, user analytics, and admin dashboard.

## 🚀 Features

- **AI Face-Swap Processing**: Upload photos and get AI-transformed results
- **Real-time Analytics**: Track user engagement and conversion metrics
- **Admin Dashboard**: Monitor campaign performance and user activity
- **Secure File Storage**: AWS S3 integration for image management
- **Database Tracking**: PostgreSQL with Prisma for user data and analytics
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Authentication**: NextAuth.js for secure dashboard access

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Storage**: AWS S3
- **Authentication**: NextAuth.js
- **State Management**: React Query (TanStack Query)
- **Analytics**: Custom analytics with Recharts
- **UI Components**: Lucide React Icons

## 📦 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth configuration
│   │   ├── upload-image/           # Image upload endpoint
│   │   ├── process-faceswap/       # Face-swap processing
│   │   └── get-analytics/          # Analytics data endpoint
│   ├── dashboard/                  # Admin dashboard page
│   ├── page.tsx                    # Landing page
│   └── layout.tsx                  # Root layout
├── components/                     # Reusable UI components
├── lib/
│   ├── prisma.ts                   # Database client
│   ├── aws.ts                      # AWS S3 configuration
│   └── providers.tsx               # React Query & Auth providers
├── types/
│   └── index.ts                    # TypeScript type definitions
└── public/
    └── images/
        └── landing-page/           # Landing page assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- AWS S3 bucket
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd face-swap-campaign
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/faceswap_db"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AWS S3
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your_s3_bucket_name

   # NextAuth.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_key

   # Face Swap API (implement later)
   FACESWAP_API_URL=your_faceswap_api_url
   FACESWAP_API_KEY=your_faceswap_api_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The application uses the following main models:

- **User**: Stores user sessions, uploaded images, and processing status
- **Analytics**: Tracks user events and page interactions
- **DashboardUser**: Admin users for dashboard access
- **Account/Session**: NextAuth.js authentication tables

## 🔧 Configuration

### AWS S3 Setup

1. Create an S3 bucket for image storage
2. Set up IAM user with S3 permissions
3. Configure CORS for web uploads
4. Update environment variables

### Database Setup (Supabase)

1. Create a new Supabase project
2. Get your database URL and API keys
3. Update environment variables
4. Run Prisma migrations

### Face-Swap API Integration

The face-swap processing is currently using placeholder logic. To integrate with your face-swap service:

1. Update `src/app/api/process-faceswap/route.ts`
2. Replace the `simulateFaceSwap` function with your API calls
3. Configure your face-swap API credentials

## 🚦 API Endpoints

- `POST /api/upload-image` - Upload and store user images
- `POST /api/process-faceswap` - Process face-swap requests
- `GET /api/get-analytics` - Retrieve analytics data
- `GET /api/auth/[...nextauth]` - NextAuth.js authentication

## 📱 Pages

- `/` - Landing page with image upload and face-swap functionality
- `/dashboard` - Analytics dashboard for campaign monitoring

## 🔐 Authentication

Dashboard access is protected by NextAuth.js. Configure your preferred authentication providers in `src/app/api/auth/[...nextauth]/route.ts`.

## 📈 Analytics

The application tracks:
- Image uploads and processing status
- User engagement metrics
- Conversion rates
- Processing success/failure rates
- Real-time dashboard statistics

## 🚀 Deployment

### Development (Vercel)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Production (Hostinger)
1. Build the application: `npm run build`
2. Set up Node.js hosting on Hostinger
3. Configure environment variables
4. Deploy the built application

## 📝 TODO

- [ ] Implement actual face-swap API integration
- [ ] Add more authentication providers
- [ ] Enhance analytics with more detailed metrics
- [ ] Add email notifications for processing completion
- [ ] Implement rate limiting for API endpoints
- [ ] Add more comprehensive error handling
- [ ] Create user-facing status page

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Note**: This is the initial setup. The face-swap processing logic needs to be implemented based on your specific AI service requirements.
