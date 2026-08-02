import React from "react";
import { thStyle, tdStyle, roleColor, gridDateString } from "./AdminStyles";

export default function MessagesTab({ msgStats, users, UserHoverTrigger }) {
  return (
    <div>
      {msgStats.length === 0 ? (
        <p style={{ color: "#718096" }}>Aucun teacher/designer trouvé.</p>
      ) : (
      <div className="table-responsive">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#edf2f7" }}>
              <th style={thStyle}>Responsable</th>
              <th style={thStyle}>Rôle</th>
              <th style={thStyle}>Messages envoyés</th>
              <th style={thStyle}>Messages reçus</th>
              <th style={thStyle}>Non lus reçus</th>
              <th style={thStyle}>Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {msgStats.map((t) => {
              const fullUser = users.find((usr) => usr.id === t.id) || t;
              const envoyes = t.sentMessages?.length || 0;
              const recus = t.receivedMessages?.length || 0;
              const nonLus = t.receivedMessages?.filter((m) => !m.lu).length || 0;
              const dernierMsg = [...(t.sentMessages || []), ...(t.receivedMessages || [])]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
              return (
                <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={tdStyle}>
                    <UserHoverTrigger user={fullUser} />
                    <div style={{ fontSize: "0.8rem", color: "#718096" }}>{t.matiere || "—"}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ background: roleColor(t.role), color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.8rem" }}>
                      {t.role}
                    </span>
                  </td>
                  <td style={tdStyle}>{envoyes}</td>
                  <td style={tdStyle}>{recus}</td>
                  <td style={tdStyle}>
                    {nonLus > 0
                      ? <span style={{ color: "#dc2626", fontWeight: "bold" }}>{nonLus} non lu(s)</span>
                      : <span style={{ color: "#059669" }}>✅ Tout lu</span>
                    }
                  </td>
                  <td style={{ ...tdStyle, color: "#718096", fontSize: "0.85rem" }}>
                    {gridDateString(dernierMsg)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
    </div>
  );
}
