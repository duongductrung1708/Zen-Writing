import { createRootRoute, Outlet, HeadContent, Scripts } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
// 1. Import công cụ của React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/styles/globals.css";

// 2. Khởi tạo "Trạm trung chuyển dữ liệu" (Nhớ đặt ở ngoài để không bị reset khi trang load lại)
const queryClient = new QueryClient();

export const Route = createRootRoute({
  notFoundComponent: () => (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-gray-800">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl">Lạc đường rồi!</p>
      <a href="/" className="mt-6 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
        Về trang chủ
      </a>
    </div>
  ),

  component: () => (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Zen Writing</title>
        <link rel="icon" type="image/png" href="/assets/zen_logo.png" />
        <HeadContent />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* 3. Bọc toàn bộ các trang con (Outlet) vào trong Provider */}
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>

        <Analytics />
        <Scripts />
      </body>
    </html>
  ),
});
