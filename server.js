const express = require('express');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_URL = process.env.CSV_URL;

// Hàm tải và xử lý dữ liệu từ đường dẫn CSV của Google Sheet
async function getLinksFromCSV() {
    try {
        if (!CSV_URL) {
            console.error("Chưa cấu hình biến môi trường CSV_URL");
            return null;
        }
        
        // Gọi dữ liệu CSV (Google cập nhật dữ liệu này rất nhanh khi Sheet thay đổi)
        const response = await axios.get(CSV_URL);
        
        // Parse nội dung chuỗi CSV thành mảng dữ liệu cấu trúc
        const records = parse(response.data, {
            columns: false,
            skip_empty_lines: true
        });

        const linkMap = {};
        
        // Bỏ qua dòng tiêu đề (i = 0 là dòng code | link_full), duyệt dữ liệu từ dòng i = 1
        for (let i = 1; i < records.length; i++) {
            const row = records[i];
            if (row[0] && row[1]) {
                const code = row[0].trim().toLowerCase();
                const linkFull = row[1].trim();
                linkMap[code] = linkFull;
            }
        }
        return linkMap;
    } catch (error) {
        console.error("Lỗi khi tải hoặc parse file CSV từ Google Sheets:", error.message);
        return null;
    }
}

app.get('/', (req, res) => {
    res.send('<h3>Hệ thống Rút gọn link (Docker + Google Sheet CSV) đang hoạt động ổn định!</h3>');
});

// Xử lý chuyển hướng link động
app.get('/:code', async (req, res) => {
    const code = req.params.code.trim().toLowerCase();
    const links = await getLinksFromCSV();

    if (!links) {
        return res.status(500).send('Lỗi hệ thống: Không thể kết nối hoặc đọc dữ liệu từ Google Sheet.');
    }

    if (links[code]) {
        // Sử dụng redirect 302 để trình duyệt luôn truy vấn lại VPS, 
        // giúp cập nhật link mới tức thì khi anh sửa trên Sheet.
        return res.redirect(302, links[code]);
    } else {
        return res.status(404).send('<h3>Lỗi 404: Mã rút gọn không tồn tại hoặc đã bị xóa!</h3>');
    }
});

app.listen(PORT, () => {
    console.log(`Server đang lắng nghe tại cổng ${PORT}`);
});
