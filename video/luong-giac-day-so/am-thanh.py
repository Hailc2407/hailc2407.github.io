#!/usr/bin/env python3
"""Âm thanh cho video "Lượng giác và Dãy số".

Lời thuyết minh nằm trong LOI_DOC (mốc giây khớp với các cảnh của index.html).
Từ đó script tạo:

  python3 am-thanh.py kich-ban   -> thuyet-minh.srt (phụ đề) + thuyet-minh.md (kịch bản để tự đọc)
  python3 am-thanh.py nhac       -> nhac-nen.wav (nhạc nền tự tổng hợp, không bản quyền)
  python3 am-thanh.py giong      -> giong-doc.wav (giọng đọc AI, cần mạng và gói edge-tts)
  python3 am-thanh.py ghep       -> luong-giac-day-so-am-thanh.mp4 (video + nhạc + giọng)
  python3 am-thanh.py tat-ca     -> làm lần lượt tất cả các bước trên

Tuỳ chọn:
  --giong nam            dùng giọng nam (mặc định: giọng nữ HoaiMy)
  --toc-do +15%          đọc nhanh hơn / chậm hơn (mặc định +10%, ví dụ +0%, +15%)
  --khong-giong          khi ghép: chỉ có nhạc nền, không có giọng đọc
  --giong-file x.wav     khi ghép: dùng file giọng tự thu (đã căn đúng thời gian) thay cho giọng AI

Cần: Python 3, numpy, ffmpeg. Riêng bước "giong" cần thêm: pip install edge-tts
"""
import argparse
import asyncio
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
VIDEO = os.path.join(HERE, "luong-giac-day-so.mp4")
DURATION = 220.0
# Mốc bắt đầu của các cảnh (giây). Một câu không được tràn sang cảnh sau.
SCENES = [0, 5, 24, 43, 59, 72, 116, 132, 150, 165, 189, 209, 220]
GIONG = {"nu": "vi-VN-HoaiMyNeural", "nam": "vi-VN-NamMinhNeural"}

