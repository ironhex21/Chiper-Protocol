"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Navbar = () => {
  return (
    <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center">
      <div className="text-2xl font-black text-gray-900 uppercase tracking-tight">
        CHIPER PROTOCOL
      </div>
      <ConnectButton />
    </nav>
  );
};
