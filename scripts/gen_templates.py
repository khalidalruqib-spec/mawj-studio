#!/usr/bin/env python3
"""Generate 16 professional templates (10 video + 6 caption-style)."""
import json, os, textwrap

BASE = "/tmp/mawj-studio/src/templates"

ANIM = ["fadeIn","fadeOut","slideUp","slideDown","slideLeft","slideRight",
        "zoomIn","zoomOut","pop","bounce","typewriter","blurReveal","rotateIn"]
TRANS = ["cut","fade","slide","zoom","wipe","blur"]
EXPORT = {"format":"mp4","fps":30,"quality":"1080p"}
AUDIO  = {"music":None,"volume":1}
SAFE   = {"top":160,"bottom":260,"left":70,"right":70}

def T(tpl):
    """Merge common fields."""
    return {
        "language": tpl.get("language","mixed"),
        "animations": ANIM, "transitions": TRANS,
        "aspectRatio":"9:16","width":1080,"height":1920,
        "safeMargins": SAFE, "audio": AUDIO, "export": EXPORT,
        **tpl
    }

# ──────────────────────────────────────────────────────────────────
# 1. RAMADAN GREETING
# ──────────────────────────────────────────────────────────────────
ramadan = T({
  "id":"ramadan-greeting","name":"رمضان مبارك — تهنئة احترافية",
  "category":"مناسبات","duration":20,"language":"ar",
  "description":"قالب رمضان احترافي بألوان ذهبية على خلفية داكنة. مثالي للتهاني والمحتوى الموسمي.",
  "requiredInputs":[
    {"key":"brandName","label":"اسم العلامة أو الشخص","type":"text","default":"علامتك التجارية","required":True},
    {"key":"greeting","label":"نص التهنئة","type":"textarea","default":"كل عام وأنتم بخير وبصحة وسعادة","required":True},
    {"key":"subMessage","label":"رسالة ثانوية","type":"text","default":"رمضان شهر العطاء والخير","required":False},
    {"key":"accentColor","label":"لون التمييز","type":"color","default":"#d4af37","required":False},
  ],
  "scenes":[
    {"id":"reveal","name":"Greeting Reveal","start":0,"duration":12,
     "background":{"type":"color","value":"#0d0a1e"},
     "transition":{"type":"fade","duration":0.6},
     "layers":[
       {"id":"arc1","type":"shape","shape":"circle","x":190,"y":320,"width":700,"height":700,"color":"{{accentColor}}","opacity":0.07,"borderRadius":350},
       {"id":"arc2","type":"shape","shape":"circle","x":265,"y":395,"width":550,"height":550,"color":"{{accentColor}}","opacity":0.10,"borderRadius":275},
       {"id":"top-line","type":"shape","shape":"rect","x":70,"y":182,"width":940,"height":2,"color":"{{accentColor}}","opacity":0.5,"borderRadius":0},
       {"id":"title","type":"text","content":"رمضان كريم","x":70,"y":720,"width":940,"height":220,
        "fontSize":108,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.8}},
       {"id":"divider","type":"shape","shape":"rect","x":340,"y":970,"width":400,"height":2,"color":"{{accentColor}}","opacity":0.6,"borderRadius":0},
       {"id":"greeting","type":"text","content":"{{greeting}}","x":70,"y":1010,"width":940,"height":140,
        "fontSize":50,"fontWeight":"normal","color":"#e8d5a0","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.7,"delay":0.4}},
       {"id":"brand","type":"text","content":"{{brandName}}","x":70,"y":1190,"width":940,"height":90,
        "fontSize":40,"fontWeight":"normal","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.6,"delay":0.7}},
       {"id":"bottom-line","type":"shape","shape":"rect","x":70,"y":1660,"width":940,"height":2,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
     ]},
    {"id":"message","name":"Message Outro","start":12,"duration":8,
     "background":{"type":"color","value":"#0a0d1a"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"glow","type":"shape","shape":"circle","x":90,"y":500,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.05,"borderRadius":450},
       {"id":"brand2","type":"text","content":"{{brandName}}","x":70,"y":260,"width":940,"height":100,
        "fontSize":44,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.5}},
       {"id":"m-line","type":"shape","shape":"rect","x":350,"y":380,"width":380,"height":2,"color":"{{accentColor}}","opacity":0.5,"borderRadius":0},
       {"id":"sub","type":"text","content":"{{subMessage}}","x":70,"y":780,"width":940,"height":300,
        "fontSize":62,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.6,"delay":0.3}},
       {"id":"d1","type":"shape","shape":"circle","x":460,"y":1165,"width":18,"height":18,"color":"{{accentColor}}","opacity":0.8,"borderRadius":9},
       {"id":"d2","type":"shape","shape":"circle","x":495,"y":1168,"width":10,"height":10,"color":"{{accentColor}}","opacity":0.5,"borderRadius":5},
       {"id":"d3","type":"shape","shape":"circle","x":520,"y":1165,"width":18,"height":18,"color":"{{accentColor}}","opacity":0.8,"borderRadius":9},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 2. STARTUP PITCH
# ──────────────────────────────────────────────────────────────────
startup_pitch = T({
  "id":"startup-pitch","name":"Startup Pitch Deck","category":"Business","duration":45,
  "description":"5-scene investor pitch: problem → solution → metrics → traction → CTA. Perfect for product launches and investor decks.",
  "requiredInputs":[
    {"key":"startupName","label":"Startup Name","type":"text","default":"TechVenture SA","required":True},
    {"key":"tagline","label":"One-Line Tagline","type":"text","default":"نحل المشكلة الكبيرة بطريقة ذكية","required":True},
    {"key":"problem","label":"Problem Statement","type":"textarea","default":"٧٠٪ من الشركات الصغيرة تعاني من إدارة العمليات","required":True},
    {"key":"solution","label":"Your Solution","type":"textarea","default":"منصة ذكاء اصطناعي تدير عملياتك وتوفر وقتك","required":True},
    {"key":"m1","label":"Metric 1 Value","type":"text","default":"١٠x","required":True},
    {"key":"m1l","label":"Metric 1 Label","type":"text","default":"زيادة الإنتاجية","required":True},
    {"key":"m2","label":"Metric 2 Value","type":"text","default":"٩٥٪","required":True},
    {"key":"m2l","label":"Metric 2 Label","type":"text","default":"رضا العملاء","required":True},
    {"key":"m3","label":"Metric 3 Value","type":"text","default":"+٥٠٠","required":True},
    {"key":"m3l","label":"Metric 3 Label","type":"text","default":"شركة مشتركة","required":True},
    {"key":"ask","label":"The Ask / CTA","type":"text","default":"نبحث عن ٢M$ لتوسيع نطاق العمل","required":True},
    {"key":"website","label":"Website","type":"text","default":"techventure.sa","required":False},
    {"key":"accentColor","label":"Brand Color","type":"color","default":"#6c63ff","required":False},
  ],
  "scenes":[
    {"id":"problem","name":"Problem","start":0,"duration":9,
     "background":{"type":"color","value":"#0b0b1a"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"p-glow","type":"shape","shape":"circle","x":-200,"y":400,"width":800,"height":800,"color":"#ef4444","opacity":0.08,"borderRadius":400},
       {"id":"p-tag","type":"text","content":"المشكلة","x":70,"y":185,"width":400,"height":65,
        "fontSize":32,"fontWeight":"bold","color":"#ef4444","align":"right","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.35}},
       {"id":"p-line","type":"shape","shape":"rect","x":70,"y":262,"width":160,"height":3,"color":"#ef4444","opacity":0.8,"borderRadius":2},
       {"id":"p-text","type":"text","content":"{{problem}}","x":70,"y":680,"width":940,"height":420,
        "fontSize":70,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.6,"delay":0.2}},
       {"id":"p-brand","type":"text","content":"{{startupName}}","x":70,"y":1600,"width":940,"height":70,
        "fontSize":36,"fontWeight":"normal","color":"{{accentColor}}","align":"center","direction":"auto",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.8}},
     ]},
    {"id":"solution","name":"Solution","start":9,"duration":9,
     "background":{"type":"color","value":"#08080f"},
     "transition":{"type":"slide","duration":0.4,"direction":"left"},
     "layers":[
       {"id":"s-glow","type":"shape","shape":"circle","x":300,"y":400,"width":800,"height":800,"color":"{{accentColor}}","opacity":0.07,"borderRadius":400},
       {"id":"s-tag","type":"text","content":"الحل","x":70,"y":185,"width":400,"height":65,
        "fontSize":32,"fontWeight":"bold","color":"{{accentColor}}","align":"right","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.35}},
       {"id":"s-line","type":"shape","shape":"rect","x":70,"y":262,"width":100,"height":3,"color":"{{accentColor}}","opacity":0.8,"borderRadius":2},
       {"id":"s-name","type":"text","content":"{{startupName}}","x":70,"y":590,"width":940,"height":130,
        "fontSize":88,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"auto",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.6}},
       {"id":"s-div","type":"shape","shape":"rect","x":300,"y":755,"width":480,"height":2,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
       {"id":"s-text","type":"text","content":"{{solution}}","x":70,"y":810,"width":940,"height":340,
        "fontSize":56,"fontWeight":"normal","color":"#e2e2f0","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.55,"delay":0.3}},
       {"id":"s-tag2","type":"text","content":"{{tagline}}","x":70,"y":1200,"width":940,"height":90,
        "fontSize":38,"fontWeight":"normal","color":"#7777aa","align":"center","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.5,"delay":0.6}},
     ]},
    {"id":"metrics","name":"Key Metrics","start":18,"duration":10,
     "background":{"type":"color","value":"#080812"},
     "transition":{"type":"zoom","duration":0.4},
     "layers":[
       {"id":"m-head","type":"text","content":"الأرقام تتحدث","x":70,"y":200,"width":940,"height":80,
        "fontSize":38,"fontWeight":"normal","color":"#888899","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"m1-bg","type":"shape","shape":"rect","x":70,"y":370,"width":880,"height":195,"color":"{{accentColor}}","opacity":0.10,"borderRadius":24},
       {"id":"m1-val","type":"text","content":"{{m1}}","x":70,"y":388,"width":880,"height":120,
        "fontSize":88,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.5,"delay":0.1}},
       {"id":"m1-lbl","type":"text","content":"{{m1l}}","x":70,"y":522,"width":880,"height":54,
        "fontSize":34,"fontWeight":"normal","color":"#ccccdd","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4,"delay":0.4}},
       {"id":"m2-bg","type":"shape","shape":"rect","x":70,"y":635,"width":880,"height":195,"color":"{{accentColor}}","opacity":0.08,"borderRadius":24},
       {"id":"m2-val","type":"text","content":"{{m2}}","x":70,"y":653,"width":880,"height":120,
        "fontSize":88,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.5,"delay":0.35}},
       {"id":"m2-lbl","type":"text","content":"{{m2l}}","x":70,"y":787,"width":880,"height":54,
        "fontSize":34,"fontWeight":"normal","color":"#ccccdd","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4,"delay":0.65}},
       {"id":"m3-bg","type":"shape","shape":"rect","x":70,"y":900,"width":880,"height":195,"color":"{{accentColor}}","opacity":0.06,"borderRadius":24},
       {"id":"m3-val","type":"text","content":"{{m3}}","x":70,"y":918,"width":880,"height":120,
        "fontSize":88,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.5,"delay":0.6}},
       {"id":"m3-lbl","type":"text","content":"{{m3l}}","x":70,"y":1052,"width":880,"height":54,
        "fontSize":34,"fontWeight":"normal","color":"#ccccdd","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4,"delay":0.9}},
     ]},
    {"id":"traction","name":"Traction","start":28,"duration":8,
     "background":{"type":"color","value":"#070710"},
     "transition":{"type":"fade","duration":0.4},
     "layers":[
       {"id":"t-label","type":"text","content":"الجذب التجاري","x":70,"y":200,"width":940,"height":70,
        "fontSize":36,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"t-line","type":"shape","shape":"rect","x":380,"y":285,"width":320,"height":2,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
       {"id":"t-tag","type":"text","content":"{{tagline}}","x":70,"y":720,"width":940,"height":300,
        "fontSize":72,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.6,"delay":0.2}},
       {"id":"t-name","type":"text","content":"{{startupName}}","x":70,"y":1070,"width":940,"height":90,
        "fontSize":48,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"auto",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.5,"delay":0.5}},
     ]},
    {"id":"cta","name":"CTA","start":36,"duration":9,
     "background":{"type":"color","value":"#050510"},
     "transition":{"type":"fade","duration":0.6},
     "layers":[
       {"id":"c-glow","type":"shape","shape":"circle","x":90,"y":700,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.12,"borderRadius":450},
       {"id":"c-name","type":"text","content":"{{startupName}}","x":70,"y":580,"width":940,"height":130,
        "fontSize":80,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"auto",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.6}},
       {"id":"c-div","type":"shape","shape":"rect","x":280,"y":745,"width":520,"height":2,"color":"{{accentColor}}","opacity":0.6,"borderRadius":0},
       {"id":"c-ask","type":"text","content":"{{ask}}","x":70,"y":800,"width":940,"height":260,
        "fontSize":56,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.55,"delay":0.3}},
       {"id":"c-web-bg","type":"shape","shape":"rect","x":200,"y":1120,"width":680,"height":90,"color":"{{accentColor}}","opacity":0.9,"borderRadius":45},
       {"id":"c-web","type":"text","content":"{{website}}","x":220,"y":1138,"width":640,"height":56,
        "fontSize":38,"fontWeight":"bold","color":"#050510","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.7}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 3. TUTORIAL HOW-TO
# ──────────────────────────────────────────────────────────────────
tutorial = T({
  "id":"tutorial-how-to","name":"Tutorial — خطوة بخطوة","category":"Education","duration":35,
  "description":"4-scene step-by-step tutorial template with numbered steps, hook, and CTA. Perfect for educational content.",
  "requiredInputs":[
    {"key":"topicTitle","label":"Topic Title","type":"text","default":"كيف تبني عادة يومية ناجحة","required":True},
    {"key":"step1","label":"Step 1","type":"text","default":"حدد هدفك بدقة وكتابة","required":True},
    {"key":"step2","label":"Step 2","type":"text","default":"ابدأ بـ٥ دقائق فقط يومياً","required":True},
    {"key":"step3","label":"Step 3","type":"text","default":"اربط العادة بنشاط موجود","required":True},
    {"key":"step4","label":"Step 4","type":"text","default":"تتبع التقدم أسبوعياً","required":True},
    {"key":"summary","label":"Key Takeaway","type":"textarea","default":"الاستمرارية أهم من الكمال","required":True},
    {"key":"cta","label":"CTA","type":"text","default":"احفظ الفيديو للتطبيق ✓","required":True},
    {"key":"accentColor","label":"Accent Color","type":"color","default":"#10b981","required":False},
    {"key":"brandName","label":"Brand / Creator Name","type":"text","default":"@creatorname","required":False},
  ],
  "scenes":[
    {"id":"hook","name":"Hook","start":0,"duration":6,
     "background":{"type":"color","value":"#050f0a"},
     "transition":{"type":"fade","duration":0.4},
     "layers":[
       {"id":"h-glow","type":"shape","shape":"circle","x":90,"y":400,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.08,"borderRadius":450},
       {"id":"h-num","type":"text","content":"٤ خطوات","x":70,"y":540,"width":940,"height":130,
        "fontSize":100,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.5}},
       {"id":"h-title","type":"text","content":"{{topicTitle}}","x":70,"y":720,"width":940,"height":260,
        "fontSize":68,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.55,"delay":0.2}},
       {"id":"h-brand","type":"text","content":"{{brandName}}","x":70,"y":1600,"width":940,"height":70,
        "fontSize":38,"fontWeight":"normal","color":"{{accentColor}}","align":"center","direction":"auto",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.7}},
     ]},
    {"id":"steps12","name":"Steps 1 & 2","start":6,"duration":10,
     "background":{"type":"color","value":"#060d09"},
     "transition":{"type":"slide","duration":0.4,"direction":"left"},
     "layers":[
       {"id":"s-head","type":"text","content":"الخطوات","x":70,"y":185,"width":940,"height":65,
        "fontSize":32,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"n1-circle","type":"shape","shape":"circle","x":80,"y":360,"width":120,"height":120,"color":"{{accentColor}}","opacity":0.9,"borderRadius":60},
       {"id":"n1","type":"text","content":"١","x":80,"y":365,"width":120,"height":110,
        "fontSize":70,"fontWeight":"bold","color":"#050f0a","align":"center","direction":"ltr",
        "animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"s1-bg","type":"shape","shape":"rect","x":220,"y":360,"width":790,"height":120,"color":"{{accentColor}}","opacity":0.08,"borderRadius":16},
       {"id":"s1","type":"text","content":"{{step1}}","x":230,"y":378,"width":770,"height":85,
        "fontSize":46,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.45,"delay":0.1}},
       {"id":"n2-circle","type":"shape","shape":"circle","x":80,"y":560,"width":120,"height":120,"color":"{{accentColor}}","opacity":0.7,"borderRadius":60},
       {"id":"n2","type":"text","content":"٢","x":80,"y":565,"width":120,"height":110,
        "fontSize":70,"fontWeight":"bold","color":"#050f0a","align":"center","direction":"ltr",
        "animationIn":{"type":"fadeIn","duration":0.3,"delay":0.2}},
       {"id":"s2-bg","type":"shape","shape":"rect","x":220,"y":560,"width":790,"height":120,"color":"{{accentColor}}","opacity":0.06,"borderRadius":16},
       {"id":"s2","type":"text","content":"{{step2}}","x":230,"y":578,"width":770,"height":85,
        "fontSize":46,"fontWeight":"bold","color":"#e8e8e8","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.45,"delay":0.3}},
     ]},
    {"id":"steps34","name":"Steps 3 & 4","start":16,"duration":10,
     "background":{"type":"color","value":"#060d09"},
     "transition":{"type":"slide","duration":0.4,"direction":"left"},
     "layers":[
       {"id":"s-head2","type":"text","content":"الخطوات","x":70,"y":185,"width":940,"height":65,
        "fontSize":32,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"n3-circle","type":"shape","shape":"circle","x":80,"y":360,"width":120,"height":120,"color":"{{accentColor}}","opacity":0.9,"borderRadius":60},
       {"id":"n3","type":"text","content":"٣","x":80,"y":365,"width":120,"height":110,
        "fontSize":70,"fontWeight":"bold","color":"#050f0a","align":"center","direction":"ltr",
        "animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"s3-bg","type":"shape","shape":"rect","x":220,"y":360,"width":790,"height":120,"color":"{{accentColor}}","opacity":0.08,"borderRadius":16},
       {"id":"s3","type":"text","content":"{{step3}}","x":230,"y":378,"width":770,"height":85,
        "fontSize":46,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.45,"delay":0.1}},
       {"id":"n4-circle","type":"shape","shape":"circle","x":80,"y":560,"width":120,"height":120,"color":"{{accentColor}}","opacity":0.7,"borderRadius":60},
       {"id":"n4","type":"text","content":"٤","x":80,"y":565,"width":120,"height":110,
        "fontSize":70,"fontWeight":"bold","color":"#050f0a","align":"center","direction":"ltr",
        "animationIn":{"type":"fadeIn","duration":0.3,"delay":0.2}},
       {"id":"s4-bg","type":"shape","shape":"rect","x":220,"y":560,"width":790,"height":120,"color":"{{accentColor}}","opacity":0.06,"borderRadius":16},
       {"id":"s4","type":"text","content":"{{step4}}","x":230,"y":578,"width":770,"height":85,
        "fontSize":46,"fontWeight":"bold","color":"#e8e8e8","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.45,"delay":0.3}},
     ]},
    {"id":"summary","name":"Takeaway + CTA","start":26,"duration":9,
     "background":{"type":"color","value":"#040c08"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"sum-glow","type":"shape","shape":"circle","x":90,"y":500,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.09,"borderRadius":450},
       {"id":"sum-label","type":"text","content":"الفكرة الرئيسية","x":70,"y":200,"width":940,"height":70,
        "fontSize":36,"fontWeight":"normal","color":"{{accentColor}}","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"sum-text","type":"text","content":"{{summary}}","x":70,"y":700,"width":940,"height":300,
        "fontSize":72,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.7,"delay":0.2}},
       {"id":"cta-bg","type":"shape","shape":"rect","x":130,"y":1090,"width":820,"height":100,"color":"{{accentColor}}","opacity":0.9,"borderRadius":50},
       {"id":"cta","type":"text","content":"{{cta}}","x":150,"y":1108,"width":780,"height":64,
        "fontSize":42,"fontWeight":"bold","color":"#040c08","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.4,"delay":0.5}},
       {"id":"sum-brand","type":"text","content":"{{brandName}}","x":70,"y":1620,"width":940,"height":65,
        "fontSize":36,"fontWeight":"normal","color":"#557766","align":"center","direction":"auto",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.8}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 4. FLASH SALE
# ──────────────────────────────────────────────────────────────────
flash_sale = T({
  "id":"flash-sale","name":"Flash Sale — تخفيض مفاجئ","category":"E-commerce","duration":15,
  "description":"High-energy 3-scene flash sale: announcement → deal details → promo code. Creates urgency and drives action.",
  "requiredInputs":[
    {"key":"headline","label":"Sale Headline","type":"text","default":"تخفيض مفاجئ!","required":True},
    {"key":"discount","label":"Discount Amount","type":"text","default":"٥٠٪","required":True},
    {"key":"productName","label":"Product / Category","type":"text","default":"جميع العطور الفاخرة","required":True},
    {"key":"originalPrice","label":"Original Price","type":"text","default":"٤٩٩ ريال","required":False},
    {"key":"salePrice","label":"Sale Price","type":"text","default":"٢٤٩ ريال","required":True},
    {"key":"promoCode","label":"Promo Code","type":"text","default":"FLASH50","required":False},
    {"key":"deadline","label":"Offer Deadline","type":"text","default":"٢٤ ساعة فقط!","required":True},
    {"key":"brandName","label":"Brand Name","type":"text","default":"متجرك","required":True},
    {"key":"accentColor","label":"Sale Color","type":"color","default":"#ef4444","required":False},
  ],
  "scenes":[
    {"id":"announce","name":"Announcement","start":0,"duration":4,
     "background":{"type":"color","value":"#0f0202"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"a-flash-bg","type":"shape","shape":"rect","x":0,"y":600,"width":1080,"height":720,"color":"{{accentColor}}","opacity":0.12,"borderRadius":0},
       {"id":"a-tag","type":"text","content":"⚡ {{headline}}","x":70,"y":580,"width":940,"height":160,
        "fontSize":100,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.4}},
       {"id":"a-brand","type":"text","content":"{{brandName}}","x":70,"y":200,"width":940,"height":80,
        "fontSize":42,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"auto",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"a-disc","type":"text","content":"{{discount}} خصم","x":70,"y":800,"width":940,"height":220,
        "fontSize":160,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"zoomIn","duration":0.45,"delay":0.2}},
       {"id":"a-deadline","type":"text","content":"{{deadline}}","x":70,"y":1070,"width":940,"height":90,
        "fontSize":50,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.3,"delay":0.5}},
     ]},
    {"id":"deal","name":"Deal Details","start":4,"duration":7,
     "background":{"type":"color","value":"#0c0202"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"d-product","type":"text","content":"{{productName}}","x":70,"y":220,"width":940,"height":160,
        "fontSize":72,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideDown","duration":0.4}},
       {"id":"d-divider","type":"shape","shape":"rect","x":70,"y":402,"width":940,"height":3,"color":"{{accentColor}}","opacity":0.5,"borderRadius":0},
       {"id":"d-orig-label","type":"text","content":"السعر الأصلي","x":70,"y":480,"width":940,"height":60,
        "fontSize":36,"fontWeight":"normal","color":"#888888","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"d-orig","type":"text","content":"{{originalPrice}}","x":70,"y":555,"width":940,"height":100,
        "fontSize":72,"fontWeight":"normal","color":"#888888","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.3,"delay":0.1}},
       {"id":"d-cross","type":"shape","shape":"rect","x":280,"y":608,"width":520,"height":5,"color":"#888888","opacity":0.8,"borderRadius":0},
       {"id":"d-sale-label","type":"text","content":"سعر التخفيض","x":70,"y":720,"width":940,"height":60,
        "fontSize":36,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.3,"delay":0.2}},
       {"id":"d-sale","type":"text","content":"{{salePrice}}","x":70,"y":800,"width":940,"height":180,
        "fontSize":130,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.45,"delay":0.3}},
       {"id":"d-disc-badge","type":"shape","shape":"rect","x":300,"y":1040,"width":480,"height":80,"color":"{{accentColor}}","opacity":0.15,"borderRadius":40},
       {"id":"d-disc-text","type":"text","content":"وفّر {{discount}}","x":320,"y":1054,"width":440,"height":52,
        "fontSize":38,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.3,"delay":0.5}},
     ]},
    {"id":"promo","name":"Promo Code","start":11,"duration":4,
     "background":{"type":"color","value":"#0f0202"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"pr-brand","type":"text","content":"{{brandName}}","x":70,"y":200,"width":940,"height":80,
        "fontSize":42,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"auto",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"pr-code-label","type":"text","content":"كود الخصم","x":70,"y":680,"width":940,"height":70,
        "fontSize":42,"fontWeight":"normal","color":"#cccccc","align":"center","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"pr-code-bg","type":"shape","shape":"rect","x":100,"y":775,"width":880,"height":160,"color":"{{accentColor}}","opacity":0.15,"borderRadius":24},
       {"id":"pr-code","type":"text","content":"{{promoCode}}","x":120,"y":793,"width":840,"height":124,
        "fontSize":96,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.4,"delay":0.2}},
       {"id":"pr-deadline","type":"text","content":"⏰ {{deadline}}","x":70,"y":1010,"width":940,"height":90,
        "fontSize":52,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"bounce","duration":0.5,"delay":0.4}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 5. REVIEW VERDICT
# ──────────────────────────────────────────────────────────────────
review = T({
  "id":"review-verdict","name":"Product Review — تقييم المنتج","category":"Reviews","duration":30,
  "description":"4-scene review template: product intro → pros → cons → final verdict with star rating. Perfect for unboxings and honest reviews.",
  "requiredInputs":[
    {"key":"productName","label":"Product Name","type":"text","default":"سماعة Sony WH-1000XM5","required":True},
    {"key":"image","label":"Product Image","type":"image","required":False},
    {"key":"price","label":"Price","type":"text","default":"١٤٩٩ ريال","required":False},
    {"key":"pro1","label":"Pro 1","type":"text","default":"جودة صوت استثنائية","required":True},
    {"key":"pro2","label":"Pro 2","type":"text","default":"عزل صوت احترافي","required":False},
    {"key":"pro3","label":"Pro 3","type":"text","default":"بطارية ٣٠ ساعة","required":False},
    {"key":"con1","label":"Con 1","type":"text","default":"سعر مرتفع نسبياً","required":True},
    {"key":"con2","label":"Con 2","type":"text","default":"تصميم بلاستيكي","required":False},
    {"key":"verdict","label":"Final Verdict","type":"textarea","default":"استثمار يستحق لمحبي الصوت عالي الجودة","required":True},
    {"key":"rating","label":"Rating (e.g. ٩/١٠)","type":"text","default":"٩/١٠","required":True},
    {"key":"brandName","label":"Your Channel / Brand","type":"text","default":"@reviewchannel","required":False},
    {"key":"accentColor","label":"Accent Color","type":"color","default":"#f59e0b","required":False},
  ],
  "scenes":[
    {"id":"intro","name":"Product Intro","start":0,"duration":6,
     "background":{"type":"color","value":"#0a0805"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"i-img","type":"image","src":"{{image}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover","opacity":0.4,"animationIn":{"type":"zoomIn","duration":0.8}},
       {"id":"i-overlay","type":"shape","shape":"rect","x":0,"y":900,"width":1080,"height":1020,"color":"#000000","opacity":0.75,"borderRadius":0},
       {"id":"i-review-tag","type":"text","content":"مراجعة صادقة","x":70,"y":180,"width":940,"height":70,
        "fontSize":38,"fontWeight":"bold","color":"{{accentColor}}","align":"right","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"i-name","type":"text","content":"{{productName}}","x":70,"y":940,"width":940,"height":280,
        "fontSize":78,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.55,"delay":0.2}},
       {"id":"i-price","type":"text","content":"{{price}}","x":70,"y":1270,"width":940,"height":90,
        "fontSize":52,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.5}},
       {"id":"i-brand","type":"text","content":"{{brandName}}","x":70,"y":1600,"width":940,"height":70,
        "fontSize":38,"fontWeight":"normal","color":"#999999","align":"center","direction":"auto",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.3,"delay":0.8}},
     ]},
    {"id":"pros","name":"The Pros","start":6,"duration":8,
     "background":{"type":"color","value":"#030a06"},
     "transition":{"type":"slide","duration":0.35,"direction":"left"},
     "layers":[
       {"id":"pr-tag","type":"text","content":"✓ الإيجابيات","x":70,"y":185,"width":940,"height":80,
        "fontSize":44,"fontWeight":"bold","color":"#10b981","align":"right","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"pr-line","type":"shape","shape":"rect","x":70,"y":278,"width":220,"height":3,"color":"#10b981","opacity":0.7,"borderRadius":2},
       {"id":"pr1-bg","type":"shape","shape":"rect","x":70,"y":380,"width":880,"height":100,"color":"#10b981","opacity":0.09,"borderRadius":16},
       {"id":"pr1","type":"text","content":"{{pro1}}","x":140,"y":398,"width":810,"height":64,
        "fontSize":46,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.4,"delay":0.1}},
       {"id":"pr2-bg","type":"shape","shape":"rect","x":70,"y":520,"width":880,"height":100,"color":"#10b981","opacity":0.07,"borderRadius":16},
       {"id":"pr2","type":"text","content":"{{pro2}}","x":140,"y":538,"width":810,"height":64,
        "fontSize":46,"fontWeight":"bold","color":"#e2e2e2","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.4,"delay":0.25}},
       {"id":"pr3-bg","type":"shape","shape":"rect","x":70,"y":660,"width":880,"height":100,"color":"#10b981","opacity":0.05,"borderRadius":16},
       {"id":"pr3","type":"text","content":"{{pro3}}","x":140,"y":678,"width":810,"height":64,
        "fontSize":46,"fontWeight":"bold","color":"#cccccc","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.4,"delay":0.4}},
     ]},
    {"id":"cons","name":"The Cons","start":14,"duration":7,
     "background":{"type":"color","value":"#0a0303"},
     "transition":{"type":"slide","duration":0.35,"direction":"left"},
     "layers":[
       {"id":"cn-tag","type":"text","content":"✕ السلبيات","x":70,"y":185,"width":940,"height":80,
        "fontSize":44,"fontWeight":"bold","color":"{{accentColor}}","align":"right","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"cn-line","type":"shape","shape":"rect","x":70,"y":278,"width":200,"height":3,"color":"{{accentColor}}","opacity":0.7,"borderRadius":2},
       {"id":"cn1-bg","type":"shape","shape":"rect","x":70,"y":380,"width":880,"height":100,"color":"{{accentColor}}","opacity":0.09,"borderRadius":16},
       {"id":"cn1","type":"text","content":"{{con1}}","x":140,"y":398,"width":810,"height":64,
        "fontSize":46,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.4,"delay":0.1}},
       {"id":"cn2-bg","type":"shape","shape":"rect","x":70,"y":520,"width":880,"height":100,"color":"{{accentColor}}","opacity":0.07,"borderRadius":16},
       {"id":"cn2","type":"text","content":"{{con2}}","x":140,"y":538,"width":810,"height":64,
        "fontSize":46,"fontWeight":"bold","color":"#e2e2e2","align":"right","direction":"rtl",
        "editable":True,"animationIn":{"type":"slideLeft","duration":0.4,"delay":0.25}},
     ]},
    {"id":"verdict","name":"Verdict","start":21,"duration":9,
     "background":{"type":"color","value":"#080604"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"v-glow","type":"shape","shape":"circle","x":90,"y":500,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.08,"borderRadius":450},
       {"id":"v-label","type":"text","content":"الحكم النهائي","x":70,"y":200,"width":940,"height":80,
        "fontSize":42,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"v-rating","type":"text","content":"{{rating}}","x":70,"y":600,"width":940,"height":220,
        "fontSize":160,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.55,"delay":0.2}},
       {"id":"v-divider","type":"shape","shape":"rect","x":300,"y":840,"width":480,"height":2,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
       {"id":"v-text","type":"text","content":"{{verdict}}","x":70,"y":880,"width":940,"height":240,
        "fontSize":56,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.55,"delay":0.4}},
       {"id":"v-brand","type":"text","content":"{{brandName}}","x":70,"y":1600,"width":940,"height":70,
        "fontSize":38,"fontWeight":"normal","color":"#888888","align":"center","direction":"auto",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.8}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 6. SPORTS ENERGY
# ──────────────────────────────────────────────────────────────────
sports = T({
  "id":"sports-energy","name":"Sports Energy — إنجاز رياضي","category":"Sports & Fitness","duration":20,
  "description":"High-energy 3-scene sports template: athlete reveal → stats highlights → motivational CTA. Perfect for fitness and sports content.",
  "requiredInputs":[
    {"key":"athleteName","label":"Athlete / Team Name","type":"text","default":"الأبطال الرياضيون","required":True},
    {"key":"sport","label":"Sport / Activity","type":"text","default":"كرة القدم","required":True},
    {"key":"image","label":"Athlete / Action Photo","type":"image","required":False},
    {"key":"stat1","label":"Stat 1 (e.g. 45)","type":"text","default":"٤٥","required":True},
    {"key":"stat1Label","label":"Stat 1 Label","type":"text","default":"هدف هذا الموسم","required":True},
    {"key":"stat2","label":"Stat 2","type":"text","default":"٩٢٪","required":True},
    {"key":"stat2Label","label":"Stat 2 Label","type":"text","default":"دقة التمريرات","required":True},
    {"key":"motivationalLine","label":"Motivational Line","type":"textarea","default":"الفوز ليس حظاً — إنه تدريب يومي بلا توقف","required":True},
    {"key":"cta","label":"CTA","type":"text","default":"تابع المسيرة ⚡","required":True},
    {"key":"accentColor","label":"Accent Color","type":"color","default":"#ef4444","required":False},
  ],
  "scenes":[
    {"id":"reveal","name":"Athlete Reveal","start":0,"duration":6,
     "background":{"type":"color","value":"#0a0202"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"r-img","type":"image","src":"{{image}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover","opacity":0.6,"animationIn":{"type":"zoomIn","duration":0.8}},
       {"id":"r-vignette","type":"shape","shape":"rect","x":0,"y":1100,"width":1080,"height":820,"color":"#000000","opacity":0.8,"borderRadius":0},
       {"id":"r-sport","type":"text","content":"{{sport}}","x":70,"y":190,"width":940,"height":75,
        "fontSize":42,"fontWeight":"bold","color":"{{accentColor}}","align":"right","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.35}},
       {"id":"r-name","type":"text","content":"{{athleteName}}","x":70,"y":1160,"width":940,"height":240,
        "fontSize":100,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.55,"delay":0.2}},
     ]},
    {"id":"stats","name":"Stats","start":6,"duration":8,
     "background":{"type":"color","value":"#080202"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"st-glow","type":"shape","shape":"circle","x":90,"y":400,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.06,"borderRadius":450},
       {"id":"st-head","type":"text","content":"الإحصائيات","x":70,"y":185,"width":940,"height":70,
        "fontSize":38,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.3}},
       {"id":"st1-val","type":"text","content":"{{stat1}}","x":70,"y":480,"width":940,"height":250,
        "fontSize":180,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.5,"delay":0.1}},
       {"id":"st1-lbl","type":"text","content":"{{stat1Label}}","x":70,"y":760,"width":940,"height":80,
        "fontSize":48,"fontWeight":"normal","color":"#dddddd","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4,"delay":0.4}},
       {"id":"st-div","type":"shape","shape":"rect","x":400,"y":880,"width":280,"height":3,"color":"{{accentColor}}","opacity":0.5,"borderRadius":0},
       {"id":"st2-val","type":"text","content":"{{stat2}}","x":70,"y":920,"width":940,"height":180,
        "fontSize":130,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.5,"delay":0.3}},
       {"id":"st2-lbl","type":"text","content":"{{stat2Label}}","x":70,"y":1130,"width":940,"height":70,
        "fontSize":44,"fontWeight":"normal","color":"#bbbbbb","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4,"delay":0.6}},
     ]},
    {"id":"motivate","name":"Motivation + CTA","start":14,"duration":6,
     "background":{"type":"color","value":"#050101"},
     "transition":{"type":"fade","duration":0.4},
     "layers":[
       {"id":"mv-glow","type":"shape","shape":"circle","x":90,"y":700,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.10,"borderRadius":450},
       {"id":"mv-line","type":"text","content":"{{motivationalLine}}","x":70,"y":600,"width":940,"height":400,
        "fontSize":72,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.6,"delay":0.1}},
       {"id":"mv-cta-bg","type":"shape","shape":"rect","x":160,"y":1090,"width":760,"height":100,"color":"{{accentColor}}","opacity":0.9,"borderRadius":50},
       {"id":"mv-cta","type":"text","content":"{{cta}}","x":180,"y":1108,"width":720,"height":64,
        "fontSize":44,"fontWeight":"bold","color":"#050101","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.4,"delay":0.4}},
       {"id":"mv-name","type":"text","content":"{{athleteName}}","x":70,"y":1260,"width":940,"height":70,
        "fontSize":38,"fontWeight":"normal","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.7}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 7. CINEMATIC QUOTE
# ──────────────────────────────────────────────────────────────────
cinematic_quote = T({
  "id":"cinematic-quote","name":"Cinematic Quote — اقتباس سينمائي","category":"Inspirational","duration":15,
  "description":"Minimal 2-scene cinematic quote template. Atmospheric dark background, powerful typography reveal, author credit.",
  "requiredInputs":[
    {"key":"quote","label":"Quote Text","type":"textarea","default":"النجاح ليس نهاية المطاف، والفشل ليس نهاية العالم — المهم هو الشجاعة للمضي قدماً","required":True},
    {"key":"author","label":"Author","type":"text","default":"ونستون تشرشل","required":False},
    {"key":"brandName","label":"Brand / Creator","type":"text","default":"@مستوحى","required":False},
    {"key":"image","label":"Background Image (optional)","type":"image","required":False},
    {"key":"accentColor","label":"Accent Color","type":"color","default":"#a78bfa","required":False},
  ],
  "scenes":[
    {"id":"quote-reveal","name":"Quote","start":0,"duration":10,
     "background":{"type":"color","value":"#050408"},
     "transition":{"type":"fade","duration":0.8},
     "layers":[
       {"id":"q-img","type":"image","src":"{{image}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover","opacity":0.15,"animationIn":{"type":"zoomIn","duration":1.2}},
       {"id":"q-vignette","type":"shape","shape":"rect","x":0,"y":0,"width":1080,"height":1920,"color":"#000000","opacity":0.6,"borderRadius":0},
       {"id":"q-glow","type":"shape","shape":"circle","x":90,"y":500,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.07,"borderRadius":450},
       {"id":"q-open","type":"text","content":"""","x":70,"y":440,"width":200,"height":200,
        "fontSize":180,"fontWeight":"bold","color":"{{accentColor}}","align":"right","direction":"ltr",
        "opacity":0.4,"animationIn":{"type":"fadeIn","duration":0.5}},
       {"id":"q-text","type":"text","content":"{{quote}}","x":80,"y":620,"width":920,"height":560,
        "fontSize":64,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.9,"delay":0.3}},
       {"id":"q-close","type":"text","content":""","x":810,"y":1140,"width":200,"height":200,
        "fontSize":180,"fontWeight":"bold","color":"{{accentColor}}","align":"left","direction":"ltr",
        "opacity":0.4,"animationIn":{"type":"fadeIn","duration":0.5,"delay":0.6}},
     ]},
    {"id":"credit","name":"Author Credit","start":10,"duration":5,
     "background":{"type":"color","value":"#040307"},
     "transition":{"type":"fade","duration":0.6},
     "layers":[
       {"id":"cr-glow","type":"shape","shape":"circle","x":90,"y":700,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.07,"borderRadius":450},
       {"id":"cr-line1","type":"shape","shape":"rect","x":200,"y":820,"width":680,"height":1,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
       {"id":"cr-author","type":"text","content":"{{author}}","x":70,"y":850,"width":940,"height":130,
        "fontSize":72,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.6,"delay":0.2}},
       {"id":"cr-line2","type":"shape","shape":"rect","x":200,"y":1000,"width":680,"height":1,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
       {"id":"cr-brand","type":"text","content":"{{brandName}}","x":70,"y":1040,"width":940,"height":70,
        "fontSize":38,"fontWeight":"normal","color":"#888888","align":"center","direction":"auto",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.5,"delay":0.5}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 8. TEAM INTRO CARD
# ──────────────────────────────────────────────────────────────────
team_intro = T({
  "id":"team-intro-card","name":"Team Intro Card — بطاقة تعريف الفريق","category":"Personal Branding","duration":20,
  "description":"Professional 3-scene team member introduction: company header → member bio → contact details. Perfect for LinkedIn and corporate content.",
  "requiredInputs":[
    {"key":"companyName","label":"Company / Brand Name","type":"text","default":"شركة مواج","required":True},
    {"key":"memberName","label":"Member Full Name","type":"text","default":"خالد الرويشد","required":True},
    {"key":"role","label":"Role / Title","type":"text","default":"مدير التطوير الرقمي","required":True},
    {"key":"bio","label":"Short Bio","type":"textarea","default":"٨ سنوات من الخبرة في التحول الرقمي وبناء المنتجات التقنية","required":True},
    {"key":"photo","label":"Profile Photo","type":"image","required":False},
    {"key":"email","label":"Email","type":"text","default":"khalid@mawj.sa","required":False},
    {"key":"linkedin","label":"LinkedIn / Social","type":"text","default":"linkedin.com/in/khalidr","required":False},
    {"key":"accentColor","label":"Brand Color","type":"color","default":"#3b82f6","required":False},
  ],
  "scenes":[
    {"id":"company","name":"Company Header","start":0,"duration":5,
     "background":{"type":"color","value":"#030811"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"co-glow","type":"shape","shape":"circle","x":90,"y":400,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.07,"borderRadius":450},
       {"id":"co-name","type":"text","content":"{{companyName}}","x":70,"y":700,"width":940,"height":200,
        "fontSize":96,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.7}},
       {"id":"co-tagline","type":"text","content":"يُقدم","x":70,"y":940,"width":940,"height":90,
        "fontSize":44,"fontWeight":"normal","color":"#888888","align":"center","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.5,"delay":0.4}},
     ]},
    {"id":"member","name":"Member Bio","start":5,"duration":10,
     "background":{"type":"color","value":"#040c14"},
     "transition":{"type":"slide","duration":0.4,"direction":"left"},
     "layers":[
       {"id":"mb-photo","type":"image","src":"{{photo}}","x":290,"y":220,"width":500,"height":500,"fit":"cover","borderRadius":250,"animationIn":{"type":"zoomIn","duration":0.6}},
       {"id":"mb-circle","type":"shape","shape":"circle","x":255,"y":185,"width":570,"height":570,"color":"{{accentColor}}","opacity":0.15,"borderRadius":285},
       {"id":"mb-name","type":"text","content":"{{memberName}}","x":70,"y":790,"width":940,"height":130,
        "fontSize":72,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.5,"delay":0.3}},
       {"id":"mb-role-bg","type":"shape","shape":"rect","x":200,"y":938,"width":680,"height":70,"color":"{{accentColor}}","opacity":0.15,"borderRadius":35},
       {"id":"mb-role","type":"text","content":"{{role}}","x":220,"y":950,"width":640,"height":46,
        "fontSize":36,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "editable":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.5}},
       {"id":"mb-bio","type":"text","content":"{{bio}}","x":70,"y":1060,"width":940,"height":220,
        "fontSize":46,"fontWeight":"normal","color":"#ccddee","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.5,"delay":0.7}},
     ]},
    {"id":"contact","name":"Contact","start":15,"duration":5,
     "background":{"type":"color","value":"#030811"},
     "transition":{"type":"fade","duration":0.4},
     "layers":[
       {"id":"ct-company","type":"text","content":"{{companyName}}","x":70,"y":200,"width":940,"height":90,
        "fontSize":44,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"ct-div","type":"shape","shape":"rect","x":300,"y":308,"width":480,"height":2,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
       {"id":"ct-name","type":"text","content":"{{memberName}}","x":70,"y":760,"width":940,"height":130,
        "fontSize":78,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.5}},
       {"id":"ct-role","type":"text","content":"{{role}}","x":70,"y":920,"width":940,"height":75,
        "fontSize":42,"fontWeight":"normal","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.3}},
       {"id":"ct-email","type":"text","content":"{{email}}","x":70,"y":1070,"width":940,"height":65,
        "fontSize":38,"fontWeight":"normal","color":"#cccccc","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.5}},
       {"id":"ct-social","type":"text","content":"{{linkedin}}","x":70,"y":1155,"width":940,"height":65,
        "fontSize":36,"fontWeight":"normal","color":"#aaaacc","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.7}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 9. STORY ARC (Before → Turning Point → After → Offer)
# ──────────────────────────────────────────────────────────────────
story_arc = T({
  "id":"story-arc","name":"Story Arc — قصة تحويل","category":"Storytelling","duration":40,
  "description":"4-scene personal transformation story: before → turning point → result → offer. Powerful for testimonials and coaching content.",
  "requiredInputs":[
    {"key":"creatorName","label":"Your Name / Brand","type":"text","default":"منى العمري","required":True},
    {"key":"beforeState","label":"Before — The Struggle","type":"textarea","default":"كنت أعاني من التشتت وعدم الوضوح في مسيرتي المهنية","required":True},
    {"key":"turningPoint","label":"The Turning Point","type":"textarea","default":"قررت أن أضع خطة واضحة بمساعدة مختص","required":True},
    {"key":"result","label":"The Result / After","type":"textarea","default":"حققت دخلاً إضافياً ٢٠,٠٠٠ ريال خلال ٣ أشهر","required":True},
    {"key":"offer","label":"Your Offer / CTA","type":"textarea","default":"برنامجي يفتح الأبواب التالي — سجّل اسمك الآن","required":True},
    {"key":"image","label":"Your Photo","type":"image","required":False},
    {"key":"accentColor","label":"Accent Color","type":"color","default":"#8b5cf6","required":False},
  ],
  "scenes":[
    {"id":"before","name":"Before","start":0,"duration":10,
     "background":{"type":"color","value":"#0a080d"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"bf-tag","type":"text","content":"قبل ذلك","x":70,"y":185,"width":400,"height":65,
        "fontSize":34,"fontWeight":"bold","color":"#888888","align":"right","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"bf-line","type":"shape","shape":"rect","x":70,"y":262,"width":140,"height":3,"color":"#888888","opacity":0.6,"borderRadius":2},
       {"id":"bf-glow","type":"shape","shape":"circle","x":90,"y":400,"width":900,"height":900,"color":"#6366f1","opacity":0.05,"borderRadius":450},
       {"id":"bf-text","type":"text","content":"{{beforeState}}","x":70,"y":660,"width":940,"height":460,
        "fontSize":68,"fontWeight":"bold","color":"#ccccdd","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.6,"delay":0.2}},
       {"id":"bf-name","type":"text","content":"{{creatorName}}","x":70,"y":1200,"width":940,"height":80,
        "fontSize":44,"fontWeight":"normal","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.5,"delay":0.8}},
     ]},
    {"id":"turning","name":"Turning Point","start":10,"duration":10,
     "background":{"type":"color","value":"#0a080d"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"tp-tag","type":"text","content":"نقطة التحول","x":70,"y":185,"width":600,"height":65,
        "fontSize":34,"fontWeight":"bold","color":"{{accentColor}}","align":"right","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"tp-line","type":"shape","shape":"rect","x":70,"y":262,"width":220,"height":3,"color":"{{accentColor}}","opacity":0.7,"borderRadius":2},
       {"id":"tp-glow","type":"shape","shape":"circle","x":90,"y":500,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.08,"borderRadius":450},
       {"id":"tp-text","type":"text","content":"{{turningPoint}}","x":70,"y":680,"width":940,"height":440,
        "fontSize":68,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.7,"delay":0.2}},
     ]},
    {"id":"result","name":"The Result","start":20,"duration":10,
     "background":{"type":"color","value":"#060a0a"},
     "transition":{"type":"zoom","duration":0.4},
     "layers":[
       {"id":"rs-tag","type":"text","content":"النتيجة","x":70,"y":185,"width":400,"height":65,
        "fontSize":34,"fontWeight":"bold","color":"#10b981","align":"right","direction":"rtl",
        "animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"rs-line","type":"shape","shape":"rect","x":70,"y":262,"width":120,"height":3,"color":"#10b981","opacity":0.7,"borderRadius":2},
       {"id":"rs-photo","type":"image","src":"{{image}}","x":215,"y":360,"width":650,"height":650,"fit":"cover","borderRadius":325,"animationIn":{"type":"zoomIn","duration":0.6}},
       {"id":"rs-text","type":"text","content":"{{result}}","x":70,"y":1090,"width":940,"height":340,
        "fontSize":62,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.6,"delay":0.4}},
       {"id":"rs-check","type":"text","content":"✓","x":70,"y":1470,"width":940,"height":100,
        "fontSize":80,"fontWeight":"bold","color":"#10b981","align":"center","direction":"ltr",
        "animationIn":{"type":"pop","duration":0.4,"delay":0.8}},
     ]},
    {"id":"offer","name":"The Offer","start":30,"duration":10,
     "background":{"type":"color","value":"#050408"},
     "transition":{"type":"fade","duration":0.6},
     "layers":[
       {"id":"of-glow","type":"shape","shape":"circle","x":90,"y":700,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.12,"borderRadius":450},
       {"id":"of-creator","type":"text","content":"{{creatorName}}","x":70,"y":200,"width":940,"height":90,
        "fontSize":44,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"of-div","type":"shape","shape":"rect","x":300,"y":308,"width":480,"height":2,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
       {"id":"of-text","type":"text","content":"{{offer}}","x":70,"y":620,"width":940,"height":500,
        "fontSize":66,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.6,"delay":0.2}},
       {"id":"of-arrow","type":"text","content":"↓","x":70,"y":1220,"width":940,"height":100,
        "fontSize":80,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"ltr",
        "animationIn":{"type":"bounce","duration":0.6,"delay":0.6}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 10. FASHION EDITORIAL
# ──────────────────────────────────────────────────────────────────
fashion = T({
  "id":"fashion-editorial","name":"Fashion Editorial — موضة وأناقة","category":"Fashion & Lifestyle","duration":25,
  "description":"Elegant 3-scene fashion editorial: brand reveal → lookbook showcase → shop now CTA. Perfect for clothing brands and stylists.",
  "requiredInputs":[
    {"key":"brandName","label":"Brand Name","type":"text","default":"Nour Atelier","required":True},
    {"key":"collectionName","label":"Collection Name","type":"text","default":"مجموعة الخريف ٢٠٢٦","required":True},
    {"key":"look1Image","label":"Look 1 Image","type":"image","required":True},
    {"key":"look1Caption","label":"Look 1 Caption","type":"text","default":"عباءة الشموخ — أسود فاخر","required":True},
    {"key":"look2Image","label":"Look 2 Image (optional)","type":"image","required":False},
    {"key":"look2Caption","label":"Look 2 Caption","type":"text","default":"كيمونو الكريستال — ذهبي","required":False},
    {"key":"tagline","label":"Brand Tagline","type":"text","default":"تميّزي في كل خطوة","required":True},
    {"key":"shopLink","label":"Shop Link","type":"text","default":"shop.nour-atelier.com","required":False},
    {"key":"accentColor","label":"Accent Color","type":"color","default":"#d4af37","required":False},
  ],
  "scenes":[
    {"id":"brand","name":"Brand Reveal","start":0,"duration":7,
     "background":{"type":"color","value":"#080604"},
     "transition":{"type":"fade","duration":0.7},
     "layers":[
       {"id":"b-glow","type":"shape","shape":"circle","x":90,"y":500,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.06,"borderRadius":450},
       {"id":"b-top-line","type":"shape","shape":"rect","x":70,"y":182,"width":940,"height":1,"color":"{{accentColor}}","opacity":0.4,"borderRadius":0},
       {"id":"b-name","type":"text","content":"{{brandName}}","x":70,"y":730,"width":940,"height":200,
        "fontSize":100,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"auto",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.9}},
       {"id":"b-collection","type":"text","content":"{{collectionName}}","x":70,"y":970,"width":940,"height":100,
        "fontSize":46,"fontWeight":"normal","color":"#ccbbaa","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.7,"delay":0.5}},
       {"id":"b-tagline","type":"text","content":"{{tagline}}","x":70,"y":1110,"width":940,"height":80,
        "fontSize":38,"fontWeight":"normal","color":"#888877","align":"center","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.6,"delay":0.8}},
       {"id":"b-bottom-line","type":"shape","shape":"rect","x":70,"y":1660,"width":940,"height":1,"color":"{{accentColor}}","opacity":0.3,"borderRadius":0},
     ]},
    {"id":"lookbook","name":"Lookbook","start":7,"duration":12,
     "background":{"type":"color","value":"#060504"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"lk-img","type":"image","src":"{{look1Image}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover","opacity":0.85,"animationIn":{"type":"zoomIn","duration":0.8}},
       {"id":"lk-overlay","type":"shape","shape":"rect","x":0,"y":1280,"width":1080,"height":640,"color":"#000000","opacity":0.75,"borderRadius":0},
       {"id":"lk-img2","type":"image","src":"{{look2Image}}","x":540,"y":100,"width":470,"height":700,"fit":"cover","opacity":0.7,"animationIn":{"type":"slideDown","duration":0.6,"delay":0.5}},
       {"id":"lk-accent-line","type":"shape","shape":"rect","x":70,"y":1310,"width":200,"height":3,"color":"{{accentColor}}","opacity":1,"borderRadius":2},
       {"id":"lk-caption1","type":"text","content":"{{look1Caption}}","x":70,"y":1360,"width":940,"height":120,
        "fontSize":58,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideUp","duration":0.5,"delay":0.3}},
       {"id":"lk-caption2","type":"text","content":"{{look2Caption}}","x":70,"y":1510,"width":940,"height":90,
        "fontSize":44,"fontWeight":"normal","color":"{{accentColor}}","align":"right","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.5,"delay":0.6}},
     ]},
    {"id":"cta","name":"Shop Now","start":19,"duration":6,
     "background":{"type":"color","value":"#070605"},
     "transition":{"type":"fade","duration":0.5},
     "layers":[
       {"id":"ct-glow","type":"shape","shape":"circle","x":90,"y":600,"width":900,"height":900,"color":"{{accentColor}}","opacity":0.08,"borderRadius":450},
       {"id":"ct-brand","type":"text","content":"{{brandName}}","x":70,"y":600,"width":940,"height":130,
        "fontSize":80,"fontWeight":"bold","color":"{{accentColor}}","align":"center","direction":"auto",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.6}},
       {"id":"ct-collection","type":"text","content":"{{collectionName}}","x":70,"y":770,"width":940,"height":90,
        "fontSize":44,"fontWeight":"normal","color":"#ccbbaa","align":"center","direction":"rtl",
        "safeMargin":True,"animationIn":{"type":"fadeIn","duration":0.5,"delay":0.3}},
       {"id":"ct-shop-bg","type":"shape","shape":"rect","x":160,"y":950,"width":760,"height":100,"color":"{{accentColor}}","opacity":0.9,"borderRadius":50},
       {"id":"ct-shop","type":"text","content":"تسوّقي الآن","x":180,"y":968,"width":720,"height":64,
        "fontSize":44,"fontWeight":"bold","color":"#060504","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"pop","duration":0.4,"delay":0.5}},
       {"id":"ct-link","type":"text","content":"{{shopLink}}","x":70,"y":1110,"width":940,"height":65,
        "fontSize":36,"fontWeight":"normal","color":"#888877","align":"center","direction":"ltr",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.8}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 11. CAPTIONS — NEON POP  (text style template)
# ──────────────────────────────────────────────────────────────────
captions_neon = T({
  "id":"captions-neon-pop","name":"Captions — Neon Pop","category":"Caption Styles","duration":20,
  "description":"High-energy neon green word-by-word caption style on dark background. Optimised for TikTok & Reels.",
  "requiredInputs":[
    {"key":"video","label":"Your Video","type":"video","required":False},
    {"key":"title","label":"Hook Title","type":"text","default":"لن تصدق هذا!","required":True},
    {"key":"brandColor","label":"Neon Color","type":"color","default":"#39ff14","required":False},
    {"key":"cta","label":"CTA","type":"text","default":"اتبع للمزيد 🔥","required":True},
  ],
  "scenes":[
    {"id":"main","name":"Neon Captions","start":0,"duration":20,
     "background":{"type":"color","value":"#060606"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"vid","type":"video","src":"{{video}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover"},
       {"id":"neon-glow-top","type":"shape","shape":"rect","x":0,"y":0,"width":1080,"height":400,"color":"#000000","opacity":0.55,"borderRadius":0},
       {"id":"neon-glow-btm","type":"shape","shape":"rect","x":0,"y":1300,"width":1080,"height":620,"color":"#000000","opacity":0.70,"borderRadius":0},
       {"id":"title-bg","type":"shape","shape":"rect","x":60,"y":172,"width":960,"height":175,"color":"{{brandColor}}","opacity":0.12,"borderRadius":36},
       {"id":"title","type":"text","content":"{{title}}","x":80,"y":195,"width":920,"height":130,
        "fontSize":72,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideDown","duration":0.35}},
       {"id":"captions","type":"captions","source":"auto",
        "x":60,"y":1190,"width":960,"height":330,
        "fontSize":68,"fontWeight":"bold","color":"#ffffff","highlightColor":"{{brandColor}}",
        "align":"center","style":"bold","direction":"auto","safeMargin":True},
       {"id":"cta-glow","type":"shape","shape":"rect","x":180,"y":1570,"width":720,"height":100,"color":"{{brandColor}}","opacity":0.18,"borderRadius":50},
       {"id":"cta","type":"text","content":"{{cta}}","x":200,"y":1586,"width":680,"height":68,
        "fontSize":46,"fontWeight":"bold","color":"{{brandColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"bounce","duration":0.4,"delay":0.6}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 12. CAPTIONS — BOLD KINETIC
# ──────────────────────────────────────────────────────────────────
captions_kinetic = T({
  "id":"captions-bold-kinetic","name":"Captions — Bold Kinetic","category":"Caption Styles","duration":20,
  "description":"High-impact kinetic typography: white bold words fly in from the side on a near-black background. MrBeast-style energy.",
  "requiredInputs":[
    {"key":"video","label":"Your Video","type":"video","required":False},
    {"key":"title","label":"Hook Title","type":"text","default":"هذا ما لم يخبرك به أحد","required":True},
    {"key":"brandColor","label":"Highlight Color","type":"color","default":"#facc15","required":False},
    {"key":"cta","label":"CTA","type":"text","default":"متابعة للاستمرار →","required":True},
  ],
  "scenes":[
    {"id":"main","name":"Kinetic Captions","start":0,"duration":20,
     "background":{"type":"color","value":"#050505"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"vid","type":"video","src":"{{video}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover","opacity":0.3},
       {"id":"title-accent","type":"shape","shape":"rect","x":70,"y":172,"width":8,"height":130,"color":"{{brandColor}}","opacity":1,"borderRadius":4},
       {"id":"title","type":"text","content":"{{title}}","x":100,"y":183,"width":900,"height":120,
        "fontSize":70,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideRight","duration":0.35}},
       {"id":"captions","type":"captions","source":"auto",
        "x":60,"y":1140,"width":960,"height":380,
        "fontSize":72,"fontWeight":"bold","color":"#ffffff","highlightColor":"{{brandColor}}",
        "align":"right","style":"bold","direction":"rtl","safeMargin":True},
       {"id":"cta-line","type":"shape","shape":"rect","x":70,"y":1595,"width":940,"height":2,"color":"{{brandColor}}","opacity":0.7,"borderRadius":0},
       {"id":"cta","type":"text","content":"{{cta}}","x":70,"y":1608,"width":940,"height":68,
        "fontSize":44,"fontWeight":"bold","color":"{{brandColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideLeft","duration":0.35,"delay":0.3}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 13. CAPTIONS — MINIMAL PILL
# ──────────────────────────────────────────────────────────────────
captions_minimal = T({
  "id":"captions-minimal-pill","name":"Captions — Minimal Pill","category":"Caption Styles","duration":20,
  "description":"Clean minimal caption style: white text on a frosted pill background. Professional and readable for any video type.",
  "requiredInputs":[
    {"key":"video","label":"Your Video","type":"video","required":False},
    {"key":"title","label":"Title (optional)","type":"text","default":"","required":False},
    {"key":"brandColor","label":"Pill Color","type":"color","default":"#ffffff","required":False},
    {"key":"cta","label":"CTA","type":"text","default":"تابع للمزيد","required":False},
  ],
  "scenes":[
    {"id":"main","name":"Minimal Captions","start":0,"duration":20,
     "background":{"type":"color","value":"#000000"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"vid","type":"video","src":"{{video}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover"},
       {"id":"title","type":"text","content":"{{title}}","x":70,"y":190,"width":940,"height":100,
        "fontSize":60,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4}},
       {"id":"pill-bg","type":"shape","shape":"rect","x":80,"y":1200,"width":920,"height":280,"color":"#000000","opacity":0.55,"borderRadius":32},
       {"id":"captions","type":"captions","source":"auto",
        "x":100,"y":1215,"width":880,"height":260,
        "fontSize":58,"fontWeight":"bold","color":"#ffffff","highlightColor":"{{brandColor}}",
        "align":"center","style":"minimal","direction":"auto","safeMargin":True},
       {"id":"cta-bg","type":"shape","shape":"rect","x":220,"y":1560,"width":640,"height":80,"color":"{{brandColor}}","opacity":0.15,"borderRadius":40},
       {"id":"cta","type":"text","content":"{{cta}}","x":240,"y":1574,"width":600,"height":52,
        "fontSize":38,"fontWeight":"bold","color":"{{brandColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.4,"delay":0.5}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 14. CAPTIONS — BROADCAST / NEWS
# ──────────────────────────────────────────────────────────────────
captions_broadcast = T({
  "id":"captions-broadcast","name":"Captions — Broadcast News","category":"Caption Styles","duration":20,
  "description":"Professional news-style lower-third caption overlay. Authoritative, clean, and trusted — ideal for serious content and interviews.",
  "requiredInputs":[
    {"key":"video","label":"Your Video","type":"video","required":False},
    {"key":"speakerName","label":"Speaker Name","type":"text","default":"خالد الرويشد","required":True},
    {"key":"speakerTitle","label":"Speaker Title","type":"text","default":"خبير في التقنية والذكاء الاصطناعي","required":True},
    {"key":"channelName","label":"Channel / Show Name","type":"text","default":"مواج ميديا","required":False},
    {"key":"brandColor","label":"Brand Color","type":"color","default":"#dc2626","required":False},
  ],
  "scenes":[
    {"id":"main","name":"Broadcast Lower Third","start":0,"duration":20,
     "background":{"type":"color","value":"#000000"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"vid","type":"video","src":"{{video}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover"},
       {"id":"captions","type":"captions","source":"auto",
        "x":60,"y":1100,"width":960,"height":280,
        "fontSize":54,"fontWeight":"bold","color":"#ffffff","highlightColor":"{{brandColor}}",
        "align":"center","style":"karaoke","direction":"rtl","safeMargin":True},
       {"id":"lt-bar","type":"shape","shape":"rect","x":60,"y":1460,"width":960,"height":130,"color":"#000000","opacity":0.85,"borderRadius":0},
       {"id":"lt-accent","type":"shape","shape":"rect","x":60,"y":1460,"width":12,"height":130,"color":"{{brandColor}}","opacity":1,"borderRadius":0},
       {"id":"lt-name","type":"text","content":"{{speakerName}}","x":90,"y":1470,"width":880,"height":60,
        "fontSize":42,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideLeft","duration":0.4}},
       {"id":"lt-title","type":"text","content":"{{speakerTitle}}","x":90,"y":1538,"width":880,"height":52,
        "fontSize":34,"fontWeight":"normal","color":"#cccccc","align":"right","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideLeft","duration":0.4,"delay":0.15}},
       {"id":"channel-badge","type":"shape","shape":"rect","x":60,"y":182,"width":400,"height":70,"color":"{{brandColor}}","opacity":0.9,"borderRadius":0},
       {"id":"channel-name","type":"text","content":"{{channelName}}","x":70,"y":196,"width":380,"height":42,
        "fontSize":32,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"slideDown","duration":0.4}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 15. CAPTIONS — GRADIENT GLOW
# ──────────────────────────────────────────────────────────────────
captions_gradient = T({
  "id":"captions-gradient-glow","name":"Captions — Gradient Glow","category":"Caption Styles","duration":20,
  "description":"Cinematic caption style with purple-to-cyan gradient highlight and soft glow. Perfect for premium and aesthetic content.",
  "requiredInputs":[
    {"key":"video","label":"Your Video","type":"video","required":False},
    {"key":"title","label":"Hook Title","type":"text","default":"اكتشف السر","required":True},
    {"key":"brandColor","label":"Glow Color","type":"color","default":"#a78bfa","required":False},
    {"key":"cta","label":"CTA","type":"text","default":"احفظ هذا الفيديو ✨","required":True},
  ],
  "scenes":[
    {"id":"main","name":"Gradient Captions","start":0,"duration":20,
     "background":{"type":"color","value":"#060409"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"vid","type":"video","src":"{{video}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover","opacity":0.6},
       {"id":"top-vignette","type":"shape","shape":"rect","x":0,"y":0,"width":1080,"height":350,"color":"#000000","opacity":0.6,"borderRadius":0},
       {"id":"btm-vignette","type":"shape","shape":"rect","x":0,"y":1200,"width":1080,"height":720,"color":"#000000","opacity":0.75,"borderRadius":0},
       {"id":"glow-orb","type":"shape","shape":"circle","x":90,"y":900,"width":900,"height":900,"color":"{{brandColor}}","opacity":0.08,"borderRadius":450},
       {"id":"title-bg","type":"shape","shape":"rect","x":80,"y":172,"width":920,"height":165,"color":"{{brandColor}}","opacity":0.1,"borderRadius":36},
       {"id":"title","type":"text","content":"{{title}}","x":100,"y":192,"width":880,"height":130,
        "fontSize":72,"fontWeight":"bold","color":"{{brandColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"blurReveal","duration":0.6}},
       {"id":"captions","type":"captions","source":"auto",
        "x":60,"y":1170,"width":960,"height":350,
        "fontSize":64,"fontWeight":"bold","color":"#ffffff","highlightColor":"{{brandColor}}",
        "align":"center","style":"karaoke","direction":"auto","safeMargin":True},
       {"id":"cta-bg","type":"shape","shape":"rect","x":120,"y":1572,"width":840,"height":95,"color":"{{brandColor}}","opacity":0.12,"borderRadius":48},
       {"id":"cta","type":"text","content":"{{cta}}","x":140,"y":1588,"width":800,"height":63,
        "fontSize":44,"fontWeight":"bold","color":"{{brandColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.5,"delay":0.5}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# 16. CAPTIONS — TYPEWRITER REVEAL
# ──────────────────────────────────────────────────────────────────
captions_typewriter = T({
  "id":"captions-typewriter","name":"Captions — Typewriter Reveal","category":"Caption Styles","duration":20,
  "description":"Classic typewriter animation style on dark background. Perfect for quotes, educational content, and storytelling.",
  "requiredInputs":[
    {"key":"video","label":"Your Video","type":"video","required":False},
    {"key":"title","label":"Opening Line","type":"text","default":"الحقيقة التي غيرت حياتي","required":True},
    {"key":"line1","label":"Key Line 1","type":"text","default":"كل يوم هو فرصة جديدة للنمو","required":True},
    {"key":"line2","label":"Key Line 2","type":"text","default":"لا تنتظر الإذن — ابدأ الآن","required":True},
    {"key":"cta","label":"CTA","type":"text","default":"تابعني لمزيد من الأفكار","required":True},
    {"key":"brandColor","label":"Cursor Color","type":"color","default":"#8ef7c2","required":False},
  ],
  "scenes":[
    {"id":"main","name":"Typewriter","start":0,"duration":20,
     "background":{"type":"color","value":"#050505"},
     "transition":{"type":"cut","duration":0},
     "layers":[
       {"id":"vid","type":"video","src":"{{video}}","x":0,"y":0,"width":1080,"height":1920,"fit":"cover","opacity":0.2},
       {"id":"overlay","type":"shape","shape":"rect","x":0,"y":0,"width":1080,"height":1920,"color":"#000000","opacity":0.55,"borderRadius":0},
       {"id":"cursor-bar","type":"shape","shape":"rect","x":70,"y":172,"width":6,"height":120,"color":"{{brandColor}}","opacity":1,"borderRadius":3},
       {"id":"title","type":"text","content":"{{title}}","x":100,"y":183,"width":900,"height":110,
        "fontSize":62,"fontWeight":"bold","color":"#ffffff","align":"right","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"typewriter","duration":1.2}},
       {"id":"div-line","type":"shape","shape":"rect","x":70,"y":400,"width":500,"height":2,"color":"{{brandColor}}","opacity":0.4,"borderRadius":0},
       {"id":"line1","type":"text","content":"{{line1}}","x":70,"y":760,"width":940,"height":150,
        "fontSize":66,"fontWeight":"bold","color":"{{brandColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"typewriter","duration":1.0,"delay":1.5}},
       {"id":"line2","type":"text","content":"{{line2}}","x":70,"y":960,"width":940,"height":150,
        "fontSize":66,"fontWeight":"bold","color":"#ffffff","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"typewriter","duration":1.0,"delay":3.0}},
       {"id":"captions","type":"captions","source":"auto",
        "x":70,"y":1200,"width":940,"height":280,
        "fontSize":54,"fontWeight":"normal","color":"#cccccc","highlightColor":"{{brandColor}}",
        "align":"center","style":"minimal","direction":"auto","safeMargin":True},
       {"id":"cta-bg","type":"shape","shape":"rect","x":130,"y":1558,"width":820,"height":90,"color":"{{brandColor}}","opacity":0.1,"borderRadius":45},
       {"id":"cta","type":"text","content":"{{cta}}","x":150,"y":1572,"width":780,"height":62,
        "fontSize":42,"fontWeight":"bold","color":"{{brandColor}}","align":"center","direction":"rtl",
        "safeMargin":True,"editable":True,"animationIn":{"type":"fadeIn","duration":0.5,"delay":4.5}},
     ]},
  ]
})

# ──────────────────────────────────────────────────────────────────
# Write all templates + SVG thumbnails
# ──────────────────────────────────────────────────────────────────

ALL = [
  ramadan, startup_pitch, tutorial, flash_sale, review,
  sports, cinematic_quote, team_intro, story_arc, fashion,
  captions_neon, captions_kinetic, captions_minimal,
  captions_broadcast, captions_gradient, captions_typewriter,
]

# Color lookup for SVG (first scene background or fallback)
PALETTE = {
  "ramadan-greeting": ("#0d0a1e","#d4af37"),
  "startup-pitch": ("#0b0b1a","#6c63ff"),
  "tutorial-how-to": ("#050f0a","#10b981"),
  "flash-sale": ("#0f0202","#ef4444"),
  "review-verdict": ("#0a0805","#f59e0b"),
  "sports-energy": ("#0a0202","#ef4444"),
  "cinematic-quote": ("#050408","#a78bfa"),
  "team-intro-card": ("#030811","#3b82f6"),
  "story-arc": ("#0a080d","#8b5cf6"),
  "fashion-editorial": ("#080604","#d4af37"),
  "captions-neon-pop": ("#060606","#39ff14"),
  "captions-bold-kinetic": ("#050505","#facc15"),
  "captions-minimal-pill": ("#000000","#ffffff"),
  "captions-broadcast": ("#0a0a0a","#dc2626"),
  "captions-gradient-glow": ("#060409","#a78bfa"),
  "captions-typewriter": ("#050505","#8ef7c2"),
}

def make_svg(tid, bg, accent, label, scenes):
    """Generate a compact SVG thumbnail (270×480)."""
    sw, sh = 270, 480
    scene_colors = ["#7ef2bc","#a78bfa","#fbbf24","#60a5fa","#fb7185","#34d399","#fb923c","#c084fc"]
    n = len(scenes)
    bar_h = 28
    bar_y = sh - bar_h - 8
    # scene strip
    strips = ""
    for i, sc in enumerate(scenes):
        sw_frac = sc.get("duration", 5) / max(sum(s.get("duration",5) for s in scenes), 1)
        bw = int(sw_frac * (sw - 16))
        bx = 8 + int(sum(s.get("duration",5) for s in scenes[:i]) / max(sum(s.get("duration",5) for s in scenes),1) * (sw-16))
        col = scene_colors[i % len(scene_colors)]
        strips += f'<rect x="{bx}" y="{bar_y}" width="{bw-2}" height="{bar_h-4}" rx="4" fill="{col}" opacity="0.85"/>'

    short = label[:18]
    return textwrap.dedent(f"""\
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {sw} {sh}" width="{sw}" height="{sh}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="{bg}"/>
          <stop offset="100%" stop-color="#000000"/>
        </linearGradient>
      </defs>
      <rect width="{sw}" height="{sh}" rx="8" fill="url(#g)"/>
      <!-- glow orb -->
      <circle cx="{sw//2}" cy="{sh//2-40}" r="90" fill="{accent}" opacity="0.10"/>
      <!-- accent top bar -->
      <rect x="12" y="12" width="80" height="3" rx="2" fill="{accent}" opacity="0.7"/>
      <!-- template id label -->
      <text x="{sw//2}" y="{sh//2 - 60}" font-family="sans-serif" font-size="13" font-weight="bold"
            fill="{accent}" text-anchor="middle" opacity="0.9">{short}</text>
      <!-- scene count -->
      <text x="{sw//2}" y="{sh//2}" font-family="sans-serif" font-size="40" font-weight="bold"
            fill="white" text-anchor="middle" opacity="0.95">{n}</text>
      <text x="{sw//2}" y="{sh//2 + 30}" font-family="sans-serif" font-size="12"
            fill="white" text-anchor="middle" opacity="0.5">{'scene' if n==1 else 'scenes'}</text>
      <!-- scene timeline strip -->
      {strips}
      <!-- border -->
      <rect width="{sw}" height="{sh}" rx="8" fill="none" stroke="{accent}" stroke-width="1" opacity="0.25"/>
    </svg>
    """)

created = 0
for tpl in ALL:
    tid = tpl["id"]
    folder = os.path.join(BASE, tid)
    os.makedirs(folder, exist_ok=True)
    # Write JSON
    with open(os.path.join(folder, "template.json"), "w", encoding="utf-8") as f:
        json.dump(tpl, f, ensure_ascii=False, indent=2)
    # Write SVG thumbnail + preview
    bg, accent = PALETTE.get(tid, ("#0a0a0a","#8ef7c2"))
    scenes = tpl.get("scenes", [])
    label = tpl.get("name","")
    svg = make_svg(tid, bg, accent, label, scenes)
    with open(os.path.join(folder, "thumbnail.svg"), "w") as f:
        f.write(svg)
    with open(os.path.join(folder, "preview.svg"), "w") as f:
        f.write(svg)
    created += 1
    print(f"  ✓  {tid}  ({len(scenes)} scenes)")

print(f"\nDone — {created} templates created.")
