"use client";

import type { ReactNode } from "react";

import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <>
      <GlobalErrorHandler />
      <MetaMaskProvider>
        <MetaMaskEthersSignerProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </MetaMaskEthersSignerProvider>
      </MetaMaskProvider>
    </>
  );
}
