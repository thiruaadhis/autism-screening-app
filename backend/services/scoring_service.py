# =============================================================================
# MEDZILLA — Clinical Scoring Engine
# =============================================================================
# DSM-5 aligned scoring pipeline with reverse scoring, critical flag
# escalation, and sub-domain segmentation.
# =============================================================================

# --- Questionnaire Constants ---
TOTAL_QUESTIONS = 30
MAX_ANSWER_VALUE = 4
SOCIAL_DOMAIN_CUTOFF = 15  # Questions 0-14 = Social Communication, 15-29 = Behavioral

# --- Reverse Scoring Matrix ---
# Answering "Never" (0) on these questions means HIGH likelihood (4 points).
REVERSE_SCORED_QUESTIONS = {
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 18
}

# --- Clinical Red Flags (Escalation Matrix) ---
CRITICAL_QUESTIONS = {0, 1, 4, 20}
WEIGHT_MULTIPLIER = 1.5
CRITICAL_FLAG_THRESHOLD_SCORE = 3  # Scored "Often" or "Always" on a critical item

# --- Interpretation Thresholds ---
HIGH_THRESHOLD = 70
MODERATE_THRESHOLD = 35
HIGH_CRITICAL_FLAG_COUNT = 3
MODERATE_CRITICAL_FLAG_COUNT = 1

# --- Age-Based Adjustment (in months) ---
# Younger children showing flagged behaviors are at higher developmental risk.
AGE_ADJUSTMENTS = [
    (24,  1.08),   # Under 2 years:  +8% sensitivity boost
    (48,  1.04),   # 2-4 years:      +4% boost (toddler peak window)
    (96,  1.00),   # 4-8 years:      baseline
    (216, 0.97),   # 8-18 years:     -3% (older children have more coping)
]


def calculate_score(answers, age_months=None):
    """
    Process a list of 30 integer answers (0-4) through the full clinical
    scoring pipeline.

    Returns a dict with: likelihood, social_percent, behavioral_percent,
    critical_flags, and interpretation.
    """
    total_score = 0
    max_possible_score = 0
    critical_flags_triggered = 0

    # DSM-5 Sub-Domain Tracking
    social_score = 0
    social_max = 0
    behavioral_score = 0
    behavioral_max = 0

    for i, answer in enumerate(answers):
        # 1. Reverse Scoring
        if i in REVERSE_SCORED_QUESTIONS:
            base_score = MAX_ANSWER_VALUE - answer
        else:
            base_score = answer

        # 2. Critical Red Flag Tracking
        is_critical = i in CRITICAL_QUESTIONS
        if is_critical and base_score >= CRITICAL_FLAG_THRESHOLD_SCORE:
            critical_flags_triggered += 1

        weight = WEIGHT_MULTIPLIER if is_critical else 1.0
        final_score = base_score * weight
        max_q_score = MAX_ANSWER_VALUE * weight

        total_score += final_score
        max_possible_score += max_q_score

        # 3. Sub-domain Allocation
        if i < SOCIAL_DOMAIN_CUTOFF:
            social_score += final_score
            social_max += max_q_score
        else:
            behavioral_score += final_score
            behavioral_max += max_q_score

    # 4. Calculate Raw Percentages
    likelihood = (total_score / max_possible_score) * 100 if max_possible_score > 0 else 0
    social_percent = (social_score / social_max) * 100 if social_max > 0 else 0
    behavioral_percent = (behavioral_score / behavioral_max) * 100 if behavioral_max > 0 else 0

    # 4b. Age-Based Adjustment
    if age_months is not None and isinstance(age_months, (int, float)) and age_months > 0:
        multiplier = AGE_ADJUSTMENTS[-1][1]  # default to oldest bracket
        for threshold_months, adj in AGE_ADJUSTMENTS:
            if age_months <= threshold_months:
                multiplier = adj
                break
        likelihood = min(likelihood * multiplier, 100.0)

    # 5. Escalation Matrix (The False-Positive Fix)
    # Blend the raw percentage with critical flags for clinical accuracy.
    if likelihood >= HIGH_THRESHOLD or critical_flags_triggered >= HIGH_CRITICAL_FLAG_COUNT:
        interpretation = ("High likelihood. Significant developmental markers were flagged. "
                          "A formal evaluation by a specialist is strongly recommended.")
        likelihood = max(likelihood, float(HIGH_THRESHOLD))

    elif likelihood >= MODERATE_THRESHOLD or critical_flags_triggered >= MODERATE_CRITICAL_FLAG_COUNT:
        interpretation = ("Moderate likelihood. Some specific behaviors were flagged. "
                          "It is recommended to consult a developmental pediatrician for a follow-up.")
        likelihood = max(likelihood, float(MODERATE_THRESHOLD))

    else:
        interpretation = ("Low likelihood, but consider monitoring and consulting a "
                          "healthcare professional if concerns persist.")

    return {
        "likelihood": round(likelihood, 2),
        "social_percent": round(social_percent, 2),
        "behavioral_percent": round(behavioral_percent, 2),
        "critical_flags": critical_flags_triggered,
        "interpretation": interpretation
    }
