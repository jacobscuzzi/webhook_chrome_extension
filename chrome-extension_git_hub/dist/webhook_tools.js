// ============================================
// Toggle this to switch between test and production
const TEST_MODE = true;
// ============================================
const productionWebhooks = {
    webhook1: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-90daaca4-a9c9-40be-aa69-17245b91faa8",
    webhook2: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-583c0378-a31d-47e9-ae07-e5af6a945e88",
};
const testWebhooks = {
    webhook1: "https://wise-sun-28.webhook.cool",
    webhook2: "https://wise-sun-28.webhook.cool",
};
export const webhooks = TEST_MODE ? testWebhooks : productionWebhooks;
//# sourceMappingURL=webhook_tools.js.map