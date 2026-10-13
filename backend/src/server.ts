import "dotenv/config";
import { createServer } from "node:http";

import app from "./app";
import connectDatabase from "./config/database";
import { startReminderScheduler } from "./services/reminder.service";
import { startTrashCleanupScheduler } from "./services/admin-trash.service";
import { startNotificationScheduleWorker } from "./services/notification-schedule.service";
import {
  ensureProductColorIds,
  removeLegacyProductSlugIndex,
} from "./services/product-migration.service";

const hostingerPort = process.env.PORT;
let ready = false;

// Hostinger requires the listener before asynchronous database initialization.
const server = createServer((req, res) => {
  if (!ready) {
    res.writeHead(503, { "Content-Type": "application/json", "Retry-After": "5" });
    res.end(JSON.stringify({ success: false, message: "Backend is starting" }));
    return;
  }
  app(req, res);
});
// Hostinger Passenger supplies a Unix socket path in PORT, while local and
// other platforms use a numeric TCP port.
if (hostingerPort && !/^\d+$/.test(hostingerPort)) {
  server.listen(hostingerPort);
} else {
  server.listen(Number(hostingerPort || 5000));
}

const startServer = async () => {
  try {
    console.log("🚀 Backend starting...");

    await connectDatabase();

    const removedLegacySlugIndex = await removeLegacyProductSlugIndex();
    if (removedLegacySlugIndex) {
      console.log(
        "✅ Removed obsolete products.slug_1 index; product SEO slugs remain in colors[].slugProduct."
      );
    }

    const migratedProducts = await ensureProductColorIds();
    if (migratedProducts > 0) {
      console.log(`✅ Added stable color IDs to ${migratedProducts} product(s).`);
    }

    startReminderScheduler();
    startTrashCleanupScheduler();
    startNotificationScheduleWorker();

    ready = true;
      console.log(
        `✅ HivraSoft backend running on ${hostingerPort || 5000}`
      );
  } catch (error) {
    console.error("❌ Server startup failed:");
    console.error(error);

    process.exit(1);
  }
};

startServer();
