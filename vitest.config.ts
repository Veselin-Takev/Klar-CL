import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],

    // ═══════════════════════════════════════════════════════════════════
    // BEFUND 10.08.2026: Hier stand kein include/exclude. Vitest benutzte
    // seine Voreinstellung und fing damit BEIDE Endungen ein -- auch die
    // Dateien, die fuer den Node-eigenen Testlaeufer geschrieben sind.
    // Ergebnis: "Cannot bundle built-in module node:test", 3 von 7
    // Testdateien scheiterten. Nicht am Inhalt, sondern daran, dass der
    // falsche Laeufer sie anfasste.
    //
    // Das Projekt hat bereits zwei Konventionen, sie standen nur nirgends:
    //   *.spec.ts      -> node --test ueber tsx   (pure, kiPolitik, rules)
    //   *.test.ts(x)   -> vitest                  (criticalPaths,
    //                                              stressTest, theme,
    //                                              AdminDashboard)
    //
    // Warum zwei Laeufer ueberhaupt: Die .spec-Dateien pruefen reine
    // Logik und Firestore-Regeln -- ohne Browser, ohne jsdom, ohne
    // Uebersetzungsschritt. Die .test-Dateien brauchen jsdom und React.
    // ═══════════════════════════════════════════════════════════════════
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
