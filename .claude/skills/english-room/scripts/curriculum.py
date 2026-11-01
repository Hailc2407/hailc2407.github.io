"""Show or update a course log (curriculum*.json) in the vault source folder.

    python3 curriculum.py <vault-src>/curriculum-grammar.json show
    python3 curriculum.py <vault-src>/curriculum-grammar.json mark 12        # plan 12 -> used 12
    python3 curriculum.py <file> add "Unit 50: Questions 2" "100–101" "Buổi 12 · …" 12   # add a planned unit

Each unit: {name, pages, details, plan: N} before the lesson, {…, used: N} after it.
"""
import json, sys

if len(sys.argv) < 3:
    sys.exit(__doc__)
path, cmd = sys.argv[1], sys.argv[2]
c = json.load(open(path, encoding="utf-8"))
units = [u for b in c["books"] for u in b["units"]]

if cmd == "show":
    for u in units:
        tag = "used %s" % u["used"] if "used" in u else ("plan %s" % u["plan"] if "plan" in u else "-")
        print("%-10s %-55s %s" % (tag, u["name"], u.get("details", "")))
elif cmd == "mark":
    n = int(sys.argv[3])
    done = 0
    for u in units:
        if u.get("plan") == n:
            u.pop("plan")
            u["used"] = n
            done += 1
            print("used", n, ":", u["name"])
    if not done:
        sys.exit("No unit has plan %d" % n)
elif cmd == "add":
    name, pages, details, n = sys.argv[3], sys.argv[4], sys.argv[5], int(sys.argv[6])
    c["books"][-1]["units"].append(dict(name=name, pages=pages, details=details, plan=n))
    print("added plan", n, ":", name)
else:
    sys.exit(__doc__)

if cmd != "show":
    with open(path, "w", encoding="utf-8") as f:
        json.dump(c, f, ensure_ascii=False, indent=1)
