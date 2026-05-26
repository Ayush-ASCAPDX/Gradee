import Link from "next/link";

export default function VerifySuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#1e1e2d,#121214)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl backdrop-blur-md">
        <svg className="mx-auto mb-6 h-16 w-16 text-[#8b5cf6]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.285 6.709a1 1 0 00-1.414-1.414L9 15.166l-3.871-3.872a1 1 0 00-1.414 1.414l4.578 4.578a1 1 0 001.414 0l10.578-10.577z" />
        </svg>
        <h1 className="mb-4 text-2xl font-bold text-white">Your email is verified!</h1>
        <p className="mb-6 text-gray-300">
          You can now sign in to your Gradee account and start using the platform.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-full bg-[#8b5cf6] px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-[#7c3aed]"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
