/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import JustValidate from "just-validate";
import dynamic from "next/dynamic";
import { slugify } from "@/utils/make_slug";
import { toast } from "sonner";

const TinyMCEEditor = dynamic(() => import("@/app/components/TinyMCEEditor"), {
  ssr: false,
});

export function GenreCreateForm() {
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const description = "";

  useEffect(() => {
    const validate = new JustValidate("#genre-create-form");
    validate
      .addField(
        "#genre_name",
        [{ rule: "required", errorMessage: "Vui lòng nhập tên thể loại!" }],
        { errorContainer: "#nameError" }
      )

      .onSuccess((event: any) => {
        const name = event.target.genre_name.value;
        const status = event.target.status.value;
        const slug = slugify(name);
        let description;
        if (editorRef.current) {
          description = (editorRef.current as any).getContent();
        }

        console.log(name);
        console.log(status);
        console.log(description);
        console.log(slug);

        const dataFinal = {
          genre_name: name,
          status: status,
          description: description,
          slug: slug,
        };

        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/genre/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataFinal),
            credentials: "include",
          }
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.code == "error") {
              toast.error(data.message);
            }
            if (data.code == "success") {
              toast.success(data.message);
            }
          });
      });
  }, []);

  return (
    <>
      <form id="genre-create-form" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tên danh mục
              </label>
              <input
                id="genre_name"
                type="text"
                className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500"
                placeholder="Nhập tên danh mục"
              />
            </div>
            <div id="errorName" className="text-sm text-red-500"></div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái
            </label>
            <select
              id="status"
              className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Mô tả
          </label>

          <div
            id="description"
            className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
          >
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
    </>
  );
}
