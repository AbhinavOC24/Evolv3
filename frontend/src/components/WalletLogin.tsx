"use client";
import * as React from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletLogin() {
  return (
    <ConnectButton
      showBalance={false}
      accountStatus={{
        smallScreen: "avatar",
        largeScreen: "full",
      }}
    />
  );
}
