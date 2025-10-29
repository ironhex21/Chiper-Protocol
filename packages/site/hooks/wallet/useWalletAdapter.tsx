import { useAccount, useConnect } from 'wagmi';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface UseWalletState {
  provider: any | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: () => void;
}

function useWalletInternal(): UseWalletState {
  const { address, isConnected, connector, chain } = useAccount();
  const { connect: wagmiConnect, connectors, error } = useConnect();
  const [provider, setProvider] = useState<any>(undefined);

  const connect = () => {
    if (isConnected) {
      return;
    }
    
    // Use the first available connector (usually injected wallet like MetaMask)
    const injectedConnector = connectors.find(c => c.type === 'injected');
    if (injectedConnector) {
      wagmiConnect({ connector: injectedConnector });
    }
  };

  useEffect(() => {
    const getProvider = async () => {
      if (!connector || !isConnected) {
        setProvider(undefined);
        return;
      }

      try {
        // Get provider from connector
        const prov = await connector.getProvider();
        setProvider(prov);
      } catch (err) {
        console.warn('[useWalletInternal] Failed to get provider:', err);
        setProvider(undefined);
      }
    };

    getProvider();
  }, [connector, isConnected]);

  return {
    provider,
    chainId: chain?.id,
    accounts: address ? [address] : undefined,
    isConnected,
    error: error as Error | undefined,
    connect,
  };
}

const WalletContext = createContext<UseWalletState | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const walletState = useWalletInternal();
  
  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
