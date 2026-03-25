import FormResetPassword from "./FormResetPassword";

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
                d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4s-3 1.567-3 3.5 1.343 3.5 3 3.5zm0 2c-2.761 0-5 2.239-5 5h10c0-2.761-2.239-5-5-5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Đặt lại mật khẩu
          </h1>
          <p className="text-sm text-gray-500">
            Tạo mật khẩu mới để tiếp tục sử dụng tài khoản
          </p>
        </div>

        <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-4 sm:p-5">
          <FormResetPassword />
        </div>
      </div>
    </div>
  );
}
