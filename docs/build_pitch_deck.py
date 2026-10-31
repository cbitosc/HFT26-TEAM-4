#!/usr/bin/env python3
"""Build the editable ResuArchitect AI pitch deck.

Usage:
  python3 docs/build_pitch_deck.py

The exported latency figures on slide 5 are a local, reproducible sample
benchmark, not a cross-device performance guarantee. Product claims elsewhere
are grounded in the repository implementation.
"""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "ResuArchitect_AI_Pitch_Deck.pptx"

SW, SH = 13.333, 7.5

NAVY = "0F172A"
NAVY_2 = "172554"
GREEN_DARK = "16A34A"
GREEN = "22C55E"
GREEN_PALE = "DCFCE7"
GREEN_TINT = "F0FDF4"
AMBER = "F59E0B"
AMBER_PALE = "FEF3C7"
AMBER_TINT = "FFFBEB"
BG = "F8FAFC"
WHITE = "FFFFFF"
SLATE = "475569"
MUTED = "64748B"
LINE = "CBD5E1"
PALE = "E2E8F0"
RED = "DC2626"
RED_PALE = "FEE2E2"

SANS = "Noto Sans"
SERIF = "Noto Serif"
MONO = "DejaVu Sans Mono"


def C(value: str) -> RGBColor:
    return RGBColor.from_string(value)


def rect(slide, x, y, w, h, fill=WHITE, stroke=None, radius=True, width=1):
    kind = MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill:
        shape.fill.solid()
        shape.fill.fore_color.rgb = C(fill)
    else:
        shape.fill.background()
    if stroke:
        shape.line.color.rgb = C(stroke)
        shape.line.width = Pt(width)
    else:
        shape.line.fill.background()
    return shape


def circle(slide, x, y, d, fill=None, stroke=None, width=1.2):
    shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
    if fill:
        shape.fill.solid()
        shape.fill.fore_color.rgb = C(fill)
    else:
        shape.fill.background()
    if stroke:
        shape.line.color.rgb = C(stroke)
        shape.line.width = Pt(width)
    else:
        shape.line.fill.background()
    return shape


def text(slide, value, x, y, w, h, size=14, color=NAVY, bold=False,
         font=SANS, align="left", valign="top", italic=False, margin=0,
         tracking=None):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = {
        "top": MSO_ANCHOR.TOP,
        "middle": MSO_ANCHOR.MIDDLE,
        "bottom": MSO_ANCHOR.BOTTOM,
    }[valign]
    p = tf.paragraphs[0]
    p.alignment = {"left": PP_ALIGN.LEFT, "center": PP_ALIGN.CENTER, "right": PP_ALIGN.RIGHT}[align]
    p.space_before = Pt(0)
    p.space_after = Pt(0)
    p.line_spacing = 1.05
    run = p.add_run()
    run.text = value
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = C(color)
    if tracking is not None:
        run._r.get_or_add_rPr().set("spc", str(tracking))
    return shape


def line(slide, x1, y1, x2, y2, color=LINE, width=1.2, dash=None):
    shape = slide.shapes.add_connector(
        MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2)
    )
    shape.line.color.rgb = C(color)
    shape.line.width = Pt(width)
    if dash:
        shape.line.dash_style = dash
    return shape


def arrow(slide, x1, y1, x2, y2, color=GREEN_DARK, width=1.7):
    line(slide, x1, y1, x2 - 0.06, y2, color, width)
    head = slide.shapes.add_shape(
        MSO_SHAPE.ISOSCELES_TRIANGLE,
        Inches(x2 - 0.12), Inches(y2 - 0.08), Inches(0.16), Inches(0.16),
    )
    head.rotation = 90
    head.fill.solid()
    head.fill.fore_color.rgb = C(color)
    head.line.fill.background()
    return head


def down_arrow(slide, x, y1, y2, color=GREEN_DARK, width=1.4):
    line(slide, x, y1, x, y2 - 0.07, color, width)
    head = slide.shapes.add_shape(
        MSO_SHAPE.ISOSCELES_TRIANGLE,
        Inches(x - 0.08), Inches(y2 - 0.12), Inches(0.16), Inches(0.16),
    )
    head.rotation = 180
    head.fill.solid()
    head.fill.fore_color.rgb = C(color)
    head.line.fill.background()
    return head


def pill(slide, label, x, y, w, fill=GREEN_PALE, color=GREEN_DARK, size=9.5,
         stroke=None, height=0.29):
    rect(slide, x, y, w, height, fill=fill, stroke=stroke, radius=True)
    text(slide, label, x + 0.05, y + 0.015, w - 0.10, height - 0.03,
         size=size, color=color, bold=True, align="center", valign="middle")


def card(slide, x, y, w, h, fill=WHITE, stroke=PALE, radius=True):
    return rect(slide, x, y, w, h, fill=fill, stroke=stroke, radius=radius, width=0.9)


def add_bg(slide, color=BG):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = C(color)


def header(slide, section, title_value, subtitle=None, number=None):
    pill(slide, section.upper(), 0.62, 0.32, max(1.35, 0.085 * len(section) + 0.46),
         fill=GREEN_PALE, color=GREEN_DARK, size=8.5, height=0.28)
    text(slide, title_value, 0.62, 0.73, 11.7, 0.54, size=27, color=NAVY, bold=True)
    if subtitle:
        text(slide, subtitle, 0.65, 1.31, 11.7, 0.36, size=12.5, color=SLATE)
    if number is not None:
        text(slide, f"{number:02d}", 12.12, 0.38, 0.55, 0.28,
             size=10, color=MUTED, bold=True, align="right")


def footer(slide, number):
    line(slide, 0.62, 7.08, 12.72, 7.08, PALE, 0.7)
    text(slide, "RESUARCHITECT AI   /   RED FLOWERS · TEAM-4", 0.64, 7.16, 6.5, 0.17,
         size=7.5, color=MUTED, bold=True)
    text(slide, f"{number:02d}  /  10", 11.72, 7.15, 0.95, 0.18,
         size=7.5, color=MUTED, bold=True, align="right")


