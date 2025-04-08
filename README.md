# Fotowinnow-ag

A modern photo management and processing application built with Next.js.

## Features

- 📸 Image uploading and processing
- 🔐 Secure authentication with Clerk
- 📁 Album and folder organization
- 💧 Watermarking capabilities
- 🎨 Multiple font options for watermarks
- 🖼️ Multiple quality options (512p, 1080p, 2K, 4K)
- 🔄 Real-time image processing

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Database**: Neon (PostgreSQL) with Drizzle ORM
- **Authentication**: Clerk
- **Storage**: Cloudflare R2
- **Styling**: Tailwind CSS with shadcn/ui components
- **Image Processing**: Sharp
- **Development Tools**:
  - ESLint for code linting
  - Prettier for code formatting
  - TypeScript for type safety

## Project Status

### Completed
- [x] Set up database and data model
- [x] Authentication integration
- [x] Image uploading functionality
- [x] Image processing pipeline
- [x] Watermarking system

### In Progress
- [ ] Add ownership to folders/albums and images
- [ ] User permissions and sharing
- [ ] Batch processing capabilities
- [ ] Advanced search and filtering

## Development

### Prerequisites
- Node.js 18+
- npm 11.2.0+
- PostgreSQL database (Neon)
- Cloudflare R2 bucket for storage

### Environment Variables
Required environment variables:
- `DATABASE_URL`: Neon database connection string
- `R2_ENDPOINT`: Cloudflare R2 endpoint
- `R2_ACCESS_KEY_ID`: R2 access key
- `R2_SECRET_ACCESS_KEY`: R2 secret key
- `R2_BUCKET_NAME`: R2 bucket name
- `CLERK_SECRET_KEY`: Clerk secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_WEBHOOK_SECRET`: Clerk webhook secret

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format:write` - Format code with Prettier
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio
