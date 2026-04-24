import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ml import TutorSentiment
from app.models.review import Review

logger = logging.getLogger(__name__)

_model = None
_tokenizer = None


def _load_model():
    global _model, _tokenizer
    if _model is not None:
        return
    try:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModelForSequenceClassification.from_pretrained(model_name)
        logger.info("DistilBERT sentiment model loaded")
    except Exception as e:
        logger.warning("Could not load sentiment model: %s", e)


def analyze_sentiment(text: str) -> float:
    _load_model()
    if _model is None or _tokenizer is None:
        return 0.5

    try:
        import torch

        inputs = _tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = _model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        return float(probs[0][1])
    except Exception as e:
        logger.error("Sentiment analysis failed: %s", e)
        return 0.5


async def compute_tutor_sentiment(
    db: AsyncSession, tutor_id
) -> TutorSentiment | None:
    result = await db.execute(
        select(Review).where(
            Review.tutor_id == tutor_id,
            Review.is_deleted == False,
        )
    )
    reviews = result.scalars().all()
    if not reviews:
        return None

    scores = [analyze_sentiment(r.text) for r in reviews]
    avg_score = sum(scores) / len(scores)

    if avg_score > 0.7:
        summary = "Students consistently praise this tutor's teaching quality."
    elif avg_score > 0.5:
        summary = "Students generally have positive experiences with this tutor."
    elif avg_score > 0.3:
        summary = "Student feedback is mixed for this tutor."
    else:
        summary = "Some students have raised concerns about their experience."

    existing = await db.execute(
        select(TutorSentiment).where(TutorSentiment.tutor_id == tutor_id)
    )
    sentiment = existing.scalar_one_or_none()
    if sentiment:
        sentiment.summary_text = summary
        sentiment.sentiment_score = round(avg_score, 4)
        sentiment.review_count = len(reviews)
        sentiment.last_computed_at = datetime.now(timezone.utc)
    else:
        sentiment = TutorSentiment(
            tutor_id=tutor_id,
            summary_text=summary,
            sentiment_score=round(avg_score, 4),
            review_count=len(reviews),
            last_computed_at=datetime.now(timezone.utc),
        )
        db.add(sentiment)

    await db.flush()
    return sentiment
