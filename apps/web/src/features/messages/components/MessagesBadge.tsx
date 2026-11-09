import { CountBadge } from '@/components/ui/CountBadge';

import { useUnreadMessagesCount } from '../api';

export function MessagesBadge() {
  const { data: count = 0 } = useUnreadMessagesCount();
  return <CountBadge count={count} label={`${count} conversas não lidas`} />;
}
