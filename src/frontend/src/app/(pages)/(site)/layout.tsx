// src/app/(site)/layout.tsx
import Header from "@/components/Header/Header";
import Sidebar from "@/components/Sidebar/Sidebar";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Chiếm đúng 100vh
    <div className="h-screen flex flex-col bg-[#f5f7fb]">
      {/* Header trên cùng */}
      <Header />

      {/* Dưới header: sidebar + content, cao = phần còn lại */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar bên trái */}
        <Sidebar />

        {/* Nội dung bên phải */}
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
