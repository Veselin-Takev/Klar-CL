// ═══════════════════════════════════════════════════════════════════════════
// ANMELDESEITE — alle drei Wege auf einer Seite (13.08.2026)
//
// ── DER BEFUND ────────────────────────────────────────────────────────────
// „Mit Google anmelden" und „Als Gast fortfahren" waren nicht entfernt — sie
// waren nur nicht erreichbar. Die Seite hatte zwei Zustaende:
//
//   isEmailLogin === false  ->  drei Knoepfe: E-Mail, Google, Gast
//   isEmailLogin === true   ->  NUR das E-Mail-Formular
//
// Wer einmal auf „Mit E-Mail anmelden" geklickt hatte, sah Google und Gast
// nicht mehr. Zurueck ging es allein ueber „Zurueck zur Auswahl" — und genau
// dieser Link stand ganz unten in einem Behaelter mit `h-[100dvh]` und
// `overflow-hidden`. Auf einem Bildschirm, der zu niedrig war, wurde er
// ABGESCHNITTEN statt scrollbar zu sein. Der Weg zurueck war damit weg.
//
// Das ist derselbe Fehlertyp wie am 10.08.2026 bei den 23 Endpunkten unter
// der SPA-Auslieferung: Der Code war vorhanden und richtig, nur unerreichbar.
// Ein Zustand, aus dem es keinen sichtbaren Rueckweg gibt, ist eine Sackgasse.
//
// ── DIE ENTSCHEIDUNG ──────────────────────────────────────────────────────
// Der Zustand `isEmailLogin` ist ersatzlos entfallen. Alle drei Wege stehen
// gleichzeitig da: das E-Mail-Formular oben, darunter Google und Gast. Kein
// Umschalten, kein Rueckweg noetig — ein Rueckweg, den es nicht gibt, kann
// auch nicht abgeschnitten werden.
//
// `isSignUp` bleibt. Der Wechsel zwischen Anmelden und Registrieren aendert
// nur die Beschriftung und das Ziel des Formulars, nicht den Seitenaufbau.
//
// ── UND DIE URSACHE DES ABSCHNEIDENS ──────────────────────────────────────
// `h-[100dvh]` + `overflow-hidden` -> `min-h-[100dvh]` ohne `overflow-hidden`.
// Feste Hoehe plus Ueberlaufsperre heisst: Was nicht passt, ist verloren.
// Mindesthoehe heisst: Was nicht passt, waechst und wird scrollbar. Die Seite
// ist jetzt laenger als vorher, deshalb war diese Aenderung zwingend und
// nicht kosmetisch.
//
// Login wird in `App.tsx` (Zeile ~475, `if (!user) return <Login />`) VOR der
// App-Huelle mit `overflow-hidden` zurueckgegeben. Dieser Behaelter hier ist
// also der aeusserste — die Korrektur wirkt.
// ═══════════════════════════════════════════════════════════════════════════
import { useAuth } from "../lib/AuthContext";
import { Sparkles, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const { signInWithGoogle, signInAsGuest, signInWithEmail, signUpWithEmail } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') {
        setError("Anmeldung abgebrochen.");
      } else {
        setError("Login fehlgeschlagen. Bitte versuche es erneut.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInAsGuest();
    } catch (e: any) {
      if (e?.code === 'auth/admin-restricted-operation') {
        setError("Gast-Anmeldung ist in Firebase nicht aktiviert. Bitte aktiviere 'Anonymous' in der Firebase Console unter Authentication.");
      } else {
        setError("Gast-Login fehlgeschlagen. Bitte versuche es erneut.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError("Bitte fülle alle Felder aus.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        if (isSignUp) {
            await signUpWithEmail(email, password);
        } else {
            await signInWithEmail(email, password);
        }
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            setError("Diese E-Mail wird bereits verwendet.");
        } else if (e.code === 'auth/invalid-credential') {
            setError("Falsche E-Mail oder Passwort.");
        } else if (e.code === 'auth/weak-password') {
            setError("Das Passwort ist zu schwach (mindestens 6 Zeichen).");
        } else if (e.code === 'auth/operation-not-allowed') {
            setError("E-Mail/Passwort-Anmeldung ist in Firebase nicht aktiviert. Bitte in der Firebase Console aktivieren.");
        } else {
            setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    // `min-h-[100dvh]` statt `h-[100dvh]`, und KEIN `overflow-hidden`.
    // Siehe die Begruendung im Kopf dieser Datei.
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center bg-light-bg px-6 py-10 shadow-md dark:bg-dark-bg">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-20 h-20 bg-brand/10 dark:bg-brand-light/10 text-brand dark:text-brand-light rounded-3xl flex items-center justify-center mb-6 shadow-sm rotate-3">
          <Sparkles size={40} />
        </div>

        <h1 className="text-4xl font-serif text-stone-900 dark:text-stone-100 mb-3 text-center">Willkommen bei Klar</h1>
        <p className="text-stone-500 dark:text-stone-400 text-center mb-8">
          Wertebasiertes Dating. Sicher, transparent und authentisch.
        </p>

        <div className="w-full space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Weg 1: E-Mail. Steht oben, weil es der einzige Weg mit Eingabe ist. */}
          <form onSubmit={handleEmailSubmit} className="space-y-4 w-full">
              <input
                  type="email"
                  placeholder="E-Mail Adresse"
                  // `aria-label`, weil ein Platzhalter allein keine Beschriftung
                  // ist: Er verschwindet bei der Eingabe und wird von
                  // Vorleseprogrammen nicht zuverlaessig als Feldname gemeldet.
                  aria-label="E-Mail Adresse"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  disabled={isLoading}
              />
              <input
                  type="password"
                  placeholder="Passwort"
                  aria-label="Passwort"
                  // Beim Registrieren `new-password`, beim Anmelden
                  // `current-password` — sonst bietet der Passwortspeicher des
                  // Browsers beim Registrieren das alte Passwort an.
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand"
                  disabled={isLoading}
              />
              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-brand text-white rounded-2xl font-medium text-lg flex items-center justify-center gap-3 hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-50"
              >
                  {isLoading ? "Wird geladen..." : (isSignUp ? "Registrieren" : "Anmelden")}
              </button>
              <div className="text-center">
                  <button
                      type="button"
                      onClick={() => {
                          setIsSignUp(!isSignUp);
                          setError(null);
                      }}
                      className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 text-sm"
                  >
                      {isSignUp ? "Bereits ein Konto? Hier anmelden" : "Noch kein Konto? Hier registrieren"}
                  </button>
              </div>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-stone-200 dark:border-stone-700"></div>
            <span className="flex-shrink-0 mx-4 text-stone-400 text-sm">oder</span>
            <div className="flex-grow border-t border-stone-200 dark:border-stone-700"></div>
          </div>

          {/* Weg 2: Google. */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-2xl font-medium text-lg flex items-center justify-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? "Wird geladen..." : "Mit Google anmelden"}
          </button>

          {/* Weg 3: Gast. */}
          <button
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full py-4 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-2xl font-medium text-lg flex items-center justify-center gap-3 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <User size={20} aria-hidden="true" />
            {isLoading ? "Wird geladen..." : "Als Gast fortfahren"}
          </button>
        </div>

        <div className="mt-8 flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs">
          <ShieldCheck size={14} className="text-green-600 dark:text-green-500" aria-hidden="true" />
          <span>Verschlüsselte Verbindung.</span>
        </div>
      </div>
    </div>
  );
}
