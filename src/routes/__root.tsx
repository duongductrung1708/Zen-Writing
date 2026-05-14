import { createRootRoute, Outlet, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import "@/styles/globals.css";

// Khởi tạo Trạm trung chuyển dữ liệu
const queryClient = new QueryClient();

export const Route = createRootRoute({
  notFoundComponent: () => (
    <div className="bg-ivory text-charcoal flex min-h-screen flex-col items-center justify-center selection:bg-red-200 selection:text-red-900">
      <div className="flex max-w-md flex-col items-center px-6 text-center">
        <h1
          className="text-charcoal mb-2 text-7xl font-light tracking-tight sm:text-9xl"
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          404
        </h1>
        <h2 className="font-modern mb-6 text-xl font-medium tracking-widest text-gray-500 uppercase sm:text-2xl">
          Page Not Found
        </h2>
        <p className="font-modern mb-10 text-base leading-relaxed text-gray-600 sm:text-lg">
          Ý tưởng bạn đang tìm kiếm dường như đã trôi dạt vào khoảng không. Hãy quay lại bảng vẽ và
          bắt đầu một dòng suy nghĩ mới.
        </p>
        <Link
          to="/write"
          className="bg-charcoal inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-medium tracking-wider text-white transition-all hover:bg-gray-800 hover:shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          VỀ TRANG CHỦ
        </Link>
      </div>
    </div>
  ),

  component: () => (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/*ĐẶT SEO TAGS TRỰC TIẾP VÀO ĐÂY, VỪA TRỰC QUAN VỪA KHÔNG BỊ LỖI TS */}
        <title>Zen Writing | Visual Reflection of Your Thoughts</title>
        <meta
          name="description"
          content="A minimalist writing environment that automatically surfaces beautiful Unsplash imagery based on your live input. Focus on your thoughts, let AI find the visual."
        />
        <meta
          name="keywords"
          content="zen writing, writing app, visual writing, unsplash, ai recognition, creative writing, note taking"
        />
        <meta name="author" content="Duong Duc Trung" />

        {/* Open Graph (Dành cho Facebook, Zalo, Discord...) */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://han-zen-writing.vercel.app/" />
        <meta property="og:title" content="Zen Writing | Focus on your thoughts" />
        <meta
          property="og:description"
          content="Turn your words into visual art in real-time. A sanctuary for creative writers."
        />
        <meta
          property="og:image"
          content="https://han-zen-writing.vercel.app/assets/og-image.jpg"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zen Writing | Visual Reflection of Your Thoughts" />
        <meta
          name="twitter:description"
          content="Turn your words into visual art in real-time. A sanctuary for creative writers."
        />
        <meta
          name="twitter:image"
          content="https://han-zen-writing.vercel.app/assets/og-image.jpg"
        />

        <meta name="theme-color" content="#F5F5F1" />

        <link rel="icon" type="image/png" href="/assets/zen_logo.png" />
        <HeadContent />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>

        <Analytics />
        <Scripts />
      </body>
    </html>
  ),
});