# (giây bắt đầu, lời đọc)
LOI_DOC = [
    # Mở đầu
    (0.6, "Chào các em! Hôm nay mình cùng ôn tập lượng giác và dãy số."),
    # Radian
    (5.4, "Phần một: radian và độ dài cung."),
    (7.4, "Lấy một đoạn dài đúng bằng bán kính, uốn lên đường tròn."),
    (10.8, "Góc ở tâm chắn cung đó là một radian."),
    (13.4, "Quay tiếp nửa vòng, cung dài pi R,"),
    (15.6, "nên một trăm tám mươi độ bằng pi radian."),
    (18.2, "Độ dài cung: l bằng R nhân trị tuyệt đối alpha."),
    (21.0, "Nhớ đổi độ sang radian trước, rồi mới tính."),
    # Giá trị lượng giác
    (24.4, "Trên đường tròn lượng giác, điểm M ứng với góc alpha."),
    (27.6, "Hoành độ của M là cos alpha, tung độ là sin alpha."),
    (30.8, "Tan bằng sin chia cos, cot bằng cos chia sin."),
    (33.8, "Sin và cos luôn nằm trong đoạn từ trừ một đến một."),
    (37.0, "Áp dụng Pi-ta-go cho tam giác vuông O H M,"),
    (39.6, "ta được sin bình cộng cos bình bằng một."),
    # sin, cos bằng 0, 1, -1
    (43.4, "Khi nào sin, cos bằng không, một, hoặc trừ một?"),
    (46.3, "Sin là tung độ. Sin bằng một tại pi phần hai, bằng trừ một tại trừ pi phần hai."),
    (51.2, "Sin bằng không khi điểm nằm trên trục hoành: alpha bằng k pi."),
    (54.6, "Cos là hoành độ: cos bằng không khi alpha bằng pi phần hai cộng k pi."),
    # Điều kiện xác định
    (59.4, "Tan xác định khi cos khác không, tức alpha khác pi phần hai cộng k pi."),
    (65.5, "Cot xác định khi sin khác không, tức alpha khác k pi."),
    (69.0, "Nhớ: mẫu số phải khác không."),
    # Góc liên quan
    (72.6, "Góc đối nhau: M phẩy đối xứng với M qua trục hoành."),
    (75.9, "Hoành độ giữ nguyên nên cos không đổi, còn sin, tan, cot đổi dấu. Cos đối!"),
    (82.1, "Góc bù nhau: đối xứng qua trục tung."),
    (84.6, "Tung độ giữ nguyên nên sin không đổi, còn lại đổi dấu. Sin bù!"),
    (91.6, "Góc phụ nhau: đối xứng qua đường thẳng y bằng x."),
    (94.6, "Hoành độ và tung độ đổi chỗ cho nhau: sin thành cos, tan thành cot. Phụ chéo!"),
    (101.1, "Hơn kém pi: đối xứng qua gốc tọa độ."),
    (103.6, "Sin, cos cùng đổi dấu, còn tan, cot giữ nguyên."),
    (110.7, "Tóm lại: cos đối, sin bù, phụ chéo, hơn kém pi tan cot."),
    # Nhân đôi
    (116.5, "Công thức nhân đôi: sin hai a bằng hai sin a cos a."),
    (119.6, "Cos hai a bằng cos bình a trừ sin bình a."),
    (122.3, "Thay sin bình bằng một trừ cos bình, ta được hai cos bình a trừ một."),
    (126.2, "Hoặc thay cos bình, ta được một trừ hai sin bình a."),
    (129.1, "Từ đó suy ra công thức hạ bậc."),
    # Chẵn, lẻ
    (132.5, "Hàm số chẵn: f của trừ x bằng f của x."),
    (135.4, "Lật đồ thị qua trục tung, ta được đúng nó. Ví dụ cos x."),
    (139.0, "Hàm số lẻ: f của trừ x bằng trừ f của x."),
    (141.9, "Xoay đồ thị nửa vòng quanh gốc tọa độ, ta được đúng nó. Ví dụ sin x."),
    (146.5, "Lưu ý: tập xác định phải đối xứng."),
    # Tuần hoàn
    (150.5, "Hàm số tuần hoàn: đồ thị lặp lại sau mỗi đoạn dài T."),
    (153.8, "Trượt một chu kì sang phải, đồ thị trùng khít."),
    (158.1, "f của x cộng T bằng f của x, với mọi x."),
    (161.0, "Sin, cos có chu kì hai pi; tan, cot có chu kì pi."),
    # Cấp số cộng
    (165.5, "Phần hai: cấp số cộng."),
    (166.9, "Mỗi số hạng bằng số hạng trước cộng với công sai d."),
    (170.5, "Cột thứ n gồm u một và n trừ một khúc d,"),
    (173.4, "nên u n bằng u một cộng n trừ một nhân d."),
    (176.4, "Tính tổng: ghép thêm dãy viết ngược lên trên."),
    (179.0, "Mỗi cột cao u một cộng u n. Có n cột, nên S n bằng n nhân tổng đó, chia hai."),
    (184.5, "Ví dụ: hai cộng năm cộng tám cộng mười một cộng mười bốn bằng bốn mươi."),
    # Cấp số nhân
    (189.5, "Cấp số nhân: mỗi số hạng bằng số hạng trước nhân với công bội q."),
    (193.6, "Mỗi cột gấp đôi cột trước, nên u n bằng u một nhân q mũ n trừ một."),
    (198.2, "Với q khác một, tổng S n bằng u một nhân một trừ q mũ n, chia một trừ q."),
    (203.4, "Ví dụ: một cộng hai cộng bốn cộng tám cộng mười sáu bằng ba mươi mốt."),
    # Tổng kết
    (209.5, "Đây là những công thức quan trọng nhất. Các em chụp lại để ôn nhé."),
    (214.0, "Chúc các em ôn tập tốt!"),
]
TEN_CANH = ["Mở đầu", "Radian và độ dài cung", "Giá trị lượng giác", "Khi nào sin, cos bằng 0, 1, −1",
            "Điều kiện xác định của tan, cot", "Góc liên quan", "Công thức nhân đôi", "Hàm số chẵn, lẻ",
            "Hàm số tuần hoàn", "Cấp số cộng", "Cấp số nhân", "Tổng kết"]


