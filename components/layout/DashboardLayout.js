import React, { useState } from "react";

export default function DashboardLayout({ user, roleIcon, customTitle, tabs, activeTab, onTabChange, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="dashboard-layout" dir="rtl" lang="ar">
      {/* Sidebar (Desktop uniquement) */}
      {!isMobile && <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-header" style={{ width: "100%", height: "260px", padding: "1rem 0", background: "transparent", borderBottom: "1px solid #e2e8f0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="dashboard-logo-wrapper" onClick={() => window.location.href = "/"}>
            <div className="logo-light-aura"></div>
            <div className="logo-light-spin-ring"></div>
            <div className="logo-flare logo-flare-tl"></div>
            <div className="logo-flare logo-flare-br"></div>
            <div className="logo-light-sweep"></div>
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="dashboard-logo-img" 
            />
          </div>
        </div>

        <nav className="dashboard-sidebar-nav">
          <div className="nav-main">
            {tabs.filter(t => !t.isFooter).map((tab) => (
              <button
                key={tab.key}
                className={`dashboard-nav-item ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => onTabChange(tab.key)}
              >
                <span style={{ fontSize: "1.4rem" }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="nav-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          <div className="nav-footer">
            {tabs.filter(t => t.isFooter).map((tab) => (
              <button
                key={tab.key}
                className={`dashboard-nav-item footer-item btn-dent-orange ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => onTabChange(tab.key)}
              >
                <span style={{ fontSize: "1.4rem" }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>}

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Mobile Dashboard Header with Navigation Dropdown */}
        <div className="dashboard-mobile-nav">
          <div className="mobile-nav-header" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className="mobile-nav-title">
              {roleIcon} {tabs.find(t => t.key === activeTab)?.label || "Menu"}
            </div>
            <div className="mobile-nav-arrow">{mobileMenuOpen ? "▲" : "▼"}</div>
          </div>
          
          {mobileMenuOpen && (
            <div className="mobile-nav-dropdown">
              {tabs.map((tab) => (
                <div 
                  key={tab.key} 
                  className={`mobile-nav-item ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => {
                    onTabChange(tab.key);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge > 0 && <span className="nav-badge-small">{tab.badge}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-content">
          {children}
        </div>
      </main>

      <style jsx global>{`
        /* ✅ RTL : forcer le sidebar à droite quel que soit le système de positionnement */
        .dashboard-layout {
          direction: rtl;
        }
        .dashboard-layout[dir="rtl"] {
          flex-direction: row;
        }
        /* Si le sidebar est en position fixed/absolute avec left:0 dans le CSS global existant */
        .dashboard-sidebar {
          left: auto !important;
          right: 0 !important;
        }
        .dashboard-main {
          margin-left: 0 !important;
          margin-right: var(--sidebar-width, 260px);
        }
        @media (max-width: 1024px) {
          .dashboard-main {
            margin-right: 0 !important;
          }
        }
      `}</style>

      <style jsx>{`
        .nav-badge {
          margin-left: auto;
          background: #ef4444;
          color: white;
          padding: 0.1rem 0.5rem;
          borderRadius: 12px;
          fontSize: 0.75rem;
          fontWeight: bold;
        }
        .nav-badge-small {
          margin-left: 8px;
          background: #ef4444;
          color: white;
          padding: 0px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
        }
        
        .dashboard-mobile-nav {
          display: none;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 100;
        }

        .mobile-nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          cursor: pointer;
        }

        .mobile-nav-title {
          font-weight: 700;
          color: #1e293b;
          font-size: 1.1rem;
        }

        .mobile-nav-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-top: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .mobile-nav-item {
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #f1f5f9;
          font-weight: 600;
          color: #475569;
        }

        .mobile-nav-item.active {
          background: #eff6ff;
          color: #1e40af;
        }

        .nav-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          margin-bottom: 1rem;
        }
        
        .footer-item {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
          color: #b45309 !important;
          margin: 0.5rem 1rem;
          width: calc(100% - 2rem) !important;
          border-radius: 12px;
          border: 1px solid #fde68a !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .footer-item:hover {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .footer-item.active {
          background: #f59e0b !important;
          color: white !important;
          border-color: #f59e0b !important;
        }

        @media (max-width: 1024px) {
          .desktop-only {
            display: none !important;
          }
          .dashboard-mobile-nav {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}