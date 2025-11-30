"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import TinyMCEEditor from "@/app/components/TinyMCEEditor";

export default function CategoryCreatePage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const description = "";
  return (
    <>
      <h2 className="text-3xl font-semibold mb-6">Tạo thể loại</h2>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <form className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tên danh mục
              </label>
              <input
                type="text"
                className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500"
                placeholder="Nhập tên danh mục"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Trạng thái
              </label>
              <select className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500">
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Mô tả
            </label>

            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
              <TinyMCEEditor value={description} editorRef={editorRef} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              className="h-10 px-6 rounded-lg bg-blue-500 text-white text-xl h-14 font-semibold hover:bg-blue-600 cursor-pointer"
            >
              Tạo danh mục
            </button>

            <div
              className="h-10 px-5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push("/admin/category/list")}
            >
              Quay lại trang danh sách
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
