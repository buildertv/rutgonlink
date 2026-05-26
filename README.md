# 🚀 Google Sheets URL Shortener (Docker)

[🇻🇳 Tiếng Việt] | [🇺🇸 English](README.en.md)

Hệ thống rút gọn liên kết (URL Shortener) cá nhân gọn nhẹ, sử dụng **Node.js (Express)** đóng gói bằng **Docker**, lấy dữ liệu trực tiếp từ **Google Sheets** (dạng CSV) và hỗ trợ giao diện Web Form bảo mật để thêm link nhanh từ điện thoại/máy tính.

## 🌟 Tính năng nổi bật
- 🏎️ **Tốc độ cao & Tiết kiệm:** Không cần tạo API Key từ Google Cloud Console, không lo vượt quá giới hạn (quota).
- 📱 **Giao diện Web thân thiện:** Tối ưu hóa giao diện (Responsive) cho cả PC và Điện thoại di động.
- 🔒 **Bảo mật:** Form nhập liệu được bảo vệ bằng mật khẩu quản trị cấu hình trực tiếp trong `.env`.
- 🔄 **Cập nhật tức thì:** Thay đổi dữ liệu trực tiếp trên Google Sheets hoặc qua Web Form, hệ thống tự động nhận diện không cần khởi động lại.
- 🐳 **Triển khai 1-click:** Đóng gói hoàn chỉnh bằng Docker Compose.

---

## 🛠️ Hướng dẫn cài đặt & Triển khai

### 1. Cấu hình trên Google Sheets

#### Bước A: Xuất bản Google Sheet dạng CSV
1. Tạo một Google Sheet mới với 2 cột:
   - **Cột A:** `code` (Mã rút gọn, ví dụ: `fb`, `zalo`)
   - **Cột B:** `link_full` (Đường dẫn gốc)

2. Vào **Tệp (File)** > **Chia sẻ (Share)** > **Xuất bản lên web (Publish to web)**.

3. Tại hộp thoại, chọn tab chứa link của bạn, chuyển định dạng từ *Trang web* sang **Giá trị phân tách bằng dấu phẩy (.csv)**.

4. Bấm **Xuất bản (Publish)** và copy lại đoạn URL hiển thị (để đưa vào `.env`).

---

#### Bước B: Cấu hình Google Apps Script (Trình nhận dữ liệu từ Web Form)

1. Trên thanh công cụ Google Sheet, vào **Tiện ích mở rộng (Extensions)** > **Apps Script**.

2. Xóa toàn bộ mã mặc định và dán đoạn code sau vào:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var code = data.code;
    var linkFull = data.link_full;
    
    if (!code || !linkFull) {
      return ContentService.createTextOutput(JSON.stringify({
        "status": "error",
        "message": "Thiếu dữ liệu"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    
    // Kiểm tra trùng mã code
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0].toString().toLowerCase() === code.toLowerCase()) {
        return ContentService.createTextOutput(JSON.stringify({
          "status": "error",
          "message": "Mã code này đã tồn tại!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    sheet.appendRow([code, linkFull]);

    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "Thêm liên kết thành công!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Bấm **Triển khai (Deploy)** > **Triển khai mới (New deployment)**.

4. Chọn loại cấu hình là **Ứng dụng web (Web app)**.

5. Tại mục *Người có quyền truy cập (Who has access)*, chọn **Bất kỳ ai (Anyone)**.

6. Ấn **Triển khai** và sao chép lại **URL của ứng dụng web** (Web app URL).

---

### 2. Triển khai trên VPS (Qua Docker Compose)

#### Bước A: Clone mã nguồn về VPS

Kết nối SSH vào VPS của bạn và chạy lệnh:

```bash
cd /home
git clone <LINK_REPO_GITHUB_CỦA_BẠN>
cd <TEN_THƯ_MỤC_DỰ_ÁN>
```

---

#### Bước B: Cấu hình file docker-compose.yml

Chỉnh sửa file `docker-compose.yml` của bạn:

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
      - CSV_URL=ĐIỀN_LINK_CSV_GOOGLE_SHEETS_TẠI_BƯỚC_A
      - ADMIN_PASSWORD=MẬT_KHẨU_QUẢN_TRỊ_TỰ_CHỌN
      - APPSCRIPT_URL=ĐIỀN_LINK_WEB_APP_APPSCRIPT_TẠI_BƯỚC_B

    restart: always
```

---

#### Bước C: Khởi chạy hệ thống

```bash
docker compose up -d --build
```

---

## 📖 Hướng dẫn sử dụng

### Trang quản trị
Truy cập:

```text
http://<IP_VPS>:3515/
```

Nhập:
- Link gốc
- Mã rút gọn
- Mật khẩu quản trị

để thêm liên kết mới.

---

### Link rút gọn

Ví dụ:

```text
http://<IP_VPS>:3515/fb
```

Hệ thống sẽ tự động redirect (302) tới link gốc tương ứng.

---

## 📄 Giấy phép

Mã nguồn này được phát hành dưới bản quyền MIT License.