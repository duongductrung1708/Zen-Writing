# AuraScribe

A zen-like writing environment where imagery from Unsplash automatically surfaces based on your live input, creating a visual reflection of your thoughts.

## Features

- **Zen Editor**: Borderless textarea with elegant serif typography (EB Garamond)
- **Dynamic Gallery**: Automatically fetches relevant images as you type
- **Smooth Animations**: High-end transitions powered by Framer Motion
- **Secure Backend**: Express.js proxy to protect API credentials
- **Museum Aesthetics**: Editorial design with off-white backgrounds and charcoal text

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Node.js, Express.js
- **APIs**: Unsplash Search API

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Get your Unsplash Access Key:
   - Visit [Unsplash Developers](https://unsplash.com/developers)
   - Create a new application
   - Copy your Access Key

5. Add your Unsplash Access Key to `.env`:
```
UNSPLASH_ACCESS_KEY=your_access_key_here
PORT=3001
```

6. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:3001):
```bash
cp .env.example .env
```

4. Update `.env` if your backend runs on a different port:
```
REACT_APP_API_URL=http://localhost:3001
```

5. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## How It Works

1. **Writing**: Type in the left panel. The editor uses EB Garamond serif font for a classic, editorial feel.

2. **Keyword Extraction**: After 800ms of inactivity, the app extracts the last meaningful word (length > 3 characters) from your text.

3. **Image Fetching**: The extracted keyword is sent to the backend, which securely queries Unsplash API with:
   - 6 images per search
   - Portrait orientation
   - High content filter

4. **Dynamic Gallery**: Images appear on the right side with smooth fade-in and scale-up animations. Old images fade out with a blur effect.

5. **Empty States**: When no text is entered, a subtle "Start Writing" watermark appears.

## Project Structure

```
AuraScribe/
├── backend/
│   ├── server.js          # Express API proxy
│   ├── .env.example       # Environment variables template
│   └── package.json       # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Tailwind & custom styles
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── tailwind.config.js # Tailwind configuration
│   ├── postcss.config.js  # PostCSS configuration
│   ├── .env.example       # Frontend env template
│   └── package.json       # Frontend dependencies
└── README.md              # This file
```

## Design Philosophy

- **Minimalism**: Clean, uncluttered interface focusing on writing
- **Editorial Aesthetics**: Museum-style typography and spacing
- **Smooth Interactions**: Every transition is carefully animated
- **Visual Reflection**: Images serve as a mirror to your thoughts

## License

MIT

