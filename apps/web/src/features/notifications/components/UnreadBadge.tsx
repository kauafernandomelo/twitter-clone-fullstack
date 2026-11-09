import { CountBadge } from '@/components/ui/CountBadge';

import { useUnreadCount } from '../api';

/** Bolinha com o número de notificações não lidas. */
export function UnreadBadge() {
  const { data: count = 0 } = useUnreadCount();
  return <CountBadge count={count} label={`${count} notificações não lidas`} />;
}
