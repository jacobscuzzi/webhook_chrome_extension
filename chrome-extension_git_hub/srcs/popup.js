// added Popup for csv import

function showNotification(message, type = 'success') {
    const existingNotification = document.getElementById('custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notificationDiv = document.createElement('div');
    notificationDiv.id = 'custom-notification';
    notificationDiv.style.position = 'fixed';
    notificationDiv.style.top = '10px';
    notificationDiv.style.left = '50%';
    notificationDiv.style.transform = 'translateX(-50%)';
    notificationDiv.style.backgroundColor = type === 'success' ? 'green' : 'red';
    notificationDiv.style.color = 'white';
    notificationDiv.style.padding = '10px';
    notificationDiv.style.borderRadius = '5px';
    notificationDiv.style.zIndex = '1000';
    notificationDiv.style.maxWidth = '300px';
    notificationDiv.style.textAlign = 'center';
    notificationDiv.textContent = message;
    
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => {
        document.body.removeChild(notificationDiv);
    }, 3000);
}


// Main part
document.addEventListener("DOMContentLoaded", async () => {
  const emailView = document.getElementById("emailView");
  const mainView = document.getElementById("mainView");
  const emailInput = document.getElementById("emailInput");
  const saveEmailButton = document.getElementById("saveEmailButton");
  const savedEmail = document.getElementById("savedEmail");
  const editEmailButton = document.getElementById("editEmailButton");
  const csvFileInput = document.getElementById("csvFileInput");
  const importCsvButton = document.getElementById("importCsvButton");

  let fullEmail = ""; 

  function updateEmailDisplay(email) {
      const maxLength = 20;
      const displayEmail = email.length > maxLength ? 
          email.substring(0, maxLength) + "..." : 
          email;
      savedEmail.textContent = displayEmail;
      savedEmail.title = email;
  }

  await chrome.storage.sync.get("email", (data) => {
      if (data.email) {
          fullEmail = data.email;
          emailView.style.display = "none";
          mainView.style.display = "block";
          updateEmailDisplay(data.email);
      } else {
          emailView.style.display = "block";
          mainView.style.display = "none";
      }
  });

  saveEmailButton.addEventListener("click", async () => {
      const email = emailInput.value;
      if (email) {
          fullEmail = email;
          await chrome.storage.sync.set({ email });
          emailView.style.display = "none";
          mainView.style.display = "block";
          updateEmailDisplay(email);
      }
  });

  editEmailButton.addEventListener("click", () => {
      emailInput.value = fullEmail;
      mainView.style.display = "none";
      emailView.style.display = "block";
  });

  const webhooks = {
      webhook1: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-90daaca4-a9c9-40be-aa69-17245b91faa8",
      webhook2: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-583c0378-a31d-47e9-ae07-e5af6a945e88",
      malo_tester: "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-b77d1251-bcae-41a4-9e36-b17082d5814e",
      tester: "https://hundreds-nightfall-52.webhook.cool"
  };

  const cleanUrl = (url) => url?.split("?")[0] || "";

  try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url.includes("linkedin.com/company/")) {
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

  // File input trigger
  importCsvButton.addEventListener('click', () => {
      console.log("Import CSV button clicked");
      csvFileInput.click();
  });

  // CSV parsing function
  function parseCSV(csvText) {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(header => header.trim().toLowerCase());

      const nameIndex = headers.findIndex(header => 
          ['full name', 'name', 'fullname', 'contact'].includes(header)
      );
      const linkedinIndex = headers.findIndex(header => 
          ['linkedin url', 'linkedin profile', 'linkedin', 'profile url'].includes(header)
      );

      if (nameIndex === -1 || linkedinIndex === -1) {
          throw new Error('CSV must contain columns for Name and LinkedIn URL');
      }

      if (!fullEmail) {
          alert("Please save your email address first");
          throw new Error("Email not saved");
      }

      return lines.slice(1).map(line => {
          const values = line.split(',').map(value => value.trim());
          return {
              fullName: values[nameIndex],
              linkedinUrl: values[linkedinIndex]
          };
      }).filter(row => row.fullName && row.linkedinUrl);
  }

  // File selection handler
  csvFileInput.addEventListener('change', async (event) => {

    event.preventDefault();
    event.stopPropagation();


    const file = event.target.files[0];
    if (!file) return;

    try {
        const csvText = await file.text();
        const contacts = parseCSV(csvText);

        let successCount = 0;
        let failureCount = 0;

        console.log(`Total contacts to process: ${contacts.length}`);


        // Use Promise.all to send all contacts concurrently
        const results = await Promise.all(contacts.map(async (contact) => {
            const payload = {
                "LinkedIn Url": contact.linkedinUrl,
                "Full Name": contact.fullName,
                "creator": fullEmail,
            };

            try {
                console.log(`Sending data for contact: ${contact.fullName}`);
                const response = await fetch(webhooks.tester, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    console.error(`Failed to send data for ${contact.fullName}`);
                    return false;
                } else {
                    console.log(`Successfully sent data for ${contact.fullName}`);
                    return true;
                }
            } catch (error) {
                console.error("Error sending contact:", error);
                return false;
            }
        }));

        // Count successes and failures
        successCount = results.filter(result => result).length;
        failureCount = results.filter(result => !result).length;

        if (successCount > 0) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../images/icon.png',
                title: 'CSV Import Success',
                message: `Processed: ${contacts.length}\nSuccessful: ${successCount}`
            });
        }

        if (failureCount > 0) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../images/icon.png',
                title: 'CSV Import Partial Failure',
                message: `Failed: ${failureCount}`
            });
        }

        csvFileInput.value = '';
    } catch (error) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../images/icon.png',
            title: 'CSV Import Error',
            message: error.message || 'An unexpected error occurred'
        });
    }
});

  // Existing webhook send buttons
  document.getElementById("sendToWebhook1").addEventListener("click", () => {
      console.log("Send to Webhook 1 button clicked");
      sendToWebhook(webhooks.tester);                                           //// UNBEDINGT ÄNDERN (JETZT MIT TEST API)
  });
  document.getElementById("sendToWebhook2").addEventListener("click", () => {
      console.log("Send to Webhook 2 button clicked");
      sendToWebhook(webhooks.tester);                                        //// UNBEDINGT ÄNDERN (JETZT MIT TEST API) 
  });
// functioon to send to webhook
  async function sendToWebhook(webhookUrl) {
      console.log("Sending to webhook:", webhookUrl);
      const payload = {
          "LinkedIn Url": document.getElementById("field1").value,
          "Full Name": document.getElementById("field2")?.value || "",
          "Company Name": document.getElementById("field2")?.value || "",
          "LinkedIn Company Page": document.getElementById("field5")?.value || "",
          "creator": fullEmail,
      };

      try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            alert("Tu vas recevoir un message sur Teams dans quelques instants !");
        } else {
            alert("Failed to send data to the webhook.");
        }
    } catch (error) {
        console.error("Error sending data:", error);
        alert("An error occurred while sending data.");
    }
}
});