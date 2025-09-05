"use client";

import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import axios from "axios";
import { useAuthStore } from "../_store/useAuthStore";

export function WalletLogin() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);

  const { setUser, clearUser } = useAuthStore((state) => ({
    setUser: state.setUser,
    clearUser: state.clearUser,
  }));

  const authenticateUser = async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    try {
      // Try to get existing user session
      const userResponse = await axios.get("/backend/me", {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (userResponse.data.success) {
        setUser(userResponse.data.data);
        return;
      }

      // If no session, perform wallet signature authentication
      const nonceResponse = await axios.post("/backend/getNonce", {
        publicKey: address,
      });

      const signature = await signMessageAsync({
        message: nonceResponse.data.data.nonce,
      });

      const verifyResponse = await axios.post(
        "/backend/verifySign",
        { address, signature },
        { withCredentials: true }
      );

      setUser(verifyResponse.data.data.user);
    } catch (error) {
      console.error("Authentication failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/backend/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }

    clearUser();
    disconnect();
  };

  // Authenticate when wallet connects
  useEffect(() => {
    authenticateUser();
  }, [address, isConnected]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-600">Authenticating...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <ConnectButton
        accountStatus={{
          smallScreen: "address",
          largeScreen: "full",
        }}
        chainStatus="none"
        showBalance={false}
      />

      {isConnected && (
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Logout
        </button>
      )}
    </div>
  );
}
