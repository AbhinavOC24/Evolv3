"use client";

import { ReactNode } from "react";
import { WagmiProvider, http, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chain } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";
import {
  createAuthenticationAdapter,
  darkTheme,
  RainbowKitAuthenticationProvider,
} from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { useAuthStore } from "@/store/useAuthStore";
import { useInitAuth } from "./useInitAuth";
import { toast } from "sonner";

import axios from "axios";
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
    default: { http: ["https://dream-rpc.somnia.network"] },
    public: { http: ["https://dream-rpc.somnia.network"] },
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
      chains: [somniaTestnet],
      ssr: true,
    });
  }
  return wagmiConfig;
}

export function Providers({ children }: { children: ReactNode }) {
  useInitAuth(); // fetch /backend/me on load

  const status = useAuthStore((s) => s.status);

  return (
    <WagmiProvider config={getWagmiConfig()}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider
          adapter={authenticationAdapter}
          status={status}
        >
          <RainbowKitProvider
            modalSize="compact"
            theme={darkTheme({
              accentColor: "#ffe0c2",
              accentColorForeground: "black",
              borderRadius: "medium",
            })}
          >
            {children}
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

const authenticationAdapter = createAuthenticationAdapter({
  // Step 1: Get nonce from backend
  getNonce: async () => {
    console.log("🔄 getNonce called");
    try {
      const res = await axios.get("/backend/getNonce", {
        withCredentials: true,
      });
      console.log("📥 getNonce response:", res.data);
      if (res.data.success) {
        console.log("✅ getNonce success:", res.data.data.nonce);
        return res.data.data.nonce;
      }
      throw new Error(res.data.message || "Failed to get nonce");
    } catch (err) {
      console.error("❌ getNonce error:", err);
      toast.error("Failed to fetch nonce");
      throw err;
    }
  },

  // Step 2: Build SIWE message
  createMessage: ({ nonce, address, chainId }) => {
    console.log("🔄 createMessage called with:", { nonce, address, chainId });
    try {
      const msg = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to Evolv3.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const preparedMessage = msg.prepareMessage();
      console.log("✅ createMessage success:", preparedMessage);
      return preparedMessage;
    } catch (err) {
      console.error("❌ createMessage error:", err);
      throw err;
    }
  },

  // Step 3: Verify signature with backend
  verify: async ({ message, signature }) => {
    console.log("🔄 verify called with:", { message, signature });
    try {
      const res = await axios.post(
        "/backend/verifySign",
        { message, signature },
        { withCredentials: true }
      );

      console.log("📥 verify response:", res.data);

      if (res.data.success) {
        useAuthStore.getState().setUser(res.data.data.user);
        toast.success("Signed in successfully");
        console.log("✅ verify success");
        return true;
      }

      console.error("❌ verification failed:", res.data);
      toast.error(res.data.message || "Signature verification failed");
      return false;
    } catch (err) {
      console.error("❌ verify error:", err);
      toast.error("Error verifying signature");
      return false;
    }
  },

  // Step 4: Logout
  signOut: async () => {
    console.log("🔄 signOut called");
    try {
      await axios.post("/backend/logout", {}, { withCredentials: true });
      useAuthStore.getState().clearUser();
      toast.success("Logged out");
      console.log("✅ signOut success");
    } catch (err) {
      console.error("❌ signOut error:", err);
      toast.error("Logout failed");
    }
  },
});
