# 🚀 Google Sheets URL Shortener (Docker)

[🇻🇳 Tiếng Việt](README.md) | [🇺🇸 English]

A lightweight, self-hosted URL shortener built with **Node.js (Express)** and **Docker**. It uses **Google Sheets** as a database (via public CSV) and features a secure, responsive Web Form to easily add links from both PC and mobile devices.

## 🌟 Features
- 🏎️ **Fast & Cost-effective:** No Google Cloud Console API Key required, no quota limits to worry about.
- 📱 **Responsive Web UI:** Tailored interface for an optimal experience on both desktop and mobile devices.
- 🔒 **Secure:** The creation form is protected by an admin password configured directly via `.env`.
- 🔄 **Instant Updates:** Changes made directly on Google Sheets or via the Web Form are updated instantly without reloading the server.
- 🐳 **1-Click Deployment:** Fully containerized with Docker Compose.

---

## 🛠️ Installation & Deployment Guide

### 1. Google Sheets Setup

#### Step A: Publish Google Sheet as CSV
1. Create a new Google Sheet with two columns:
   - **Column A:** `code` (The shortened path, e.g., `fb`, `zalo`)
   - **Column B:** `link_full` (The destination URL)
2. Go to **File** > **Share** > **Publish to web**.
3. Select your link tab, change the format from *Web page* to **Comma-separated values (.csv)**.
4. Click **Publish** and copy the generated URL.

#### Step B: Configure Google Apps Script (For Web Form Handling)
1. In the Google Sheet menu, navigate to **Extensions** > **Apps Script**.
2. Delete any default code and paste the following snippet:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var code = data.code;
    var linkFull = data.link_full;
    
    if (!code || !linkFull) {
      return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "Missing parameters"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    
    // Check for duplicate code
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0].toString().toLowerCase() === code.toLowerCase()) {
        return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "This code already exists!"})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    sheet.appendRow([code, linkFull]);
    return ContentService.createTextOutput(JSON.stringify({"status": "success", "message": "Link added successfully!"})).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}