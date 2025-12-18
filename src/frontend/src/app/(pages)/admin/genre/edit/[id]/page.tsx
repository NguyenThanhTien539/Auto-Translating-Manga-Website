"use client";

import { GenreEditForm } from "./GenreEditForm";

export default function GenreEditPage() {
  return (
    <>
      <h2 className="text-3xl font-semibold mb-6">Chỉnh sửa thể loại</h2>
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <GenreEditForm />
      </div>
    </>
  );
}
