import FormForgotPassword from "./FormForgotPassword";

export default function UserLoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 00-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V9a3 3 0 016 0v2H9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Quên mật khẩu
          </h1>
          <p className="text-sm text-gray-500">
            Nhập email để nhận mã OTP đặt lại mật khẩu
          </p>
        </div>

        <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-4 sm:p-5">
          <FormForgotPassword />
        </div>
      </div>
    </div>
  );
}
