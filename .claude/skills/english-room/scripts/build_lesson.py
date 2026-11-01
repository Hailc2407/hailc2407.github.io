"""Build one lesson from its content file into a vault source folder.

    python3 build_lesson.py <content.py> <vault-src> [--materials /home/user/toeic-materials]

The content file defines LESSON (and optionally UNITS, PAGES, BOOK, assets(mat, imgdir)).
- UNITS: Murphy units; the explanation page (PDF page 12 + 2n) is saved as img/<id>/uNN.jpg
- PAGES: PDF pages; saved as img/<id>/p<book page>.jpg (book page = PDF page − 12 for Murphy)
- assets(mat, imgdir): your own rendering/cropping/audio cutting, for anything else
Then every block is checked (blanks vs options, answers inside options, fix words present,
image files present) and lessons/<id>.json is written. Errors stop the build.
"""
import collections, json, os, runpy, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) != 2:
    sys.exit(__doc__)
CONTENT, OUT = args
MAT = "/home/user/toeic-materials"
for a in sys.argv[1:]:
    if a.startswith("--materials="):
        MAT = a.split("=", 1)[1]
MURPHY = "235_7-english-grammar-in-use.-murphy-r.-2019-5th-394p-.pdf"

sys.path.insert(0, os.path.dirname(os.path.abspath(CONTENT)))
mod = runpy.run_path(CONTENT)
L = mod["LESSON"]
IMG = os.path.join(OUT, "img", L["id"])
os.makedirs(IMG, exist_ok=True)
pdf = os.path.join(MAT, mod.get("BOOK", MURPHY))


def render(pg, name, dpi=130):
    subprocess.run(["pdftoppm", "-f", str(pg), "-l", str(pg), "-r", str(dpi), "-jpeg", "-jpegopt", "quality=80",
                    "-singlefile", pdf, os.path.join(IMG, name)], check=True)


for u in mod.get("UNITS", []):
    render(12 + 2 * u, "u%02d" % u)
for pg in mod.get("PAGES", []):
    render(pg, "p%d" % (pg - 12))
if "assets" in mod:
    mod["assets"](MAT, IMG)

# ---------------------------------------------------------------- checks
errors, warn = [], []
blocks = [(s["id"], b) for s in L["sections"] for b in s["blocks"]]
for sid, b in blocks:
    t = b.get("type")
    if t == "photo" and not os.path.exists(os.path.join(IMG, b["img"] + ".jpg")):
        errors.append("%s: photo %s.jpg was not rendered" % (sid, b["img"]))
    if t == "gaps":
        for grp in b["groups"]:
            for it in grp["items"]:
                n = it["q"].count("___")
                ans = it["a"] if n > 1 else [it["a"]]
                if n == 0:
                    errors.append("%s: no ___ in %r" % (sid, it["q"][:60]))
                    continue
                if len(ans) != n:
                    errors.append("%s: %d blanks but %d answer lists in %r" % (sid, n, len(ans), it["q"][:60]))
                    continue
                choices = it.get("opts")
                if choices is not None:
                    per = choices if n > 1 else [choices]
                    if n > 1 and not all(isinstance(x, list) for x in choices):
                        errors.append("%s: %d blanks need one option list per blank in %r" % (sid, n, it["q"][:60]))
                        continue
                elif b.get("bank"):
                    per = [b["bank"]] * n
                else:
                    per = None
                for k, a in enumerate(ans):
                    if not isinstance(a, list) or not a:
                        errors.append("%s: answer %d must be a non-empty list in %r" % (sid, k + 1, it["q"][:60]))
                    elif per and not any(x in per[k] for x in a):
                        errors.append("%s: answer %r is not among the options in %r" % (sid, a, it["q"][:60]))
    if t == "fix":
        for it in b["items"]:
            if it.get("err"):
                w = [x.strip(".,!?;:’'\"") .lower() for x in it["s"].split()]
                e = [x.strip(".,!?;:’'\"").lower() for x in it["err"].split()]
                if not any(w[k:k + len(e)] == e for k in range(len(w))):
                    errors.append("%s: fix word(s) %r not found in %r" % (sid, it["err"], it["s"]))
    if t == "sort":
        for it in b["items"]:
            if not 0 <= it["c"] < len(b["cats"]):
                errors.append("%s: sort card %r has no column %s" % (sid, it["t"], it["c"]))
    if t == "duel":
        pos = collections.Counter(it["a"] for it in b["items"])
        if len(b["items"]) >= 6 and max(pos.values()) > 0.8 * len(b["items"]):
            warn.append("%s: duel answers mostly at position %s (use ch())" % (sid, pos.most_common(1)[0][0]))
    if t == "test":
        pos = collections.Counter(next(i for i, o in enumerate(it["options"]) if o.get("ok")) for it in b["items"])
        if len(b["items"]) >= 8 and max(pos.values()) > 0.6 * len(b["items"]):
            warn.append("%s: test answers mostly at position %s (use mc())" % (sid, pos.most_common(1)[0][0]))

for w in warn:
    print("warning:", w)
if errors:
    print("\n".join("ERROR: " + e for e in errors))
    sys.exit(1)

os.makedirs(os.path.join(OUT, "lessons"), exist_ok=True)
with open(os.path.join(OUT, "lessons", L["id"] + ".json"), "w", encoding="utf-8") as f:
    json.dump(L, f, ensure_ascii=False, indent=1)
print("ok: %s, %d sections, %d blocks, %d images" % (L["id"], len(L["sections"]), len(blocks), len(os.listdir(IMG))))
