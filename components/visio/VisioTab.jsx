import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function VisioTab({ user }) {
  const router = useRouter();
  const [visios, setVisios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("upcoming");
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    dateDebut: "",
    dureeMinutes: 60,
    publicCible: "TOUS",
    niveau: "",
    demarrerImmediatement: false,
  });

  const canSchedule = ["ADMIN", "DESIGNER", "TEACHER"].includes(user?.role);

  useEffect(() => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    const localIso = new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData((prev) => ({ ...prev, dateDebut: localIso }));
  }, []);

  const fetchVisios = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/visio", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setVisios(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("خطأ تحميل الاجتماعات:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisios();
  }, []);

  const handleCreateVisio = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.titre.trim()) {
      setErrorMsg("يرجى إدخال عنوان الاجتماع.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/visio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        const count = data.participantsInvites || 0;
        const msg = `✅ تمت برمجة اجتماع "${data.visio?.titre || formData.titre}" بنجاح! ${count > 0 ? `تم إرسال ${count} دعوة للمشاركين.` : "تم تسجيل الاجتماع في الجدول."}`;
        setSuccessMsg(msg);
        setShowModal(false);
        setFormData({
          titre: "",
          description: "",
          dateDebut: "",
          dureeMinutes: 60,
          publicCible: "TOUS",
          niveau: "",
          demarrerImmediatement: false,
        });
        fetchVisios();

        if (formData.demarrerImmediatement && data.visio?.id) {
          router.push(`/visio?id=${data.visio.id}`);
        }
      } else {
        setErrorMsg(data.error || "خطأ أثناء البرمجة.");
      }
    } catch (err) {
      setErrorMsg("خطأ في الاتصال بالخادم.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (visioId, newStatut) => {
    try {
      const res = await fetch(`/api/visio/${visioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ statut: newStatut }),
      });
      if (res.ok) {
        fetchVisios();
      }
    } catch (err) {
      console.error("خطأ الحالة:", err);
    }
  };

  const handleDeleteVisio = async (visioId, titre) => {
    if (!window.confirm(`هل تؤكد إلغاء وحذف الاجتماع "${titre}"؟`)) {
      return;
    }
    try {
      const res = await fetch(`/api/visio/${visioId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchVisios();
      }
    } catch (err) {
      console.error("خطأ الحذف:", err);
    }
  };

  const copyMeetingLink = (visioId) => {
    const fullUrl = `${window.location.origin}/visio?id=${visioId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(visioId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const isLive = (v) => v.statut === "EN_COURS";
  const isPast = (v) =>
    v.statut === "TERMINEE" ||
    v.statut === "ANNULEE" ||
    new Date(v.dateDebut).getTime() + v.dureeMinutes * 60000 < Date.now();

  const liveAndUpcoming = visios.filter((v) => !isPast(v) || isLive(v));
  const pastVisios = visios.filter((v) => isPast(v) && !isLive(v));
  const liveCount = visios.filter(isLive).length;
  const displayedList = activeSubTab === "upcoming" ? liveAndUpcoming : pastVisios;

  return (
    <div className="dz-visio-wrapper" dir="rtl">
      {/* Hero Banner */}
      <section className="dz-visio-hero">
        <div className="hero-glow-aura"></div>
        <div className="hero-content">
          <div className="hero-header-line">
            <span className="hero-badge">
              <span className="badge-icon">🎓</span> دزأكاديمي — الفصل الافتراضي
            </span>
            {liveCount > 0 && (
              <span className="live-pulse-badge">
                <span className="pulse-ping"></span>
                <span className="pulse-dot"></span>
                {liveCount} {liveCount > 1 ? "حصص مباشرة" : "حصة مباشرة"}
              </span>
            )}
          </div>

          <h1 className="hero-title">
            اجتماعات الفيديو و<span className="title-gradient">الحصص المباشرة</span>
          </h1>

          <p className="hero-description">
            تواصل مباشرة مع أساتذتك وزملائك. فيديو عالي الجودة مجاني، مشاركة الدروس، عروض تفاعلية وأسئلة فورية.
          </p>

          {/* KPIs */}
          <div className="hero-kpis">
            <div className="kpi-item">
              <span className="kpi-val">{liveAndUpcoming.length}</span>
              <span className="kpi-lbl">اجتماعات قادمة</span>
            </div>
            <div className="kpi-sep"></div>
            <div className="kpi-item">
              <span className="kpi-val">{liveCount}</span>
              <span className="kpi-lbl">مباشر الآن</span>
            </div>
            <div className="kpi-sep"></div>
            <div className="kpi-item">
              <span className="kpi-val">{pastVisios.length}</span>
              <span className="kpi-lbl">مؤرشفة</span>
            </div>
          </div>
        </div>

        {canSchedule && (
          <div className="hero-action-box">
            <button className="btn-create-visio" onClick={() => setShowModal(true)}>
              <span>📹</span> برمجة اجتماع جديد
            </button>
            <p className="action-sub">أنشئ حصة مباشرة وادعُ المشاركين تلقائياً</p>
          </div>
        )}
      </section>

      {/* Messages */}
      {successMsg && (
        <div className="lms-alert lms-alert-success">
          <span className="alert-icon">✅</span>
          <span>{successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg("")}>✕</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="sub-tabs-bar">
        <button
          className={`sub-tab ${activeSubTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveSubTab("upcoming")}
        >
          📅 القادمة ({liveAndUpcoming.length})
        </button>
        <button
          className={`sub-tab ${activeSubTab === "past" ? "active" : ""}`}
          onClick={() => setActiveSubTab("past")}
        >
          📁 المؤرشفة ({pastVisios.length})
        </button>
      </div>

      {/* States */}
      {loading ? (
        <div className="lms-state-card">
          <div className="lms-spinner"></div>
          <h3>جارٍ تحميل الاجتماعات...</h3>
          <p>يرجى الانتظار بينما نحمّل البيانات.</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="lms-state-card">
          <div className="empty-graphic">
            <div className="graphic-circle">📹</div>
          </div>
          <h3>{activeSubTab === "upcoming" ? "لا توجد اجتماعات مبرمجة" : "لا توجد اجتماعات سابقة"}</h3>
          <p>
            {activeSubTab === "upcoming"
              ? canSchedule
                ? "ابدأ بإنشاء أول اجتماع فيديو لتفعيل الحصص المباشرة."
                : "لم يتم برمجة أي اجتماع بعد. ترقب الدعوات!"
              : "ستظهر هنا الاجتماعات المنتهية والمؤرشفة."}
          </p>
          {canSchedule && activeSubTab === "upcoming" && (
            <button className="btn-create-visio btn-in-card" onClick={() => setShowModal(true)}>
              📹 إنشاء أول اجتماع
            </button>
          )}
        </div>
      ) : (
        <div className="lms-visio-grid">
          {displayedList.map((visio) => {
            const live = isLive(visio);
            const past = isPast(visio) && !live;
            const canManage =
              user &&
              (user.role === "ADMIN" ||
                user.id === visio.organisateurId ||
                user.id === visio.organisateur?.id);

            const dateStr = new Date(visio.dateDebut).toLocaleDateString("ar-DZ", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const timeStr = new Date(visio.dateDebut).toLocaleTimeString("ar-DZ", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const statusLabel = live
              ? "🔴 مباشر الآن"
              : visio.statut === "TERMINEE"
              ? "✅ منتهي"
              : visio.statut === "ANNULEE"
              ? "❌ ملغى"
              : "📅 مبرمج";

            const statusClass = live
              ? "status-live"
              : visio.statut === "TERMINEE"
              ? "status-done"
              : visio.statut === "ANNULEE"
              ? "status-cancelled"
              : "status-upcoming";

            return (
              <article key={visio.id} className={`visio-card ${live ? "card-live" : ""} ${past ? "card-past" : ""}`}>
                <div className="card-header">
                  <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                  <span className="card-date">{dateStr} — {timeStr}</span>
                </div>

                <h3 className="card-title">{visio.titre}</h3>

                {visio.description && (
                  <p className="card-desc">{visio.description.slice(0, 120)}{visio.description.length > 120 ? "..." : ""}</p>
                )}

                <div className="card-meta">
                  <span className="meta-item">👤 {visio.organisateur?.prenom} {visio.organisateur?.nom}</span>
                  <span className="meta-item">⏱️ {visio.dureeMinutes} د</span>
                  <span className="meta-item">👥 {visio._count?.participants || 0} مشارك</span>
                </div>

                <div className="card-actions">
                  <button
                    className={`btn-join ${live ? "btn-join-live" : ""}`}
                    onClick={() => router.push(`/visio?id=${visio.id}`)}
                    disabled={past && !live}
                  >
                    {live ? "🔴 انضم الآن" : past ? "انتهى" : "📹 الدخول"}
                  </button>

                  <button
                    className="btn-copy-link"
                    onClick={() => copyMeetingLink(visio.id)}
                    title="نسخ الرابط"
                  >
                    {copiedId === visio.id ? "✅ تم النسخ" : "🔗 نسخ"}
                  </button>

                  {canManage && (
                    <div className="host-tools">
                      {!live && visio.statut === "PROGRAMMEE" && (
                        <button
                          className="tool-btn tool-start"
                          title="بدء فوري"
                          onClick={() => handleUpdateStatus(visio.id, "EN_COURS")}
                        >
                          ▶️ بدء
                        </button>
                      )}

                      {live && (
                        <button
                          className="tool-btn tool-finish"
                          title="إنهاء الحصة"
                          onClick={() => handleUpdateStatus(visio.id, "TERMINEE")}
                        >
                          ⏹️ إنهاء
                        </button>
                      )}

                      <button
                        className="tool-btn tool-delete"
                        title="حذف الاجتماع"
                        onClick={() => handleDeleteVisio(visio.id, visio.titre)}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de Création */}
      {showModal && (
        <div className="lms-modal-overlay">
          <div className="lms-modal-card">
            <div className="modal-header">
              <div className="modal-header-title">
                <span className="modal-icon-badge">📹</span>
                <div>
                  <h3>برمجة اجتماع فيديو</h3>
                  <p>سيظهر الاجتماع في لوحات التحكم للمعنيين.</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="lms-alert lms-alert-danger" style={{ marginBottom: "1rem" }}>
                <span className="alert-icon">❌</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {actionLoading && (
              <div className="lms-alert lms-alert-success" style={{ background: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe", marginBottom: "1rem" }}>
                <span className="alert-icon">⏳</span>
                <span>جارٍ إنشاء الاجتماع وإرسال الدعوات...</span>
              </div>
            )}

            <form onSubmit={handleCreateVisio} className="modal-form">
              <div className="form-field">
                <label>
                  عنوان الاجتماع <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="lms-input"
                  placeholder="مثال: حصة مراجعة الرياضيات — الجبر"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label>الوصف والأهداف (اختياري)</label>
                <textarea
                  className="lms-textarea"
                  placeholder="مثال: مراجعة المفاهيم الأساسية، تمارين تطبيقية، أسئلة وأجوبة..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-two-cols">
                <div className="form-field">
                  <label>
                    التاريخ والوقت <span className="req-star">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="lms-input"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>المدة المقدرة</label>
                  <select
                    className="lms-select"
                    value={formData.dureeMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, dureeMinutes: parseInt(e.target.value) })
                    }
                  >
                    <option value={30}>30 دقيقة</option>
                    <option value={45}>45 دقيقة</option>
                    <option value={60}>ساعة واحدة (60 د)</option>
                    <option value={90}>ساعة و30 دقيقة</option>
                    <option value={120}>ساعتان</option>
                  </select>
                </div>
              </div>

              <div className="form-two-cols">
                <div className="form-field">
                  <label>الجمهور المستهدف</label>
                  <select
                    className="lms-select"
                    value={formData.publicCible}
                    onChange={(e) =>
                      setFormData({ ...formData, publicCible: e.target.value })
                    }
                  >
                    <option value="TOUS">👥 الجميع (كل الأدوار)</option>
                    <option value="ETUDIANTS">🎓 الطلاب فقط</option>
                    <option value="ENSEIGNANTS">📚 الأساتذة فقط</option>
                    <option value="DESIGNERS">🎨 المصممون فقط</option>
                  </select>
                </div>

                {formData.publicCible === "ETUDIANTS" && (
                  <div className="form-field">
                    <label>المستوى الدراسي</label>
                    <select
                      className="lms-select"
                      value={formData.niveau}
                      onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                    >
                      <option value="">جميع المستويات</option>
                      <option value="PRIMAIRE">ابتدائي</option>
                      <option value="CEM">متوسط</option>
                      <option value="LYCEE">ثانوي</option>
                      <option value="BAC">تحضير البكالوريا</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Switch Démarrage Immédiat */}
              <div className="instant-start-box">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={formData.demarrerImmediatement}
                    onChange={(e) =>
                      setFormData({ ...formData, demarrerImmediatement: e.target.checked })
                    }
                  />
                  <div>
                    <strong className="switch-title">🔴 بدء فوري</strong>
                    <p className="switch-desc">
                      سيتم تعليم الاجتماع كـ "مباشر" فور الإنشاء وسيتلقى المشاركون تنبيهاً فورياً.
                    </p>
                  </div>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "⏳ جارٍ الإنشاء..."
                    : formData.demarrerImmediatement
                    ? "🔴 إنشاء وبدء الآن"
                    : "📅 برمجة الاجتماع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ STYLES ═══ */}
      <style jsx>{`
        .dz-visio-wrapper {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          direction: rtl;
        }

        /* HERO BANNER */
        .dz-visio-hero {
          background: linear-gradient(135deg, #78350f 0%, #b45309 30%, #f59e0b 80%, #fbbf24 100%);
          border-radius: 22px;
          padding: 2.2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          position: relative;
          overflow: hidden;
          color: white;
          margin-bottom: 1.5rem;
        }

        .hero-glow-aura {
          position: absolute;
          top: -50%;
          left: -30%;
          width: 160%;
          height: 200%;
          background: radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.12) 0%, transparent 65%);
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          flex: 1;
        }

        .hero-header-line {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 0.8rem;
          flex-wrap: wrap;
        }

        .hero-badge {
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(6px);
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .badge-icon {
          font-size: 1rem;
        }

        .live-pulse-badge {
          background: rgba(239, 68, 68, 0.25);
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: #fecaca;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .pulse-ping {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: ping 1.5s ease-out infinite;
          position: absolute;
          right: 10px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          position: relative;
          z-index: 1;
        }

        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .hero-title {
          font-size: 2rem;
          font-weight: 900;
          margin: 0 0 0.5rem;
          line-height: 1.3;
        }

        .title-gradient {
          background: linear-gradient(90deg, #fef3c7, #fde68a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-description {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
          max-width: 600px;
          line-height: 1.6;
          margin: 0 0 1.2rem;
        }

        .hero-kpis {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          background: rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(8px);
          padding: 0.65rem 1.2rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          width: fit-content;
        }

        .kpi-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .kpi-val {
          font-size: 1.4rem;
          font-weight: 900;
        }

        .kpi-lbl {
          font-size: 0.72rem;
          opacity: 0.75;
        }

        .kpi-sep {
          width: 1px;
          height: 28px;
          background: rgba(255, 255, 255, 0.2);
        }

        .hero-action-box {
          position: relative;
          z-index: 1;
          text-align: center;
          flex-shrink: 0;
        }

        .btn-create-visio {
          background: white;
          color: #92400e;
          border: none;
          padding: 0.9rem 1.6rem;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }

        .btn-create-visio:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
        }

        .action-sub {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0.5rem 0 0;
        }

        /* ALERTS */
        .lms-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.85rem 1.1rem;
          border-radius: 14px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1rem;
          border: 1px solid;
        }

        .lms-alert-success {
          background: #f0fdf4;
          color: #166534;
          border-color: #86efac;
        }

        .lms-alert-danger {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .alert-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .alert-close {
          margin-right: auto;
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.6;
        }

        /* SUB TABS */
        .sub-tabs-bar {
          display: flex;
          gap: 6px;
          margin-bottom: 1.2rem;
          background: white;
          padding: 5px;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .sub-tab {
          flex: 1;
          padding: 0.7rem;
          border: none;
          background: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 700;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .sub-tab.active {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: white;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        /* GRID */
        .lms-visio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.2rem;
        }

        /* CARDS */
        .visio-card {
          background: white;
          border-radius: 18px;
          padding: 1.4rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .visio-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .card-live {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15), 0 4px 20px rgba(239, 68, 68, 0.12);
        }

        .card-past {
          opacity: 0.7;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .status-live {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
        }

        .status-done {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #86efac;
        }

        .status-cancelled {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .status-upcoming {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .card-date {
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          line-height: 1.3;
        }

        .card-desc {
          font-size: 0.88rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .meta-item {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 0.6rem;
          border-top: 1px solid #f1f5f9;
        }

        .btn-join {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          color: white;
          border: none;
          padding: 0.55rem 1.2rem;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.88rem;
          cursor: pointer;
          box-shadow: 0 3px 12px rgba(249, 115, 22, 0.3);
          transition: all 0.2s ease;
        }

        .btn-join:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 18px rgba(249, 115, 22, 0.4);
        }

        .btn-join:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-join-live {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          box-shadow: 0 3px 12px rgba(239, 68, 68, 0.3);
          animation: pulse-btn 2s ease-in-out infinite;
        }

        @keyframes pulse-btn {
          0%, 100% { box-shadow: 0 3px 12px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 3px 20px rgba(239, 68, 68, 0.6); }
        }

        .btn-copy-link {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 0.55rem 1rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-copy-link:hover {
          background: #e2e8f0;
        }

        .host-tools {
          display: flex;
          gap: 6px;
          margin-right: auto;
        }

        .tool-btn {
          padding: 0.45rem 0.8rem;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .tool-start {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .tool-start:hover {
          background: #059669;
          color: white;
        }

        .tool-finish {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .tool-finish:hover {
          background: #dc2626;
          color: white;
        }

        .tool-delete {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }

        .tool-delete:hover {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fca5a5;
        }

        /* STATES */
        .lms-state-card {
          background: white;
          border-radius: 20px;
          border: 2px dashed #cbd5e1;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-graphic {
          display: flex;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .graphic-circle {
          width: 76px;
          height: 76px;
          background: #fffbeb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          border: 2px solid #fde68a;
        }

        .lms-state-card h3 {
          font-size: 1.35rem;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        .lms-state-card p {
          color: #64748b;
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .btn-in-card {
          margin: 1.5rem auto 0;
        }

        .lms-spinner {
          width: 44px;
          height: 44px;
          border: 4px solid #fffbeb;
          border-top-color: #f59e0b;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* MODAL */
        .lms-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1.5rem;
        }

        .lms-modal-card {
          background: #ffffff;
          border-radius: 22px;
          max-width: 580px;
          width: 100%;
          padding: 2.2rem;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3);
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          direction: rtl;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .modal-header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-icon-badge {
          width: 44px;
          height: 44px;
          background: #fffbeb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          border: 1px solid #fde68a;
        }

        .modal-header-title h3 {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .modal-header-title p {
          margin: 0.2rem 0 0 0;
          font-size: 0.85rem;
          color: #64748b;
        }

        .btn-close-modal {
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 1rem;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-close-modal:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-field label {
          font-size: 0.88rem;
          font-weight: 700;
          color: #334155;
        }

        .req-star {
          color: #ef4444;
        }

        .lms-input,
        .lms-textarea,
        .lms-select {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 0.95rem;
          color: #0f172a;
          font-family: inherit;
          outline: none;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          direction: rtl;
        }

        .lms-input:focus,
        .lms-textarea:focus,
        .lms-select:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }

        .instant-start-box {
          background: linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%);
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 1rem 1.25rem;
        }

        .switch-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
        }

        .switch-input {
          width: 20px;
          height: 20px;
          accent-color: #dc2626;
          margin-top: 3px;
        }

        .switch-title {
          display: block;
          font-size: 0.95rem;
          color: #991b1b;
        }

        .switch-desc {
          margin: 0.2rem 0 0 0;
          font-size: 0.8rem;
          color: #7f1d1d;
          line-height: 1.4;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 1rem;
          padding-top: 1.2rem;
          border-top: 1px solid #f1f5f9;
        }

        .btn-modal-cancel {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 0.75rem 1.4rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
        }

        .btn-modal-submit {
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          border: none;
          color: white;
          padding: 0.75rem 1.6rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.35);
          transition: all 0.2s ease;
        }

        .btn-modal-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45);
        }

        .btn-modal-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .dz-visio-hero {
            flex-direction: column;
            align-items: flex-start;
            padding: 1.6rem;
          }
          .hero-action-box {
            width: 100%;
          }
          .btn-create-visio {
            width: 100%;
            justify-content: center;
          }
          .hero-title {
            font-size: 1.7rem;
          }
        }

        @media (max-width: 640px) {
          .form-two-cols {
            grid-template-columns: 1fr;
          }
          .lms-visio-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