def box_label(slide, label, x, y, w, h, title_value, body_value,
              fill=WHITE, accent=GREEN_DARK, title_size=14, body_size=10.5,
              stroke=PALE):
    card(slide, x, y, w, h, fill=fill, stroke=stroke)
    rect(slide, x, y + 0.12, 0.055, h - 0.24, fill=accent, radius=False)
    text(slide, label.upper(), x + 0.22, y + 0.18, w - 0.40, 0.21,
         size=8, color=accent, bold=True)
    text(slide, title_value, x + 0.22, y + 0.47, w - 0.40, 0.43,
         size=title_size, color=NAVY, bold=True)
    text(slide, body_value, x + 0.22, y + 0.99, w - 0.40, h - 1.10,
         size=body_size, color=SLATE)


def add_title_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, NAVY)
    # Abstract signal field; dark grounds appear only on the bookends.
    circle(slide, 9.02, 0.55, 4.05, fill=None, stroke="1F3A4A", width=1.0)
    circle(slide, 9.40, 0.93, 3.30, fill=None, stroke=GREEN_DARK, width=1.3)
    circle(slide, 9.78, 1.31, 2.54, fill=None, stroke="31564A", width=1.0)
    for i in range(11):
        circle(slide, 8.66 + i * 0.36, 6.48, 0.035, fill="334155")

    pill(slide, "TEAM RED FLOWERS  ·  TEAM-4", 0.82, 0.78, 2.88,
         fill="15372E", color="86EFAC", size=9)
    text(slide, "RESUME ARCHITECTURE / PRODUCT DECK", 0.84, 1.47, 5.8, 0.25,
         size=9, color="86EFAC", bold=True, tracking=110)
    text(slide, "ResuArchitect", 0.78, 1.94, 7.2, 0.72,
         size=39, color=WHITE, bold=True, font=SERIF)
    text(slide, "AI", 0.80, 2.66, 2.5, 0.97,
         size=60, color=GREEN, bold=True, font=SANS)
    text(slide, "Tailor the story.\nKeep the evidence.", 0.84, 3.83, 5.9, 0.92,
         size=22, color="E2E8F0", bold=False, font=SERIF)
    text(slide, "A local-first resume studio with deterministic job matching,\nreviewable AI suggestions, and clean document exports.",
         0.87, 5.00, 5.9, 0.60, size=12.5, color="CBD5E1")
    line(slide, 0.85, 6.09, 6.75, 6.09, "334155", 1.1)
    text(slide, "cbitosc/HFT26-TEAM-4", 0.87, 6.31, 3.4, 0.25,
         size=10, color="94A3B8", font=MONO)

    # Resume sheet over a 0–100 gauge scale: the range is a capability, not a sample score.
    card(slide, 9.22, 2.00, 2.88, 4.20, fill="FFFFFF", stroke="E2E8F0")
    rect(slide, 9.22, 2.00, 2.88, 0.24, fill=GREEN_DARK, radius=False)
    text(slide, "MATCH SCORE", 9.56, 2.53, 2.12, 0.22,
         size=8.5, color=GREEN_DARK, bold=True, align="center")
    text(slide, "0–100", 9.50, 2.84, 2.24, 0.58,
         size=28, color=NAVY, bold=True, align="center")
    line(slide, 9.73, 3.55, 11.59, 3.55, PALE, 1.0)
    for j, (heading, width) in enumerate([
        ("PROFILE", 1.74), ("EXPERIENCE", 1.96), ("SKILLS", 1.54), ("EDUCATION", 1.28)
    ]):
        yy = 3.79 + j * 0.51
        text(slide, heading, 9.54, yy, 1.95, 0.15, size=7.5, color=MUTED, bold=True)
        rect(slide, 9.54, yy + 0.22, width, 0.055,
             fill=GREEN_PALE if j == 1 else "E2E8F0", radius=False)
    pill(slide, "LIVE CANVAS", 9.80, 5.98, 1.64,
         fill=GREEN_PALE, color=GREEN_DARK, size=8)
    text(slide, "LOCAL BY DEFAULT  ·  AI WHEN CHOSEN", 8.68, 6.53, 4.0, 0.20,
         size=8, color="94A3B8", bold=True, align="right")
    return slide


def add_problem_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, WHITE)
    header(slide, "01  /  Problem space", "One application means the same alignment work again.",
           "The friction lives between the job description, the candidate’s evidence, and the final file.", 2)

    # Repeated task cycle on the left.
    text(slide, "THE REPEATABLE WORK", 0.72, 2.02, 4.0, 0.22,
         size=9, color=GREEN_DARK, bold=True, tracking=100)
    steps = [
        ("01", "Read the JD", "Find required skills and role signals."),
        ("02", "Locate proof", "Trace each requirement to real experience."),
        ("03", "Rewrite carefully", "Make relevant evidence easy to scan."),
        ("04", "Check the file", "Keep structure clean for people and ATS."),
    ]
    y0 = 2.42
    for i, (num, title_value, body_value) in enumerate(steps):
        yy = y0 + i * 0.88
        circle(slide, 0.75, yy + 0.02, 0.38, fill=GREEN_PALE)
        text(slide, num, 0.75, yy + 0.02, 0.38, 0.38, size=8.5,
             color=GREEN_DARK, bold=True, align="center", valign="middle")
        text(slide, title_value, 1.30, yy - 0.01, 2.10, 0.28,
             size=13, color=NAVY, bold=True)
        text(slide, body_value, 1.30, yy + 0.31, 4.35, 0.28,
             size=10.5, color=SLATE)
        if i < 3:
            line(slide, 0.94, yy + 0.41, 0.94, yy + 0.82, "BBF7D0", 1.2)

    # Visualize the fragmenting workflow, not a market statistic.
    card(slide, 6.25, 2.04, 6.36, 4.53, fill=BG, stroke=PALE)
    text(slide, "FRAGMENTED WORKSPACE", 6.62, 2.36, 3.4, 0.2,
         size=9, color=MUTED, bold=True, tracking=80)
    nodes = [
        ("JOB TAB", "JD"),
        ("RESUME FILE", "DOC"),
        ("REWRITE TOOL", "AI"),
        ("EXPORT CHECK", "PDF"),
    ]
    for i, (label, icon) in enumerate(nodes):
        x = 6.62 + i * 1.40
        card(slide, x, 3.02, 1.13, 1.14, fill=WHITE, stroke=PALE)
        circle(slide, x + 0.37, 3.20, 0.39,
               fill=AMBER_PALE if i in (1, 2) else GREEN_PALE)
        text(slide, icon, x + 0.37, 3.20, 0.39, 0.39, size=8.5,
             color=AMBER if i in (1, 2) else GREEN_DARK, bold=True,
             align="center", valign="middle", font=MONO)
        text(slide, label, x + 0.04, 3.74, 1.05, 0.22,
             size=7.2, color=NAVY, bold=True, align="center")
        if i < len(nodes) - 1:
            line(slide, x + 1.13, 3.59, x + 1.37, 3.59, AMBER, 1.4)
            circle(slide, x + 1.19, 3.51, 0.16, fill=AMBER)

    text(slide, "KEYWORDS", 6.66, 4.64, 1.1, 0.20, size=8, color=MUTED, bold=True)
    text(slide, "PROOF", 8.18, 4.64, 0.8, 0.20, size=8, color=MUTED, bold=True)
    text(slide, "VOICE", 9.62, 4.64, 0.8, 0.20, size=8, color=MUTED, bold=True)
    text(slide, "FORMAT", 11.10, 4.64, 0.8, 0.20, size=8, color=MUTED, bold=True)
    for x in (7.65, 9.05, 10.48):
        circle(slide, x, 4.61, 0.12, fill=AMBER)
    rect(slide, 6.62, 5.18, 5.61, 0.94, fill=NAVY, radius=True)
    text(slide, "A better flow connects each step.", 6.92, 5.39, 4.90, 0.34,
         size=17, color=WHITE, bold=True, font=SERIF)
    text(slide, "Requirement  →  evidence  →  reviewable edit  →  export", 6.95, 5.79,
         5.00, 0.21, size=9, color="BBF7D0", bold=True)
    footer(slide, 2)
    return slide


