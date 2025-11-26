"use client";
import { useRouter } from "next/navigation";
export default function Header() {
  const route = useRouter();
  return (
    <header className="w-full border-b border-black-800 mt-2  bg-white px-4 py-1 flex items-center justify-between gap-4">
      <div className="ml-[50px] flex items-center gap-2">
        <span
          className="text-[30px] font-semibold text-sky-700 cursor-pointer"
          onClick={() => {
            route.push("/");
          }}
        >
          Softwarriors
        </span>
        {/* Icon nhỏ cạnh logo (demo) */}
        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-sky-300 bg-sky-50 text-[15px] text-sky-700">
          🖥️
        </div>
      </div>

      {/* Thanh search ở giữa */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center h-9 max-w-xl w-full rounded-full border border-gray-300 border-b-2 border-b-amber-400 bg-white px-2 shadow-sm">
          {/* Icon search */}
          <span className="mx-2 text-gray-400 text-[15px]">🔍</span>

          {/* Input */}
          <input
            type="text"
            placeholder="Tìm ở đây"
            className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
          />

          {/* Vạch ngăn + icon filter */}
          <div className="flex items-center gap-1 pl-2 ml-2 border-l border-gray-200">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xs"
            >
              ⏷
            </button>
          </div>
        </div>
      </div>

      {/* Bên phải: Log in + Sign up */}
      <div className=" mr-[50px] flex items-center gap-3">
        <button
          type="button"
          className="h-8 px-4 rounded-md bg-sky-700 text-white text-[15px] font-semibold hover:bg-sky-800 cursor-pointer"
          onClick={() => {
            route.push("/account/login");
          }}
        >
          Log in
        </button>
        <button
          type="button"
          className="text-[15px] text-gray-700 hover:text-gray-900 cursor-pointer"
          onClick={() => {
            route.push("/account/register");
          }}
        >
          Sign up
        </button>
      </div>
    </header>
  );
}
