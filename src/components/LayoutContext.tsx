"use client";

import { createContext, useContext, useState } from "react";

type LayoutContextType = {
  navbarOpen: boolean;
  setNavbarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LayoutContext.Provider
      value={{
        navbarOpen,
        setNavbarOpen,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error("useLayout must be used inside LayoutProvider");
  }

  return context;
}
