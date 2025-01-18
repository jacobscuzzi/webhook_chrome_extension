// filepath: /home/jbaumfal/Desktop/Side_Projects/webhook_extension/send-to-webhook-extension/popup.js
document.addEventListener("DOMContentLoaded", async () => {
  const formContainer = document.getElementById("formContainer");
  const toggleTitle = document.getElementById("toggleTitle");
  const toggleLinks = document.getElementById("toggleLinks");

  const webhooks = {
      webhook1: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-90daaca4-a9c9-40be-aa69-17245b91faa8",
      webhook2: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-583c0378-a31d-47e9-ae07-e5af6a945e88",
      webhook3: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-b09cf39e-c1e3-4bcc-84c5-462be24da8cc",
      webhook4: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-f03b2c4b-d1d5-4712-8398-03e46894e999",
  };

  const cleanUrl = (url) => url?.split("?")[0] || ""; // Clean URL by removing query parameters

  try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url.includes("linkedin.com/company/")) {
          // Company workflow
          const [{ result }] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                  const companyNameElement = document.querySelector("h1") || document.querySelector(".ember-view.org-top-card-summary__title");
                  return {
                      linkedinUrl: window.location.href,
                      companyName: companyNameElement?.textContent.trim() || "Not Found",
                  };
              },
          });

          const cleanedLinkedInUrl = cleanUrl(result.linkedinUrl);

          // Update popup HTML for company workflow
          formContainer.innerHTML = `
              <div class="form-field">
                  <label for="field1">LinkedIn Company Page</label>
                  <input type="text" id="field1" value="${cleanedLinkedInUrl}" />
              </div>
              <div class="form-field">
                  <label for="field2">Company Name</label>
                  <input type="text" id="field2" value="${result.companyName}" />
              </div>
          `;
      } else if (tab.url.includes("linkedin.com/in/")) {
          // Contact workflow
          const [{ result }] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                  const fullNameElement = document.querySelector(".inline.t-24.v-align-middle.break-words");
                  const companyPageElement = document.querySelector('[data-field="experience_company_logo"]');

                  return {
                      linkedinUrl: window.location.href,
                      fullName: fullNameElement?.textContent.trim() || "Not Found",
                      linkedinCompanyPage: companyPageElement?.getAttribute("href") || "Not Found",
                  };
              },
          });

          const cleanedLinkedInUrl = cleanUrl(result.linkedinUrl);
          const cleanedLinkedInCompanyPage = cleanUrl(result.linkedinCompanyPage);

          // Update popup HTML for contact workflow
          formContainer.innerHTML = `
              <div class="form-field">
                  <label for="field1">LinkedIn URL</label>
                  <input type="text" id="field1" value="${cleanedLinkedInUrl}" />
              </div>
              <div class="form-field">
                  <label for="field2">Full Name</label>
                  <input type="text" id="field2" value="${result.fullName}" />
              </div>
              <div class="form-field">
                  <label for="field5">LinkedIn Company Page</label>
                  <input type="text" id="field5" value="${cleanedLinkedInCompanyPage}" />
              </div>
          `;
      }
  } catch (error) {
      console.error("Error determining page type:", error);
  }

  // Add event listeners for webhook buttons
  document.getElementById("sendToWebhook1").addEventListener("click", () => sendToWebhook(webhooks.webhook1));
  document.getElementById("sendToWebhook2").addEventListener("click", () => sendToWebhook(webhooks.webhook2));
  document.getElementById("sendToWebhook3").addEventListener("click", () => sendToWebhook(webhooks.webhook3));
  document.getElementById("sendToWebhook4").addEventListener("click", () => sendToWebhook(webhooks.webhook4));

  // Function to send data to the webhook
  async function sendToWebhook(webhookUrl) {
      const payload = {
          "LinkedIn Url": document.getElementById("field1").value,
          "Full Name": document.getElementById("field2")?.value || "",
          "Company Name": document.getElementById("field2")?.value || "",
          "LinkedIn Company Page": document.getElementById("field5")?.value || "",
      };

      console.log("Payload to send:", payload);

      try {
          const response = await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
          });

          if (response.ok) {
              alert("Data successfully sent to the webhook!");
          } else {
              alert("Failed to send data to the webhook.");
          }
      } catch (error) {
          console.error("Error sending data:", error);
          alert("An error occurred while sending data.");
      }
  }

  // Toggle functionality for Clay Tables
  toggleTitle.addEventListener("click", () => {
      const isVisible = toggleLinks.style.display === "block";
      toggleLinks.style.display = isVisible ? "none" : "block";
      toggleTitle.querySelector("span").innerHTML = isVisible ? "&#43;" : "&#8722;";
  });
});