'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Users,
  DollarSign,
  Calendar,
  Mail,
  Settings,
  Plus,
  Activity,
  Zap
} from 'lucide-react';

export interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: 'navigation' | 'actions' | 'clients' | 'deals' | 'search';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: Array<{ id: string; contact_name: string; company_name?: string | null; email?: string | null }>;
  deals?: Array<{ id: string; title: string; value: number; stage: string }>;
}

export function CommandPalette({ isOpen, onClose, clients = [], deals = [] }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const navigationItems: CommandPaletteItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'View analytics and metrics',
      icon: <Activity className="h-4 w-4" />,
      category: 'navigation',
      action: () => {
        router.push('/dashboard');
        onClose();
      },
      keywords: ['home', 'overview', 'metrics']
    },
    {
      id: 'nav-pipeline',
      title: 'Pipeline',
      subtitle: 'Manage deals and opportunities',
      icon: <DollarSign className="h-4 w-4" />,
      category: 'navigation',
      action: () => {
        router.push('/dashboard/pipeline');
        onClose();
      },
      keywords: ['deals', 'opportunities', 'kanban']
    },
    {
      id: 'nav-clients',
      title: 'Clients',
      subtitle: 'Manage customer relationships',
      icon: <Users className="h-4 w-4" />,
      category: 'navigation',
      action: () => {
        router.push('/dashboard/clients');
        onClose();
      },
      keywords: ['customers', 'contacts', 'people']
    },
    {
      id: 'nav-calendar',
      title: 'Calendar',
      subtitle: 'Schedule and view meetings',
      icon: <Calendar className="h-4 w-4" />,
      category: 'navigation',
      action: () => {
        router.push('/dashboard/calendar');
        onClose();
      },
      keywords: ['meetings', 'schedule', 'appointments']
    },
    {
      id: 'nav-emails',
      title: 'Emails',
      subtitle: 'Manage email communications',
      icon: <Mail className="h-4 w-4" />,
      category: 'navigation',
      action: () => {
        router.push('/dashboard/emails');
        onClose();
      },
      keywords: ['inbox', 'messages', 'communication']
    },
    {
      id: 'nav-automations',
      title: 'Automations',
      subtitle: 'Configure workflows',
      icon: <Zap className="h-4 w-4" />,
      category: 'navigation',
      action: () => {
        router.push('/dashboard/automations');
        onClose();
      },
      keywords: ['workflows', 'triggers', 'n8n']
    },
    {
      id: 'nav-settings',
      title: 'Settings',
      subtitle: 'Configure your account',
      icon: <Settings className="h-4 w-4" />,
      category: 'navigation',
      action: () => {
        router.push('/dashboard/settings');
        onClose();
      },
      keywords: ['preferences', 'configuration', 'profile']
    }
  ];

  const actionItems: CommandPaletteItem[] = [
    {
      id: 'action-add-client',
      title: 'Add New Client',
      subtitle: 'Create a new client record',
      icon: <Plus className="h-4 w-4" />,
      category: 'actions',
      action: () => {
        // This would open the add client modal
        router.push('/dashboard/clients?action=add');
        onClose();
      },
      keywords: ['create', 'new', 'customer']
    },
    {
      id: 'action-add-deal',
      title: 'Add New Deal',
      subtitle: 'Create a new opportunity',
      icon: <Plus className="h-4 w-4" />,
      category: 'actions',
      action: () => {
        // This would open the add deal modal
        router.push('/dashboard/pipeline?action=add');
        onClose();
      },
      keywords: ['create', 'opportunity', 'sales']
    },
    {
      id: 'action-schedule-meeting',
      title: 'Schedule Meeting',
      subtitle: 'Book a new appointment',
      icon: <Calendar className="h-4 w-4" />,
      category: 'actions',
      action: () => {
        router.push('/dashboard/calendar?action=add');
        onClose();
      },
      keywords: ['book', 'appointment', 'call']
    },
    {
      id: 'action-compose-email',
      title: 'Compose Email',
      subtitle: 'Draft a new message',
      icon: <Mail className="h-4 w-4" />,
      category: 'actions',
      action: () => {
        router.push('/dashboard/emails?action=compose');
        onClose();
      },
      keywords: ['draft', 'write', 'send']
    }
  ];

  // Convert clients to command items
  const clientItems: CommandPaletteItem[] = clients.slice(0, 10).map(client => ({
    id: `client-${client.id}`,
    title: client.contact_name,
    subtitle: client.company_name || client.email || undefined,
    icon: <Users className="h-4 w-4" />,
    category: 'clients' as const,
    action: () => {
      router.push(`/dashboard/clients/${client.id}`);
      onClose();
    },
    keywords: [client.contact_name.toLowerCase(), client.company_name?.toLowerCase() || '', client.email?.toLowerCase() || '']
  }));

  // Convert deals to command items
  const dealItems: CommandPaletteItem[] = deals.slice(0, 10).map(deal => ({
    id: `deal-${deal.id}`,
    title: deal.title,
    subtitle: `$${deal.value.toLocaleString()} • ${deal.stage}`,
    icon: <DollarSign className="h-4 w-4" />,
    category: 'deals' as const,
    action: () => {
      router.push(`/dashboard/pipeline?deal=${deal.id}`);
      onClose();
    },
    keywords: [deal.title.toLowerCase(), deal.stage.toLowerCase()]
  }));

  // Combine all items
  const allItems = [...navigationItems, ...actionItems, ...clientItems, ...dealItems];

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems;

    const searchLower = search.toLowerCase();
    return allItems.filter(item => {
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.subtitle?.toLowerCase().includes(searchLower) ||
        item.keywords?.some(keyword => keyword.includes(searchLower))
      );
    });
  }, [search, allItems]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups = {
      navigation: filteredItems.filter(item => item.category === 'navigation'),
      actions: filteredItems.filter(item => item.category === 'actions'),
      clients: filteredItems.filter(item => item.category === 'clients'),
      deals: filteredItems.filter(item => item.category === 'deals')
    };

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [filteredItems]);

  // Clear search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'navigation': return 'Navigation';
      case 'actions': return 'Quick Actions';
      case 'clients': return 'Clients';
      case 'deals': return 'Deals';
      default: return category;
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groupedItems.map(([category, items]) => (
          <CommandGroup key={category} heading={getCategoryLabel(category)}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={item.action}
                className="flex items-center gap-3 p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-sm text-muted-foreground truncate">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// Hook for managing command palette state
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false)
  };
}