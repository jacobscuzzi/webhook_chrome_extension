import type { LinkWebhookPayload } from './types.js';

const webhooks = {
  webhook1: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-90daaca4-a9c9-40be-aa69-17245b91faa8",
  webhook2: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-583c0378-a31d-47e9-ae07-e5af6a945e88",
} as const;

type WebhookId = 'sendToWebhook1' | 'sendToWebhook2';

// Helper function to show notifications in service worker context
async function showNotification(title: string, message: string): Promise<void> {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: '/images/icon.png',
    title,
    message
  });
}

// Create context menus
chrome.runtime.onInstalled.addListener((): void => {
  chrome.contextMenus.create({
    id: "sendToWebhook1",
    title: "Enrichir Contact",
    contexts: ["link"],
  });
  chrome.contextMenus.create({
    id: "sendToWebhook2",
    title: "Analyse Entreprise",
    contexts: ["link"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(
  async (info: chrome.contextMenus.OnClickData, _tab?: chrome.tabs.Tab): Promise<void> => {
    const linkUrl = info.linkUrl;

    if (!linkUrl || !linkUrl.includes("linkedin.com/")) {
      await showNotification("Error", "This is not a LinkedIn link.");
      return;
    }

    const menuItemId = info.menuItemId as string;

    // Type-safe webhook lookup
    let webhookUrl: string | undefined;
    if (menuItemId === "sendToWebhook1") {
      webhookUrl = webhooks.webhook1;
    } else if (menuItemId === "sendToWebhook2") {
      webhookUrl = webhooks.webhook2;
    }

    if (!webhookUrl) {
      await showNotification("Error", "Invalid Webhook.");
      return;
    }

    const payload: LinkWebhookPayload = { linkUrl };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await showNotification("Success", "Data successfully sent to the webhook!");
      } else {
        await showNotification("Error", "Failed to send data to the webhook.");
      }
    } catch (error) {
      console.error("Error sending data to the webhook:", error);
      await showNotification("Error", "An error occurred.");
    }
  }
);
