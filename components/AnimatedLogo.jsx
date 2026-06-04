import { useEffect, useState } from "react";

export default function AnimatedLogo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timings = [
      0,    // initial
      600,  // أ
      1200, // ب
      1800, // ج
      2400, // د
      3200, // garder أ ج
      4200, // afficher AA
    ];

    timings.forEach((t, i) => {
      setTimeout(() => setStep(i), t);
    });
  }, []);

  return (
    <div className="logo-container">
      
      {/* AA */}
      {step >= 6 && (
        <div className="latin">
          A A
        </div>
      )}

      {/* Arabic Letters */}
      <div className="arabic">
        <span className={`letter ${step >= 1 ? "show" : ""}`}>أ</span>
        <span className={`letter ${step >= 2 ? "show" : ""} ${step >= 5 ? "hide" : ""}`}>ب</span>
        <span className={`letter ${step >= 3 ? "show" : ""}`}>ج</span>
        <span className={`letter ${step >= 4 ? "show" : ""} ${step >= 5 ? "hide" : ""}`}>د</span>
      </div>

    </div>
  );
}