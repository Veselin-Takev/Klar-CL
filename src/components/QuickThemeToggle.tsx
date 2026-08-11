import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { hapticFeedback, HAPTIC_PATTERNS } from '../lib/haptics';
import { useTheme } from './ThemeProvider';

// ═══════════════════════════════════════════════════════════════════════════
// BEFUND 11.08.2026 — der Knopf merkte sich nichts
//
// Hier stand:
//     localStorage.setItem('theme', 'dark')      bzw. 'light'
//     document.documentElement.classList.add/remove('dark')
//
// Der `ThemeProvider` liest und schreibt aber `localStorage['klar_theme']`
// (ThemeProvider.tsx:17, :54, :64, :73). Zwei verschiedene Schlüssel.
//
// Folge: Die Umschaltung wirkte sofort — die Klasse am <html> war ja
// gesetzt — und war nach dem nächsten Neuladen weg, weil der ThemeProvider
// beim Start seinen eigenen Schlüssel las und die alte Einstellung
// wiederherstellte. Zusätzlich umging der Knopf die Firestore-Synchronisierung
// (ThemeProvider.tsx:77) und die dritte Einstellung „system".
//
// Wieder derselbe Fehlertyp wie den ganzen Tag: Die Oberfläche tut so, als
// hätte sie etwas Dauerhaftes getan.
//
// JETZT über `useTheme()`. Der ThemeProvider ist die einzige Stelle, die
// den Zustand hält, die Klasse setzt, speichert und synchronisiert.
//
// ZWEITE ÄNDERUNG: Der Knopf war `fixed bottom-24 left-6 z-40` und wurde nur
// im Dashboard eingehängt — auf Profil, Chats, Coach, Tipps und im Chat gab
// es ihn gar nicht. Er ist jetzt ein gewöhnliches Kind der Systemleiste in
// `Layout` und damit auf jedem Bildschirm an derselben Stelle.
// ═══════════════════════════════════════════════════════════════════════════

export function QuickThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Welches Aussehen gerade WIRKT. Bei `theme === 'system'` steht das nicht
  // in `theme`, sondern in der Klasse am Wurzelelement — die setzt der
  // ThemeProvider aus der Geräteeinstellung. Deshalb wird sie hier gelesen
  // und nicht erraten.
  const [wirktDunkel, setWirktDunkel] = useState(false);

  useEffect(() => {
    const lesen = () => setWirktDunkel(document.documentElement.classList.contains('dark'));
    lesen();
    // Ändert der ThemeProvider die Klasse — etwa weil das Gerät bei
    // „system" auf Nachtmodus wechselt —, zieht die Beschriftung nach.
    const beobachter = new MutationObserver(lesen);
    beobachter.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => beobachter.disconnect();
  }, [theme]);

  const umschalten = () => {
    hapticFeedback(HAPTIC_PATTERNS.LIGHT_TAP);
    // Bewusst nur zwischen hell und dunkel. „system" bleibt erreichbar,
    // aber über die Einstellungen — ein Knopf mit drei Zuständen, dessen
    // dritter aussieht wie einer der ersten beiden, ist nicht bedienbar.
    setTheme(wirktDunkel ? 'light' : 'dark');
  };

  return (
    <button
      onClick={umschalten}
      className="p-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
      aria-label={wirktDunkel ? 'Zu hellem Aussehen wechseln' : 'Zu dunklem Aussehen wechseln'}
      title={wirktDunkel ? 'Helles Aussehen' : 'Dunkles Aussehen'}
    >
      {wirktDunkel ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