def run(cmd):
    subprocess.run(cmd, check=True)


def scene_end(t):
    return next(s for s in SCENES if s > t + 1e-6)


def est_len(text, syl_per_s=4.3):
    """Ước lượng thời gian đọc (giây) theo số âm tiết."""
    return len(text.replace(",", " ").split()) / syl_per_s


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


# ---------------------------------------------------------------- kịch bản
def kich_ban(lens=None):
    """Phụ đề .srt và kịch bản .md. lens: thời lượng thật của từng câu (nếu đã tạo giọng)."""
    srt, md = [], ["# Kịch bản thuyết minh: Lượng giác và Dãy số", "",
                   "Đọc mỗi câu khi đồng hồ video tới mốc ở cột đầu. Tốc độ vừa phải, khoảng 4 tiếng mỗi giây.", ""]
    canh = -1
    for i, (t, text) in enumerate(LOI_DOC):
        k = max(j for j, s in enumerate(SCENES[:-1]) if s <= t)
        if k != canh:
            canh = k
            md += ["", f"## {TEN_CANH[k]} ({SCENES[k]}–{SCENES[k + 1]} s)", "", "| Giây | Lời đọc |", "|---|---|"]
        md.append(f"| {t:.1f} | {text} |")
        nxt = LOI_DOC[i + 1][0] if i + 1 < len(LOI_DOC) else DURATION
        start = lens[i][0] if lens else t
        end = min(nxt, start + (lens[i][1] if lens else est_len(text)) + 0.4)
        srt += [str(i + 1), f"{ts(start)} --> {ts(end)}", text, ""]
    open(os.path.join(HERE, "thuyet-minh.srt"), "w", encoding="utf-8").write("\n".join(srt))
    open(os.path.join(HERE, "thuyet-minh.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
    print("đã ghi thuyet-minh.srt và thuyet-minh.md")


# ---------------------------------------------------------------- nhạc nền
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def nhac(path=None):
    """Nhạc nền nhẹ nhàng tự tổng hợp: pad hợp âm, arpeggio gảy, bass; tempo 72."""
    path = path or os.path.join(HERE, "nhac-nen.wav")
    rng = np.random.default_rng(11)
    total = int((DURATION + 1) * SR)
    L = np.zeros(total)
    R = np.zeros(total)
    beat = 60 / 72
    bar = 4 * beat
    # Cmaj7 – Am7 – Fmaj7 – G6, mỗi hợp âm 2 ô nhịp
    chords = [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 52]]
    span = 2 * bar
    t_all = np.arange(total) / SR

    def add(sig, start, pan=0.0, amp=1.0):
        i0 = int(start * SR)
        if i0 >= total:
            return
        sig = sig[: total - i0] * amp
        L[i0:i0 + len(sig)] += sig * (1 - pan) * 0.5 * 2 ** 0.5
        R[i0:i0 + len(sig)] += sig * (1 + pan) * 0.5 * 2 ** 0.5

    n_chords = int(np.ceil(DURATION / span)) + 1
    for c in range(n_chords):
        notes = chords[c % 4]
        start = c * span
        n = int((span + 2.0) * SR)
        tt = np.arange(n) / SR
        env = np.minimum(1, tt / 1.6) * np.clip((span + 2.0 - tt) / 2.0, 0, 1)
        # pad: hai giọng hơi lệch nhau cho dày tiếng
        for j, m in enumerate(notes):
            f = midi(m + 12)
            for det, pan in ((-0.25, -0.5), (0.25, 0.5)):
                w = np.sin(2 * np.pi * (f + det) * tt) + 0.25 * np.sin(4 * np.pi * (f + det) * tt) + 0.08 * np.sin(6 * np.pi * f * tt)
                add(w * env, start, pan=pan * (j - 1.5) / 1.5, amp=0.035)
        # bass
        for b in range(2):
            n2 = int(2.4 * SR)
            t2 = np.arange(n2) / SR
            f = midi(notes[0] - 12)
            w = (np.sin(2 * np.pi * f * t2) + 0.3 * np.sin(4 * np.pi * f * t2)) * np.exp(-t2 / 0.9) * np.minimum(1, t2 / 0.01)
            add(w, start + b * bar, amp=0.16)
        # arpeggio gảy nhẹ theo nốt móc đơn
        pattern = [0, 2, 1, 3, 2, 1, 3, 2]
        for k in range(16):
            m = notes[pattern[k % 8]] + 24
            n3 = int(1.4 * SR)
            t3 = np.arange(n3) / SR
            f = midi(m)
            w = (np.sin(2 * np.pi * f * t3) + 0.18 * np.sin(4 * np.pi * f * t3)) * np.exp(-t3 / 0.32) * np.minimum(1, t3 / 0.004)
            vel = 0.05 * (0.75 + 0.25 * rng.random()) * (1.15 if k % 4 == 0 else 1)
            add(w, start + k * beat / 2, pan=0.35 * np.sin(k), amp=vel)

    # vang nhẹ: chập với đáp ứng xung nhiễu tắt dần
    ir_n = int(1.6 * SR)
    ir_t = np.arange(ir_n) / SR
    for ch, seed in ((L, 1), (R, 2)):
        ir = np.random.default_rng(seed).standard_normal(ir_n) * np.exp(-ir_t / 0.45) * 0.012
        ir[0] = 1.0
        size = 1 << int(np.ceil(np.log2(total + ir_n)))
        wet = np.fft.irfft(np.fft.rfft(ch, size) * np.fft.rfft(ir, size), size)[:total]
        ch[:] = wet
    fade = np.minimum(1, t_all / 2.5) * np.clip((DURATION + 1 - t_all) / 5.0, 0, 1)
    L *= fade
    R *= fade
    peak = max(np.abs(L).max(), np.abs(R).max())
    st = np.stack([L, R], 1) / peak * 0.7
    write_wav(path, st)
    print(f"đã ghi {os.path.basename(path)}")


def write_wav(path, data):
    data = np.clip(data, -1, 1)
    pcm = (data * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1 if pcm.ndim == 1 else pcm.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def read_wav_mono(path):
    with wave.open(path, "rb") as w:
        assert w.getframerate() == SR and w.getsampwidth() == 2
        a = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(float) / 32767
        if w.getnchannels() == 2:
            a = a.reshape(-1, 2).mean(1)
    return a


# ---------------------------------------------------------------- giọng đọc
async def _tts_edge(text, voice, rate, out_mp3):
    import edge_tts
    # đi qua proxy nếu máy có cấu hình (aiohttp không tự đọc biến môi trường)
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy") or None
    await edge_tts.Communicate(text, voice, rate=rate, proxy=proxy).save(out_mp3)


def tts(text, voice, rate, out_wav):
    """Đọc một câu thành file wav mono 44.1 kHz."""
    with tempfile.TemporaryDirectory() as d:
        mp3 = os.path.join(d, "x.mp3")
        asyncio.run(_tts_edge(text, voice, rate, mp3))
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), out_wav])


