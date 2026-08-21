from google import genai
import os
from dotenv import load_dotenv
import json
import re

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# =========================
# GENERATE RULES
# =========================
def generate_rules(description: str):

    prompt = f"""
    Convert this government project description into strict compliance rules.

    Description:
    {description}

    Return bullet points only. No markdown, no code fences, no explanation.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw = response.text.strip()

        raw = re.sub(r"^```(?:\w+)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        return raw

    except Exception as e:
        print("⚠️ Rule generation failed:", e)

        return """
        - Use certified materials
        - Follow safety standards
        - Maintain quality compliance
        - Stay within budget
        """


# =========================
# EVALUATE MILESTONE
# =========================
def evaluate_milestone(rules: str, milestone: str):

    prompt = f"""
    You are a strict but practical compliance AI.

    Rules:
    {rules}

    Milestone:
    {milestone}

    Scoring Guidelines:
    - 75 to 100 → APPROVED
    - 50 to 74 → REVIEW
    - Below 50 → REJECTED
    - Score MUST be between 0 and 100

    Return ONLY raw JSON:
    {{
      "score": number,
      "verdict": "APPROVED | REVIEW | REJECTED",
      "summary": "",
      "issues": [],
      "suggestions": [],
      "flags": []
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw = response.text.strip()

        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        start = raw.find("{")
        end = raw.rfind("}") + 1
        clean_json = raw[start:end]

        result = json.loads(clean_json)

        # =========================
        # SCORE NORMALIZATION
        # =========================
        try:
            score = float(result.get("score", 50))

            if 0 <= score <= 1:
                score *= 100

            if score > 100:
                score = 100

            if score < 0:
                score = 0

            score = round(score, 2)
        except:
            score = 50

        result["score"] = score

        # =========================
        # 🔥 AI → AUDITOR DECISION
        # =========================
        verdict = result.get("verdict", "REVIEW")

        if verdict == "APPROVED":
            recommendation = "ACCEPT"
        elif verdict == "REJECTED":
            recommendation = "FLAG"
        else:
            recommendation = "ACCEPT" if score >= 65 else "FLAG"

        # Confidence (scaled properly)
        confidence = int(min(100, max(50, score)))

        # Better reasoning (dynamic)
        if recommendation == "ACCEPT":
            reason = "AI analysis indicates sufficient compliance with minor or no risks."
        else:
            reason = "AI detected significant compliance gaps that require attention."

        # Attach fields
        result["auditor_recommendation"] = recommendation
        result["confidence"] = confidence
        result["reason"] = reason

        # Ensure fields
        result.setdefault("summary", "")
        result.setdefault("issues", [])
        result.setdefault("suggestions", [])
        result.setdefault("flags", [])

        return result

    except Exception as e:
        print("⚠️ AI evaluation failed:", e)

        return {
            "score": 50,
            "verdict": "REVIEW",
            "summary": "AI unavailable",
            "issues": ["AI service unavailable"],
            "suggestions": [],
            "flags": ["AI_FALLBACK"],
            "auditor_recommendation": "FLAG",
            "confidence": 50,
            "reason": "AI unavailable, manual review required"
        }