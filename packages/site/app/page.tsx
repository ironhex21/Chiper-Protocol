import { PrivateVaultDemo } from "@/components/PrivateVaultDemo";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="flex flex-col gap-8 items-center w-full px-3 md:px-6 py-8">
        <PrivateVaultDemo />
      </div>
    </main>
  );
}
