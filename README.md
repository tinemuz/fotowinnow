# Fotowinnow-ag

A modern photo proofing and delivery application designed for photographers, built with Next.js.

## Overview

Fotowinnow streamlines the workflow for photographers interacting with clients. It allows users to upload photos, organize them into albums, apply customizable watermarks, securely share albums for client feedback (planned), and deliver final images.

## Features

- 📸 **Image Uploading:** Efficiently upload images to Cloudflare R2 storage.
- 📁 **Album Organization:** Create and manage albums to group photos for specific clients or projects.
- 💧 **Watermarking:** Apply text-based watermarks to images. - 🎨 Customizable watermark text per album.
  - (Planned) More options like fonts, quality, position, opacity.
- 🖼️ **Image Processing:** Utilizes Sharp for server-side image manipulations 
- 🔐 **Authentication:** Secure user sign-up and login provided by Clerk 
- ✨ **Modern UI:** Built with Tailwind CSS and shadcn/ui components
- *(Planned)* Secure client sharing & feedback capabilities.
- *(Planned)* Batch processing for actions like watermarking.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Clerk
- **Storage**: Cloudflare R2
- **Styling**: Tailwind CSS with shadcn/ui 
- **Image Processing**: Sharp 
- **Development Tools**:
  - ESLint
  - Prettier

## Project Status

### Completed
- [x] Initial Project Setup (Next.js, TS, Tailwind, Shadcn)
- [x] Database Setup (Neon + Drizzle schema)
- [x] Authentication Integration (Clerk)
- [x] User Profile Sync (Clerk Webhook -> DB)
- [x] Storage Setup (Cloudflare R2)
- [x] Album Creation & Listing (Backend & UI)
- [x] Image Uploading Functionality (Backend & UI -> R2 & DB)
- [x] Image Display within Albums
- [x] Per-Album Watermark Text Configuration (UI & DB)
- [x] Basic Watermarking Action (needs integration with album flow)

### In Progress / Next Steps
- [ ] Implement Backend logic for applying watermarks to all images in an album.
- [ ] Add UI trigger and feedback for album watermarking process.
- [ ] Implement image ownership tracking. - [ ] Implement secure album sharing link generation.
- [ ] Build client review portal.
- [ ] Implement client feedback mechanisms.

### Planned / Future
- [ ] User permissions and fine-grained sharing.
- [ ] Batch processing capabilities (for watermarking, exports, etc.).
- [ ] Advanced search and filtering for albums/photos.
- [ ] Subscription Tiers & Limits enforcement.
- [ ] Final Image Delivery workflow.

## Development

### Prerequisites
- Node.js (Version 18+ recommended)
- npm (Version 11.2.0+ or equivalent package manager like yarn/pnpm)
- Neon Account & PostgreSQL database connection string
- Cloudflare Account & R2 bucket configured
- Clerk Account for API keys and webhook setup
- Git (for cloning)

### Environment Variables
Create a `.env.local` file in the project root and add the following variables:

```bash
# Neon Database
DATABASE_URL="YOUR_NEON_CONNECTION_STRING"

# Cloudflare R2
R2_ENDPOINT="YOUR_R2_ENDPOINT" # e.g., https://<ACCOUNT_ID>[.r2.cloudflarestorage.com](https://www.google.com/search?q=.r2.cloudflarestorage.com)
R2_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY_ID"
R2_SECRET_ACCESS_KEY="YOUR_R2_SECRET_ACCESS_KEY"
R2_BUCKET_NAME="YOUR_R2_BUCKET_NAME"

# Clerk Authentication
CLERK_SECRET_KEY="YOUR_CLERK_SECRET_KEY"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="YOUR_CLERK_PUBLISHABLE_KEY"
CLERK_WEBHOOK_SECRET="YOUR_CLERK_WEBHOOK_SECRET" # For profile sync

# Optional: Clerk Frontend API URL if needed for specific configs
# NEXT_PUBLIC_CLERK_FRONTEND_API="YOUR_CLERK_FRONTEND_API"

# Optional: App URL
# NEXT_PUBLIC_APP_URL="http://localhost:3000" # Or your production URL