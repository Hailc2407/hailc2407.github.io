# Grammar Lesson NN: <Topic>. Built with: python3 build_lesson.py gNN_content.py <vault-src>
# Murphy, English Grammar in Use (5th ed.): Units A, B, C (core) and D (extension).
# Exercise answers: the book's Key to Exercises (check every one with murphy.py unit …).
from lessonkit import *

UNITS = [0, 0, 0, 0]   # core units first, then the extension unit(s) → img uNN.jpg
PAGES = []             # extra PDF pages (Additional exercises…) → img p<book page>.jpg

VOCAB = [  # 20 words from today's examples: word, IPA (US), part of speech, Vietnamese, example from the book
    dict(word="example", ipa="/ɪɡˈzæmpl/", pos="n.", vi="ví dụ", ex="This is an <b>example</b> sentence."),
]

DUEL_A = [  # 6–8 per unit; the right option is opts[a]; ch() spreads the positions
    ch("I ___ here every day.", ["come", "am coming"], 0, "Routine → present simple."),
]

TEST = [  # 15 TOEIC Part 5 style questions over all units; mc() spreads the right answer
    mc("1. The manager _____ the report yesterday.", ["sends", "sent", "has sent", "sending"], 1, ["", "Finished time → past simple.", "", ""]),
]

LESSON = dict(
    id="gNN", no=NN, group="grammar", groupTitle="Grammar", minutes=120,
    title="<Topic>: <key forms>",
    subtitle="<the forms of the lesson, separated by ·>",
    book="Murphy, <i>English Grammar in Use</i> (5th ed.): Units A, B, C · mở rộng: Unit D",
    images="img/gNN/",
    tracks={},
    objectives=["…", "…", "(extension) …"],
    howto=(
        "<ul><li>Each unit: look at the page, read the table, sort, then do the book exercises.</li>"
        "<li>Answer first, then read why. Wrong answers are collected for the review at the end.</li>"
        "<li>🔊 is only for the pronunciation of new words.</li></ul>"
    ),
    vi="<p>Giải thích ngắn bằng tiếng Việt: lỗi người Việt hay mắc, mẹo nhận biết trong TOEIC.</p>",
    sections=[
        dict(id="v", title="Warm-up & Vocabulary", short="Vocabulary", minutes=15,
             intro="New words from today’s examples. Listen, repeat, and check the meaning.",
             blocks=[
                 dict(type="vocab", title="20 words", task="Listen and repeat. Then read each example aloud.", items=VOCAB),
                 dict(type="listenPick", title="Quick check: listen and choose the meaning", by="vi", words=["example"]),  # 6 words from VOCAB
                 dict(type="sort", title="Warm-up: right or wrong? (guess before the lesson)", cats=["✓ Right", "✗ Wrong"],
                      items=[dict(t="A right sentence.", c=0), dict(t="A wrong sentence.", c=1, why="→ <i>the correction</i>.")]),
             ]),
        dict(id="uA", title="Unit A · <title>", short="Unit A", minutes=25,
             intro="One line: what the unit is about.",
             blocks=[
                 dict(type="photo", img="uA", caption="English Grammar in Use, Unit A (p. book). Click to zoom."),
                 dict(type="table", title="The rule in one table", head=["", "form", "example"], rows=[["…", "…", "…"]],
                      vi="Mẹo tiếng Việt."),
                 dict(type="sort", title="Which one?", cats=["…", "…"], items=[dict(t="…", c=0, why="…")]),   # or type="timeline" for tenses
                 dict(type="gaps", title="Exercise A.1 · …", bank=["…"],            # bank = shared dropdown; or typed g(); or sel()/two() per item
                      groups=[dict(items=[g("He ___ here.", "lives", hint="live"), sel("___ book", ART, "the"), two("I ___ it.", "like", "am liking", "like")])]),
                 dict(type="fix", title="Find the mistake",
                      items=[dict(s="He go to work.", err="go", fix=["goes"], why="he/she/it + -s."), dict(s="A right sentence.", err=None, why="OK.")]),
                 order(["I", "have", "never", "been", "there."], task="(never / been / have)", seed=1),
                 dict(type="duel", title="Duel · Unit A", seconds=15, items=DUEL_A,
                      task="Type your names. Take turns; 15 seconds per question. A wrong answer comes back later."),
             ]),
        # … one section per core unit (uB, uC) …
        dict(id="ext", title="Extension (optional): Unit D · <title>", short="Extension", minutes=15, intro="…",
             blocks=[dict(type="photo", img="uD", caption="Unit D (p. …)."), dict(type="gaps", title="Exercise D.1", groups=[dict(items=[])])]),
        dict(id="t", title="Mini Test (15 questions, TOEIC Part 5 style)", short="Mini test", minutes=10,
             intro="All units mixed. Answer, then submit and read why.",
             blocks=[dict(type="test", text="show", seconds=480, items=TEST)]),
        dict(id="r", title="Review your mistakes & Homework", short="Review", minutes=10,
             blocks=[
                 dict(type="review", title="Redo everything you got wrong today",
                      task="Every item you answered wrongly in this lesson is here. Do them again until they are all green."),
                 dict(type="table", title="Today in one table", head=["Rule", "Example"], rows=[["…", "…"]]),
                 dict(type="checklist", title="Homework",
                      items=["Redo the review until it is empty.", "Additional exercise NN (p. …) in the book; check with the key.", "…"]),
             ]),
    ],
)
