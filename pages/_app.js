import "../styles/globals.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Head from "next/head";
import '@/styles/forum-styles.css'
import { useEffect } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

if (typeof window !== "undefined") {
  window.hljs = hljs;
}

function AppContent({ Component, pageProps }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const isDashboard = router.pathname.startsWith("/dashboard");

  // Appliquer la police arabe si RTL et activer Highlight/MathJax sur changement de page
  useEffect(() => {
    if (lang === "ar") {
      document.body.style.fontFamily = "'Cairo', 'Tajawal', sans-serif";
    } else {
      document.body.style.fontFamily = "'Inter', sans-serif";
    }

    const handleRouteChange = () => {
      setTimeout(() => {
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
        }
        hljs.highlightAll();
      }, 100);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    handleRouteChange(); // initial

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [lang, router.events]);

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <Header />

      <main style={{ flex: 1 }}>
        <Component {...pageProps} />
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
}

export default function App(props) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </LanguageProvider>
  );
}