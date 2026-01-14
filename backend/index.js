const express = require("express");
const cors = require("cors");
const path = require("path");
const QRCode = require("qrcode");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { Parser } = require("json2csv");
const XLSX = require("xlsx");

const app = express();
const PORT = 3000;

// ------------------ utils ------------------
function calculeazaStare(start, end) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now >= s && now <= e) return "OPEN";
  return "CLOSED";
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ✅ FIX ORĂ EXPORT: format local pentru Excel/CSV (fără UTC "Z")
function formatLocalDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    `${d.getFullYear()}-` +
    `${pad(d.getMonth() + 1)}-` +
    `${pad(d.getDate())} ` +
    `${pad(d.getHours())}:` +
    `${pad(d.getMinutes())}:` +
    `${pad(d.getSeconds())}`
  );
}

// ------------------ middlewares ------------------
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

// ------------------ AUTH (organizator) ------------------
app.post("/api/register", async (req, res) => {
  try {
    const { nume, prenume, email, parola } = req.body;

    const exista = await prisma.organizator.findUnique({ where: { email } });
    if (exista) return res.status(400).json({ message: "Email deja folosit" });

    const organizator = await prisma.organizator.create({
      data: { nume, prenume, email, parola },
    });

    res.json(organizator);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare server" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, parola } = req.body;

    const user = await prisma.organizator.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "Utilizator inexistent!" });

    if (user.parola !== parola)
      return res.status(400).json({ message: "Parola greșită!" });

    res.json({ message: "Autentificare reușită!", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare server" });
  }
});

