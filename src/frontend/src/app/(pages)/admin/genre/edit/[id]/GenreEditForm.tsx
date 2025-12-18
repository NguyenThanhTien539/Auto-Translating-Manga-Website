/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import JustValidate from "just-validate";
import { slugify } from "@/utils/make_slug";
import { toast } from "sonner";

export function GenreEditForm() {
  const router = useRouter();
  const params = useParams();
  const [genreDetail, setGenreDetail] = useState<any>(null);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/genre/detail/${params.id}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") setGenreDetail(data.detail);
      });
  }, [params.id]);

  useEffect(() => {
    if (!genreDetail) return;
    const validate = new JustValidate("#genre-edit-form");
    validate
      .addField(
        "#genre_name",
        [{ rule: "required", errorMessage: "Vui lòng nhập tên thể loại!" }],
        { errorContainer: "#errorName" }
      )

      .onSuccess((event: any) => {
        event.preventDefault();
        const name = event.target.genre_name.value;
        const slug = slugify(name);

        const dataFinal = {
          genre_name: name,
          slug: slug,
        };
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/genre/edit/${params.id}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataFinal),
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

    return () => {
      try {
        if ((validate as any).destroy) (validate as any).destroy();
      } catch (e) {}
    };
  }, [genreDetail]);

  return (
    genreDetail && (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <form
          id="genre-edit-form"
          className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 text-center">
              Tên thể loại
            </label>

            <input
              id="genre_name"
              name="genre_name"
              defaultValue={genreDetail.genre_name}
              type="text"
              className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500"
              placeholder="Nhập tên thể loại"
            />

            <div id="errorName" className="text-sm text-red-500 text-center" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              className="w-full h-14 rounded-lg bg-blue-500 text-white text-xl font-semibold hover:bg-blue-600 cursor-pointer"
            >
              Lưu thay đổi
            </button>

            <button
              type="button"
              className="h-10 px-5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push("/admin/genre/list")}
            >
              Quay lại trang danh sách
            </button>
          </div>
        </form>
      </div>
    )
  );
}
