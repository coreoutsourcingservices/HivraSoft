"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_http_1 = require("node:http");
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const reminder_service_1 = require("./services/reminder.service");
const admin_trash_service_1 = require("./services/admin-trash.service");
const product_migration_service_1 = require("./services/product-migration.service");
const PORT = Number(process.env.PORT || 5000);
let ready = false;
// Hostinger requires the listener before asynchronous database initialization.
const server = (0, node_http_1.createServer)((req, res) => {
    if (!ready) {
        res.writeHead(503, { "Content-Type": "application/json", "Retry-After": "5" });
        res.end(JSON.stringify({ success: false, message: "Backend is starting" }));
        return;
    }
    (0, app_1.default)(req, res);
});
server.listen(PORT);
const startServer = async () => {
    try {
        console.log("🚀 Backend starting...");
        await (0, database_1.default)();
        const removedLegacySlugIndex = await (0, product_migration_service_1.removeLegacyProductSlugIndex)();
        if (removedLegacySlugIndex) {
            console.log("✅ Removed obsolete products.slug_1 index; product SEO slugs remain in colors[].slugProduct.");
        }
        const migratedProducts = await (0, product_migration_service_1.ensureProductColorIds)();
        if (migratedProducts > 0) {
            console.log(`✅ Added stable color IDs to ${migratedProducts} product(s).`);
        }
        (0, reminder_service_1.startReminderScheduler)();
        (0, admin_trash_service_1.startTrashCleanupScheduler)();
        ready = true;
        console.log(`✅ HivraSoft backend running on http://localhost:${PORT}`);
    }
    catch (error) {
        console.error("❌ Server startup failed:");
        console.error(error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map