import os
from flask import Blueprint, request, jsonify
from utils import load_json, save_json

milestone_bp = Blueprint("milestones", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(BASE_DIR, "../data/milestones.json")

# ─────────────────────────────────────────────────────────────
# CDC-aligned developmental milestones by age group
# Each milestone: {id, age_months, category, text}
# ─────────────────────────────────────────────────────────────
MILESTONE_DEFINITIONS = [
    # ── 2 Months ─────────────────────────────────────────────
    {"id": "2m_soc_1", "age_months": 2, "category": "social",    "text": "Begins to smile at people"},
    {"id": "2m_soc_2", "age_months": 2, "category": "social",    "text": "Tries to look at parent; briefly calms when spoken to"},
    {"id": "2m_lang_1","age_months": 2, "category": "language",   "text": "Makes cooing, gurgling sounds"},
    {"id": "2m_lang_2","age_months": 2, "category": "language",   "text": "Turns head toward sounds"},
    {"id": "2m_cog_1", "age_months": 2, "category": "cognitive",  "text": "Pays attention to faces"},
    {"id": "2m_cog_2", "age_months": 2, "category": "cognitive",  "text": "Begins to follow things with eyes"},
    {"id": "2m_mov_1", "age_months": 2, "category": "movement",   "text": "Can hold head up during tummy time"},
    {"id": "2m_mov_2", "age_months": 2, "category": "movement",   "text": "Makes smoother movements with arms and legs"},

    # ── 4 Months ─────────────────────────────────────────────
    {"id": "4m_soc_1", "age_months": 4, "category": "social",    "text": "Smiles spontaneously, especially at people"},
    {"id": "4m_soc_2", "age_months": 4, "category": "social",    "text": "Likes to play with people; may cry when playing stops"},
    {"id": "4m_lang_1","age_months": 4, "category": "language",   "text": "Begins to babble; babbles with expression"},
    {"id": "4m_lang_2","age_months": 4, "category": "language",   "text": "Cries in different ways to show hunger, pain, or tiredness"},
    {"id": "4m_cog_1", "age_months": 4, "category": "cognitive",  "text": "Lets you know if happy or sad"},
    {"id": "4m_cog_2", "age_months": 4, "category": "cognitive",  "text": "Responds to affection"},
    {"id": "4m_mov_1", "age_months": 4, "category": "movement",   "text": "Holds head steady without support"},
    {"id": "4m_mov_2", "age_months": 4, "category": "movement",   "text": "Pushes down on legs when feet are on a hard surface"},

    # ── 6 Months ─────────────────────────────────────────────
    {"id": "6m_soc_1", "age_months": 6, "category": "social",    "text": "Knows familiar faces; recognizes strangers"},
    {"id": "6m_soc_2", "age_months": 6, "category": "social",    "text": "Likes to play with others, especially parents"},
    {"id": "6m_lang_1","age_months": 6, "category": "language",   "text": "Responds to own name"},
    {"id": "6m_lang_2","age_months": 6, "category": "language",   "text": "Responds to sounds by making sounds"},
    {"id": "6m_cog_1", "age_months": 6, "category": "cognitive",  "text": "Looks around at things nearby"},
    {"id": "6m_cog_2", "age_months": 6, "category": "cognitive",  "text": "Brings things to mouth; shows curiosity"},
    {"id": "6m_mov_1", "age_months": 6, "category": "movement",   "text": "Rolls over in both directions"},
    {"id": "6m_mov_2", "age_months": 6, "category": "movement",   "text": "Begins to sit without support"},

    # ── 9 Months ─────────────────────────────────────────────
    {"id": "9m_soc_1", "age_months": 9, "category": "social",    "text": "May be afraid of strangers"},
    {"id": "9m_soc_2", "age_months": 9, "category": "social",    "text": "May be clingy with familiar adults"},
    {"id": "9m_lang_1","age_months": 9, "category": "language",   "text": "Understands 'no'"},
    {"id": "9m_lang_2","age_months": 9, "category": "language",   "text": "Makes a lot of different sounds like 'mamamama' and 'babababa'"},
    {"id": "9m_cog_1", "age_months": 9, "category": "cognitive",  "text": "Watches the path of a falling object"},
    {"id": "9m_cog_2", "age_months": 9, "category": "cognitive",  "text": "Looks for things they see you hide"},
    {"id": "9m_mov_1", "age_months": 9, "category": "movement",   "text": "Stands holding on; can pull to stand"},
    {"id": "9m_mov_2", "age_months": 9, "category": "movement",   "text": "Sits without support"},

    # ── 12 Months ────────────────────────────────────────────
    {"id": "12m_soc_1","age_months": 12, "category": "social",   "text": "Is shy or nervous with strangers"},
    {"id": "12m_soc_2","age_months": 12, "category": "social",   "text": "Has favorite things and people; shows fear in some situations"},
    {"id": "12m_lang_1","age_months":12, "category": "language",  "text": "Responds to simple spoken requests"},
    {"id": "12m_lang_2","age_months":12, "category": "language",  "text": "Says 'mama' and 'dada' and exclamations like 'uh-oh!'"},
    {"id": "12m_cog_1","age_months": 12, "category": "cognitive", "text": "Explores things in different ways (shaking, banging, throwing)"},
    {"id": "12m_cog_2","age_months": 12, "category": "cognitive", "text": "Finds hidden things easily"},
    {"id": "12m_mov_1","age_months": 12, "category": "movement",  "text": "Gets to a sitting position without help"},
    {"id": "12m_mov_2","age_months": 12, "category": "movement",  "text": "Pulls up to stand; walks holding on to furniture"},

    # ── 18 Months ────────────────────────────────────────────
    {"id": "18m_soc_1","age_months": 18, "category": "social",   "text": "Likes to hand things to others as play"},
    {"id": "18m_soc_2","age_months": 18, "category": "social",   "text": "May have temper tantrums; may be afraid of strangers"},
    {"id": "18m_soc_3","age_months": 18, "category": "social",   "text": "Shows affection to familiar people"},
    {"id": "18m_lang_1","age_months":18, "category": "language",  "text": "Says several single words"},
    {"id": "18m_lang_2","age_months":18, "category": "language",  "text": "Points to show others something interesting"},
    {"id": "18m_lang_3","age_months":18, "category": "language",  "text": "Points to one body part when asked"},
    {"id": "18m_cog_1","age_months": 18, "category": "cognitive", "text": "Knows what ordinary things are for (phone, brush, spoon)"},
    {"id": "18m_cog_2","age_months": 18, "category": "cognitive", "text": "Points to get the attention of others"},
    {"id": "18m_mov_1","age_months": 18, "category": "movement",  "text": "Walks alone"},
    {"id": "18m_mov_2","age_months": 18, "category": "movement",  "text": "May walk up steps and run"},
    {"id": "18m_mov_3","age_months": 18, "category": "movement",  "text": "Drinks from a cup; eats with a spoon"},

    # ── 24 Months ────────────────────────────────────────────
    {"id": "24m_soc_1","age_months": 24, "category": "social",   "text": "Copies others, especially adults and older children"},
    {"id": "24m_soc_2","age_months": 24, "category": "social",   "text": "Shows more independence; gets excited around other children"},
    {"id": "24m_soc_3","age_months": 24, "category": "social",   "text": "Plays mainly beside other children (parallel play)"},
    {"id": "24m_lang_1","age_months":24, "category": "language",  "text": "Points to things or pictures when named"},
    {"id": "24m_lang_2","age_months":24, "category": "language",  "text": "Knows names of familiar people and body parts"},
    {"id": "24m_lang_3","age_months":24, "category": "language",  "text": "Says sentences with 2 to 4 words"},
    {"id": "24m_cog_1","age_months": 24, "category": "cognitive", "text": "Finds hidden objects under multiple layers"},
    {"id": "24m_cog_2","age_months": 24, "category": "cognitive", "text": "Begins to sort shapes and colors"},
    {"id": "24m_mov_1","age_months": 24, "category": "movement",  "text": "Stands on tiptoe; kicks a ball"},
    {"id": "24m_mov_2","age_months": 24, "category": "movement",  "text": "Begins to run; climbs on furniture without help"},

    # ── 36 Months (3 years) ──────────────────────────────────
    {"id": "36m_soc_1","age_months": 36, "category": "social",   "text": "Copies adults and friends"},
    {"id": "36m_soc_2","age_months": 36, "category": "social",   "text": "Shows concern for a crying friend"},
    {"id": "36m_soc_3","age_months": 36, "category": "social",   "text": "Takes turns in games; understands 'mine' and 'theirs'"},
    {"id": "36m_lang_1","age_months":36, "category": "language",  "text": "Follows 2- or 3-step instructions"},
    {"id": "36m_lang_2","age_months":36, "category": "language",  "text": "Can name most familiar things; says first name, age, and sex"},
    {"id": "36m_lang_3","age_months":36, "category": "language",  "text": "Carries on a conversation using 2 to 3 sentences"},
    {"id": "36m_cog_1","age_months": 36, "category": "cognitive", "text": "Can work toys with buttons, levers, and moving parts"},
    {"id": "36m_cog_2","age_months": 36, "category": "cognitive", "text": "Plays make-believe with dolls, animals, and people"},
    {"id": "36m_mov_1","age_months": 36, "category": "movement",  "text": "Climbs well; runs easily"},
    {"id": "36m_mov_2","age_months": 36, "category": "movement",  "text": "Pedals a tricycle"},

    # ── 48 Months (4 years) ──────────────────────────────────
    {"id": "48m_soc_1","age_months": 48, "category": "social",   "text": "Enjoys doing new things; cooperates with other children"},
    {"id": "48m_soc_2","age_months": 48, "category": "social",   "text": "Plays 'Mom' and 'Dad'; increasingly inventive in fantasy play"},
    {"id": "48m_lang_1","age_months":48, "category": "language",  "text": "Knows some basic rules of grammar ('he' and 'she' correctly)"},
    {"id": "48m_lang_2","age_months":48, "category": "language",  "text": "Sings a song or says a poem from memory"},
    {"id": "48m_lang_3","age_months":48, "category": "language",  "text": "Tells stories; can say first and last name"},
    {"id": "48m_cog_1","age_months": 48, "category": "cognitive", "text": "Understands the idea of counting; knows some numbers"},
    {"id": "48m_cog_2","age_months": 48, "category": "cognitive", "text": "Starts to understand time ('yesterday', 'tomorrow')"},
    {"id": "48m_mov_1","age_months": 48, "category": "movement",  "text": "Hops and stands on one foot for up to 2 seconds"},
    {"id": "48m_mov_2","age_months": 48, "category": "movement",  "text": "Catches a bounced ball most of the time"},

    # ── 60 Months (5 years) ──────────────────────────────────
    {"id": "60m_soc_1","age_months": 60, "category": "social",   "text": "Wants to please friends; wants to be like friends"},
    {"id": "60m_soc_2","age_months": 60, "category": "social",   "text": "More likely to agree with rules; likes to sing, dance, and act"},
    {"id": "60m_soc_3","age_months": 60, "category": "social",   "text": "Is aware of gender; can distinguish real from make-believe"},
    {"id": "60m_lang_1","age_months":60, "category": "language",  "text": "Speaks very clearly; tells a simple story using full sentences"},
    {"id": "60m_lang_2","age_months":60, "category": "language",  "text": "Uses future tense; says name and address"},
    {"id": "60m_cog_1","age_months": 60, "category": "cognitive", "text": "Can count 10 or more things"},
    {"id": "60m_cog_2","age_months": 60, "category": "cognitive", "text": "Draws a person with at least 6 body parts"},
    {"id": "60m_cog_3","age_months": 60, "category": "cognitive", "text": "Can print some letters or numbers"},
    {"id": "60m_mov_1","age_months": 60, "category": "movement",  "text": "Stands on one foot for 10 seconds or longer"},
    {"id": "60m_mov_2","age_months": 60, "category": "movement",  "text": "Can do a somersault; uses a fork and spoon and sometimes a knife"},
]


# ── GET milestone defaults ────────────────────────────────────
@milestone_bp.route("/api/milestones/defaults", methods=["GET"])
def get_defaults():
    return jsonify({"milestones": MILESTONE_DEFINITIONS}), 200


# ── GET user milestone data ───────────────────────────────────
@milestone_bp.route("/api/milestones", methods=["GET"])
def get_milestones():
    email = request.args.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    records = load_json(FILE)
    user_data = next((r for r in records if r["email"] == email), None)

    if not user_data:
        return jsonify({
            "email": email,
            "child_name": "",
            "child_dob": "",
            "milestones": {},
            "definitions": MILESTONE_DEFINITIONS
        }), 200

    user_data["definitions"] = MILESTONE_DEFINITIONS
    return jsonify(user_data), 200


# ── POST save milestone data ─────────────────────────────────
@milestone_bp.route("/api/milestones", methods=["POST"])
def save_milestones():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        email = data.get("email", "").strip().lower()
        if not email:
            return jsonify({"error": "Email is required."}), 400

        records = load_json(FILE)
        existing = next((r for r in records if r["email"] == email), None)

        entry = {
            "email": email,
            "child_name": data.get("child_name", ""),
            "child_dob": data.get("child_dob", ""),
            "milestones": data.get("milestones", {})
            # milestones = { "2m_soc_1": {"status": "achieved", "date": "...", "notes": "..."}, ... }
        }

        if existing:
            idx = records.index(existing)
            records[idx] = entry
        else:
            records.append(entry)

        save_json(FILE, records)
        return jsonify({"message": "Milestones saved", "email": email}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error."}), 500
