// app/components/admin/ViewDetailButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { Eye, Pencil } from "lucide-react";

type ViewDetailButtonProps = {
  href: string;
  title: string;
};

type EditButtonProps = {
  href: string; // đường dẫn cần chuyển tới
  title?: string; // tooltip, mặc định "Chỉnh sửa"
};

export function ViewDetailButton({
  href,
  title = "Xem chi tiết",
}: ViewDetailButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-200 cursor-pointer"
      onClick={() => router.push(href)}
      title={title}
    >
      <Eye size={18} />
    </button>
  );
}

export function EditButton({ href, title = "Chỉnh sửa" }: EditButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors border border-purple-200 cursor-pointer"
      onClick={() => router.push(href)}
      title={title}
    >
      <Pencil size={18} />
    </button>
  );
}
