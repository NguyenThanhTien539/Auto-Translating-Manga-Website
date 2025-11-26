import "./globals.css";
import { Toaster } from "sonner";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen">
        <Toaster
          richColors
          closeButton
          position="top-right"
          toastOptions={{
            style: {
              fontSize: "14px",
              padding: "8px 12px",
              width: "auto",
              height: "50px",
              borderRadius: "8px",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
