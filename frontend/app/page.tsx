import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WalletLogin } from "./_components/WalletLogin";

export default function Home() {
  return (
    <div>
      <WalletLogin />
    </div>
  );
}
