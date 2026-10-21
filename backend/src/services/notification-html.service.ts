import { prepareAdminHtml } from "../utils/adminHtml";

export function prepareNotificationHtml(value: unknown): string {
  return prepareAdminHtml(value, 50_000, "Notification HTML");
}
