from typing import List, Dict
import re


def _tokenize(text: str) -> List[str]:
    text = (text or "").lower()
    # simple tokenization: words of length >=2
    return re.findall(r"\b[a-z]{2,}\b", text)


class SimpleNaiveBayes:
    def __init__(self):
        self.class_word_counts: Dict[str, Dict[str, int]] = {}
        self.class_totals: Dict[str, int] = {}
        self.class_priors: Dict[str, float] = {}
        self.vocab: Dict[str, int] = {}

    def train(self, examples: List[Dict[str, str]]):
        # examples: list of {"text": ..., "label": ...}
        for ex in examples:
            label = ex["label"]
            text = ex["text"]
            if label not in self.class_word_counts:
                self.class_word_counts[label] = {}
                self.class_totals[label] = 0
            tokens = _tokenize(text)
            for t in tokens:
                self.vocab[t] = 1
                self.class_word_counts[label][t] = self.class_word_counts[label].get(t, 0) + 1
                self.class_totals[label] += 1

        # priors (uniform over labels present)
        total_labels = sum(self.class_totals.values())
        for label in self.class_totals:
            # prior proportional to total words seen for label (simple heuristic)
            self.class_priors[label] = float(self.class_totals[label]) / max(1, total_labels)

    def classify(self, text: str) -> str:
        tokens = _tokenize(text)
        if not tokens:
            # fallback to Inbox when nothing to go on
            return "Inbox"

        V = max(1, len(self.vocab))
        best_label = None
        best_score = None
        for label, word_counts in self.class_word_counts.items():
            # start with log prior
            import math

            score = math.log(self.class_priors.get(label, 1e-6)) if self.class_priors.get(label) else 0.0
            total = self.class_totals.get(label, 0)
            for t in tokens:
                count = word_counts.get(t, 0)
                # Laplace smoothing
                prob = (count + 1) / (total + V)
                score += math.log(prob)

            if best_score is None or score > best_score:
                best_score = score
                best_label = label

        return best_label or "Inbox"


# build a small, conservative training set to bootstrap classification
_TRAINING_SET = [
    # University
    {"text": "Course registration update from admissions@university.edu", "label": "University"},
    {"text": "Assignment deadline reminder professor@college.edu", "label": "University"},
    {"text": "Lecture notes and syllabus from csdept@university.edu", "label": "University"},

    # Promotions
    {"text": "Big sale - save 50% off our new products newsletter@shop.com", "label": "Promotions"},
    {"text": "Limited time offer: discount code inside deals@store.com", "label": "Promotions"},
    {"text": "Your coupon is waiting - exclusive offer marketing@brand.com", "label": "Promotions"},

    # Spam
    {"text": "You are a winner! Claim your prize now spam@scam.com", "label": "Spam"},
    {"text": "Congratulations, you've won free money winner@lottery.com", "label": "Spam"},
    {"text": "Unsubscribe here: unwanted@ads.com", "label": "Spam"},

    # Important
    {"text": "Invoice due payment required billing@service.com", "label": "Important"},
    {"text": "Urgent: action required regarding your account support@bank.com", "label": "Important"},
    {"text": "Follow up: meeting time changed from manager@company.com", "label": "Important"},

    # Inbox (neutral examples)
    {"text": "Hello from a friend friend@example.com", "label": "Inbox"},
    {"text": "Weekly update from team team@work.com", "label": "Inbox"},
]


_CLASSIFIER = SimpleNaiveBayes()
_CLASSIFIER.train(_TRAINING_SET)


def classify_texts(texts: List[str]) -> List[str]:
    return [_CLASSIFIER.classify(t) for t in texts]


def classify_emails_payload(emails: List[Dict[str, str]]) -> List[Dict[str, str]]:
    texts = [(e.get("subject", "") + " " + e.get("sender", "")) for e in emails]
    labels = classify_texts(texts)
    return [{"id": emails[i].get("id"), "category": labels[i]} for i in range(len(emails))]
