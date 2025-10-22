import React from 'react';
import { ShoppingCart, Package, History, RefreshCcw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

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
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg font-bold px-4 py-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Antaali POS
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={isActive}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center px-4">
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
