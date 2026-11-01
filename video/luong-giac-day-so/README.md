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

## Âm thanh

`am-thanh.py` làm mọi việc về âm thanh. Lời thuyết minh nằm ở một chỗ duy nhất (`LOI_DOC` trong script),
mỗi câu gắn một mốc giây khớp với hình.

| File | Nội dung |
|---|---|
| `luong-giac-day-so-nhac.mp4` | Video có nhạc nền (nhạc tự tổng hợp bằng code, không bản quyền) |
| `thuyet-minh.md` | Kịch bản: đọc câu nào ở giây thứ mấy, để tự thu giọng |
| `thuyet-minh.srt` | Phụ đề, kéo vào CapCut hoặc YouTube |

**Thêm giọng đọc AI tiếng Việt** (chạy trên máy có mạng, cần Python, ffmpeg):

```bash
pip install numpy edge-tts
python3 am-thanh.py tat-ca
```

Kết quả: `luong-giac-day-so-am-thanh.mp4` (giọng nữ HoaiMy; thêm `--giong nam` để dùng giọng nam,
`--toc-do +10%` để đọc nhanh hơn). Nhạc nền tự nhỏ lại mỗi khi có giọng. Câu nào dài hơn chỗ trống sẽ
được đọc nhanh hơn một chút (tối đa 1,3 lần); script in cảnh báo nếu vẫn không vừa, khi đó rút gọn câu đó trong `LOI_DOC`.

**Dùng giọng tự thu:** thu theo `thuyet-minh.md` thành một file wav dài đúng 220 giây, rồi

```bash
python3 am-thanh.py ghep --giong-file giong-cua-toi.wav
```
