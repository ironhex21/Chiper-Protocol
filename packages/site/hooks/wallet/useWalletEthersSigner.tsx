import { ethers } from 'ethers';
import { useWallet } from './useWalletAdapter';
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useWalletClient } from 'wagmi';
import type { WalletClient } from 'viem';

export interface UseWalletEthersSignerState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: () => void;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
  ethersBrowserProvider: ethers.BrowserProvider | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  initialMockChains: Readonly<Record<number, string>> | undefined;
}

function walletClientToSigner(walletClient: WalletClient): ethers.JsonRpcSigner {
  const { account, chain, transport } = walletClient;
  
  if (!chain || !account) {
    throw new Error('WalletClient must have chain and account');
  }
  
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.BrowserProvider(transport, network);
  const signer = new ethers.JsonRpcSigner(provider, account.address);
  return signer;
}

function useWalletEthersSignerInternal(parameters: { 
  initialMockChains?: Readonly<Record<number, string>> 
}): UseWalletEthersSignerState {
  const { initialMockChains } = parameters;
  const { provider, chainId, accounts, isConnected, connect, error } = useWallet();
  const { data: walletClient } = useWalletClient();
  
  const [ethersSigner, setEthersSigner] = useState<
    ethers.JsonRpcSigner | undefined
  >(undefined);
  const [ethersBrowserProvider, setEthersBrowserProvider] = useState<
    ethers.BrowserProvider | undefined
  >(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<
    ethers.ContractRunner | undefined
  >(undefined);

  const chainIdRef = useRef<number | undefined>(chainId);
  const ethersSignerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);

  const sameChain = useRef((chainId: number | undefined) => {
    return chainId === chainIdRef.current;
  });

  const sameSigner = useRef(
    (ethersSigner: ethers.JsonRpcSigner | undefined) => {
      return ethersSigner === ethersSignerRef.current;
    }
  );

  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  useEffect(() => {
    if (
      !provider ||
      !chainId ||
      !isConnected ||
      !accounts ||
      accounts.length === 0 ||
      !walletClient
    ) {
      ethersSignerRef.current = undefined;
      setEthersSigner(undefined);
      setEthersBrowserProvider(undefined);
      setEthersReadonlyProvider(undefined);
      return;
    }

    // Validate provider is a proper EIP-1193 provider
    if (!provider.request || typeof provider.request !== 'function') {
      console.warn('[useWalletEthersSignerInternal] Invalid provider - missing request method');
      return;
    }

    console.warn(`[useWalletEthersSignerInternal] create new ethers.BrowserProvider(), chainId=${chainId}`);

    try {
      const bp = new ethers.BrowserProvider(provider);
      let rop: ethers.ContractRunner = bp;
      const rpcUrl: string | undefined = initialMockChains?.[chainId];
      
      if (rpcUrl) {
        // Try to avoid using wallet provider for view functions in mock mode
        // Wallet providers keep a cache value of all view function calls. When using a dev node, this can be problematic.
        rop = new ethers.JsonRpcProvider(rpcUrl);
        console.warn(`[useWalletEthersSignerInternal] create new readonly provider ethers.JsonRpcProvider(${rpcUrl}), chainId=${chainId}`);
      } else {
        console.warn(`[useWalletEthersSignerInternal] use ethers.BrowserProvider() as readonly provider, chainId=${chainId}`);
      }

      const s = walletClientToSigner(walletClient);
      ethersSignerRef.current = s;
      setEthersSigner(s);
      setEthersBrowserProvider(bp);
      setEthersReadonlyProvider(rop);
    } catch (error) {
      console.error('[useWalletEthersSignerInternal] Failed to create provider/signer:', error);
      ethersSignerRef.current = undefined;
      setEthersSigner(undefined);
      setEthersBrowserProvider(undefined);
      setEthersReadonlyProvider(undefined);
    }
  }, [provider, chainId, isConnected, accounts, walletClient, initialMockChains]);

  return {
    sameChain,
    sameSigner,
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersBrowserProvider,
    ethersReadonlyProvider,
    ethersSigner,
    error,
    initialMockChains
  };
}

const WalletEthersSignerContext = createContext<UseWalletEthersSignerState | undefined>(
  undefined
);

interface WalletEthersSignerProviderProps {
  children: ReactNode;
  initialMockChains: Readonly<Record<number, string>>;
}

export const WalletEthersSignerProvider: React.FC<WalletEthersSignerProviderProps> = ({
  children, 
  initialMockChains
}) => {
  const props = useWalletEthersSignerInternal({ initialMockChains });
  return (
    <WalletEthersSignerContext.Provider value={props}>
      {children}
    </WalletEthersSignerContext.Provider>
  );
};

export function useWalletEthersSigner() {
  const context = useContext(WalletEthersSignerContext);
  if (context === undefined) {
    throw new Error('useWalletEthersSigner must be used within a WalletEthersSignerProvider');
  }
  return context;
}
