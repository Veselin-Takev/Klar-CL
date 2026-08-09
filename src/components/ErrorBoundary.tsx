import { Component } from "react";
import * as Sentry from "@sentry/react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    eventId: null
  };

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Create debug dump
    const debugDump = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      navigator: {
        userAgent: navigator.userAgent,
        onLine: navigator.onLine,
        language: navigator.language
      },
      localStorage: Object.keys(localStorage).reduce((acc: any, key) => {
        // Exclude sensitive tokens if needed, but for debug dump we might include standard keys
        if (!key.toLowerCase().includes('token') && !key.toLowerCase().includes('key')) {
          acc[key] = localStorage.getItem(key);
        }
        return acc;
      }, {})
    };

    console.log("[Debug Dump]", debugDump);

    const eventId = Sentry.captureException(error, { 
      contexts: { 
        react: { componentStack: errorInfo.componentStack },
        appState: debugDump
      },
      tags: {
        offline: !navigator.onLine
      }
    });

    this.setState({ eventId });
  }

  public static getDerivedStateFromError(_: Error): Partial<State> {
    return { hasError: true };
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[100dvh] p-6 text-center bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
          <h2 className="text-xl font-bold mb-2">Ein unerwarteter Fehler ist aufgetreten.</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-2">
            Wir haben das Problem erfasst und arbeiten an einer Lösung. Ein Debug-Dump wurde sicher übermittelt.
          </p>
          {this.state.eventId && (
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-6 font-mono">
              Fehler-ID: {this.state.eventId}
            </p>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-full font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            App neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
