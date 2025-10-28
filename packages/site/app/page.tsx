import { PrivateVaultDemo } from "@/components/PrivateVaultDemo";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="flex flex-col gap-8 items-center w-full px-3 md:px-6 py-8">
        <PrivateVaultDemo />
      </div>
    </main>
  );
}
