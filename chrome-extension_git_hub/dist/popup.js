import { getButtonsForPageType, detectPageType } from './webhook_tools.js';
import { PageType as PageTypeEnum } from './types.js';
// Track current state for SPA detection
let currentPageType = PageTypeEnum.OTHER;
let currentTabId;
let fullEmail = "";
// Extraction functions (moved from inline code for reusability)
function extractCompanyData() {
    const companyNameElement = document.querySelector("h1") ||
        document.querySelector(".ember-view.org-top-card-summary__title");
    return {
        linkedinUrl: window.location.href,
        companyName: companyNameElement?.textContent?.trim() ?? "Not Found",
    };
}
function extractProfileData() {
    const fullNameElement = document.querySelector(".inline.t-24.v-align-middle.break-words");
    const companyPageElement = document.querySelector('[data-field="experience_company_logo"]');
    let companyName = "";
    const topCompanyElement = document.querySelector('button[aria-label*="company"] span') ||
        document.querySelector('a[data-field="current_company_link"] span') ||
        document.querySelector('.pv-text-details__right-panel a[href*="/company/"] span');
    if (topCompanyElement) {
        companyName = topCompanyElement.textContent?.trim() ?? "";
    }
    return {
        linkedinUrl: window.location.href,
        fullName: fullNameElement?.textContent?.trim() ?? "Not Found",
        companyName: companyName,
        linkedinCompanyPage: companyPageElement?.getAttribute("href") ?? "Not Found",
    };
}
// Type-safe DOM element getters
function getElement(id) {
    return document.getElementById(id);
}
function getRequiredElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Required element "${id}" not found`);
    }
    return element;
}
// Promisified chrome.storage.sync operations
async function getStorageEmail() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('email', (data) => {
            resolve(data.email);
        });
    });
}
async function setStorageEmail(email) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ email }, () => {
            resolve();
        });
    });
}
// Safe notification display
function showNotification(message, type = 'success') {
    const existingNotification = document.getElementById('custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    const notificationDiv = document.createElement('div');
    notificationDiv.id = 'custom-notification';
    // Apply styles
    Object.assign(notificationDiv.style, {
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: type === 'success' ? 'green' : 'red',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: '1000',
        maxWidth: '300px',
        textAlign: 'center'
    });
    // Safe text content assignment (no XSS risk)
    notificationDiv.textContent = message;
    document.body.appendChild(notificationDiv);
    setTimeout(() => {
        notificationDiv.remove();
    }, 3000);
}
// Clean URL helper
function cleanUrl(url) {
    return url?.split("?")[0] ?? "";
}
// Safe DOM element creation for form fields (prevents XSS)
function createFormField(labelText, inputId, inputValue) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    const label = document.createElement('label');
    label.htmlFor = inputId;
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = inputId;
    input.value = inputValue; // Safe: .value assignment doesn't execute HTML
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(input);
    return fieldDiv;
}
// Render company form safely
function renderCompanyForm(container, data) {
    container.innerHTML = ''; // Clear safely
    container.appendChild(createFormField('LinkedIn Company Page', 'field1', cleanUrl(data.linkedinUrl)));
    container.appendChild(createFormField('Company Name', 'field2', data.companyName));
}
// Render profile form safely
function renderProfileForm(container, data) {
    container.innerHTML = ''; // Clear safely
    container.appendChild(createFormField('LinkedIn URL', 'field1', cleanUrl(data.linkedinUrl)));
    container.appendChild(createFormField('Full Name', 'field2', data.fullName));
    container.appendChild(createFormField('Company Name', 'field3', data.companyName));
    container.appendChild(createFormField('LinkedIn Company Page', 'field5', cleanUrl(data.linkedinCompanyPage)));
}
// Send data to webhook
async function sendToWebhook(webhookUrl, creatorEmail) {
    console.log("Sending to webhook:", webhookUrl);
    const field1 = getElement('field1');
    const field2 = getElement('field2');
    const field3 = getElement('field3');
    const field5 = getElement('field5');
    let payload;
    if (currentPageType === PageTypeEnum.COMPANY) {
        // Company page: field1 = company URL, field2 = company name
        payload = {
            "LinkedIn Url": "",
            "Full Name": "",
            "Company Name": field2?.value ?? "",
            "LinkedIn Company Page": field1?.value ?? "",
            "creator": creatorEmail,
        };
    }
    else {
        // Profile page or default: field1 = profile URL, field2 = full name, etc.
        payload = {
            "LinkedIn Url": field1?.value ?? "",
            "Full Name": field2?.value ?? "",
            "Company Name": field3?.value ?? "",
            "LinkedIn Company Page": field5?.value ?? "",
            "creator": creatorEmail,
        };
    }
    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (response.ok) {
            alert("Data sent successfully! You'll receive a notification shortly.");
        }
        else {
            alert("Failed to send data to the webhook.");
        }
    }
    catch (error) {
        console.error("Error sending data:", error);
        alert("An error occurred while sending data.");
    }
}
// Update email display with truncation
function updateEmailDisplay(element, email) {
    const maxLength = 20;
    const displayEmail = email.length > maxLength
        ? email.substring(0, maxLength) + "..."
        : email;
    element.textContent = displayEmail;
    element.title = email;
}
// Render webhook buttons dynamically
function renderWebhookButtons(container, pageType) {
    container.innerHTML = ''; // Clear existing buttons
    const buttons = getButtonsForPageType(pageType);
    buttons.forEach(config => {
        const button = document.createElement('button');
        button.id = config.id;
        button.textContent = config.label;
        button.addEventListener('click', () => {
            console.log(`Button clicked: ${config.label}`);
            sendToWebhook(config.webhookUrl, fullEmail);
        });
        container.appendChild(button);
    });
}
// Listen for tab URL changes (SPA navigation)
function setupNavigationListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        // Only react to URL changes on our current tab
        if (tabId === currentTabId && changeInfo.url) {
            const newPageType = detectPageType(changeInfo.url);
            // Re-render if page type changed
            if (newPageType !== currentPageType) {
                console.log(`Page type changed: ${currentPageType} -> ${newPageType}`);
                initializePage();
            }
        }
    });
}
// Initialize page: extract data and render buttons
async function initializePage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url || !tab.id) {
        console.log("No active tab or URL found");
        return;
    }
    currentTabId = tab.id;
    const pageType = detectPageType(tab.url);
    currentPageType = pageType;
    const formContainer = getRequiredElement("formContainer");
    const actionsContainer = getRequiredElement("actions");
    // Clear existing content
    formContainer.innerHTML = '';
    actionsContainer.innerHTML = '';
    // Extract and render data based on page type
    if (pageType === PageTypeEnum.COMPANY) {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractCompanyData
        });
        if (result) {
            renderCompanyForm(formContainer, result);
        }
    }
    else if (pageType === PageTypeEnum.PROFILE) {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractProfileData
        });
        if (result) {
            renderProfileForm(formContainer, result);
        }
    }
    // Render appropriate buttons
    renderWebhookButtons(actionsContainer, pageType);
}
// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
    // Get all required DOM elements
    const emailView = getRequiredElement("emailView");
    const mainView = getRequiredElement("mainView");
    const emailInput = getRequiredElement("emailInput");
    const saveEmailButton = getRequiredElement("saveEmailButton");
    const savedEmail = getRequiredElement("savedEmail");
    const editEmailButton = getRequiredElement("editEmailButton");
    const importCsvButton = getRequiredElement("importCsvButton");
    // Load saved email - properly using async/await
    const storedEmail = await getStorageEmail();
    if (storedEmail) {
        fullEmail = storedEmail;
        emailView.style.display = "none";
        mainView.style.display = "block";
        updateEmailDisplay(savedEmail, storedEmail);
    }
    else {
        emailView.style.display = "block";
        mainView.style.display = "none";
    }
    // Save email button handler
    saveEmailButton.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        if (email) {
            fullEmail = email;
            await setStorageEmail(email);
            emailView.style.display = "none";
            mainView.style.display = "block";
            updateEmailDisplay(savedEmail, email);
        }
    });
    // Edit email button handler
    editEmailButton.addEventListener("click", () => {
        emailInput.value = fullEmail;
        mainView.style.display = "none";
        emailView.style.display = "block";
    });
    // Extract LinkedIn data from current tab and render buttons
    await initializePage();
    // Setup SPA navigation detection
    setupNavigationListener();
    // Import CSV button handler
    importCsvButton.addEventListener('click', () => {
        window.open('upload.html', '_blank', 'width=800,height=600');
    });
});
//# sourceMappingURL=popup.js.map