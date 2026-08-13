import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signInAnonymously, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { meldeKontoErforderlich, sollGateZeigen } from './gastGrenze';

interface AuthContextType {
  user: User | null;
  profileData: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: any) => Promise<void>;
}

let cachedAccessToken: string | null = null;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profileData: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logOut: async () => {},
  refreshProfile: async () => {},
  updateProfileData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const newData = docSnap.data();
        setProfileData((prevData: any) => {
          if (prevData && prevData.updatedAt && newData.updatedAt) {
            if (new Date(prevData.updatedAt) > new Date(newData.updatedAt)) {
              return prevData;
            }
          }
          return newData;
        });
      } else {
        setProfileData(null);
      }
    } catch (error: any) {
      console.warn("Failed to fetch profile during fetchProfile", error);
      setProfileData(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const updateProfileData = async (data: any) => {
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        const updatePayload = {
          ...data,
          updatedAt: new Date().toISOString()
        };
        await updateDoc(docRef, updatePayload);
        // DAT-07/DAT-08: Der lokale Zustand wird erst NACH dem erfolgreichen
        // Schreibvorgang gesetzt. Vorher stand er davor bzw. wurde auch im
        // Fehlerfall gesetzt, und der Fehler ging in ein `console.warn`.
        // Folge: Jeder von den Firestore-Regeln abgelehnte Schreibvorgang
        // sah in der Oberflaeche wie ein Erfolg aus — bis zum Neuladen.
        // Genau so blieben `theme`, `moodHistory` und die vorgetaeuschte
        // Verifizierung monatelang unbemerkt.
        setProfileData((prev: any) => prev ? { ...prev, ...updatePayload } : null);
      } catch (error) {
        // ── GAST-02 (14.08.2026, im Browser beobachtet) ─────────────────
        // Als Gast lehnt `firestore.rules` das Update ab (`allow update`
        // verlangt `!istGast()`). Die Regel ist richtig — falsch war, dass
        // davon nur eine rote Zeile in der Konsole ankam. Der Mensch davor
        // aenderte etwas, es passierte nichts, und niemand sagte warum.
        //
        // Jetzt muendet die Regelablehnung in dasselbe Registrierungs-Gate
        // wie die API-Antwort 403. Ein zweiter Dialog waere eine zweite
        // Wahrheit; es gibt nur eine.
        if (sollGateZeigen(error, user)) {
          meldeKontoErforderlich({
            herkunft: 'firestore',
            vorgang: 'Profil speichern',
          });
        } else {
          console.error("Profil konnte nicht gespeichert werden", error);
        }
        throw error;   // die aufrufende Ansicht muss es erfahren
      }
    }
  };

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            cachedAccessToken = credential.accessToken;
          }
        }
      } catch (error) {
        console.error("Redirect login error:", error);
      }
    };
    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // BEFUND 10.08.2026, im HAR auf die Millisekunde belegt:
        // Hier fehlte setLoading(true). setUser wirkt sofort, das Profil
        // wird aber asynchron geholt. Dazwischen lag ein Fenster von rund
        // 450 ms, in dem user gesetzt, loading bereits false (aus dem
        // abgemeldeten Zustand) und profileData noch null war.
        //
        // In App.tsx schaltete profileData === null das Alters- und
        // Einwilligungs-Gate AB. Das Dashboard hing sich in diesem Fenster
        // ein und feuerte 22 Anfragen ab -- alle beantwortet mit
        // 403 alter_fehlt, weil der Server richtig prueft. Das Gate
        // erschien danach nie.
        //
        //   09:55:17.793  accounts:signUp
        //   09:55:18.248  22 Dashboard-Anfragen, alle 403
        //
        // setLoading(true) haelt die App auf dem Ladebildschirm, bis das
        // Profil da ist. Damit gibt es keinen Zustand mehr, in dem
        // gerendert wird, ohne dass der Profilstand bekannt ist.
        setLoading(true);
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              localStorage.setItem("userInterests", JSON.stringify(data.interests || []));
              localStorage.setItem("userGoal", data.goal || "undecided");
              if (data.bio) {
                  localStorage.setItem("klar_user_bio", data.bio);
              }
              setProfileData((prevData: any) => {
                if (prevData && prevData.updatedAt && data.updatedAt) {
                  if (new Date(prevData.updatedAt) > new Date(data.updatedAt)) {
                    return prevData;
                  }
                }
                return data;
              });
            }
          } else {
            // Create initial profile
            const localInterestsStr = localStorage.getItem("userInterests");
            const localInterests = localInterestsStr ? JSON.parse(localInterestsStr) : [];
            const localGoal = localStorage.getItem("userGoal") || "undecided";
            const localBio = localStorage.getItem("klar_user_bio") || "";
            
            const newUser = {
              uid: currentUser.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              name: currentUser.displayName || 'Neu',
              bio: localBio,
              interests: localInterests,
              goal: localGoal,
              // DSG-02 (Final Audit 08.08.2026): Hier stand `isAdult: true`.
              // Nichts wurde geprüft — die App behauptete die Volljährigkeit
              // über sich selbst, und niemand hätte es je bemerkt. In einer
              // Dating-App ist das der Befund mit den größten Folgen.
              //
              // Das Feld wird jetzt ausschließlich vom Server gesetzt
              // (POST /api/account/alter) und ist in firestore.rules für den
              // Client gesperrt. Ein Profil ohne `isAdult` ist der richtige
              // Ausgangszustand: unbekannt, nicht „ja".
              smartMatchAlerts: true
            };
            await setDoc(docRef, newUser);
            setProfileData(newUser);
          }
        } catch (error: any) {
          console.warn("Failed to fetch/create profile, offline?", error);
          setProfileData(null);
        }
      } else {
        setProfileData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    try {
      // First try popup
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        // Fallback to redirect
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Error signing in as guest", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // FE-03 / FE-04 (Final Audit 08.08.2026) — Abmelden räumt auf
  //
  // BEFUND: `logOut` rief `signOut(auth)` und sonst nichts. Im localStorage
  // blieben `klar_journal_entries`, `klar_mood_history`, `klar_user_bio`,
  // `klar_chat_draft_*` und Weiteres liegen — im Klartext. Auf einem
  // geteilten Gerät sah die nächste angemeldete Person die Journaleinträge,
  // Stimmungen und Entwürfe der vorherigen.
  //
  // WAS DAS NICHT LÖST: Solange jemand angemeldet ist, liegen diese Daten
  // weiterhin unverschlüsselt im Browser. Jede Erweiterung mit Lesezugriff
  // kommt daran. FE-04 ist damit eingegrenzt, nicht erledigt — die Lösung
  // wäre, intime Freitexte gar nicht clientseitig zu halten.
  // ═════════════════════════════════════════════════════════════════════════

  // GEGENPRÜFUNG 09.08.2026: Die erste Fassung räumte nach den Präfixen
  // `klar_`, `user` und `theme` — und der Kommentar darüber behauptete
  // „Alles, was zu dieser App gehört". Nachgezählt: 13 Schlüssel blieben
  // liegen, darunter `mustHaveInterests`, `noGoStrictness`,
  // `datePreferences`, `profile_icebreakers` und `hasCompletedOnboarding`.
  // Auf dem geteilten Gerät — dem Fall, den der Kommentar selbst beschreibt —
  // hätte die nächste Person die Vorlieben und KI-Icebreaker der vorigen
  // gesehen und wäre am Onboarding vorbeigelaufen.
  //
  // Die Präfixliste war der Fehler: Sie erfasst nur, woran jemand beim
  // Schreiben gedacht hat. Diese Herkunft gehört der App allein, also wird
  // alles geräumt. Ein Schlüssel, der überleben soll, muss ausdrücklich in
  // BEHALTEN stehen — und dann fällt beim Lesen auf, warum.
  const BEHALTEN: string[] = [
    // Die Entscheidung zu Fehlerberichten wird von Sentry beim Seitenstart
    // gelesen, lange vor jeder Anmeldung. Sie ist keine Nutzerdatum, sondern
    // eine Verarbeitungssperre — sie zu löschen hiesse, im Zweifel wieder
    // zu senden. Der Standard ohne diesen Schlüssel ist „nein".
    'klar_einw_fehlerberichte',
  ];

  const raeumeLokaleDaten = () => {
    try {
      const bewahrt = new Map<string, string>();
      for (const k of BEHALTEN) {
        const v = localStorage.getItem(k);
        if (v !== null) bewahrt.set(k, v);
      }
      localStorage.clear();
      bewahrt.forEach((v, k) => localStorage.setItem(k, v));
      sessionStorage.clear();

      // Die Warteschlange für Offline-Aktionen liegt in IndexedDB und
      // enthält die Nutzlasten der noch nicht gesendeten Aufrufe.
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase('klar-offline-db');
      }
    } catch (e) {
      // Privater Modus oder volles Kontingent. Die Abmeldung darf daran
      // nicht scheitern — sonst bliebe die Person angemeldet UND die Daten
      // lägen weiterhin da.
      console.error("Aufräumen beim Abmelden fehlgeschlagen", e);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      cachedAccessToken = null;
    } catch (error) {
      console.error("Error signing out", error);
    } finally {
      // Auch wenn signOut fehlschlägt: Die lokalen Daten sind dann erst
      // recht das Problem.
      raeumeLokaleDaten();
    }
  };

  return (
    <AuthContext.Provider value={{ user, profileData, loading, signInWithGoogle, signInAsGuest, signInWithEmail, signUpWithEmail, logOut, refreshProfile, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};
