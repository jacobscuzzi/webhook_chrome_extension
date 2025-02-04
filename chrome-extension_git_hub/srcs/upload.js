import { webhooks} from './webhook_tools.js';

document.addEventListener('DOMContentLoaded', () => {
    const uploadCsvButton = document.getElementById('uploadCsvButton');
    const csvFileInput = document.getElementById('csvFileInput');
    let fullEmail = "";

    // Retrieve the email from chrome.storage.sync
    chrome.storage.sync.get("email", (data) => {
        if (data.email) {
            fullEmail = data.email;
            console.log("Email retrieved:", fullEmail);
        } else {
            alert("Please save your email address first in the main popup.");
            window.close();
        }
    });

    uploadCsvButton.addEventListener('click', () => {
        csvFileInput.click();
    });

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

    csvFileInput.addEventListener('change', async (event) => {
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
                alert(` Contacts Processed: ${contacts.length}\n Contacts Imported Successful: ${successCount}`);
            }

            if (failureCount > 0) {
                alert(`Failed: ${failureCount}`);
            }

            csvFileInput.value = '';
        } catch (error) {
            alert(error.message || 'An unexpected error occurred');
        }
    });
});