def giong(voice, rate):
    """Tạo từng câu, đặt đúng mốc; câu nào quá dài so với chỗ trống thì đọc nhanh hơn chút (tối đa 1,3 lần)."""
    track = np.zeros(int((DURATION + 1) * SR))
    lens, prev_end, warn = [], 0.0, []
    with tempfile.TemporaryDirectory() as d:
        for i, (t, text) in enumerate(LOI_DOC):
            raw = os.path.join(d, f"{i}.wav")
            tts(text, voice, rate, raw)
            a = read_wav_mono(raw)
            # bỏ khoảng lặng hai đầu
            nz = np.nonzero(np.abs(a) > 0.01)[0]
            a = a[max(0, nz[0] - 800): nz[-1] + 1600] if len(nz) else a
            start = max(t, prev_end + 0.15)
            nxt = LOI_DOC[i + 1][0] if i + 1 < len(LOI_DOC) else DURATION
            limit = min(scene_end(t) - 0.3, nxt + 1.0) - start
            dur = len(a) / SR
            if dur > limit:
                k = min(1.3, dur / max(limit, 0.5))
                fast = os.path.join(d, f"{i}f.wav")
                write_wav(raw, a)
                run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-filter:a", f"atempo={k:.3f}", "-ar", str(SR), fast])
                a = read_wav_mono(fast)
                dur = len(a) / SR
                if dur > limit + 0.05:
                    warn.append(f"  câu {i + 1} ({t}s) vẫn dài hơn chỗ trống {dur - limit:.1f}s: {text}")
            i0 = int(start * SR)
            track[i0:i0 + len(a)] += a[: len(track) - i0]
            lens.append((start, dur))
            prev_end = start + dur
            print(f"  {i + 1:2d}/{len(LOI_DOC)}  {start:6.1f}s  {dur:4.1f}s  {text[:50]}")
    peak = np.abs(track).max() or 1
    write_wav(os.path.join(HERE, "giong-doc.wav"), track / peak * 0.9)
    json.dump(lens, open(os.path.join(HERE, "giong-doc.json"), "w"))
    print("đã ghi giong-doc.wav")
    if warn:
        print("Lưu ý, các câu sau hơi dài, có thể rút gọn lời hoặc dùng --toc-do +10%:\n" + "\n".join(warn))
    kich_ban(lens)  # cập nhật phụ đề theo thời lượng thật


