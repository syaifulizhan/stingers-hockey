import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <SignUp />
    </main>
  );
}
