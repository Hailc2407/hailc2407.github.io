"""Read Murphy, English Grammar in Use (5th ed.) quickly while planning a lesson.

    python3 murphy.py unit 69 72 87      # exercise page text + the key for each unit
    python3 murphy.py page 315           # one PDF page as text (layout kept, spaces squeezed)
    python3 murphy.py addkey             # Key to Additional exercises (PDF pp. 380-383)
    python3 murphy.py index              # list of Additional exercises (PDF p. 314)

Geometry: unit n explanation = PDF page 12 + 2n, exercises = 13 + 2n; book page = PDF page − 12.
Key to Exercises: PDF pp. 348-379, three columns (x 0-212, 212-365, 365-575).
Additional exercises: PDF pp. 314-337 (book pp. 302-325); their key: PDF pp. 380-383.
"""
import os, re, subprocess, sys

PDF = os.path.join(os.environ.get("MATERIALS", "/home/user/toeic-materials"), "235_7-english-grammar-in-use.-murphy-r.-2019-5th-394p-.pdf")
CACHE = os.path.join(os.environ.get("TMPDIR", "/tmp"), "murphy_key.txt")


def text(pg, layout=True, crop=None):
    cmd = ["pdftotext", "-f", str(pg), "-l", str(pg)]
    if layout:
        cmd.append("-layout")
    if crop:
        x, w = crop
        cmd += ["-x", str(x), "-y", "0", "-W", str(w), "-H", "800"]
    return subprocess.run(cmd + [PDF, "-"], capture_output=True, text=True, check=True).stdout


def squeeze(t):
    return "\n".join(re.sub(r"  +", " ", l).rstrip() for l in t.splitlines() if l.strip())


def key_text():
    if not os.path.exists(CACHE):
        parts = [text(pg, layout=False, crop=cr) for pg in range(348, 380) for cr in ((0, 212), (212, 153), (365, 210))]
        open(CACHE, "w").write("\n".join(parts))
    return open(CACHE).read()


def unit_key(u):
    lines = key_text().splitlines()
    out, on = [], False
    for l in lines:
        s = l.strip()
        if s == "UNIT %d" % u:
            on = True
        elif on and re.fullmatch(r"UNIT \d+", s):
            break
        if on:
            out.append(l)
    return "\n".join(out)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd, rest = sys.argv[1], sys.argv[2:]
    if cmd == "unit":
        for u in map(int, rest):
            print("=" * 20, "Unit %d (explanation PDF p. %d, exercises PDF p. %d)" % (u, 12 + 2 * u, 13 + 2 * u))
            print(squeeze(text(13 + 2 * u)))
            print("-" * 20, "key")
            print(unit_key(u) or "(key not found: look at the Key pages by hand)")
    elif cmd == "page":
        for p in map(int, rest):
            print("=" * 20, "PDF p. %d (book p. %d)" % (p, p - 12))
            print(squeeze(text(p)))
    elif cmd == "addkey":
        for p in range(380, 384):
            print("=" * 20, "PDF p. %d" % p)
            print(re.sub(r"   +", "  |  ", text(p)))
    elif cmd == "index":
        print(squeeze(text(314)))
    else:
        sys.exit(__doc__)
