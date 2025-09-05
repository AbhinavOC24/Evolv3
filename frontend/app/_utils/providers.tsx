"use client";

import { ReactNode } from "react";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { http, WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Chain } from "wagmi/chains";

const queryClient = new QueryClient();

let wagmiConfig: any;

export const somniaTestnet: Chain = {
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: {
    name: "Somnia",
    symbol: "SOM",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] }, //
    public: { http: ["https://dream-rpc.somnia.network/"] },
  },
  blockExplorers: {
    default: {
      name: "Shanon Explorer",
      url: "https://shannon-explorer.somnia.network/",
    },
  },
  testnet: true,
};

export function getWagmiConfig() {
  if (!wagmiConfig) {
    wagmiConfig = getDefaultConfig({
      appName: "Evolv3",
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
      chains: [somniaTestnet, mainnet, polygon, optimism, arbitrum, base],
      ssr: true,
      //   transports: {
      //     [somniaTestnet.id]: http("https://dream-rpc.somnia.network/"),
      //   },
    });
  }
  return wagmiConfig;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={getWagmiConfig()}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
