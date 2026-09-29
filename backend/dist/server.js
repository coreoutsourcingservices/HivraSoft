"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const reminder_service_1 = require("./services/reminder.service");
const product_migration_service_1 = require("./services/product-migration.service");
const PORT = Number(process.env.PORT || 5000);
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
        app_1.default.listen(PORT, () => {
            console.log(`✅ HivraSoft backend running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Server startup failed:");
        console.error(error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map