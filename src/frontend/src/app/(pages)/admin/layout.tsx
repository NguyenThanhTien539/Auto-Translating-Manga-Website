import Header from "@/app/components/admin/Header/Header";
import Sidebar from "@/app/components/admin/Sidebar/Sidebar";

export default function AdminLayout({
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
