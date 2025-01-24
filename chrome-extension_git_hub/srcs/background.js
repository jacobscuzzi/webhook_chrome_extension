
const webhooks = {
  webhook1: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-90daaca4-a9c9-40be-aa69-17245b91faa8",
  webhook2: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-583c0378-a31d-47e9-ae07-e5af6a945e88",
  webhook3: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-b09cf39e-c1e3-4bcc-84c5-462be24da8cc",
  webhook4: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-f03b2c4b-d1d5-4712-8398-03e46894e999",
};

// Create context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
      id: "sendToWebhook1",
      title: "Send to Contacts",
      contexts: ["link"],
  });
  chrome.contextMenus.create({
      id: "sendToWebhook2",
      title: "Send to Company Enrichement",
      contexts: ["link"],
  });
  chrome.contextMenus.create({
      id: "sendToWebhook3",
      title: "Send to Indepth research",
      contexts: ["link"],
  });
  chrome.contextMenus.create({
      id: "sendToWebhook4",
      title: "Send to Custom Learningpage",
      contexts: ["link"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const linkUrl = info.linkUrl;

  if (!linkUrl.includes("linkedin.com/")) {
      alert("This is not a LinkedIn link.");
      return;
  }

  let webhookUrl;
  switch (info.menuItemId) {
      case "sendToWebhook1":
          webhookUrl = webhooks.webhook1;
          break;
      case "sendToWebhook2":
          webhookUrl = webhooks.webhook2;
          break;
      case "sendToWebhook3":
          webhookUrl = webhooks.webhook3;
          break;
      case "sendToWebhook4":
          webhookUrl = webhooks.webhook4;
          break;
      default:
          alert("Invalid Webhook.");
          return;
  }

  const payload = { linkUrl };

  fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
  })
  .then((response) => {
      if (response.ok) {
          alert("Data successfully sent to the webhook!");
      } else {
          alert("Failed to send data to the webhook.");
      }
  })
  .catch((error) => {
      console.error("Error sending data to the webhook:", error);
      alert("An error occurred.");
  });
});