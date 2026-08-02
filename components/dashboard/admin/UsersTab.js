import React from "react";
import { MATIERES, ANNEES_COLLEGE, ANNEES_LYCEE } from "@/lib/constants";
import { inputStyle, thStyle, tdStyle, btnPrimary, btnSuccess, btnDanger, btnSmall, btnWarning, labelStyle, roleColor } from "./AdminStyles";

export default function UsersTab({
  users, form, showForm, editingUser, editForm,
  onToggleForm, onFormChange, onAddUser, onEditUser, onUpdateUser, onCancelEdit,
  onDeleteUser, onEditFormChange, onToggleMatiere, onToggleNiveau,
  UserHoverTrigger,
}) {
  return (
    <div>
      <button onClick={onToggleForm} style={{ ...btnPrimary, marginBottom: "1rem" }}>
        {showForm ? "✖ Annuler" : "➕ Ajouter un utilisateur"}
      </button>

      {showForm && (
        <div style={{ background: "#f7fafc", padding: "1.5rem", borderRadius: "10px", marginBottom: "2rem" }}>
          <h3>Nouvel utilisateur</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <input name="nom" placeholder="Nom *" value={form.nom} onChange={onFormChange} style={inputStyle} />
            <input name="prenom" placeholder="Prénom *" value={form.prenom} onChange={onFormChange} style={inputStyle} />
            <input name="email" placeholder="Email *" value={form.email} onChange={onFormChange} style={inputStyle} type="email" />
            <input name="password" placeholder="Mot de passe *" value={form.password} onChange={onFormChange} style={inputStyle} type="password" />
          </div>

          <select name="role" value={form.role} onChange={onFormChange} style={{ ...inputStyle, marginTop: "1rem" }}>
            <option value="TEACHER">👨‍🏫 Enseignant</option>
            <option value="DESIGNER">🎨 Designer</option>
            <option value="ADMIN">👑 Admin</option>
            <option value="STUDENT">👨‍🎓 Élève</option>
          </select>

          {(form.role === "TEACHER" || form.role === "DESIGNER") && (
            <>
              <label style={{ ...labelStyle, marginTop: "1rem" }}>Matières</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {MATIERES.map((m) => (
                  <label key={m.value} style={{
                    cursor: "pointer",
                    background: form.matieres?.includes(m.value) ? "#3182ce" : "#e2e8f0",
                    color: form.matieres?.includes(m.value) ? "white" : "#4a5568",
                    padding: "0.3rem 0.8rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem"
                  }}>
                    <input type="checkbox" style={{ display: "none" }}
                      checked={form.matieres?.includes(m.value) || false}
                      onChange={() => {
                        const list = form.matieres?.includes(m.value)
                          ? form.matieres.filter((x) => x !== m.value)
                          : [...(form.matieres || []), m.value];
                        onEditFormChange({ ...form, matieres: list });
                      }}
                    />
                    {m.label}
                  </label>
                ))}
              </div>

              <label style={{ ...labelStyle, marginTop: "1rem" }}>Niveaux</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["college", "lycee"].map((n) => (
                  <label key={n} style={{
                    cursor: "pointer",
                    background: form.niveaux?.includes(n) ? "#805ad5" : "#e2e8f0",
                    color: form.niveaux?.includes(n) ? "white" : "#4a5568",
                    padding: "0.3rem 0.8rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem"
                  }}>
                    <input type="checkbox" style={{ display: "none" }}
                      checked={form.niveaux?.includes(n) || false}
                      onChange={() => {
                        const list = form.niveaux?.includes(n)
                          ? form.niveaux.filter((x) => x !== n)
                          : [...(form.niveaux || []), n];
                        onEditFormChange({ ...form, niveaux: list });
                      }}
                    />
                    {n === "college" ? "Collège" : "Lycée"}
                  </label>
                ))}
              </div>
            </>
          )}

          {form.role === "STUDENT" && (
            <>
              <select name="niveau" value={form.niveau} onChange={onFormChange} style={{ ...inputStyle, marginTop: "1rem" }}>
                <option value="">Niveau *</option>
                <option value="college">Collège</option>
                <option value="lycee">Lycée</option>
              </select>

              <select name="classe" value={form.classe || ""} onChange={onFormChange} style={{ ...inputStyle, marginTop: "1rem" }}>
                <option value="">Année *</option>
                  {form.niveau === "college" && ANNEES_COLLEGE.map(a => <option key={a} value={a}>{a}</option>)}
                {form.niveau === "lycee" && ANNEES_LYCEE.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </>
          )}

          <br />
          <button onClick={onAddUser} style={{ ...btnSuccess, marginTop: "1rem" }}>✅ Créer le compte</button>
        </div>
      )}

      <div className="table-responsive">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#edf2f7" }}>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Rôle</th>
              <th style={thStyle}>Matières</th>
              <th style={thStyle}>Niveaux</th>
              <th style={thStyle}>Classe / Année</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
          {users.map((u) => (
            <React.Fragment key={u.id}>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={tdStyle}>
                  <UserHoverTrigger user={u} />
                </td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>
                  <span style={{
                    background: roleColor(u.role),
                    color: "white",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "20px",
                    fontSize: "0.8rem"
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={tdStyle}>
                  {u.matieres?.length > 0
                    ? u.matieres.map((m) => (
                      <span key={m} style={{
                        background: "#dbeafe",
                        color: "#1e40af",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "10px",
                        fontSize: "0.8rem",
                        marginRight: "0.3rem"
                      }}>
                        {MATIERES.find(x => x.value === m)?.label || m}
                      </span>
                    ))
                    : "—"
                  }
                </td>
                <td style={tdStyle}>
                  {u.niveaux?.length > 0
                    ? u.niveaux.map((n) => (
                      <span key={n} style={{
                        background: "#ede9fe",
                        color: "#7c3aed",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "10px",
                        fontSize: "0.8rem",
                        marginRight: "0.3rem"
                      }}>
                        {n === "college" ? "Collège" : n === "lycee" ? "Lycée" : n}
                      </span>
                    ))
                    : "—"
                  }
                </td>
                <td style={tdStyle}>
                  {u.classe || u.niveau
                    ? <span style={{
                      background: "#d1fae5",
                      color: "#059669",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "10px",
                      fontSize: "0.8rem"
                    }}>
                      {[u.niveau, u.classe].filter(Boolean).join(" / ")}
                    </span>
                    : "—"
                  }
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => onEditUser(u)} style={btnSmall}>✏️ Modifier</button>
                    {u.role !== "ADMIN" && (
                      <button onClick={() => onDeleteUser(u.id, `${u.prenom} ${u.nom}`)} style={btnDanger}>🗑</button>
                    )}
                  </div>
                </td>
              </tr>

              {editingUser === u.id && (
                <tr>
                  <td colSpan={7} style={{ padding: "1rem", background: "#eff6ff", borderLeft: "3px solid #bfdbfe" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
                      <div>
                        <label style={labelStyle}>Rôle</label>
                        <select value={editForm.role} onChange={(e) => onEditFormChange({ ...editForm, role: e.target.value })} style={{ ...inputStyle, width: "150px" }}>
                          <option value="TEACHER">👨‍🏫 Teacher</option>
                          <option value="DESIGNER">🎨 Designer</option>
                          <option value="ADMIN">👑 Admin</option>
                          <option value="STUDENT">👨‍🎓 Student</option>
                        </select>
                      </div>

                      {(editForm.role === "TEACHER" || editForm.role === "DESIGNER") && (
                        <div>
                          <label style={labelStyle}>Matières</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {MATIERES.map((m) => (
                              <label key={m.value} style={{
                                cursor: "pointer",
                                background: editForm.matieres.includes(m.value) ? "#1e40af" : "#e2e8f0",
                                color: editForm.matieres.includes(m.value) ? "white" : "#4a5568",
                                padding: "0.3rem 0.7rem",
                                borderRadius: "20px",
                                fontSize: "0.8rem"
                              }}>
                                <input type="checkbox" style={{ display: "none" }}
                                  checked={editForm.matieres.includes(m.value)}
                                  onChange={() => onToggleMatiere(m.value)}
                                />
                                {m.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {(editForm.role === "TEACHER" || editForm.role === "DESIGNER") && (
                        <div>
                          <label style={labelStyle}>Niveaux</label>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            {["college", "lycee"].map((n) => (
                              <label key={n} style={{
                                cursor: "pointer",
                                background: editForm.niveaux.includes(n) ? "#7c3aed" : "#e2e8f0",
                                color: editForm.niveaux.includes(n) ? "white" : "#4a5568",
                                padding: "0.3rem 0.7rem",
                                borderRadius: "20px",
                                fontSize: "0.8rem"
                              }}>
                                <input type="checkbox" style={{ display: "none" }}
                                  checked={editForm.niveaux.includes(n)}
                                  onChange={() => onToggleNiveau(n)}
                                />
                                {n === "college" ? "Collège" : "Lycée"}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {editForm.role === "STUDENT" && (
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <div>
                            <label style={labelStyle}>Niveau</label>
                            <select
                              value={editForm.niveau || ""}
                              onChange={(e) => onEditFormChange({ ...editForm, niveau: e.target.value, classe: "" })}
                              style={{ ...inputStyle, width: "130px" }}
                            >
                              <option value="">Niveau</option>
                              <option value="college">Collège</option>
                              <option value="lycee">Lycée</option>
                            </select>
                          </div>

                          <div>
                            <label style={labelStyle}>Année</label>
                            <select
                              value={editForm.classe || ""}
                              onChange={(e) => onEditFormChange({ ...editForm, classe: e.target.value })}
                              style={{ ...inputStyle, width: "130px" }}
                              disabled={!editForm.niveau}
                            >
                              <option value="">Année</option>
                                              {editForm.niveau === "college" && ANNEES_COLLEGE.map(a => <option key={a} value={a}>{a}</option>)}
                              {editForm.niveau === "lycee" && ANNEES_LYCEE.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                        <button onClick={() => onUpdateUser(u.id)} style={btnSuccess}>✅ Sauvegarder</button>
                        <button onClick={onCancelEdit} style={btnWarning}>Annuler</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