def add_architecture_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, BG)
    header(slide, "02  /  Architecture", "A browser-first core with an optional AI branch.",
           "Scoring and editing stay local; the model is called only for tailored language suggestions.", 3)

    # Browser-owned lane.
    card(slide, 0.62, 1.91, 8.02, 3.02, fill=GREEN_TINT, stroke="BBF7D0")
    pill(slide, "BROWSER  /  LOCAL CORE", 0.91, 2.12, 2.10,
         fill=GREEN_PALE, color=GREEN_DARK, size=8.5)
    local_nodes = [
        (0.91, "PROFILE + JD", "Master profile\nText or public URL"),
        (2.78, "TYPED RESUME AST", "Zod schema\nmaster + active copy"),
        (4.65, "PARSE + SCORE", "JD taxonomy\nweighted evidence"),
        (6.52, "RESULT", "0–100 score\nkeyword gaps"),
    ]
    for i, (x, title_value, body_value) in enumerate(local_nodes):
        card(slide, x, 2.76, 1.55, 1.16, fill=WHITE, stroke="BBF7D0")
        text(slide, title_value, x + 0.10, 2.93, 1.35, 0.22,
             size=8.3, color=GREEN_DARK, bold=True, align="center")
        text(slide, body_value, x + 0.10, 3.22, 1.35, 0.50,
             size=10.5, color=NAVY, bold=True, align="center", valign="middle")
        if i < 3:
            arrow(slide, x + 1.59, 3.34, x + 1.83, 3.34, color=GREEN_DARK, width=1.3)
    text(slide, "Zustand + localStorage  ·  no app database  ·  scoring needs no model call", 1.00, 4.38,
         7.20, 0.24, size=10, color=SLATE, bold=True, align="center")

    # Optional provider lane.
    card(slide, 8.93, 1.91, 3.78, 3.02, fill=AMBER_TINT, stroke="FDE68A")
    pill(slide, "OPTIONAL NETWORK PATH", 9.20, 2.12, 2.22,
         fill=AMBER_PALE, color="92400E", size=8.2)
    ai_nodes = [
        (2.75, "Next.js API proxy", "Contact fields redacted"),
        (3.42, "Featherless / OpenAI", "Provider configured by operator"),
        (4.09, "Truth Guard", "Tools + numeric claims checked"),
    ]
    for y, title_value, body_value in ai_nodes:
        card(slide, 9.21, y, 3.18, 0.52, fill=WHITE, stroke="FDE68A")
        text(slide, title_value, 9.37, y + 0.06, 1.75, 0.18,
             size=9, color=NAVY, bold=True)
        text(slide, body_value, 11.10, y + 0.06, 1.15, 0.27,
             size=7.3, color=SLATE, align="right", valign="middle")
    down_arrow(slide, 10.80, 3.29, 3.40, color=AMBER, width=1.2)
    down_arrow(slide, 10.80, 3.96, 4.07, color=AMBER, width=1.2)
    # Dotted visual link from the local inputs into the optional request path.
    line(slide, 1.68, 2.76, 1.68, 2.60, AMBER, 1.5)
    arrow(slide, 1.68, 2.60, 8.86, 2.60, color=AMBER, width=1.5)
    text(slide, "OPTIONAL TAILOR REQUEST  /  PROFILE + JD", 4.15, 2.39, 3.30, 0.15,
         size=7.0, color="92400E", bold=True, align="center")
    text(slide, "Only when tailoring is requested", 8.89, 4.65, 3.70, 0.18,
         size=8, color="92400E", bold=True, align="center")

    # Shared editing and export lane.
    card(slide, 0.62, 5.24, 12.09, 1.25, fill=WHITE, stroke=PALE)
    text(slide, "REVIEW + BUILD", 0.90, 5.48, 1.52, 0.22,
         size=8.5, color=GREEN_DARK, bold=True)
    steps = [
        (2.55, "Diff review"), (4.60, "Live A4 canvas"),
        (6.84, "ATS text view"), (9.02, "DOCX / PDF"),
    ]
    for i, (x, label) in enumerate(steps):
        pill(slide, label, x, 5.45, 1.63 if i != 1 else 1.80,
             fill=GREEN_PALE if i in (0, 3) else "F1F5F9",
             color=GREEN_DARK if i in (0, 3) else NAVY, size=8.3, height=0.33)
        if i < len(steps) - 1:
            arrow(slide, x + (1.63 if i != 1 else 1.80) + 0.05, 5.62,
                  steps[i + 1][0] - 0.08, 5.62, color=LINE, width=1.1)
    text(slide, "Missing API key or caught provider failure → offline heuristic tailoring", 2.55,
         5.98, 8.9, 0.22, size=9, color=SLATE, align="center")
    footer(slide, 3)
    return slide


