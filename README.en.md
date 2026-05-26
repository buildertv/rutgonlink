# 🚀 Google Sheets URL Shortener (Docker)

[🇻🇳 Tiếng Việt](README.md) | [🇺🇸 English]

A lightweight, self-hosted URL shortener built with **Node.js (Express)** and **Docker**. It uses **Google Sheets** as a database (via public CSV) and features a secure, responsive Web Form to easily add links from both PC and mobile devices.

## 🌟 Features
- 🏎️ **Fast & Cost-effective:** No Google Cloud Console API Key required, no quota limits to worry about.
- 📱 **Responsive Web UI:** Tailored interface for desktop and mobile devices.
- 🔒 **Secure:** The creation form is protected by an admin password configured via `.env`.
- 🔄 **Instant Updates:** Any changes made in Google Sheets or through the Web Form are updated instantly without restarting the server.
- 🐳 **1-Click Deployment:** Fully containerized with Docker Compose.

---

## 🛠️ Installation & Deployment Guide

### 1. Google Sheets Setup

#### Step A: Publish Google Sheet as CSV

1. Create a Google Sheet with two columns:
   - **Column A:** `code`
   - **Column B:** `link_full`

2. Go to **File** > **Share** > **Publish to web**.

3. Change the format to **Comma-separated values (.csv)**.

4. Click **Publish** and copy the generated CSV URL.

---

#### Step B: Configure Google Apps Script

1. Open **Extensions** > **Apps Script**.

2. Remove the default code and paste:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var code = data.code;
    var linkFull = data.link_full;
    
    if (!code || !linkFull) {
      return ContentService.createTextOutput(JSON.stringify({
        "status": "error",
        "message": "Missing parameters"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    
    // Check duplicate code
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0].toString().toLowerCase() === code.toLowerCase()) {
        return ContentService.createTextOutput(JSON.stringify({
          "status": "error",
          "message": "This code already exists!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    sheet.appendRow([code, linkFull]);

    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "Link added successfully!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click **Deploy** > **New deployment**.

4. Choose **Web app**.

5. Set access to **Anyone**.

6. Deploy and copy the **Web app URL**.

---

### 2. VPS Deployment (Docker Compose)

#### Step A: Clone Repository

```bash
cd /home
git clone <YOUR_GITHUB_REPO_LINK>
cd <YOUR_PROJECT_DIRECTORY>
```

---

#### Step B: Configure docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: url_shortener

    ports:
      - "3515:3000"

    environment:
      - PORT=3000
      - CSV_URL=YOUR_GOOGLE_SHEETS_CSV_URL
      - ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
      - APPSCRIPT_URL=YOUR_APPSCRIPT_WEBAPP_URL

    restart: always
```

---

#### Step C: Start Application

```bash
docker compose up -d --build
```

---

## 📖 Usage

### Admin Dashboard

Open:

```text
http://<YOUR_VPS_IP>:3515/
```

Enter:
- Destination URL
- Short code
- Admin password

to create a new short link.

---

### Short Link

Example:

```text
http://<YOUR_VPS_IP>:3515/fb
```

The system will automatically redirect (302) to the destination URL.

---

## 📄 License

This project is licensed under the MIT License.