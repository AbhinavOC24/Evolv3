"use client";

import Link from "next/link";

interface NavbarProps {
  walletLogin: React.ReactNode;
  modeToggle: React.ReactNode;
}

export function Navbar({ walletLogin, modeToggle }: NavbarProps) {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-7xl h-14 items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Evolv3</span>
          </Link>
        </div>

        {/* Middle: Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link
            href="/series"
            className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Series
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Dashboard
          </Link>
        </div>

        {/* Right: Wallet + Theme Toggle */}
        <div className="flex items-center gap-7">
          {walletLogin}
          {modeToggle}
        </div>
      </div>
    </nav>
  );
}
