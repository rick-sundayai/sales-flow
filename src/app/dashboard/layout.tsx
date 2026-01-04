"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useClients } from "@/lib/queries/clients";
import { useDeals } from "@/lib/queries/deals";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, onOpen, onClose } = useCommandPalette();
  const { data: clients = [] } = useClients();
  const { data: deals = [] } = useDeals();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex justify-between items-center px-4 py-3 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Button variant="outline" size="sm" onClick={onOpen} className="hidden md:flex">
              <Search className="h-4 w-4 mr-2" />
              Search
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                ⌘K
              </kbd>
            </Button>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
      
      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isOpen}
        onClose={onClose}
        clients={clients}
        deals={deals}
      />
    </SidebarProvider>
  );
}
