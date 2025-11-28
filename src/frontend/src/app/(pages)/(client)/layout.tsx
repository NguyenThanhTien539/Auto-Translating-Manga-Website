// src/app/(site)/layout.tsx
import Header from "@/app/components/client/Header/Header";
import Sidebar from "@/app/components/client/Sidebar/Sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-[#f5f7fb]">
      <Header />

      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
