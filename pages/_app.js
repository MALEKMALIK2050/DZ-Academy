import "../styles/globals.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { useRouter } from "next/router";
import Head from "next/head";
import '@/styles/forum-styles.css'  // Ou ton chemin réel

function AppContent({ Component, pageProps }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const isDashboard = router.pathname.startsWith("/dashboard");

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