def add_scraper_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, WHITE)
    header(slide, "03  /  JD ingestion", "A job URL passes security checks before text extraction.",
           "Pasted text goes straight to analysis; public URLs use a bounded server-side fetch path.", 4)

    checks = [
        (0.63, "01  VALIDATE", "HTTP(S) only · no URL credentials\nPorts 80 / 443 / 8080 / 8443\nReject internal hosts and IP ranges", GREEN_DARK, GREEN_TINT, "BBF7D0"),
        (3.87, "02  RESOLVE + PIN", "Preflight DNS; reject private results\nPin the request to a validated IP\nRecheck every redirect (up to 3)", NAVY_2, "F1F5F9", PALE),
        (7.11, "03  BOUND FETCH", "5-second total timeout\n1 MB response cap\nProtocol, host, and redirect checks", AMBER, AMBER_TINT, "FDE68A"),
    ]
    for x, label, body, accent, fill, stroke in checks:
        card(slide, x, 1.98, 3.00, 1.63, fill=fill, stroke=stroke)
        text(slide, label, x + 0.23, 2.22, 2.58, 0.20,
             size=8.2, color=accent, bold=True)
        text(slide, body, x + 0.23, 2.60, 2.58, 0.73,
             size=9.1, color=NAVY, bold=True)
    arrow(slide, 3.66, 2.79, 3.81, 2.79, GREEN_DARK, 1.5)
    arrow(slide, 6.90, 2.79, 7.05, 2.79, GREEN_DARK, 1.5)

    card(slide, 10.39, 1.98, 2.31, 1.63, fill=NAVY, stroke=NAVY)
    text(slide, "SAFE FETCH RESULT", 10.63, 2.22, 1.84, 0.20,
         size=8.0, color="86EFAC", bold=True, align="center")
    text(slide, "Readable\nJD text", 10.58, 2.62, 1.94, 0.62,
         size=17, color=WHITE, bold=True, font=SERIF, align="center", valign="middle")
    arrow(slide, 10.14, 2.79, 10.32, 2.79, AMBER, 1.5)

    text(slide, "THREE-TIER EXTRACTOR  /  FIRST MATCHING SOURCE WINS",
         0.76, 4.02, 5.50, 0.20, size=8.7, color=GREEN_DARK, bold=True, tracking=65)
    extractors = [
        (0.75, "1", "Schema.org JSON-LD", "JobPosting fields"),
        (4.84, "2", "Next.js hydration", "__NEXT_DATA__ props"),
        (8.93, "3", "Semantic HTML", "Clean + repair headings"),
    ]
    for x, n, title_value, body_value in extractors:
        card(slide, x, 4.44, 3.64, 1.09, fill=BG, stroke=PALE)
        circle(slide, x + 0.22, 4.68, 0.40, fill=GREEN_PALE)
        text(slide, n, x + 0.22, 4.68, 0.40, 0.40,
             size=10, color=GREEN_DARK, bold=True, align="center", valign="middle")
        text(slide, title_value, x + 0.78, 4.64, 2.62, 0.23,
             size=10.0, color=NAVY, bold=True)
        text(slide, body_value, x + 0.78, 4.97, 2.60, 0.20,
             size=8.6, color=SLATE)
    arrow(slide, 4.46, 4.99, 4.74, 4.99, LINE, 1.3)
    arrow(slide, 8.55, 4.99, 8.83, 4.99, LINE, 1.3)

    card(slide, 1.10, 5.88, 11.10, 0.69, fill=GREEN_TINT, stroke="BBF7D0")
    text(slide, "HEADING + BULLET REPAIR", 1.37, 6.10, 2.38, 0.17,
         size=8.0, color=GREEN_DARK, bold=True)
    arrow(slide, 3.93, 6.23, 4.30, 6.23, GREEN_DARK, 1.2)
    text(slide, "Readable JD text", 4.42, 6.09, 1.84, 0.20,
         size=9.4, color=NAVY, bold=True)
    arrow(slide, 6.37, 6.23, 6.75, 6.23, GREEN_DARK, 1.2)
    text(slide, "Local taxonomy parser", 6.89, 6.09, 2.12, 0.20,
         size=9.4, color=NAVY, bold=True)
    text(slide, "SSRF CONTROLS", 10.32, 6.10, 1.64, 0.16,
         size=7.4, color=MUTED, bold=True, align="center")

    footer(slide, 4)
    return slide


