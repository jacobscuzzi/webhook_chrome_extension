import { webhooks } from './webhook_tools.js';
// Type-safe DOM element getter
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return element;
}
// Promisified chrome.storage.sync.get
async function getStorageEmail() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("email", (data) => {
            resolve(data.email);
        });
    });
}
// Parse a single CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        }
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
// Parse CSV with proper handling of quoted fields
function parseCSV(csvText, creatorEmail) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    // Parse header row
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
    const nameIndex = headers.findIndex(header => ['full name', 'name', 'fullname', 'contact'].includes(header));
    const linkedinIndex = headers.findIndex(header => ['linkedin url', 'linkedin profile', 'linkedin', 'profile url'].includes(header));
    if (nameIndex === -1 || linkedinIndex === -1) {
        throw new Error('CSV must contain columns for Name and LinkedIn URL');
    }
    if (!creatorEmail) {
        throw new Error("Email not saved");
    }
    return lines.slice(1)
        .map(line => {
        const values = parseCSVLine(line);
        return {
            fullName: values[nameIndex]?.trim() || '',
            linkedinUrl: values[linkedinIndex]?.trim() || ''
        };
    })
        .filter((row) => Boolean(row.fullName) && Boolean(row.linkedinUrl));
}
// Send contact to webhook
async function sendContactToWebhook(contact, creatorEmail) {
    const payload = {
        "LinkedIn Url": contact.linkedinUrl,
        "Full Name": contact.fullName,
        "creator": creatorEmail,
    };
    try {
        console.log(`Sending data for contact: ${contact.fullName}`);
        const response = await fetch(webhooks.csvImport, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            console.error(`Failed to send data for ${contact.fullName}`);
            return false;
        }
        console.log(`Successfully sent data for ${contact.fullName}`);
        return true;
    }
    catch (error) {
        console.error("Error sending contact:", error);
        return false;
    }
}
// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    const uploadCsvButton = getElement('uploadCsvButton');
    const csvFileInput = getElement('csvFileInput');
    // Get email using async/await pattern
    const fullEmail = await getStorageEmail();
    if (!fullEmail) {
        alert("Please save your email address first in the main popup.");
        window.close();
        return;
    }
    console.log("Email retrieved:", fullEmail);
    uploadCsvButton.addEventListener('click', () => {
        csvFileInput.click();
    });
    csvFileInput.addEventListener('change', async (event) => {
        const target = event.target;
        const file = target.files?.[0];
        if (!file)
            return;
        try {
            const csvText = await file.text();
            const contacts = parseCSV(csvText, fullEmail);
            console.log(`Total contacts to process: ${contacts.length}`);
            // Send all contacts concurrently
            const results = await Promise.all(contacts.map(contact => sendContactToWebhook(contact, fullEmail)));
            // Count results
            const successCount = results.filter(Boolean).length;
            const failureCount = results.length - successCount;
            if (successCount > 0) {
                alert(`Contacts Processed: ${contacts.length}\nContacts Imported Successfully: ${successCount}`);
            }
            if (failureCount > 0) {
                alert(`Failed: ${failureCount}`);
            }
            // Reset file input
            csvFileInput.value = '';
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred';
            alert(message);
        }
    });
});
//# sourceMappingURL=upload.js.map