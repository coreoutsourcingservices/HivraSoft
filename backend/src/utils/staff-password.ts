import crypto from "node:crypto";

export function temporaryStaffPassword(username: string) {
  if (!username) throw new Error("Admin user ID is required before issuing credentials");
  return `${username}@${crypto.randomInt(100000, 1000000)}`;
}
