import React from 'react';
import { ShoppingCart, Package, History, RefreshCcw, Store } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/pos',
      icon: ShoppingCart,
      label: 'Point de Vente',
      path: '/pos',
    },
    {
      key: '/stock',
      icon: Package,
      label: 'Gestion du Stock',
      path: '/stock',
    },
    {
      key: '/history',
      icon: History,
      label: 'Historique des Ventes',
      path: '/history',
    },
    {
      key: '/returns',
      icon: RefreshCcw,
      label: 'Retours et Échanges',
      path: '/returns',
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border bg-gradient-to-br from-primary/5 to-primary/10 group-data-[collapsible=icon]:bg-none group-data-[collapsible=icon]:p-2">
            <div className="flex items-center gap-3 px-3 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-sm flex-shrink-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                <Store className="h-6 w-6 text-primary-foreground group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-lg font-bold text-sidebar-foreground">Antaali POS</span>
                <span className="text-xs text-sidebar-foreground/60">Système de Caisse</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
            <SidebarGroup className="group-data-[collapsible=icon]:p-0">
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-2 px-3 group-data-[collapsible=icon]:hidden">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={isActive}
                          size="lg"
                          tooltip={item.label}
                          className={cn(
                            isActive ? "sidebar-active-primary shadow-sm" : "hover:bg-sidebar-accent/80",
                            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border mt-auto group-data-[collapsible=icon]:border-0">
            <div className="px-4 py-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
              <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:justify-center">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="group-data-[collapsible=icon]:hidden">Système opérationnel</span>
              </div>
              <div className="mt-2 text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                Version 1.0.0
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center px-4 shadow-sm">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-6 bg-muted/30">
            <div className="bg-card rounded-lg shadow-sm p-6 min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
