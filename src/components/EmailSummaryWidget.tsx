import { useState, useEffect } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";
import { getAccessToken } from "../lib/AuthContext";
import { useAuth } from "../lib/AuthContext";
import { melde } from "../lib/fehler";

export function EmailSummaryWidget() {
  const { user } = useAuth();
  const [hasToken, setHasToken] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkToken = async () => {
      const token = await getAccessToken();
      setHasToken(!!token);
    };
    checkToken();
    
    // Check periodically if token was acquired (e.g. after login)
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendEmail = async () => {
    if (!window.confirm("Möchtest du dir jetzt eine Zusammenfassung deiner Dating-Fortschritte per E-Mail senden lassen?")) {
      return;
    }

    setIsSending(true);
    setError("");
    setSuccess(false);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Bitte melde dich erneut mit Google an, um die E-Mail-Berechtigung zu erteilen.");
      }

      // We'll send the email to the currently authenticated user's email if available,
      // otherwise we query their profile or just use 'me'.
      const toEmail = user?.email || "me";

      const dailyConversations = localStorage.getItem("stats_conversations_started") || "0";
      const profileChecks = localStorage.getItem("stats_profile_checks") || "0";

      const emailBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4f46e5;">Deine Klar Dating-Zusammenfassung</h2>
          <p>Hallo!</p>
          <p>Hier ist dein aktueller Fortschritt auf Klar, wo Qualität vor Quantität steht:</p>
          <ul>
            <li><strong>Tiefgründige Gespräche gestartet:</strong> ${dailyConversations}</li>
            <li><strong>KI-Profil-Checks durchgeführt:</strong> ${profileChecks}</li>
          </ul>
          <p>Bleib dran und konzentriere dich auf authentische Verbindungen!</p>
          <br/>
          <p>Dein Klar-Team</p>
        </div>
      `;

      const emailLines = [
        `To: ${toEmail}`,
        'Subject: =?utf-8?B?' + btoa(unescape(encodeURIComponent('Deine tägliche Klar-Zusammenfassung'))) + '?=',
        'Content-Type: text/html; charset=utf-8',
        '',
        emailBody
      ];

      const raw = btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });

      if (!res.ok) {
        const errData = await res.text().then(text => text ? JSON.parse(text) : {});
        throw new Error(errData.error?.message || "Fehler beim Senden der E-Mail");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      melde("EmailSummaryWidget", err);
      setError(err.message || "Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
          <Mail size={20} />
        </div>
        <div>
          <h3 className="font-serif font-medium text-lg text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            E-Mail-Zusammenfassung
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Erhalte deine Fortschritte ins Postfach</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!hasToken ? (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Bitte logge dich über dein Profil mit Google ein, um diese Funktion zu aktivieren.
            </p>
          </div>
        ) : (
          <button
            onClick={sendEmail}
            disabled={isSending}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {isSending ? (
              <>
                <span className="w-4 h-4 rounded-full bg-current opacity-50 animate-pulse"></span>
                Sende...
              </>
            ) : success ? (
              <>
                <Check size={16} />
                Gesendet!
              </>
            ) : (
              <>
                <Mail size={16} />
                Jetzt senden
              </>
            )}
          </button>
        )}

        {error && (
          <p className="text-xs text-red-500 font-medium px-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
