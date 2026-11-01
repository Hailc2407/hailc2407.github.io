"""Helpers for English Room lesson content files (grammar course and any similar lesson).

A content file is plain Python:

    from lessonkit import *          # g, c, ch, mc, sel, two, order, alt, q, ART, ABC
    UNITS = [69, 72, 87, 85]         # Murphy units whose explanation page is shown (img uNN)
    PAGES = []                       # extra PDF pages to show (img pBBB, BBB = book page)
    LESSON = dict(id="g05", ...)     # see reference/blocks.md and templates/grammar_content.py

build_lesson.py renders the images, checks the blocks and writes lessons/<id>.json.
"""
import random

__all__ = ["q", "g", "c", "ch", "mc", "sel", "two", "order", "alt", "ART", "ABC"]

ART = ["a", "an", "the", "—"]
ABC = ["A only", "B only", "C only", "A and B", "A and C", "B and C"]


def q(ask, rows, n=None, **kw):
    """A multiple-choice question for the `test` block: rows = [(text, is_right, why), ...]."""
    opts = []
    for t, ok, why in rows:
        o = {"t": t}
        if why:
            o["why"] = why
        if ok:
            o["ok"] = True
        opts.append(o)
    d = {"img": None, "ask": ask, "options": opts}
    if n:
        d["n"] = n
    d.update(kw)
    return d


def g(qs, *answers, hint=None, size=None):
    """A typed gap. One ___: g("He ___ .", "went", "has gone"). Several ___: one list per blank."""
    d = dict(q=qs + (" <i class='muted'>(%s)</i>" % hint if hint else ""), a=list(answers))
    if size:
        d["size"] = size
    return d


def c(*forms):
    """Each form plus its straight-apostrophe twin (I’d / I'd), for typed answers."""
    out = []
    for p in forms:
        out += [p, p.replace("’", "'")]
    return out


def _rot(key, n):
    return sum(map(ord, key)) % n


def ch(qs, opts, a, why=""):
    """A duel question; the right option is moved to a position that depends on the text."""
    k = _rot(qs, len(opts))
    return dict(q=qs, opts=opts[k:] + opts[:k], a=(a - k) % len(opts), why=why)


def mc(ask, opts, ok, whys=None, note=None):
    """A test question (TOEIC style); write the right answer anywhere, its position is spread."""
    k = _rot(ask, len(opts))
    opts = opts[k:] + opts[:k]
    whys = (whys[k:] + whys[:k]) if whys else None
    ok = (ok - k) % len(opts)
    d = q(ask, [(o, i == ok, (whys[i] if whys else "")) for i, o in enumerate(opts)])
    if note:
        d["note"] = note
    return d


def sel(s, opts, ans):
    """A gap with a dropdown per ___. ans: "x", ["x", "y"] (both accepted) or a tuple, one entry per ___."""
    n = s.count("___")
    if n > 1:
        if not isinstance(ans, tuple) or len(ans) != n:
            raise ValueError("sel: %d blanks need a tuple of %d answers: %s" % (n, n, s))
        return dict(q=s, opts=[opts] * n, a=[x if isinstance(x, list) else [x] for x in ans])
    return dict(q=s, opts=opts, a=ans if isinstance(ans, list) else [ans])


def two(s, a, b, ans):
    """'Which is correct?' with two choices."""
    return dict(q=s, opts=[a, b], a=[ans])


def alt(text, a, b, cc, key):
    """'Which alternatives are correct?' (one or two of A/B/C). key: "B" or "B or C".
    The ___ in the sentence is shown as …… so that only the answer dropdown counts as a blank."""
    m = {"A": "A only", "B": "B only", "C": "C only", "A or B": "A and B", "A or C": "A and C", "B or C": "B and C"}
    return dict(q="%s <br><span class='muted'>A %s · B %s · C %s</span> → ___" % (text.replace("___", "……"), a, b, cc), opts=ABC, a=[m[key]])


def order(chunks, task=None, seed=0):
    """Put the chunks in order (shown inline, shuffled with a fixed seed)."""
    idx = list(range(len(chunks)))
    rnd = random.Random(seed)
    while idx == sorted(idx):
        rnd.shuffle(idx)
    d = dict(type="order", inline=True, items=[chunks[i] for i in idx], answer=[i + 1 for i in idx])
    if task:
        d["task"] = task
    return d
