import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { IndexedDBStorage, indexedDBStorage } from "@zama-fhe/sdk";
import { sepolia as sepoliaFhe, type FheChain } from "@zama-fhe/sdk/chains";
import { createConfig } from "@zama-fhe/sdk/viem";
import { web } from "@zama-fhe/sdk/web";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { createWalletClient, custom, type Address } from "viem";
import { sepolia } from "viem/chains";
import { appConfig } from "./config";
import { getSavedWalletAccount, getWalletEthereumProvider, onSavedWalletAccountChange, publicClient, walletProvider } from "./walletClient";

const queryClient = new QueryClient();
const permitStorage = new IndexedDBStorage("LatticePayZamaPermits");

export function LatticeZamaProvider({ children }: PropsWithChildren) {
  const [account, setAccount] = useState<Address | null>(() => getSavedWalletAccount());

  useEffect(() => onSavedWalletAccountChange(setAccount), []);

  const zamaConfig = useMemo(() => {
    const chain = {
      ...sepoliaFhe,
      network: appConfig.rpcUrl
    } as const satisfies FheChain;
    const walletClient = createWalletClient({
      account: account || undefined,
      chain: sepolia,
      transport: custom(walletProvider)
    });

    return createConfig({
      chains: [chain],
      publicClient,
      walletClient,
      ethereum: getWalletEthereumProvider(),
      relayers: { [chain.id]: web() },
      storage: indexedDBStorage,
      permitStorage
    });
  }, [account]);

  return (
    <QueryClientProvider client={queryClient}>
      <ZamaProvider key={account || "disconnected"} config={zamaConfig}>{children}</ZamaProvider>
    </QueryClientProvider>
  );
}
