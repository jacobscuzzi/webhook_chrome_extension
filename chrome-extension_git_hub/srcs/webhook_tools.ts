import type { WebhookConfig, ButtonConfig, PageType } from './types.js';
import { PageType as PageTypeEnum } from './types.js';

// ============================================
// Toggle this to switch between test and production
const TEST_MODE = false;
// ============================================

// Production webhook URLs
const productionWebhooks: WebhookConfig = {
    webhook1: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-90daaca4-a9c9-40be-aa69-17245b91faa8",
    webhook2: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-583c0378-a31d-47e9-ae07-e5af6a945e88",
    fullFunnel: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-39eaa4ff-b556-4676-acfa-82c961a5f360",
    lookalikeCompanyProfile: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-f845e4c2-7624-423f-883a-2b137279ab35",
    lookalikeCompanyCompany: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-46c991a2-183d-45f4-bcd2-b7f4ae8e112d",
    findPeople: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-0596cd9b-4ef7-4eb2-985e-4618cc10d3ff",
    csvImport: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-db0118ff-19e4-430a-97e6-322ed6d336fa"
};

const testWebhooks: WebhookConfig = {
    webhook1: "https://wise-sun-28.webhook.cool",
    webhook2: "https://wise-sun-28.webhook.cool",
    fullFunnel: "https://wise-sun-28.webhook.cool",
    lookalikeCompanyProfile: "https://wise-sun-28.webhook.cool",
    lookalikeCompanyCompany: "https://wise-sun-28.webhook.cool",
    findPeople: "https://wise-sun-28.webhook.cool",
    csvImport: "https://wise-sun-28.webhook.cool"
};

export const webhooks: WebhookConfig = TEST_MODE ? testWebhooks : productionWebhooks;

// Button configuration - single source of truth
export const buttonConfigs: ButtonConfig[] = [
    {
        id: 'fullFunnel',
        label: 'Add in full funnel',
        webhookUrl: webhooks.fullFunnel,
        pageTypes: [PageTypeEnum.PROFILE],
        order: 1
    },
    {
        id: 'findPeople',
        label: 'Find People + Push in CRM',
        webhookUrl: webhooks.findPeople,
        pageTypes: [PageTypeEnum.COMPANY],
        order: 1
    },
    {
        id: 'lookalikeCompanyProfile',
        label: 'Lookalike company',
        webhookUrl: webhooks.lookalikeCompanyProfile,
        pageTypes: [PageTypeEnum.PROFILE],
        order: 2
    },
    {
        id: 'lookalikeCompanyCompany',
        label: 'Lookalike company',
        webhookUrl: webhooks.lookalikeCompanyCompany,
        pageTypes: [PageTypeEnum.COMPANY],
        order: 2
    }
];

// Utility: Get buttons for a specific page type
export function getButtonsForPageType(pageType: PageType): ButtonConfig[] {
    return buttonConfigs
        .filter(config => config.pageTypes.includes(pageType))
        .sort((a, b) => a.order - b.order);
}

// Utility: Detect page type from URL
export function detectPageType(url: string | undefined): PageType {
    if (!url) return PageTypeEnum.OTHER;
    if (url.includes('linkedin.com/in/')) return PageTypeEnum.PROFILE;
    if (url.includes('linkedin.com/company/')) return PageTypeEnum.COMPANY;
    return PageTypeEnum.OTHER;
}
