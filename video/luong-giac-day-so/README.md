# Video bài giảng: Lượng giác và Dãy số (Toán 11)

Video 16:9 (1920×1080, 30 fps), dài khoảng 3 phút 40 giây, đi cùng đề cương trong `de-cuong/`.
Không có tiếng; giáo viên thuyết minh trực tiếp hoặc ghép nhạc nền.

| File | Nội dung |
|---|---|
| `index.html` | Toàn bộ video: công thức gõ bằng KaTeX, hình động bằng SVG. Mở bằng trình duyệt để xem chạy trực tiếp. |
| `render.mjs` | Xuất `index.html` ra MP4 từng khung hình (cần Node, Playwright, ffmpeg). |
| `luong-giac-day-so.mp4` | Video đã xuất. |

```bash
npm install                          # tải KaTeX (một lần)
node render.mjs                      # xuất toàn bộ video
node render.mjs --stills 10,80,170   # xuất vài ảnh tĩnh để kiểm tra bố cục
```

Các cảnh (giây): mở đầu 0 · radian 5 · giá trị lượng giác 24 · sin, cos bằng 0, ±1 43 ·
ĐKXĐ tan, cot 59 · góc liên quan 72 · nhân đôi 116 · chẵn, lẻ 132 · tuần hoàn 150 ·
cấp số cộng 165 · cấp số nhân 189 · tổng kết 209.
Mỗi cảnh là một lời gọi `scene(thời lượng, tên, ...)` trong `index.html`; chữ và mốc thời gian
nằm trong các lời gọi `put(...)`.
