// src/app/(site)/layout.tsx
import Header from "@/app/components/client/Header/Header";
import Sidebar from "@/app/components/client/Sidebar/Sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb]">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