def add_scoring_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, WHITE)
    header(slide, "04  /  Match engine", "Evidence earns the score—not keyword presence alone.",
           "The deterministic scorer returns a 0–100 match score and shows where each requirement is supported.", 5)

    # Weighting model.
    card(slide, 0.62, 1.91, 6.12, 3.12, fill=BG, stroke=PALE)
    text(slide, "EVIDENCE WEIGHTING", 0.94, 2.18, 3.0, 0.21,
         size=9, color=GREEN_DARK, bold=True, tracking=80)
    weight_rows = [
        ("Bullets + education highlights", "1.0×", 1.00, GREEN_DARK),
        ("Skills / tech / summary", "0.6×", 0.60, AMBER),
        ("No profile evidence", "0.0×", 0.00, MUTED),
    ]
    for i, (label, value, scale, color) in enumerate(weight_rows):
        y = 2.62 + i * 0.69
        text(slide, label, 0.96, y, 2.65, 0.22, size=10.3, color=NAVY, bold=True)
        rect(slide, 3.62, y + 0.02, 2.02, 0.15, fill="E2E8F0", radius=True)
        if scale > 0:
            rect(slide, 3.62, y + 0.02, 2.02 * scale, 0.15,
                 fill=color, radius=True)
        text(slide, value, 5.87, y - 0.05, 0.55, 0.28,
             size=12, color=color, bold=True, align="right")
        text(slide, "full credit" if scale == 1 else "partial credit" if scale else "no credit",
             0.97, y + 0.28, 2.5, 0.17, size=8.2, color=MUTED)
    text(slide, "Score = Σ(priority × evidence credit) ÷ Σ(priority) × 100",
         0.96, 4.54, 5.48, 0.17, size=7.7, color=SLATE, bold=True)
    text(slide, "JD priority: must-have 3.0×  ·  preferred 1.5×  ·  general 1.0×",
         0.96, 4.76, 5.48, 0.17, size=7.6, color=SLATE)

    # Alias map as a visible normalization graph.
    card(slide, 0.62, 5.22, 6.12, 1.30, fill=GREEN_TINT, stroke="BBF7D0")
    text(slide, "NORMALIZE THE WORDING", 0.91, 5.42, 2.6, 0.19,
         size=8.3, color=GREEN_DARK, bold=True)
    pill(slide, "K8s", 0.96, 5.83, 0.77, fill=WHITE, color=NAVY, size=10, stroke="BBF7D0")
    arrow(slide, 1.84, 5.99, 2.25, 5.99, color=GREEN_DARK, width=1.4)
    pill(slide, "Kubernetes", 2.31, 5.83, 1.46, fill=WHITE, color=NAVY, size=9.5, stroke="BBF7D0")
    pill(slide, "Postgres", 3.98, 5.83, 1.14, fill=WHITE, color=NAVY, size=9.5, stroke="BBF7D0")
    arrow(slide, 5.23, 5.99, 5.56, 5.99, color=GREEN_DARK, width=1.4)
    pill(slide, "PostgreSQL", 5.62, 5.83, 0.91, fill=WHITE, color=NAVY, size=7.8, stroke="BBF7D0")

    # Score scale and measured runtime.
    card(slide, 6.98, 1.91, 5.73, 4.61, fill=BG, stroke=PALE)
    text(slide, "MATCH SCORE SCALE", 7.31, 2.17, 2.7, 0.20,
         size=9, color=GREEN_DARK, bold=True, tracking=70)
    circle(slide, 7.44, 2.55, 1.74, fill=None, stroke="BBF7D0", width=7.0)
    # Range ticks communicate the gauge limits without inventing a candidate score.
    for i, value in enumerate(("0", "25", "50", "75", "100")):
        xx = 7.24 + i * 0.55
        circle(slide, xx, 4.33, 0.06, fill=GREEN_DARK)
        text(slide, value, xx - 0.10, 4.43, 0.28, 0.18,
             size=7.5, color=MUTED, align="center")
    text(slide, "0–100", 7.57, 3.12, 1.47, 0.42,
         size=21, color=NAVY, bold=True, align="center")
    text(slide, "score range", 7.57, 3.56, 1.47, 0.18,
         size=7.8, color=MUTED, align="center")

    text(slide, "LOCAL SCORER / 5-KEYWORD FIXTURE", 9.54, 2.20, 2.80, 0.19,
         size=8.2, color=NAVY, bold=True)
    # Local sample benchmark: p50 0.28ms, p95 0.43ms, sample max 1.71ms.
    chart_x, chart_y, chart_w = 9.58, 2.78, 1.10
    axis_y = chart_y + 1.05
    line(slide, chart_x, axis_y, chart_x + chart_w, axis_y, LINE, 0.8)
    text(slide, "P50 / P95 · 0–1 ms axis", chart_x, chart_y - 0.23, 2.50,
         0.16, size=7.2, color=MUTED, bold=True, align="right")
    for i, (label, value, color) in enumerate((
        ("p50", 0.28, GREEN_DARK), ("p95", 0.43, GREEN)
    )):
        yy = chart_y + 0.20 + i * 0.52
        rect(slide, chart_x, yy, chart_w, 0.17, fill="E2E8F0", radius=True)
        width = chart_w * value
        rect(slide, chart_x, yy, width, 0.17, fill=color, radius=True)
        text(slide, f"{label}  {value:.2f} ms", chart_x + chart_w + 0.14, yy + 0.01,
             1.27, 0.18, size=8.0, color=NAVY, bold=True)
    for fraction, tick_label in ((0, "0"), (0.5, "0.5"), (1, "1.0 ms")):
        tick_x = chart_x + chart_w * fraction
        line(slide, tick_x, axis_y - 0.025, tick_x, axis_y + 0.055, MUTED, 0.5)
        text(slide, tick_label, tick_x - 0.20, axis_y + 0.075, 0.40, 0.13,
             size=6.6, color=MUTED, align="center")
    text(slide, "100 warm-ups · 5,000 runs · Node v24.21", 9.55, 4.09, 2.95, 0.18,
         size=8.0, color=MUTED)
    text(slide, "Sample max: 1.71 ms (<5 ms ref.); device/JD size vary.",
         9.55, 4.29, 2.96, 0.32, size=7.6, color=MUTED)

    line(slide, 7.31, 4.80, 12.35, 4.80, PALE, 0.8)
    pill(slide, "500 SKILLS · 10 CATEGORIES", 7.32, 5.07, 2.66,
         fill=GREEN_PALE, color=GREEN_DARK, size=7.8)
    pill(slide, "LONGEST SPAN WINS", 10.16, 5.07, 2.11,
         fill=AMBER_PALE, color="92400E", size=7.8)
    text(slide, "Span overlap avoids double-counting compounds like Spring Boot.",
         7.33, 5.44, 4.95, 0.18, size=8.0, color=SLATE, bold=True)
    card(slide, 7.32, 5.72, 2.38, 0.57, fill=GREEN_TINT, stroke="BBF7D0")
    text(slide, "MATCH SCORE", 7.48, 5.81, 1.96, 0.14,
         size=7.0, color=GREEN_DARK, bold=True)
    text(slide, "Local · deterministic", 7.48, 6.02, 1.96, 0.15,
         size=8.2, color=NAVY, bold=True)
    card(slide, 9.88, 5.72, 2.39, 0.57, fill=AMBER_TINT, stroke="FDE68A")
    text(slide, "TAILORING", 10.04, 5.81, 1.95, 0.14,
         size=7.0, color="92400E", bold=True)
    text(slide, "Optional · network model", 10.04, 6.02, 2.02, 0.15,
         size=8.0, color=NAVY, bold=True)
    footer(slide, 5)
    return slide


