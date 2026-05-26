const express = require('express');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const app = express();
app.use(express.json()); // Để đọc dữ liệu JSON gửi lên từ Form

const PORT = process.env.PORT || 3000;
const CSV_URL = process.env.CSV_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const APPSCRIPT_URL = process.env.APPSCRIPT_URL;

// Hàm tải dữ liệu CSV từ Google Sheet
async function getLinksFromCSV() {
    try {
        if (!CSV_URL) return null;
        const response = await axios.get(CSV_URL);
        const records = parse(response.data, { columns: false, skip_empty_lines: true });
        const linkMap = {};
        for (let i = 1; i < records.length; i++) {
            const row = records[i];
            if (row[0] && row[1]) {
                linkMap[row[0].trim().toLowerCase()] = row[1].trim();
            }
        }
        return linkMap;
    } catch (error) {
        console.error("Lỗi đọc CSV:", error.message);
        return null;
    }
}

// GIAO DIỆN TRANG CHỦ: FORM THÊM LINK (Tối ưu PC/Mobile)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hệ thống rút gọn link</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            body { background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
            .container { background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 500px; }
            h2 { color: #333; margin-bottom: 20px; text-align: center; font-size: 24px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 6px; color: #555; font-weight: 600; font-size: 14px; }
            input { width: 100%; padding: 12px; border: 1px solid #cccccc; border-radius: 6px; font-size: 16px; outline: none; transition: 0.3s; }
            input:focus { border-color: #007bff; box-shadow: 0 0 5px rgba(0,123,255,0.2); }
            button { width: 100%; padding: 12px; background: #007bff; border: none; color: white; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer; transition: 0.3s; margin-top: 10px; }
            button:hover { background: #0056b3; }
            #message { margin-top: 15px; padding: 10px; border-radius: 6px; display: none; text-align: center; font-weight: 600; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Rút Gọn Link Hệ Thống</h2>
            <div id="message"></div>
            <form id="shortenForm">
                <div class="form-group">
                    <label>Link gốc (Full Link):</label>
                    <input type="url" id="link_full" placeholder="https://example.com/duong-dan-dai..." required>
                </div>
                <div class="form-group">
                    <label>Mã rút gọn (Code):</label>
                    <input type="text" id="code" placeholder="Ví dụ: fb, zalo, kịchbản" required>
                </div>
                <div class="form-group">
                    <label>Mật khẩu quản trị:</label>
                    <input type="password" id="password" placeholder="Nhập mật khẩu để xác thực" required>
                </div>
                <button type="submit">Tạo Link Rút Gọn</button>
            </form>
        </div>

        <script>
            document.getElementById('shortenForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const msgDiv = document.getElementById('message');
                msgDiv.style.display = 'none';

                const data = {
                    link_full: document.getElementById('link_full').value,
                    code: document.getElementById('code').value,
                    password: document.getElementById('password').value
                };

                try {
                    const response = await fetch('/add-link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();

                    msgDiv.innerText = result.message;
                    msgDiv.className = response.ok ? 'success' : 'error';
                    msgDiv.style.display = 'block';

                    if(response.ok) {
                        document.getElementById('shortenForm').reset();
                    }
                } catch (err) {
                    msgDiv.innerText = "Lỗi kết nối đến Server VPS!";
                    msgDiv.className = 'error';
                    msgDiv.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>
    `);
});

// API XỬ LÝ NHẬN DỮ LIỆU TỪ FORM VÀ ĐẨY LÊN GOOGLE APPS SCRIPT
app.post('/add-link', async (req, res) => {
    const { link_full, code, password } = req.body;

    // 1. Kiểm tra mật khẩu mã hóa cứng từ .env
    if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ status: 'error', message: 'Sai mật khẩu quản trị!' });
    }

    if (!link_full || !code) {
        return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ thông tin!' });
    }

    try {
        // 2. Gửi dữ liệu sang Google Apps Script bằng phương thức POST
        const response = await axios.post(APPSCRIPT_URL, {
            code: code.trim().toLowerCase(),
            link_full: link_full.trim()
        });

        if (response.data.status === 'success') {
            return res.json({ status: 'success', message: 'Đã thêm link vào Google Sheet thành công!' });
        } else {
            return res.status(400).json({ status: 'error', message: response.data.message || 'Lỗi Apps Script.' });
        }
    } catch (error) {
        console.error("Lỗi khi kết nối Apps Script:", error.message);
        return res.status(500).json({ status: 'error', message: 'Không thể kết nối đến Google AppScript.' });
    }
});

// XỬ LÝ ĐIỀU HƯỚNG LINK RÚT GỌN (Giữ nguyên)
app.get('/:code', async (req, res) => {
    const code = req.params.code.trim().toLowerCase();
    const links = await getLinksFromCSV();

    if (!links) return res.status(500).send('Lỗi hệ thống không lấy được data.');

    if (links[code]) {
        return res.redirect(302, links[code]);
    } else {
        return res.status(404).send('<h3>Mã rút gọn không tồn tại!</h3>');
    }
});

app.listen(PORT, () => {
    console.log(`Hệ thống đang chạy tại cổng ${PORT}`);
});
