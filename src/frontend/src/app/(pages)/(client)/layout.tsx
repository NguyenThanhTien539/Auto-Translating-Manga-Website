// src/app/(site)/layout.tsx
import Header from "@/app/components/client/Header/Header";
import Sidebar from "@/app/components/client/Sidebar/Sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <Header />
      </div>

      <div className="flex min-h-screen ">
        <aside className="bg-[#0c4a6e] w-[220px]">
          <div className="sticky top-[80px]">
            <Sidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