// ------------------ grupuri ------------------
app.post("/api/grupuri", async (req, res) => {
  try {
    const { nume, organizatorId } = req.body;

    const grup = await prisma.grupEvenimente.create({
      data: { nume, organizatorId: Number(organizatorId) },
    });

    res.json(grup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare server" });
  }
});

app.get("/api/grupuri", async (req, res) => {
  try {
    const grupuri = await prisma.grupEvenimente.findMany();
    res.json(grupuri);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la obținerea grupurilor" });
  }
});

// ------------------ evenimente ------------------
app.post("/api/evenimente", async (req, res) => {
  try {
    const { titlu, start, end, grupEvenimenteId } = req.body;

    const codUnic = generateCode();

    const eveniment = await prisma.eveniment.create({
      data: {
        titlu,
        start: new Date(start),
        end: new Date(end),
        grupEvenimenteId: Number(grupEvenimenteId),
        codAcces: codUnic,
        stare: "CLOSED",
      },
    });

    res.json(eveniment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la crearea evenimentului" });
  }
});

app.get("/api/evenimente", async (req, res) => {
  try {
    const evenimente = await prisma.eveniment.findMany();

    // actualizare stare pe baza timpului
    const updates = evenimente
      .map((ev) => {
        const stareNoua = calculeazaStare(ev.start, ev.end);
        if (ev.stare !== stareNoua) {
          return prisma.eveniment.update({
            where: { id: ev.id },
            data: { stare: stareNoua },
          });
        }
        return null;
      })
      .filter(Boolean);

    if (updates.length > 0) await prisma.$transaction(updates);

    const evenimenteActualizate = await prisma.eveniment.findMany();
    res.json(evenimenteActualizate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la obținerea evenimentelor" });
  }
});

app.get("/api/evenimente/cod/:codAcces", async (req, res) => {
  try {
    const { codAcces } = req.params;

    const eveniment = await prisma.eveniment.findUnique({
      where: { codAcces },
      include: { grupEvenimente: true },
    });

    if (!eveniment) return res.status(404).json({ message: "Eveniment inexistent!" });
    res.json(eveniment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la obtinerea evenimentului" });
  }
});

// ------------------ checkin ------------------
app.post("/api/checkin", async (req, res) => {
  try {
    const { codAcces, nume, prenume, email } = req.body;

    let eveniment = await prisma.eveniment.findUnique({ where: { codAcces } });
    if (!eveniment) return res.status(404).json({ message: "Cod de acces invalid!" });

    const stareNoua = calculeazaStare(eveniment.start, eveniment.end);
    if (eveniment.stare !== stareNoua) {
      eveniment = await prisma.eveniment.update({
        where: { id: eveniment.id },
        data: { stare: stareNoua },
      });
    }

    if (eveniment.stare !== "OPEN") {
      return res.status(400).json({ message: "Evenimentul este CLOSED. Check-in indisponibil." });
    }

    // caută/creează participant
    let participant = null;

    if (email && email.trim() !== "") {
      participant = await prisma.participant.findFirst({ where: { email } });
    }

    if (!participant) {
      participant = await prisma.participant.findFirst({
        where: { nume, prenume, email: null },
      });
    }

    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          nume,
          prenume,
          email: email && email.trim() !== "" ? email : null,
        },
      });
    }

    const existaPrezenta = await prisma.prezenta.findFirst({
      where: { participantId: participant.id, evenimentId: eveniment.id },
    });

    if (existaPrezenta) {
      return res.status(400).json({ message: "Participant deja înregistrat la acest eveniment!" });
    }

    const prezenta = await prisma.prezenta.create({
      data: { participantId: participant.id, evenimentId: eveniment.id },
    });

    res.json({ message: "Check-in reușit!", participant, prezenta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la check-in" });
  }
});

// ------------------ prezente ------------------
app.get("/api/evenimente/:id/prezente", async (req, res) => {
  try {
    const evenimentId = Number(req.params.id);

    let eveniment = await prisma.eveniment.findUnique({ where: { id: evenimentId } });
    if (!eveniment) return res.status(404).json({ message: "Eveniment inexistent!" });

    const stareNoua = calculeazaStare(eveniment.start, eveniment.end);
    if (eveniment.stare !== stareNoua) {
      eveniment = await prisma.eveniment.update({
        where: { id: eveniment.id },
        data: { stare: stareNoua },
      });
    }

    const prezente = await prisma.prezenta.findMany({
      where: { evenimentId },
      include: { participant: true },
    });

    res.json(prezente);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la obținerea prezențelor" });
  }
});

// ------------------ QR ------------------
app.get("/api/evenimente/:id/qr", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const ev = await prisma.eveniment.findUnique({ where: { id } });
    if (!ev) return res.status(404).json({ message: "Eveniment inexistent!" });

    const publicUrl = process.env.PUBLIC_URL;
    if (!publicUrl) {
      return res.status(400).json({
        error: "PUBLIC_URL lipsă în backend/.env (ex: https://xxxx.ngrok-free.dev)",
      });
    }

    const link = `${publicUrl}/checkin?code=${ev.codAcces}`;
    const qr = await QRCode.toDataURL(link);

    res.json({ codAcces: ev.codAcces, qr, link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la generarea QR" });
  }
});

// ------------------ export eveniment ------------------
app.get("/api/evenimente/:id/export", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const format = (req.query.format || "csv").toLowerCase(); // csv | xlsx

    const eveniment = await prisma.eveniment.findUnique({
      where: { id },
      include: {
        prezente: { include: { participant: true } },
        grupEvenimente: true,
      },
    });

    if (!eveniment) return res.status(404).json({ message: "Eveniment inexistent!" });

    const rows = eveniment.prezente.map((p) => ({
      evenimentId: eveniment.id,
      titluEveniment: eveniment.titlu,
      start: formatLocalDate(eveniment.start),
      end: formatLocalDate(eveniment.end),
      stare: eveniment.stare,
      grupEvenimenteId: eveniment.grupEvenimenteId,
      nume: p.participant.nume,
      prenume: p.participant.prenume,
      email: p.participant.email || "",
      momentCheckin: formatLocalDate(p.moment),
    }));

    const safeName = (eveniment.titlu || "eveniment")
      .replace(/[^\w\d\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "_");

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Prezente");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="prezente_eveniment_${id}_${safeName}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buffer);
    }

    const parser = new Parser();
    const csv = parser.parse(rows);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="prezente_eveniment_${id}_${safeName}.csv"`
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la export eveniment" });
  }
});

// ------------------ export grup ------------------
app.get("/api/grupuri/:id/export", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const format = (req.query.format || "csv").toLowerCase();

    const grup = await prisma.grupEvenimente.findUnique({
      where: { id },
      include: {
        evenimente: { include: { prezente: { include: { participant: true } } } },
      },
    });

    if (!grup) return res.status(404).json({ message: "Grup inexistent!" });

    const rows = [];
    for (const ev of grup.evenimente) {
      for (const p of ev.prezente) {
        rows.push({
          grupEvenimenteId: grup.id,
          numeGrup: grup.nume,
          evenimentId: ev.id,
          titluEveniment: ev.titlu,
          start: formatLocalDate(ev.start),
          end: formatLocalDate(ev.end),
          stare: ev.stare,
          nume: p.participant.nume,
          prenume: p.participant.prenume,
          email: p.participant.email || "",
          momentCheckin: formatLocalDate(p.moment),
        });
      }
    }

    const safeName = (grup.nume || "grup")
      .replace(/[^\w\d\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "_");

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Prezente");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="prezente_grup_${id}_${safeName}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buffer);
    }

    const parser = new Parser();
    const csv = parser.parse(rows);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="prezente_grup_${id}_${safeName}.csv"`
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la export grup" });
  }
});

// ------------------ delete eveniment ------------------
app.delete("/api/evenimente/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.prezenta.deleteMany({ where: { evenimentId: id } });
    await prisma.eveniment.delete({ where: { id } });

    res.json({ message: "Eveniment șters cu succes!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la ștergerea evenimentului" });
  }
});

// ======================================================================
//  SERVIRE REACT BUILD + QR redirect (doar cu 1 tunel ngrok)
// ======================================================================
const buildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(buildPath));

// QR -> deschide frontend cu codul completat
app.get("/checkin", (req, res) => {
  const qs = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  return res.redirect("/" + qs);
});

// fallback React pentru orice GET care NU e /api
app.get(/^(?!\/api).*/, (req, res) => {
  return res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});
