import { useEffect, useState } from "react";
import "./App.css";
import { Html5QrcodeScanner } from "html5-qrcode";


// - DEV (React pe 3001) → backend pe 3000
// - PROD / ngrok (same-origin) → ""
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (window.location.port === "3001" ? "http://localhost:3000" : "");

const API = `${API_BASE}/api`;

function App() {
  const [evenimente, setEvenimente] = useState([]);
  const [loading, setLoading] = useState(true);

  // creare eveniment (organizator)
  const [titlu, setTitlu] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [grupId, setGrupId] = useState(1);

  // check-in
  const [codAcces, setCodAcces] = useState("");
  const [nume, setNume] = useState("");
  const [prenume, setPrenume] = useState("");
  const [email, setEmail] = useState("");

  // mesaje
  const [mesaj, setMesaj] = useState("");
  const [error, setError] = useState("");

  // QR scan
  const [scanOn, setScanOn] = useState(false);

  // prezențe
  const [prezente, setPrezente] = useState([]);
  const [evenimentSelectat, setEvenimentSelectat] = useState(null);

  // scroll la checkin când vine din QR
  const [autoScroll, setAutoScroll] = useState(false);

  const loadEvenimente = () => {
    setLoading(true);
    fetch(`${API}/evenimente`)
      .then((res) => res.json())
      .then((data) => {
        setEvenimente(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadEvenimente();
  }, []);

  // dacă intri pe link cu ?code=XXXX (din QR)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setCodAcces(code);
      setAutoScroll(true);
    }
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    const el = document.getElementById("checkin-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setAutoScroll(false);
  }, [autoScroll]);

  // QR Scanner în browser
  useEffect(() => {
    if (!scanOn) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 220 },
      false
    );

    scanner.render(
      (decodedText) => {
        try {
          if (decodedText.startsWith("http")) {
            const u = new URL(decodedText);
            const code = u.searchParams.get("code");
            if (code) setCodAcces(code);
          } else {
            setCodAcces(decodedText);
          }
        } catch {
          setCodAcces(decodedText);
        }

        setScanOn(false);
        scanner.clear().catch(() => {});
      },
      () => {}
    );

    return () => scanner.clear().catch(() => {});
  }, [scanOn]);

  const handleCreateEveniment = async (e) => {
    e.preventDefault();
    setMesaj("");
    setError("");

    try {
      const res = await fetch(`${API}/evenimente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titlu,
          start,
          end,
          grupEvenimenteId: Number(grupId),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare creare eveniment");
        return;
      }

      setMesaj("Eveniment creat!");
      setTitlu("");
      setStart("");
      setEnd("");
      loadEvenimente();
    } catch {
      setError("Backend indisponibil");
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    setMesaj("");
    setError("");

    try {
      const res = await fetch(`${API}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codAcces, nume, prenume, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Eroare check-in");
        return;
      }

      setMesaj("Check-in reușit!");
      setCodAcces("");
      setNume("");
      setPrenume("");
      setEmail("");
      loadEvenimente();
    } catch {
      setError("Backend indisponibil");
    }
  };

  // Toggle QR (Arată / Ascunde)
  const toggleQr = async (evId) => {
    const ev = evenimente.find((x) => x.id === evId);

    if (ev?.qr) {
      setEvenimente((prev) =>
        prev.map((x) => (x.id === evId ? { ...x, qr: null, link: null } : x))
      );
      return;
    }

    const res = await fetch(`${API}/evenimente/${evId}/qr`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Eroare la QR");
      return;
    }

    setEvenimente((prev) =>
      prev.map((x) =>
        x.id === evId ? { ...x, qr: data.qr, link: data.link } : x
      )
    );
  };

  // Toggle prezențe
  const togglePrezente = async (evId) => {
    if (evenimentSelectat === evId) {
      setEvenimentSelectat(null);
      setPrezente([]);
      return;
    }

    const res = await fetch(`${API}/evenimente/${evId}/prezente`);
    const data = await res.json();
    setEvenimentSelectat(evId);
    setPrezente(data);
  };

  // Șterge eveniment
  const deleteEveniment = async (ev) => {
    const ok = window.confirm(`Sigur vrei să ștergi "${ev.titlu}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API}/evenimente/${ev.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Eroare la ștergere");
        return;
      }

      if (evenimentSelectat === ev.id) {
        setEvenimentSelectat(null);
        setPrezente([]);
      }

      setEvenimente((prev) => prev.filter((x) => x.id !== ev.id));
    } catch {
      alert("Backend indisponibil / eroare la ștergere");
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="title">Checksy</h1>
        <div className="subtitle">Monitorizare prezență</div>
      </header>

      <div className="grid">
        <div className="left">
          <section className="card">
            <h2 className="sectionTitle">Creare eveniment (organizator)</h2>

            <form onSubmit={handleCreateEveniment} className="form">
              <label className="label">Titlu</label>
              <input
                className="input"
                value={titlu}
                onChange={(e) => setTitlu(e.target.value)}
                required
              />

              <label className="label">Start</label>
              <input
                className="input"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />

              <label className="label">End</label>
              <input
                className="input"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />

              <label className="label">ID grup evenimente</label>
              <input
                className="input"
                type="number"
                value={grupId}
                onChange={(e) => setGrupId(e.target.value)}
                required
              />

              <button className="btn btnPrimary" type="submit">
                Creează eveniment
              </button>
            </form>

            {mesaj && <div className="toast ok">{mesaj}</div>}
            {error && <div className="toast err">{error}</div>}
          </section>

          <section className="card" id="checkin-section">
            <h2 className="sectionTitle">Check-in participant</h2>

            <div className="row">
              <button
                className="btn btnGhost"
                type="button"
                onClick={() => setScanOn((v) => !v)}
              >
                {scanOn ? "Oprește scanarea QR" : "Scanează QR"}
              </button>
            </div>

            {scanOn && <div id="qr-reader" className="qrReader" />}

            <form onSubmit={handleCheckin} className="form">
              <label className="label">Cod acces</label>
              <input
                className="input"
                value={codAcces}
                onChange={(e) => setCodAcces(e.target.value)}
                required
              />

              <div className="twoCol">
                <div>
                  <label className="label">Nume</label>
                  <input
                    className="input"
                    value={nume}
                    onChange={(e) => setNume(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Prenume</label>
                  <input
                    className="input"
                    value={prenume}
                    onChange={(e) => setPrenume(e.target.value)}
                    required
                  />
                </div>
              </div>

              <label className="label">Email (opțional)</label>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button className="btn btnPrimary" type="submit">
                Trimite check-in
              </button>
            </form>
          </section>

          {evenimentSelectat && (
            <section className="card">
              <div className="row rowBetween">
                <h2 className="sectionTitle">
                  Prezențe • eveniment #{evenimentSelectat}
                </h2>
                <button
                  className="btn btnGhost"
                  type="button"
                  onClick={() => togglePrezente(evenimentSelectat)}
                >
                  Ascunde
                </button>
              </div>

              {prezente.length === 0 && (
                <div className="muted">Nu există prezențe.</div>
              )}

              {prezente.length > 0 && (
                <div className="tableWrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nume</th>
                        <th>Prenume</th>
                        <th>Email</th>
                        <th>Moment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prezente.map((p) => (
                        <tr key={p.id}>
                          <td>{p.participant.nume}</td>
                          <td>{p.participant.prenume}</td>
                          <td>{p.participant.email || "-"}</td>
                          <td>{new Date(p.moment).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="right">
          <section className="card">
            <div className="row rowBetween">
              <h2 className="sectionTitle">Evenimente</h2>
              <button
                className="btn btnGhost"
                type="button"
                onClick={loadEvenimente}
              >
                Refresh
              </button>
            </div>

            {loading && <div className="muted">Se încarcă...</div>}
            {!loading && evenimente.length === 0 && (
              <div className="muted">Nu există evenimente.</div>
            )}

            <div className="eventList">
              {evenimente.map((ev) => (
                <div key={ev.id} className="eventCard">
                  <div className="row rowBetween">
                    <div className="eventTitle">{ev.titlu}</div>
                    <div
                      className={
                        ev.stare === "OPEN" ? "badge open" : "badge closed"
                      }
                    >
                      {ev.stare}
                    </div>
                  </div>

                  <div className="kv">
                    <span className="k">Cod:</span>{" "}
                    <span className="v">{ev.codAcces}</span>
                  </div>

                  <div className="kv">
                    <span className="k">Interval:</span>{" "}
                    <span className="v">
                      {new Date(ev.start).toLocaleString()}
                      {ev.end && ` – ${new Date(ev.end).toLocaleString()}`}
                    </span>
                  </div>

                  <div className="btnRow">
                    <button
                      className="btn btnSmall"
                      type="button"
                      onClick={() => toggleQr(ev.id)}
                    >
                      {ev.qr ? "Ascunde QR" : "Arată QR"}
                    </button>

                    <button
                      className="btn btnSmall btnGhost"
                      type="button"
                      onClick={() => togglePrezente(ev.id)}
                    >
                      {evenimentSelectat === ev.id
                        ? "Ascunde prezențe"
                        : "Vezi prezențe"}
                    </button>

                    <button
                      className="btn btnSmall"
                      type="button"
                      onClick={() => deleteEveniment(ev)}
                      style={{
                        background: "linear-gradient(135deg, #ff4f4f, #b42020)",
                      }}
                    >
                      Șterge
                    </button>
                  </div>

                  {ev.qr && (
                    <div className="qrBox">
                      <img src={ev.qr} alt="QR" className="qrImg" />
                      {ev.link && (
                        <div className="muted" style={{ marginTop: 8 }}>
                          Link din QR:{" "}
                          <span style={{ wordBreak: "break-all" }}>{ev.link}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="exportRow">
                    <a
                      className="link"
                      href={`${API}/evenimente/${ev.id}/export?format=csv`}
                    >
                      CSV (ev)
                    </a>
                    <a
                      className="link"
                      href={`${API}/evenimente/${ev.id}/export?format=xlsx`}
                    >
                      XLSX (ev)
                    </a>
                    <a
                      className="link"
                      href={`${API}/grupuri/${ev.grupEvenimenteId}/export?format=csv`}
                    >
                      CSV (grup)
                    </a>
                    <a
                      className="link"
                      href={`${API}/grupuri/${ev.grupEvenimenteId}/export?format=xlsx`}
                    >
                      XLSX (grup)
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="footer">
        QR-ul conține link cu <b>?code=XXXX</b> → completează automat codul la
        check-in.
      </footer>
    </div>
  );
}

export default App;