def add_pipeline_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, BG)
    header(slide, "05  /  AI co-pilot", "Three bounded stages. Candidate approval stays in the loop.",
           "Local parsing and code checks frame an optional language-model rewrite.", 6)

    stages = [
        (0.68, "STAGE 1", "Parse the JD", "Local taxonomy parser\nCanonical skills + priority tiers", GREEN_DARK),
        (4.56, "STAGE 2", "Google XYZ rewrite", "Outcome · measure · method\nOptional provider · 8s request bound", AMBER),
        (8.44, "STAGE 3", "Check the claims", "Detected tools + numbers\nSelected qualitative rules", GREEN_DARK),
    ]
    for x, stage, title_value, body_value, accent in stages:
        card(slide, x, 2.19, 3.43, 2.32, fill=WHITE, stroke=PALE)
        circle(slide, x + 0.25, 2.44, 0.47, fill=GREEN_PALE if accent == GREEN_DARK else AMBER_PALE)
        text(slide, stage[-1], x + 0.25, 2.44, 0.47, 0.47,
             size=13, color=accent, bold=True, align="center", valign="middle")
        text(slide, stage, x + 0.87, 2.46, 1.36, 0.21,
             size=8.2, color=accent, bold=True)
        text(slide, title_value, x + 0.26, 3.12, 2.93, 0.34,
             size=17, color=NAVY, bold=True, font=SERIF)
        text(slide, body_value, x + 0.27, 3.70, 2.91, 0.53,
             size=10.7, color=SLATE)
    arrow(slide, 4.18, 3.35, 4.47, 3.35, GREEN_DARK)
    arrow(slide, 8.06, 3.35, 8.35, 3.35, GREEN_DARK)

    # Human gate and honest validation boundary.
    card(slide, 0.68, 4.91, 7.48, 1.31, fill=GREEN_TINT, stroke="BBF7D0")
    text(slide, "CANDIDATE REVIEW", 0.98, 5.18, 1.54, 0.20,
         size=8.5, color=GREEN_DARK, bold=True)
    pill(slide, "ACCEPT", 2.77, 5.12, 1.05, fill=GREEN_PALE, color=GREEN_DARK, size=8.4)
    pill(slide, "EDIT", 4.05, 5.12, 0.84, fill=WHITE, color=NAVY, size=8.4, stroke=PALE)
    pill(slide, "REJECT", 5.12, 5.12, 1.00, fill=AMBER_PALE, color="92400E", size=8.4)
    text(slide, "Suggestions are reviewable diffs—not silent edits.", 2.77, 5.59,
         4.75, 0.23, size=9.5, color=SLATE)

    card(slide, 8.44, 4.91, 3.43, 1.31, fill=AMBER_TINT, stroke="FDE68A")
    text(slide, "VALIDATION BOUNDARY", 8.72, 5.16, 2.75, 0.20,
         size=8.4, color="92400E", bold=True)
    text(slide, "Rule checks can flag unsupported tools, number drift, selected claims, and bullets over 180 characters. Human review remains necessary.",
         8.72, 5.43, 2.82, 0.64, size=8.4, color=SLATE)

    # Fallback route.
    line(slide, 6.27, 4.52, 6.27, 4.78, AMBER, 1.2)
    circle(slide, 6.20, 4.66, 0.14, fill=AMBER)
    text(slide, "No API key / caught provider failure  →  deterministic heuristic fallback",
         2.04, 6.47, 9.05, 0.24, size=9.5, color=NAVY, bold=True, align="center")
    footer(slide, 6)
    return slide


def add_studio_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, WHITE)
    header(slide, "06  /  Visual editor", "A working profile on the left. A live A4 canvas on the right.",
           "Edit, reorder sections, change themes, inspect gaps, and review each proposed change in context.", 7)

    # Left control pane.
    card(slide, 0.62, 1.91, 5.84, 4.69, fill="F1F5F9", stroke=PALE)
    text(slide, "CONTROL PANE", 0.94, 2.17, 1.65, 0.20,
         size=8.5, color=GREEN_DARK, bold=True)
    for i, label in enumerate(("PROFILE", "JD MATCH", "AI TAILOR", "THEME")):
        x = 0.91 + i * 1.26
        active = i == 1
        pill(slide, label, x, 2.56, 1.10, fill=GREEN_DARK if active else WHITE,
             color=WHITE if active else SLATE, size=7.4, height=0.31,
             stroke=None if active else PALE)
    text(slide, "TARGET JOB DESCRIPTION", 0.97, 3.14, 2.4, 0.17,
         size=7.7, color=MUTED, bold=True)
    rect(slide, 0.96, 3.42, 5.12, 0.58, fill=WHITE, stroke=PALE, radius=True)
    text(slide, "Paste a job description or enter a public job URL…", 1.14, 3.60,
         4.78, 0.18, size=9, color=MUTED)
    text(slide, "MATCH SCORE", 0.98, 4.22, 1.40, 0.18,
         size=7.8, color=GREEN_DARK, bold=True)
    # A range-only gauge avoids inventing an example score.
    rect(slide, 2.32, 4.28, 3.02, 0.10, fill="E2E8F0", radius=True)
    for tick_x in (2.32, 3.81, 5.31):
        rect(slide, tick_x, 4.22, 0.025, 0.22, fill=MUTED, radius=False)
    text(slide, "0", 2.28, 4.45, 0.16, 0.16, size=6.8, color=MUTED)
    text(slide, "50", 3.74, 4.45, 0.25, 0.16, size=6.8, color=MUTED, align="center")
    text(slide, "100", 5.20, 4.45, 0.34, 0.16, size=6.8, color=MUTED, align="right")
    text(slide, "0–100%", 5.35, 4.17, 0.66, 0.24, size=8.5,
         color=NAVY, bold=True, align="right")
    text(slide, "KEYWORD GAPS", 0.98, 4.70, 1.50, 0.18,
         size=7.8, color=MUTED, bold=True)
    pill(slide, "REQUIRED", 2.28, 4.64, 0.95, fill=AMBER_PALE, color="92400E", size=7.0)
    pill(slide, "PREFERRED", 3.36, 4.64, 1.05, fill=WHITE, color=SLATE, size=7.0, stroke=PALE)
    pill(slide, "EVIDENCE", 4.55, 4.64, 0.98, fill=GREEN_PALE, color=GREEN_DARK, size=7.0)
    line(slide, 0.98, 5.12, 6.08, 5.12, PALE, 0.8)
    text(slide, "BULLET REVIEW", 0.98, 5.32, 1.5, 0.18,
         size=7.8, color=GREEN_DARK, bold=True)
    text(slide, "Original  →  Proposed  →  Accept / edit / reject", 0.98, 5.67,
         4.95, 0.27, size=10.5, color=NAVY, bold=True)
    pill(slide, "Δ MATCH", 4.88, 5.63, 1.14, fill=GREEN_PALE, color=GREEN_DARK, size=7.5)
    text(slide, "Master → active draft → ≤20 variants · JSON backup / restore",
         0.98, 6.01, 4.97, 0.17, size=7.8, color=SLATE)
    text(slide, "Stable IDs · hide without deleting · score follows visible content",
         0.98, 6.23, 4.97, 0.17, size=7.6, color=SLATE)

    # Bidirectional relationship between controls and canvas.
    line(slide, 6.53, 4.12, 6.87, 4.12, GREEN_DARK, 2.2)
    circle(slide, 6.61, 4.04, 0.16, fill=GREEN)
    circle(slide, 6.68, 4.04, 0.16, fill=GREEN_DARK)

    # Right canvas / A4 preview.
    card(slide, 6.98, 1.91, 5.73, 4.69, fill=BG, stroke=PALE)
    text(slide, "LIVE CANVAS", 7.29, 2.17, 1.55, 0.20,
         size=8.5, color=GREEN_DARK, bold=True)
    pill(slide, "A4  /  210 × 297 mm", 10.47, 2.02, 1.81, fill=WHITE,
         color=NAVY, size=7.7, stroke=PALE)
    # Page mockup.
    card(slide, 8.53, 2.36, 2.70, 3.66, fill=WHITE, stroke=PALE)
    rect(slide, 8.53, 2.36, 2.70, 0.13, fill=GREEN_DARK, radius=False)
    text(slide, "CANDIDATE PROFILE", 8.84, 2.72, 2.08, 0.19,
         size=8, color=NAVY, bold=True, align="center")
    rect(slide, 9.12, 3.06, 1.54, 0.055, fill="CBD5E1", radius=False)
    rect(slide, 8.88, 3.38, 2.00, 0.045, fill="E2E8F0", radius=False)
    for y, label in ((3.71, "SUMMARY"), (4.28, "EXPERIENCE"), (4.93, "SKILLS"), (5.48, "EDUCATION")):
        text(slide, label, 8.82, y, 1.62, 0.14, size=6.9, color=GREEN_DARK, bold=True)
        rect(slide, 8.82, y + 0.22, 2.10, 0.045, fill="E2E8F0", radius=False)
        if label == "EXPERIENCE":
            rect(slide, 8.82, y + 0.34, 1.88, 0.045, fill="E2E8F0", radius=False)
    # ATS inspector chip under the page.
    pill(slide, "ATS PLAIN-TEXT INSPECTOR", 8.18, 6.29, 3.40,
         fill=GREEN_PALE, color=GREEN_DARK, size=7.8)
    text(slide, "One-page target  ·  overflow warning  ·  live preview", 8.02, 6.03,
         3.70, 0.19, size=8.2, color=SLATE, align="center")
    footer(slide, 7)
    return slide


