const webhooks = {
    contacts: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-90daaca4-a9c9-40be-aa69-17245b91faa8",
    companies: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-583c0378-a31d-47e9-ae07-e5af6a945e88",
  };
  
  // Create context menu
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "sendToWebhook",
      title: "Send to Webhook",
      contexts: ["link"],
    });
  });
  
  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info) => {
    const linkUrl = info.linkUrl;
  
    if (!linkUrl.includes("linkedin.com/")) {
      alert("This is not a LinkedIn link.");
      return;
    }
  
    let webhookUrl;
    if (linkUrl.includes("linkedin.com/in/")) {
      webhookUrl = webhooks.contacts;
    } else if (linkUrl.includes("linkedin.com/company/")) {
      webhookUrl = webhooks.companies;
    } else {
      alert("Invalid LinkedIn URL.");
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
