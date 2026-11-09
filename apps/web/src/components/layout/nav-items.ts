import { Bell, Bookmark, House, type LucideIcon, Mail, Search, User } from 'lucide-react';

export type NavItem = { label: string; to: string; icon: LucideIcon };

export function getNavItems(username: string): NavItem[] {
  return [
    { label: 'Início', to: '/home', icon: House },
    { label: 'Explorar', to: '/explore', icon: Search },
    { label: 'Notificações', to: '/notifications', icon: Bell },
    { label: 'Mensagens', to: '/messages', icon: Mail },
    { label: 'Salvos', to: '/bookmarks', icon: Bookmark },
    { label: 'Perfil', to: `/${username}`, icon: User },
  ];
}
