"use client";

import { GenreCreateForm } from "./GenreCreateForm";

export default function CategoryCreatePage() {
  return (
    <>
      <h2 className="text-3xl font-semibold mb-6">Tạo thể loại</h2>
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <GenreCreateForm />
      </div>
    </>
  );
}
