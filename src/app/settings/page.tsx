export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">Konfiguriere Xeron lokal fuer KI, Datenbank und Uploads.</p>
      </header>

      <div className="space-y-6">
        <div className="glass-card rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">KI-Assistent (Ollama lokal)</h2>
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Ollama installieren: <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="text-primary hover:underline">ollama.ai</a></li>
            <li>Modell laden: <code className="rounded bg-muted px-1 py-0.5 text-xs">ollama pull llama3</code></li>
            <li>Server starten: <code className="rounded bg-muted px-1 py-0.5 text-xs">ollama serve</code></li>
            <li>In Xeron den KI-Chat auf <a href="/ai" className="text-primary hover:underline">/ai</a> testen</li>
          </ol>
        </div>

        <div className="glass-card rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Datenmodus</h2>
          <p className="text-sm text-muted-foreground">
            Xeron laeuft im Demo-User-Modus ohne Login. Alle Daten werden lokal in SQLite gespeichert und sind fuer spaetere Auth-Integration vorbereitet.
          </p>
        </div>
      </div>
    </div>
  );
}

