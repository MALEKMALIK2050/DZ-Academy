import React, { useState, useEffect, useMemo } from "react";

function parseQuestionData(support) {
  if (!support) return null;
  try {
    return typeof support.contenu === "string" ? JSON.parse(support.contenu) : (support.contenu || {});
  } catch (_) {
    return {
      questionType: "QCM",
      texte: support?.nom || "سؤال",
      choix: [],
      reponse: "",
    };
  }
}

function getInitialOrdering(qData) {
  if (!qData) return [];
  let items = [];
  if (Array.isArray(qData.choix) && qData.choix.length > 0) {
    items = [...qData.choix];
  } else if (typeof qData.choix === "string") {
    try {
      const parsed = JSON.parse(qData.choix);
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    } catch (_) {
      items = qData.choix.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  if (items.length === 0) {
    try {
      const rep = Array.isArray(qData.reponse) ? qData.reponse : JSON.parse(qData.reponse || "[]");
      if (Array.isArray(rep) && rep.length > 0) {
        items = [...rep].sort(() => Math.random() - 0.5);
      }
    } catch (_) {}
  }
  return items;
}

function getQuestionOrdinal(num) {
  switch (num) {
    case 1:
      return "السؤال التقييمي الأول";
    case 2:
      return "السؤال التقييمي الثاني";
    case 3:
      return "السؤال التقييمي الثالث";
    case 4:
      return "السؤال التقييمي الرابع";
    case 5:
      return "السؤال التقييمي الخامس";
    case 6:
      return "السؤال التقييمي السادس";
    case 7:
      return "السؤال التقييمي السابع";
    case 8:
      return "السؤال التقييمي الثامن";
    case 9:
      return "السؤال التقييمي التاسع";
    case 10:
      return "السؤال التقييمي العاشر";
    default:
      return `السؤال التقييمي رقم ${num}`;
  }
}

function getQuestionTypeLabel(type) {
  switch (type) {
    case "QCM":
      return "اختيار من متعدد — إجابة واحدة";
    case "QCM_MULTIPLE":
      return "اختيار متعدد — عدة إجابات صحيحة";
    case "VRAI_FAUX":
      return "صحيح / خطأ";
    case "OUVERTE":
      return "سؤال مفتوح";
    case "GAP":
      return "ملء الفراغات";
    case "MATCHING":
      return "ربط ومطابقة";
    case "ORDERING":
      return "ترتيب تسلسلي";
    default:
      return "سؤال تكويني";
  }
}

export default function SupportQuestionCard({
  support,
  onContinue,
  isTeacher = false,
  questionNumber = 1,
  defaultOpen = false,
}) {
  const qData = useMemo(() => parseQuestionData(support), [support?.contenu, support?.nom]);
  const questionType = qData?.questionType || "QCM";
  const points = qData?.points || 1;
  const explication = qData?.explication || "";

  // حالة الأكورديون
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // إجابات الطالب
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedMulti, setSelectedMulti] = useState([]);
  const [openAnswer, setOpenAnswer] = useState("");
  const [gapAnswers, setGapAnswers] = useState(() => {
    if (questionType === "GAP") {
      const gapsCount = (qData?.texte?.match(/\[(?:trou|فراغ)\]/gi) || []).length;
      return new Array(gapsCount || 1).fill("");
    }
    return [];
  });
  const [matchingAnswers, setMatchingAnswers] = useState({});
  const [orderingItems, setOrderingItems] = useState(() => getInitialOrdering(qData));

  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // تهيئة عند تغيير الدعامة أو نوع السؤال فقط
  useEffect(() => {
    if (questionType === "ORDERING") {
      setOrderingItems(getInitialOrdering(qData));
    } else if (questionType === "GAP") {
      const gapsCount = (qData?.texte?.match(/\[(?:trou|فراغ)\]/gi) || []).length;
      setGapAnswers(new Array(gapsCount || 1).fill(""));
    }
    setSelectedOption("");
    setSelectedMulti([]);
    setOpenAnswer("");
    setMatchingAnswers({});
    setSubmitted(false);
    setIsCorrect(false);
  }, [support?.id, questionType]);

  // التصحيح والتقييم الذاتي
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    let correct = false;

    if (questionType === "QCM") {
      correct = selectedOption.trim() === String(qData.reponse).trim();
    } else if (questionType === "VRAI_FAUX") {
      const rep = String(qData.reponse).trim();
      const sel = selectedOption.trim();
      correct =
        sel === rep ||
        (sel === "صحيح" && (rep === "Vrai" || rep === "true" || rep === "صحيح")) ||
        (sel === "خطأ" && (rep === "Faux" || rep === "false" || rep === "خطأ"));
    } else if (questionType === "QCM_MULTIPLE") {
      try {
        const correctList = Array.isArray(qData.reponse)
          ? qData.reponse
          : JSON.parse(qData.reponse || "[]");
        const s1 = [...selectedMulti].sort().join("||");
        const s2 = [...correctList].sort().join("||");
        correct = s1 === s2;
      } catch (_) {
        correct = false;
      }
    } else if (questionType === "OUVERTE") {
      correct = openAnswer.trim().length >= 3;
    } else if (questionType === "GAP") {
      try {
        let correctList = [];
        if (Array.isArray(qData.reponse)) {
          correctList = qData.reponse;
        } else {
          try {
            correctList = JSON.parse(qData.reponse);
          } catch {
            correctList = String(qData.reponse || "").split(",").map((r) => r.trim());
          }
        }
        correct =
          gapAnswers.length > 0 &&
          gapAnswers.every(
            (ans, idx) => ans.trim().toLowerCase() === (correctList[idx] || "").trim().toLowerCase()
          );
      } catch (_) {
        correct = false;
      }
    } else if (questionType === "MATCHING") {
      try {
        const correctPairs =
          typeof qData.reponse === "object"
            ? qData.reponse
            : JSON.parse(qData.reponse || "{}");
        const keys = Object.keys(correctPairs);
        correct =
          keys.length > 0 &&
          keys.every((k) => (matchingAnswers[k] || "").trim() === (correctPairs[k] || "").trim());
      } catch (_) {
        correct = false;
      }
    } else if (questionType === "ORDERING") {
      try {
        let correctOrder = [];
        if (Array.isArray(qData.reponse)) {
          correctOrder = qData.reponse;
        } else if (typeof qData.reponse === "string") {
          try {
            correctOrder = JSON.parse(qData.reponse);
          } catch {
            correctOrder = qData.reponse.split(",").map((s) => s.trim());
          }
        }

        correct =
          Array.isArray(correctOrder) &&
          correctOrder.length > 0 &&
          orderingItems.length === correctOrder.length &&
          orderingItems.every(
            (item, idx) => item.trim() === String(correctOrder[idx] || "").trim()
          );
      } catch (_) {
        correct = false;
      }
    }

    setIsCorrect(correct);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setSubmitted(false);
    setIsCorrect(false);
    setSelectedOption("");
    setSelectedMulti([]);
    setOpenAnswer("");
    if (questionType === "GAP") {
      const gapsCount = (qData?.texte?.match(/\[(?:trou|فراغ)\]/gi) || []).length;
      setGapAnswers(new Array(gapsCount || 1).fill(""));
    }
    if (questionType === "ORDERING") {
      setOrderingItems(getInitialOrdering(qData));
    }
  };

  // تحريك عناصر الترتيب
  const moveOrderingItem = (index, direction) => {
    if (submitted) return;
    setOrderingItems((prev) => {
      const newItems = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newItems.length) return prev;
      const temp = newItems[index];
      newItems[index] = newItems[targetIndex];
      newItems[targetIndex] = temp;
      return newItems;
    });
  };

  // عرض نص الفراغات
  const renderGapText = () => {
    const rawText = qData?.texte || "";
    const parts = rawText.split(/\[(?:trou|فراغ)\]/gi);

    return (
      <div className="gap-paragraph">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <input
                type="text"
                disabled={submitted}
                value={gapAnswers[index] || ""}
                onChange={(e) => {
                  const newAnswers = [...gapAnswers];
                  newAnswers[index] = e.target.value;
                  setGapAnswers(newAnswers);
                }}
                className="gap-input"
                placeholder={`فراغ ${index + 1}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const hasCustomNom =
    support.nom &&
    !support.nom.toLowerCase().startsWith("question") &&
    !support.nom.startsWith("سؤال");

  return (
    <div
      className={`support-question-card ${
        isOpen ? "card-open" : "card-closed"
      } ${submitted ? (isCorrect ? "card-correct" : "card-incorrect") : ""}`}
      dir="rtl"
    >
      {/* ── شريط رأس السؤال (أكورديون قابل للفتح والإغلاق) ── */}
      <div
        className="checkpoint-header"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        title={isOpen ? "اضغط لطي السؤال" : "اضغط لعرض السؤال"}
      >
        <div className="header-content">
          {/* سطر التصنيف والنقاط */}
          <div className="tag-row">
            <span className="checkpoint-badge">
              <span className="badge-icon">🎯</span> تقييم ذاتي : {getQuestionTypeLabel(questionType)}
            </span>
            <span className="points-pill">+{points} {points > 10 ? "نقطة" : points > 2 ? "نقاط" : "نقطة"}</span>
            {isTeacher && <span className="teacher-preview-pill">👁️ معاينة الأستاذ</span>}
          </div>

          {/* سطر العنوان والترتيب */}
          <div className="title-row">
            <h3 className="ordinal-heading">
              💡 {getQuestionOrdinal(questionNumber)}
              {hasCustomNom && <span className="custom-title"> — {support.nom}</span>}
            </h3>
          </div>

          {/* سطر التوجيهات / الحالة */}
          <div className="meta-row">
            <span className="eval-tagline">تحقق من استيعابك للمفاهيم في هذه المرحلة من الدرس</span>
            {!isOpen && !submitted && (
              <span className="cta-hint">👈 اضغط على الزر لعرض السؤال والإجابة</span>
            )}
            {!isOpen && submitted && (
              <span className="cta-hint">
                {isCorrect ? "✅ تم التحقق من الإجابة بنجاح" : "⚠️ إجابة غير صحيحة — اضغط للمراجعة"}
              </span>
            )}
          </div>
        </div>

        {/* زر التبديل / شارة الحالة */}
        <div className="header-action">
          {submitted ? (
            isCorrect ? (
              <span className="status-badge badge-success">
                ✅ إجابة صحيحة (+{points}) <span className="chevron">{isOpen ? "▲" : "▼"}</span>
              </span>
            ) : (
              <span className="status-badge badge-fail">
                ❌ بحاجة لمراجعة <span className="chevron">{isOpen ? "▲" : "▼"}</span>
              </span>
            )
          ) : (
            <button
              type="button"
              className={`toggle-button ${isOpen ? "btn-open" : "btn-closed"}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              {isOpen ? "إخفاء السؤال ▲" : "عرض السؤال التفاعلي ▼"}
            </button>
          )}
        </div>
      </div>

      {/* ── جسم السؤال (يظهر عند الفتح) ── */}
      {isOpen && (
        <div className="question-body">
          {/* نص السؤال أو البيان */}
          <div className="question-prompt">
            <h4>{qData?.texte}</h4>
          </div>

          {/* المنطقة التفاعلية حسب نوع السؤال */}
          <div className="interactive-content">
            {/* 1. QCM أو صحيح/خطأ */}
            {(questionType === "QCM" || questionType === "VRAI_FAUX") && (
              <div className="choices-grid">
                {(qData?.choix || (questionType === "VRAI_FAUX" ? ["صحيح", "خطأ"] : [])).map((choice, i) => {
                  const isSelected = selectedOption === choice;
                  let choiceClass = "";
                  if (submitted) {
                    const isAnsCorrect =
                      choice === qData.reponse ||
                      (choice === "صحيح" && (qData.reponse === "Vrai" || qData.reponse === "true")) ||
                      (choice === "خطأ" && (qData.reponse === "Faux" || qData.reponse === "false"));

                    if (isAnsCorrect) choiceClass = "choice-correct";
                    else if (isSelected && !isCorrect) choiceClass = "choice-wrong";
                  } else if (isSelected) {
                    choiceClass = "choice-selected";
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={submitted}
                      className={`choice-button ${choiceClass}`}
                      onClick={() => setSelectedOption(choice)}
                    >
                      <span className="choice-indicator">
                        {submitted ? (
                          choiceClass === "choice-correct" ? "✅" : isSelected ? "❌" : "○"
                        ) : isSelected ? "◉" : "○"}
                      </span>
                      <span className="choice-text">{choice}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. QCM متعدد */}
            {questionType === "QCM_MULTIPLE" && (
              <div className="choices-grid">
                {(qData?.choix || []).map((choice, i) => {
                  const isChecked = selectedMulti.includes(choice);
                  let multiClass = "";
                  let correctList = [];
                  try {
                    correctList = Array.isArray(qData.reponse) ? qData.reponse : JSON.parse(qData.reponse || "[]");
                  } catch (_) {}

                  if (submitted) {
                    if (correctList.includes(choice)) multiClass = "choice-correct";
                    else if (isChecked && !correctList.includes(choice)) multiClass = "choice-wrong";
                  } else if (isChecked) {
                    multiClass = "choice-selected";
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={submitted}
                      className={`choice-button ${multiClass}`}
                      onClick={() => {
                        if (submitted) return;
                        if (isChecked) setSelectedMulti(selectedMulti.filter((c) => c !== choice));
                        else setSelectedMulti([...selectedMulti, choice]);
                      }}
                    >
                      <span className="choice-indicator">{isChecked ? "☑" : "☐"}</span>
                      <span className="choice-text">{choice}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. سؤال مفتوح */}
            {questionType === "OUVERTE" && (
              <div className="open-question-box">
                <textarea
                  rows="4"
                  value={openAnswer}
                  onChange={(e) => setOpenAnswer(e.target.value)}
                  disabled={submitted}
                  placeholder="اكتب إجابتك هنا بتفصيل..."
                  className="open-textarea"
                />
              </div>
            )}

            {/* 4. ملء الفراغات */}
            {questionType === "GAP" && renderGapText()}

            {/* 5. ربط ومطابقة */}
            {questionType === "MATCHING" && (
              <div className="matching-grid">
                {Array.isArray(qData?.choix) &&
                  qData.choix.map((leftItem, i) => {
                    let rightOptions = [];
                    try {
                      const pairs = typeof qData.reponse === "object" ? qData.reponse : JSON.parse(qData.reponse || "{}");
                      rightOptions = Object.values(pairs);
                    } catch (_) {}

                    return (
                      <div key={i} className="matching-row">
                        <span className="matching-left">{leftItem}</span>
                        <span className="matching-arrow">⟵</span>
                        <select
                          disabled={submitted}
                          value={matchingAnswers[leftItem] || ""}
                          onChange={(e) =>
                            setMatchingAnswers({
                              ...matchingAnswers,
                              [leftItem]: e.target.value,
                            })
                          }
                          className="matching-select"
                        >
                          <option value="">-- اختر العنصر المطابق --</option>
                          {rightOptions.map((opt, optIdx) => (
                            <option key={optIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* 6. ترتيب العناصر */}
            {questionType === "ORDERING" && (
              <div className="ordering-list">
                <p className="order-hint">
                  💡 استخدم أزرار الأسهم <strong>(أعلى ▲ / أسفل ▼)</strong> لترتيب العناصر بالتسلسل الصحيح:
                </p>
                {orderingItems.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="ordering-item">
                    <span className="order-number">{idx + 1}</span>
                    <span className="order-text">{item}</span>
                    {!submitted && (
                      <div className="order-buttons">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            moveOrderingItem(idx, "up");
                          }}
                          className="btn-order-arrow btn-order-up"
                          aria-label="تحريك لأعلى"
                          title="تحريك لأعلى"
                        >
                          <span className="arrow-icon">▲</span>
                          <span className="arrow-text">أعلى</span>
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderingItems.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            moveOrderingItem(idx, "down");
                          }}
                          className="btn-order-arrow btn-order-down"
                          aria-label="تحريك لأسفل"
                          title="تحريك لأسفل"
                        >
                          <span className="arrow-icon">▼</span>
                          <span className="arrow-text">أسفل</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* أزرار الإجراءات والتقييم */}
          <div className="card-actions">
            {!submitted ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-submit-answer"
                >
                  🎯 التحقق من الإجابة
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-fold"
                >
                  إخفاء مؤقتاً
                </button>
              </div>
            ) : (
              <div className="feedback-container">
                <div
                  className={`feedback-banner ${
                    isCorrect ? "banner-success" : "banner-fail"
                  }`}
                >
                  <div className="feedback-title">
                    {isCorrect ? (
                      <strong>🎉 ممتاز! إجابتك صحيحة ومكتملة (+{points} نقطة)</strong>
                    ) : (
                      <strong>❌ الإجابة غير صحيحة أو غير مكتملة، حاول مرة أخرى!</strong>
                    )}
                  </div>

                  {/* كشف الإجابة النموذجية في السؤال المفتوح */}
                  {questionType === "OUVERTE" && qData?.reponse && (
                    <div className="correct-answer-reveal">
                      <strong>💡 الإجابة النموذجية المرجعية:</strong>
                      <p style={{ margin: "0.25rem 0 0 0" }}>{qData.reponse}</p>
                    </div>
                  )}

                  {/* إظهار الترتيب الصحيح النموذجي */}
                  {questionType === "ORDERING" && !isCorrect && (
                    <div className="correct-answer-reveal">
                      <strong>💡 الترتيب الصحيح النموذجي:</strong>
                      <ol style={{ margin: "0.5rem 1.4rem 0 0", padding: 0 }}>
                        {(() => {
                          try {
                            const list = Array.isArray(qData.reponse)
                              ? qData.reponse
                              : JSON.parse(qData.reponse || "[]");
                            return list.map((elem, i) => (
                              <li key={i} style={{ marginBottom: "0.25rem", color: "#065f46", fontWeight: "600" }}>
                                {elem}
                              </li>
                            ));
                          } catch (_) {
                            return null;
                          }
                        })()}
                      </ol>
                    </div>
                  )}

                  {/* الشرح التعليمي إن وجد */}
                  {explication && (
                    <div className="pedagogical-explanation">
                      <strong>📖 التفسير والشرح التعليمي:</strong> {explication}
                    </div>
                  )}
                </div>

                <div className="feedback-buttons">
                  {!isCorrect && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="btn-retry"
                    >
                      🔄 إعادة المحاولة
                    </button>
                  )}
                  {onContinue && (
                    <button
                      type="button"
                      onClick={onContinue}
                      className="btn-continue"
                    >
                      متابعة الدرس ⬅️
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-fold"
                  >
                    طي السؤال
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── الأنماط والتنسيق الحديث RTL ── */}
      <style jsx>{`
        .support-question-card {
          margin: 1.5rem 0;
          border-radius: 16px;
          background: #ffffff;
          border: 1.5px solid #d1fae5;
          box-shadow: 0 4px 20px rgba(6, 95, 70, 0.05);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .support-question-card:hover {
          box-shadow: 0 6px 24px rgba(6, 95, 70, 0.09);
        }

        .card-correct {
          border-color: #86efac;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.12);
        }

        .card-incorrect {
          border-color: #fca5a5;
        }

        /* رأس الأكورديون */
        .checkpoint-header {
          padding: 1.2rem 1.6rem;
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
        }

        .checkpoint-header:hover {
          background: linear-gradient(135deg, #ecfdf5 0%, #f8fafc 100%);
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tag-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .checkpoint-badge {
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .points-pill {
          background: #e6fffa;
          color: #047857;
          border: 1px solid #a7f3d0;
          font-size: 0.76rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .teacher-preview-pill {
          background: #ede9fe;
          color: #6d28d9;
          border: 1px solid #ddd6fe;
          font-size: 0.74rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .title-row {
          margin-top: 2px;
        }

        .ordinal-heading {
          margin: 0;
          font-size: 1.18rem;
          font-weight: 800;
          color: #065f46;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .custom-title {
          font-size: 1rem;
          color: #334155;
          font-weight: 600;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.86rem;
        }

        .eval-tagline {
          color: #059669;
          font-weight: 600;
        }

        .cta-hint {
          color: #64748b;
          font-size: 0.82rem;
        }

        .header-action {
          margin-right: 1.5rem;
        }

        .toggle-button {
          background: linear-gradient(135deg, #059669, #0d9488);
          color: white;
          border: none;
          padding: 0.55rem 1.2rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.86rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
        }

        .toggle-button:hover {
          background: linear-gradient(135deg, #047857, #0f766e);
          transform: translateY(-1px);
        }

        .btn-open {
          background: #f1f5f9;
          color: #475569;
          box-shadow: none;
          border: 1px solid #cbd5e1;
        }

        .btn-open:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .status-badge {
          padding: 0.45rem 0.95rem;
          border-radius: 10px;
          font-size: 0.86rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .badge-success {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
        }

        .badge-fail {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }

        .chevron {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-right: 4px;
        }

        /* جسم السؤال */
        .question-body {
          padding: 1.6rem;
          border-top: 1px solid #e2e8f0;
          animation: slideDown 0.25s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .question-prompt h4 {
          margin: 0 0 1.25rem 0;
          font-size: 1.15rem;
          color: #0f172a;
          font-weight: 700;
          line-height: 1.6;
        }

        /* خيارات QCM */
        .choices-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 1.5rem;
        }

        .choice-button {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          cursor: pointer;
          text-align: right;
          font-size: 0.98rem;
          color: #1e293b;
          transition: all 0.2s ease;
          width: 100%;
        }

        .choice-button:hover:not(:disabled) {
          border-color: #10b981;
          background: #f0fdf4;
          transform: translateX(-4px);
        }

        .choice-selected {
          background: #d1fae5 !important;
          border-color: #059669 !important;
          color: #065f46 !important;
          font-weight: 700;
        }

        .choice-correct {
          background: #dcfce7 !important;
          border-color: #10b981 !important;
          color: #15803d !important;
          font-weight: 800;
        }

        .choice-wrong {
          background: #fee2e2 !important;
          border-color: #ef4444 !important;
          color: #991b1b !important;
          text-decoration: line-through;
        }

        .choice-indicator {
          font-size: 1.2rem;
          min-width: 24px;
        }

        /* السؤال المفتوح */
        .open-question-box {
          margin-bottom: 1.25rem;
        }

        .open-textarea {
          width: 100%;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 0.9rem;
          font-size: 0.98rem;
          font-family: inherit;
          resize: vertical;
          box-sizing: border-box;
          direction: rtl;
        }

        .open-textarea:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
        }

        /* الفراغات GAP */
        .gap-paragraph {
          font-size: 1.1rem;
          line-height: 2.3;
          color: #0f172a;
          margin-bottom: 1.25rem;
        }

        .gap-input {
          border: 1.5px solid #059669;
          border-radius: 8px;
          padding: 0.35rem 0.8rem;
          font-size: 0.95rem;
          margin: 0 6px;
          font-weight: 700;
          color: #065f46;
          direction: rtl;
          text-align: center;
        }

        /* الربط والمطابقة MATCHING */
        .matching-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 1.25rem;
        }

        .matching-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          padding: 0.75rem 1.2rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .matching-left {
          flex: 1;
          font-weight: 700;
          color: #0f172a;
        }

        .matching-arrow {
          color: #059669;
          font-weight: 800;
          font-size: 1.1rem;
        }

        .matching-select {
          flex: 1;
          padding: 0.55rem 0.9rem;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          font-size: 0.94rem;
          direction: rtl;
        }

        /* ترتيب العناصر ORDERING */
        .ordering-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 1.25rem;
        }

        .order-hint {
          font-size: 0.88rem;
          color: #047857;
          background: #ecfdf5;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          margin: 0 0 0.5rem 0;
          border: 1px solid #a7f3d0;
          font-weight: 600;
        }

        .ordering-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          padding: 0.85rem 1.2rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .ordering-item:hover {
          background: #ffffff;
          border-color: #cbd5e1;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
        }

        .order-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ecfdf5;
          color: #059669;
          font-weight: 800;
          font-size: 0.88rem;
          flex-shrink: 0;
        }

        .order-text {
          flex: 1;
          font-weight: 600;
          font-size: 0.96rem;
          color: #1e293b;
          user-select: none;
        }

        .order-buttons {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .btn-order-arrow {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          border: 1.5px solid #a7f3d0;
          color: #065f46;
          border-radius: 8px;
          padding: 6px 11px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          user-select: none;
        }

        .btn-order-arrow:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(5, 150, 105, 0.3);
        }

        .btn-order-arrow:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-order-arrow:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
          transform: none;
        }

        .arrow-icon {
          font-size: 0.85rem;
          line-height: 1;
        }

        .arrow-text {
          font-size: 0.78rem;
        }

        /* إجراءات التقييم والتغذية الراجعة */
        .card-actions {
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px dashed #e2e8f0;
        }

        .btn-submit-answer {
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          border: none;
          padding: 0.75rem 1.8rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.96rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }

        .btn-submit-answer:hover:not(:disabled) {
          background: linear-gradient(135deg, #047857, #059669);
          transform: translateY(-2px);
        }

        .btn-fold {
          background: transparent;
          border: 1px solid #cbd5e1;
          color: #64748b;
          padding: 0.65rem 1.2rem;
          border-radius: 10px;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-fold:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .feedback-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feedback-banner {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .banner-success {
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #14532d;
        }

        .banner-fail {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #7f1d1d;
        }

        .feedback-title {
          font-size: 1.05rem;
          margin-bottom: 0.4rem;
        }

        .correct-answer-reveal {
          margin-top: 0.5rem;
          background: rgba(255, 255, 255, 0.7);
          padding: 0.6rem 0.9rem;
          border-radius: 8px;
          font-size: 0.92rem;
        }

        .pedagogical-explanation {
          margin-top: 0.5rem;
          font-size: 0.92rem;
          font-style: italic;
          opacity: 0.95;
        }

        .feedback-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-retry {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #065f46;
          padding: 0.65rem 1.3rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .btn-retry:hover {
          background: #ecfdf5;
          border-color: #a7f3d0;
        }

        .btn-continue {
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          border: none;
          padding: 0.65rem 1.6rem;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.94rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }

        .btn-continue:hover {
          background: linear-gradient(135deg, #047857, #059669);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
