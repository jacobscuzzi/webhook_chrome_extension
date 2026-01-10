import { webhooks } from './webhook_tools.js';
import type { CSVContact, ContactWebhookPayload, StorageData } from './types.js';

// Type-safe DOM element getter
function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}

// Promisified chrome.storage.sync.get
async function getStorageEmail(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("email", (data: StorageData) => {
      resolve(data.email);
    });
  });
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Parse CSV with proper handling of quoted fields
function parseCSV(csvText: string, creatorEmail: string): CSVContact[] {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

  const nameIndex = headers.findIndex(header =>
    ['full name', 'name', 'fullname', 'contact'].includes(header)
  );
  const linkedinIndex = headers.findIndex(header =>
    ['linkedin url', 'linkedin profile', 'linkedin', 'profile url'].includes(header)
  );

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
    .filter((row): row is CSVContact =>
      Boolean(row.fullName) && Boolean(row.linkedinUrl)
    );
}

// Send contact to webhook
async function sendContactToWebhook(
  contact: CSVContact,
  creatorEmail: string
): Promise<boolean> {
  const payload: ContactWebhookPayload = {
    "LinkedIn Url": contact.linkedinUrl,
    "Full Name": contact.fullName,
    "creator": creatorEmail,
  };

  try {
    console.log(`Sending data for contact: ${contact.fullName}`);
    const response = await fetch(webhooks.webhook1, {
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
  } catch (error) {
    console.error("Error sending contact:", error);
    return false;
  }
}

// Main initialization
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
  const uploadCsvButton = getElement<HTMLButtonElement>('uploadCsvButton');
  const csvFileInput = getElement<HTMLInputElement>('csvFileInput');

  // Get email using async/await pattern
  const fullEmail = await getStorageEmail();

  if (!fullEmail) {
    alert("Please save your email address first in the main popup.");
    window.close();
    return;
  }

  console.log("Email retrieved:", fullEmail);

  uploadCsvButton.addEventListener('click', (): void => {
    csvFileInput.click();
  });

  csvFileInput.addEventListener('change', async (event: Event): Promise<void> => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const csvText = await file.text();
      const contacts = parseCSV(csvText, fullEmail);

      console.log(`Total contacts to process: ${contacts.length}`);

      // Send all contacts concurrently
      const results = await Promise.all(
        contacts.map(contact => sendContactToWebhook(contact, fullEmail))
      );

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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert(message);
    }
  });
});
