# Le Canh Hai: personal homepage

Source of [hailc2407.github.io](https://hailc2407.github.io): a single-page academic homepage in plain HTML, CSS and JavaScript (no build step), with interactive diagrams of my research on optimization, dynamical systems and mathematical modelling.

## Structure

```
index.html            page skeleton
content.js            all text on the site (edit this file)
assets/css/style.css  colours, fonts, layout
assets/js/main.js     rendering and interactions
assets/js/diagrams.js animated research diagrams
assets/img/           photo and favicon
assets/files/         CV (opened in the on-page viewer, downloadable from it)
```

## Hướng dẫn cập nhật

**Xem thử trên máy:**

```bash
cd ~/Downloads/Web && python3 -m http.server 8000
```

Sau đó mở http://localhost:8000.

**Sửa nội dung:** mọi chữ trên web nằm trong `content.js`.

| Muốn làm gì | Sửa ở đâu |
|---|---|
| Thêm tin mới | Thêm một dòng lên đầu `news.items`: `{ date: "Nov 2026", key: true, text: "..." }` |
| Thêm bài báo / dự án | Thêm một mục vào `research.items`. Thêm `links: [{ text: "Paper", url: "https://..." }]` để có nút link |
| Thêm Google Scholar, ORCID, GitHub, LinkedIn | Dán URL vào `profile.links` |
| Ghi các lần trượt/từ chối (Setbacks) | Thêm vào `setbacks`. Để trống thì mục tự ẩn |
| Ẩn hoặc hiện lại một mục | Thêm hoặc xoá tên mục trong `hiddenSections` (đang ẩn: honors, skills). Nhóm Leadership & Service trong `experience` đang ẩn bằng `hidden: true` |
| Đổi chữ trên 3 thẻ ở đầu trang | `hero.loop` |
| Đổi dải phương trình chạy ngang | `equations` và `motto` |

Định dạng trong chuỗi: `<b>đậm</b>`, `<mark>tô tím</mark>`, `<span class='hl'>tô xanh</span>`, `<a href='https://...'>link</a>`.

**Đổi CV:** thay file `assets/files/CV_Le_Canh_Hai.pdf`, giữ nguyên tên. Nút *View CV* mở CV ngay trên trang (dùng PDF.js); trong khung xem có nút *Download* để tải file.

**Đổi ảnh:** thay `assets/img/avatar.jpg` bằng một ảnh vuông.

**Đổi màu:** sửa `--coral` (màu nhấn chính) và `--gold` (màu nhấn phụ) ở đầu `assets/css/style.css`.

**Đưa thay đổi lên mạng:** `git add . && git commit -m "Update" && git push`. GitHub Pages tự cập nhật sau khoảng 1 phút.
