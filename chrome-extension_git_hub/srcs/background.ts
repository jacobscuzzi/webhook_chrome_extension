import { buttonConfigs, detectPageType } from './webhook_tools.js';
import type { LinkWebhookPayload } from './types.js';

// Helper function to show notifications
async function showNotification(title: string, message: string): Promise<void> {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon.png',
    title,
    message
  });
}

// Create context menus dynamically from buttonConfigs
chrome.runtime.onInstalled.addListener((): void => {
  buttonConfigs.forEach(config => {
    chrome.contextMenus.create({
      id: config.id,
      title: config.label,
      contexts: ["link"],
      documentUrlPatterns: ["*://*.linkedin.com/*"]
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(
  async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): Promise<void> => {
    const linkUrl = info.linkUrl;

    if (!linkUrl || !linkUrl.includes("linkedin.com/")) {
      await showNotification("Error", "This is not a LinkedIn link.");
      return;
    }

    // Detect page type from the clicked link
    const pageType = detectPageType(linkUrl);

    // Find the button config for this menu item
    const config = buttonConfigs.find(c => c.id === info.menuItemId);

    if (!config) {
      await showNotification("Error", "Invalid menu action.");
      return;
    }

    // Validate that the button is appropriate for this page type
    if (!config.pageTypes.includes(pageType)) {
      await showNotification(
        "Invalid Action",
        `This action is not available for ${pageType} pages.`
      );
      return;
    }

    // Send to webhook
    const payload: LinkWebhookPayload = { linkUrl };

    try {
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await showNotification("Success", `${config.label}: Data sent successfully!`);
      } else {
        await showNotification("Error", "Failed to send data to the webhook.");
      }
    } catch (error) {
      console.error("Error sending data to the webhook:", error);
      await showNotification("Error", "An error occurred.");
    }
  }
);