def add_export_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, BG)
    header(slide, "07  /  ATS + export", "One document. Two ways to inspect it.",
           "Review the human-facing page and the linearized text stream before downloading.", 8)

    # Human view.
    card(slide, 0.63, 1.91, 5.30, 3.93, fill=WHITE, stroke=PALE)
    text(slide, "VISUAL RESUME", 0.94, 2.16, 1.85, 0.19,
         size=8.5, color=GREEN_DARK, bold=True)
    card(slide, 1.58, 2.56, 3.15, 2.92, fill=WHITE, stroke=PALE)
    text(slide, "NAME  /  HEADLINE", 1.88, 2.85, 2.55, 0.19,
         size=8, color=NAVY, bold=True, align="center")
    line(slide, 1.89, 3.19, 4.42, 3.19, GREEN_DARK, 1.2)
    for i, section in enumerate(("SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION")):
        yy = 3.42 + i * 0.37
        text(slide, section, 1.88, yy, 1.35, 0.15,
             size=7, color=GREEN_DARK, bold=True)
        rect(slide, 3.28, yy + 0.02, 1.12 if i % 2 == 0 else 1.30, 0.045,
             fill="CBD5E1", radius=False)
        if i < 3:
            rect(slide, 1.89, yy + 0.19, 2.52, 0.04, fill="E2E8F0", radius=False)

    # ATS inspector view.
    card(slide, 7.22, 1.91, 5.48, 3.93, fill=NAVY, stroke=NAVY)
    pill(slide, "ATS ROBOT VIEW", 7.56, 2.16, 1.61,
         fill="1E293B", color="86EFAC", size=8.0)
    # Terminal controls are decorative, not product statistics.
    circle(slide, 11.68, 2.24, 0.10, fill=RED)
    circle(slide, 11.87, 2.24, 0.10, fill=AMBER)
    circle(slide, 12.06, 2.24, 0.10, fill=GREEN)
    rect(slide, 7.56, 2.61, 4.78, 2.72, fill="111827", stroke="334155", radius=True)
    stream = (
        "PROFILE HEADER\n"
        "  name · headline · contact\n\n"
        "SECTION ORDER\n"
        "  summary → experience → projects\n"
        "  skills → education → certifications\n\n"
        "TEXT FLOW\n"
        "  headings · bullets · technologies"
    )
    text(slide, stream, 7.84, 2.87, 4.18, 2.24,
         size=9.2, color="BBF7D0", font=MONO)
    text(slide, "App-generated text order · not a third-party ATS certification.", 7.58, 5.50,
         4.70, 0.19, size=8.4, color="CBD5E1")

    # Two exporter cards.
    card(slide, 0.63, 6.03, 5.30, 0.72, fill=GREEN_TINT, stroke="BBF7D0")
    pill(slide, ".DOCX", 0.91, 6.23, 0.83, fill=GREEN_DARK, color=WHITE, size=8.0)
    text(slide, "OpenXML · Heading 1/2 · right tabs · native bullets", 1.95, 6.19,
         3.66, 0.30, size=8.0, color=NAVY, bold=True, valign="middle")
    card(slide, 7.22, 6.03, 5.48, 0.72, fill=AMBER_TINT, stroke="FDE68A")
    pill(slide, ".PDF", 7.50, 6.23, 0.76, fill=AMBER, color=NAVY, size=8.0)
    text(slide, "jsPDF vector first · raster / print fallback · A4 pagination", 8.50, 6.19,
         3.91, 0.30, size=8.2, color=NAVY, bold=True, valign="middle")
    footer(slide, 8)
    return slide


