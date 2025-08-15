"use client";
import { useState } from "react";

declare global {
  interface Window {
    grecaptcha: any;
    grecaptchaEnterpriseReady?: boolean;
  }
}

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!; // Your Enterprise v3 site key
const API_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_API_KEY!; // Your Google Cloud API Key

const Page = () => {
  const [status, setStatus] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const loadRecaptchaScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.grecaptchaEnterpriseReady) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.grecaptcha && window.grecaptcha.enterprise) {
          window.grecaptcha.enterprise.ready(() => {
            window.grecaptchaEnterpriseReady = true;
            resolve();
          });
        } else {
          reject("grecaptcha.enterprise not available after script load.");
        }
      };
      script.onerror = () =>
        reject("Failed to load reCAPTCHA Enterprise script.");
      document.body.appendChild(script);
    });
  };

  const runRecaptcha = async (): Promise<string | null> => {
    console.log(window.location);
    try {
      setStatus("⚙️ Executing reCAPTCHA Enterprise v3...");
      const token = await window.grecaptcha.enterprise.execute(siteKey, {
        action: "fuck",
      });
      setStatus("✅ Token generated successfully!");
      setToken(token);
      return token;
    } catch (error) {
      setStatus("❌ Error generating token.");
      console.error(error);
      return null;
    }
  };

  const validateToken = async () => {
    if (!token) {
      setStatus("⚠️ No token to validate. Please generate one first.");
      return;
    }
    setStatus("🔍 Validating token...");
    setScore(null);

    try {
      const projectId = "emailautomation-466308"; // Replace with your Google Cloud Project ID
      const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${API_KEY}`;

      const body = {
        event: {
          token,
          siteKey,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to validate token");
      }

      const data = await res.json();
      const riskScore = data.riskAnalysis?.score;
      setScore(riskScore);
      setStatus(`✅ Validation complete. Score: ${riskScore}`);
    } catch (error: any) {
      setStatus(`❌ Validation error: ${error.message || error}`);
      setScore(null);
    }
  };

  const handleGenerate = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatus("🔄 Loading reCAPTCHA Enterprise script...");
    setScore(null);
    setToken(null);

    try {
      await loadRecaptchaScript();
      await runRecaptcha();
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message || error}`);
      setToken(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-white bg-black/50 backdrop-blur space-y-4 p-4">
      <h1 className="text-2xl mb-6 text-center">
        Google reCAPTCHA Enterprise v3 Token Generator & Validator
      </h1>

      <button
        onClick={handleGenerate}
        disabled={isRunning}
        className="bg-blue-600 px-6 py-3 rounded-md text-lg font-semibold disabled:opacity-50 w-full max-w-xs"
      >
        {isRunning ? "Running..." : "Generate Token"}
      </button>

      <button
        onClick={validateToken}
        disabled={!token}
        className="bg-green-600 px-6 py-3 rounded-md text-lg font-semibold disabled:opacity-50 w-full max-w-xs"
      >
        Validate Token
      </button>

      {token && (
        <textarea
          // readOnly
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          className="w-[1000px] h-[500px] text-white max-w-xs p-2 rounded-md text-black resize-none"
          placeholder="Generated token will appear here"
        />
      )}

      {score !== null && <p className="text-yellow-400">Score: {score}</p>}

      <p className="mt-2 text-green-400 whitespace-pre-wrap">{status}</p>
    </div>
  );
};

export default Page;
