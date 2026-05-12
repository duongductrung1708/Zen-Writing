# 🌿 Zen Writing

A zen-like, full-stack writing environment where live input triggers a visual reflection of your thoughts. Built with a museum-inspired aesthetic and cutting-edge web technologies.

## ✨ New in Version 2.0 (Modernized)

- **Full TypeScript Migration**: 100% type-safe codebase for robust development.
- **Full-stack Architecture**: Powered by **TanStack Start**, replacing the old separate Backend/Frontend setup.
- **RPC (Server Functions)**: Native server functions for API security without manual Express setup.
- **AI Sketch Recognition**: Draw your thoughts on a canvas and let AI (ML5.js) recognize and find images.
- **Advanced Pan-Zoom Gallery**: Interactively explore images with fluid masonry layout and multi-touch support.

## 🚀 Tech Stack

- **Framework**: [TanStack Start](https://www.google.com/search?q=https://tanstack.com/router/v1/docs/guide/start/overview) (React 18+)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **AI Integration**: ML5.js (MobileNet & DoodleNet models)
- **PDF Generation**: jsPDF
- **Deployment**: Vercel

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18.x or higher
- An Unsplash Developer Access Key

### Local Development

1. **Clone the repository**:

```bash
git clone https://github.com/your-username/Zen-Writing.git
cd Zen-Writing

```

2. **Install dependencies**:

```bash
npm install

```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:

```env
UNSPLASH_ACCESS_KEY=your_access_key_here

```

4. **Start the development server**:

```bash
npm run dev

```

Open `http://localhost:3000` to see the application.

## 🧠 How It Works

1. **Editorial Editor**: A borderless writing space using **EB Garamond** typography. It features a custom-built `contentEditable` engine with real-time keyword highlighting.
2. **Smart Extraction**: As you type, the system debounces input (800ms) and extracts meaningful keywords.
3. **Secure RPC Calls**: Keywords are sent to Server Functions which securely query the Unsplash API, protecting your keys from the client side.
4. **Collision-Free Masonry**: A custom JavaScript algorithm calculates random, non-overlapping positions for every image in the gallery.
5. **Sketch-to-Search**: Integrated Canvas allows you to draw. ML5.js analyzes the pixels and converts your doodle into a searchable keyword.

## 📂 Project Structure

```text
Zen-Writing/
├── src/
│   ├── components/       # UI Components (DrawingCanvas, PDFPreview, etc.)
│   ├── hooks/            # Custom TS Hooks (useImageRecognition, useQuery)
│   ├── routes/           # TanStack Router file-based routing
│   ├── server/           # Server Functions (RPC - Unsplash API logic)
│   ├── store/            # Zustand global state (WriterStore)
│   └── utils/            # Logic helpers (Keywords, Masonry Layout)
├── public/               # Static assets (Favicon, Logos)
├── app.config.ts         # TanStack Start configuration
├── vercel.json           # Vercel deployment & rewrite rules
└── tsconfig.json         # TypeScript configuration

```

## 🎨 Design Philosophy

- **Minimalism**: Clean interface focusing 100% on the creative flow.
- **Editorial Aesthetics**: Museum-style off-white backgrounds (`#F5F5F1`) and charcoal text.
- **Seamless Feedback**: Every interaction, from a keyword highlight to an AI prediction, is fluidly animated.

## 📄 License

MIT
