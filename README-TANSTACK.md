# Zen Writing - TanStack Start Version

A zen-like writing environment where imagery from Unsplash automatically surfaces based on your live input, creating a visual reflection of your thoughts.

## Migration Complete! 🎉

This project has been successfully migrated from separate backend/frontend folders to a single TanStack Start application.

## New Architecture

- **Single Codebase**: No more separate backend and frontend folders
- **TanStack Start**: Full-stack React framework with SSR/SSG capabilities
- **Server Functions**: Backend logic now runs as server functions
- **Type Safety**: Better TypeScript support throughout
- **Simplified Deployment**: Deploy one application instead of two

## Setup Instructions

1. **Install dependencies**:

```bash
npm install
```

2. **Set up environment variables**:

```bash
cp .env.example .env
```

3. **Add your Unsplash Access Key** to `.env`:

```
UNSPLASH_ACCESS_KEY=your_access_key_here
```

4. **Start development server**:

```bash
npm run dev
```

The application will run on `http://localhost:3000`

## Key Changes

### Backend Migration

- Express.js server endpoints converted to TanStack Start server functions
- API routes now in `/src/api/` directory
- Environment variables work the same way

### Frontend Migration

- React Router replaced with TanStack Router
- Components moved to `/src/app/` directory with file-based routing
- All existing functionality preserved

### File Structure

```
src/
├── api/                    # Server functions (was backend/)
│   ├── images.ts          # GET /api/images
│   └── track-download.ts  # POST /api/track-download
├── app/                    # Frontend routes (was frontend/src/)
│   ├── root.tsx           # Root layout
│   ├── index.tsx          # Home page (/)
│   ├── write.tsx          # Writer page (/write)
│   ├── client.tsx         # Client entry
│   └── server.tsx         # Server entry
├── styles/                 # Global styles
├── router.ts              # Router configuration
└── components/            # React components (to be migrated)
```

## Development

The migration maintains all original functionality:

- ✅ Dynamic image fetching from Unsplash
- ✅ Keyword extraction and highlighting
- ✅ Masonry layout gallery
- ✅ PDF export
- ✅ Drawing canvas with ML recognition
- ✅ Responsive design

## Deployment

This single TanStack Start application can be deployed to:

- Vercel (recommended)
- Netlify
- Any Node.js hosting

No more managing separate backend and frontend deployments!

## Next Steps

1. Run `npm install` to install dependencies
2. Copy your `.env` file from the old backend folder
3. Test the application with `npm run dev`
4. Deploy when ready

The migration preserves all features while simplifying the architecture significantly.
