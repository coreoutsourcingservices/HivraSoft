export type CustomerNotification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

export const NOTIFICATIONS_CHANGED = "hivrasoft-notifications-changed";

/** ObjectId is a deterministic tie-breaker when timestamps are identical. */
export function newestNotifications<T extends CustomerNotification>(items: T[]): T[] {
  const time = (value: string) => Date.parse(value) || 0;
  return [...items].sort((a, b) =>
    time(b.createdAt) - time(a.createdAt) || b._id.localeCompare(a._id),
  );
}

export function unreadQueue(items: CustomerNotification[], postponed: string[]) {
  const skipped = new Set(postponed);
  return newestNotifications(items).filter((item) => !item.isRead && !skipped.has(item._id));
}