def add_privacy_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, WHITE)
    header(slide, "08  /  Resilience + proof", "Local by default. External AI is an explicit branch.",
           "The browser owns the working profile; optional tailoring crosses a clearly bounded network boundary.", 9)

    # Privacy/data path, deliberately transparent about external processing.
    cards = [
        (0.64, "01  STORE", "Browser localStorage", "Resume state persists in the browser.\nThe app has no candidate database.", GREEN_DARK, GREEN_TINT, "BBF7D0"),
        (4.58, "02  OPTIONAL CALL", "Configured LLM provider", "Contact fields are redacted in the proxy.\nResume content is still sent for tailoring.", AMBER, AMBER_TINT, "FDE68A"),
        (8.52, "03  RECOVER", "Offline heuristic", "No key or a caught provider failure\nreturns deterministic fallback suggestions.", GREEN_DARK, GREEN_TINT, "BBF7D0"),
    ]
    for x, label, title_value, body_value, accent, fill, stroke in cards:
        card(slide, x, 2.12, 3.54, 2.07, fill=fill, stroke=stroke)
        text(slide, label, x + 0.25, 2.38, 2.90, 0.20,
             size=8.2, color=accent, bold=True)
        text(slide, title_value, x + 0.25, 2.79, 3.02, 0.35,
             size=15, color=NAVY, bold=True, font=SERIF)
        text(slide, body_value, x + 0.25, 3.34, 3.03, 0.56,
             size=10, color=SLATE)
    arrow(slide, 4.23, 3.15, 4.50, 3.15, color=AMBER)
    arrow(slide, 8.17, 3.15, 8.44, 3.15, color=GREEN_DARK)

    # Current verified suite result, without making the run time a product guarantee.
    card(slide, 0.64, 4.58, 5.39, 1.98, fill=BG, stroke=PALE)
    text(slide, "AUTOMATED VERIFICATION", 0.96, 4.84, 3.40, 0.19,
         size=8.5, color=GREEN_DARK, bold=True)
    text(slide, "86 / 86", 0.96, 5.17, 2.42, 0.70,
         size=31, color=NAVY, bold=True, font=SERIF)
    text(slide, "test cases passed", 0.99, 5.91, 2.25, 0.18,
         size=9.2, color=GREEN_DARK, bold=True)
    line(slide, 3.52, 5.16, 3.52, 6.27, PALE, 1.0)
    text(slide, "17 reported suite groups", 3.82, 5.25, 1.90, 0.37,
         size=10, color=NAVY, bold=True)
    text(slide, "npm test · 0 failures\nTypecheck · lint clean",
         3.82, 5.76, 1.95, 0.52, size=8.8, color=SLATE)

    card(slide, 6.35, 4.58, 6.36, 1.98, fill=NAVY, stroke=NAVY)
    text(slide, "LOCAL-FIRST RESILIENCE", 6.69, 4.85,
         5.47, 0.20, size=8.3, color="86EFAC", bold=True)
    text(slide, "Local scoring", 6.70, 5.32, 1.48, 0.25,
         size=12, color=WHITE, bold=True)
    text(slide, "Local editing", 8.63, 5.32, 1.48, 0.25,
         size=12, color=WHITE, bold=True)
    text(slide, "Fallback path", 10.63, 5.32, 1.48, 0.25,
         size=12, color=WHITE, bold=True)
    text(slide, "TypeScript", 6.70, 5.72, 1.48, 0.20, size=8.8, color="CBD5E1")
    text(slide, "Browser state", 8.63, 5.72, 1.48, 0.20, size=8.8, color="CBD5E1")
    text(slide, "Heuristic engine", 10.63, 5.72, 1.65, 0.20, size=8.8, color="CBD5E1")
    text(slide, "No-key or caught provider failure → local suggestion path",
         6.70, 6.20, 5.45, 0.17, size=8.0, color="CBD5E1", bold=True)
    footer(slide, 9)
    return slide


def add_closing_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, NAVY)
    circle(slide, 9.55, 1.12, 2.72, fill=None, stroke="1F3A4A", width=1.2)
    circle(slide, 9.86, 1.43, 2.10, fill=None, stroke=GREEN_DARK, width=1.8)
    circle(slide, 10.20, 1.77, 1.42, fill=GREEN_DARK)
    text(slide, "R", 10.20, 1.83, 1.42, 1.08, size=53,
         color=WHITE, bold=True, align="center", valign="middle", font=SERIF)
    pill(slide, "RESUARCHITECT AI", 0.88, 0.92, 1.90,
         fill="15372E", color="86EFAC", size=8.4)
    text(slide, "Tailor for the role.\nKeep the evidence.", 0.82, 2.05, 7.95, 1.64,
         size=36, color=WHITE, bold=True, font=SERIF)
    text(slide, "Questions & discussion", 0.89, 4.18, 5.65, 0.42,
         size=20, color=GREEN, bold=True)
    line(slide, 0.90, 5.03, 6.75, 5.03, "334155", 1.0)
    text(slide, "TEAM RED FLOWERS  ·  TEAM-4", 0.91, 5.33, 4.2, 0.23,
         size=10, color="CBD5E1", bold=True)
    text(slide, "cbitosc/HFT26-TEAM-4", 0.91, 5.72, 3.9, 0.23,
         size=9, color="94A3B8", font=MONO)
    text(slide, "LOCAL MATCHING  /  REVIEWABLE TAILORING  /  EDITABLE EXPORTS",
         7.05, 6.80, 5.44, 0.20, size=7.8, color="94A3B8", bold=True, align="right")
    return slide


def validate_bounds(prs):
    for index, slide in enumerate(prs.slides, 1):
        for shape in slide.shapes:
            if shape.left < 0 or shape.top < 0:
                raise ValueError(f"Slide {index}: shape begins outside the canvas")
            if shape.left + shape.width > prs.slide_width + 2_000 or shape.top + shape.height > prs.slide_height + 2_000:
                raise ValueError(f"Slide {index}: shape extends outside the canvas")


def build():
    prs = Presentation()
    prs.slide_width = Inches(SW)
    prs.slide_height = Inches(SH)
    prs.core_properties.title = "ResuArchitect AI"
    prs.core_properties.subject = "Local-first resume architecture, scoring, and tailoring"
    prs.core_properties.author = "Team Red flowers (TEAM-4)"
    prs.core_properties.keywords = "resume, ATS, deterministic scoring, AI tailoring"

    add_title_slide(prs)
    add_problem_slide(prs)
    add_architecture_slide(prs)
    add_scraper_slide(prs)
    add_scoring_slide(prs)
    add_pipeline_slide(prs)
    add_studio_slide(prs)
    add_export_slide(prs)
    add_privacy_slide(prs)
    add_closing_slide(prs)

    validate_bounds(prs)
    prs.save(OUT)
    print(f"Wrote {OUT} ({len(prs.slides)} slides)")


if __name__ == "__main__":
    build()