# ---------------------------------------------------------------- ghép
def ghep(voice_file=None, music=True):
    out = os.path.join(HERE, "luong-giac-day-so-am-thanh.mp4" if voice_file else "luong-giac-day-so-nhac.mp4")
    music_file = os.path.join(HERE, "nhac-nen.wav")
    if music and not os.path.exists(music_file):
        nhac()
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", VIDEO]
    if voice_file:
        cmd += ["-i", music_file, "-i", voice_file, "-filter_complex",
                # nhạc nhỏ lại mỗi khi có giọng đọc (ducking)
                "[1:a]volume=0.32[m];[2:a]aformat=channel_layouts=stereo,volume=1.0,asplit=2[v1][v2];"
                "[m][v1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450[md];"
                "[md][v2]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]"]
    else:
        cmd += ["-i", music_file, "-filter_complex", "[1:a]volume=0.55,alimiter=limit=0.95[a]"]
    cmd += ["-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]
    run(cmd)
    print(f"đã ghi {os.path.basename(out)}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("buoc", choices=["kich-ban", "nhac", "giong", "ghep", "tat-ca"])
    ap.add_argument("--giong", dest="gioi", choices=["nu", "nam"], default="nu")
    ap.add_argument("--toc-do", default="+10%")
    ap.add_argument("--khong-giong", action="store_true")
    ap.add_argument("--giong-file")
    a = ap.parse_args()
    voice = GIONG[a.gioi]
    if a.buoc in ("kich-ban", "tat-ca"):
        kich_ban()
    if a.buoc in ("nhac", "tat-ca"):
        nhac()
    if a.buoc in ("giong", "tat-ca") and not a.khong_giong:
        giong(voice, a.toc_do)
    if a.buoc in ("ghep", "tat-ca"):
        vf = a.giong_file or (None if a.khong_giong else os.path.join(HERE, "giong-doc.wav"))
        if vf and not os.path.exists(vf):
            sys.exit("Chưa có giong-doc.wav: chạy bước 'giong' trước, hoặc thêm --khong-giong.")
        ghep(vf)


if __name__ == "__main__":
    main()
