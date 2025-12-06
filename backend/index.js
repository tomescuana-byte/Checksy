const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend functioneaza OKI");
});

//organizator
app.post("/register", async (req, res) => {
    try {
        const { nume, prenume, email, parola } = req.body;

        const exista = await prisma.organizator.findUnique({
            where: { email }
        });

        if (exista) {
            return res.status(400).json({ message: "email déjà utilisé" });
        }
        const organizator = await prisma.organizator.create({
            data: { nume, prenume, email, parola }
        });

        res.json(organizator);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error 404" });
    }
});

//login
app.post("/login", async (req, res) => {
    try {
        const { email, parola } = req.body;

        const user = await prisma.organizator.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario inexistente!" });
        }

        if (user.parola !== parola) {
            return res.status(400).json({ message: "Password errata!" });
        }

        res.json({ message: "Autentificare reusita!", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare server" });
    }
});

app.post("/grupuri", async (req, res) => {
    try {
        const { nume, organizatorId } = req.body;

        const grup = await prisma.grupEvenimente.create({
            data: { 
                nume,
                organizatorId: Number(organizatorId)
            }
        });

        res.json(grup);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare server" });
    }
});


app.post("/evenimente", async (req, res) => {
    try {
        const { titlu, data, grupEvenimenteId } = req.body;

        const codUnic = generateCode(); 

        const eveniment = await prisma.eveniment.create({
            data: {
                titlu,
                data: new Date(data),
                grupEvenimenteId: Number(grupEvenimenteId),
                codAcces: codUnic
            }
        });

        res.json(eveniment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare la crearea evenimentului" });
    }
});

app.post("/checkin", async (req, res) => {
    try {
        const { codAcces, nume, prenume, email } = req.body;

      
        const eveniment = await prisma.eveniment.findUnique({
            where: { codAcces }
        });

        if (!eveniment) {
            return res.status(404).json({ message: "Cod de acces invalid!" });
        }

       
        let participant = await prisma.participant.findFirst({
            where: {
                nume,
                prenume,
                email
            }
        });

      
        if (!participant) {
            participant = await prisma.participant.create({
                data: { nume, prenume, email }
            });
        }

        const prezenta = await prisma.prezenta.create({
            data: {
                participantId: participant.id,
                evenimentId: eveniment.id
            }
        });

        res.json({
            message: "Check-in reușit!",
            participant,
            prezenta
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare la check-in" });
    }
});

app.get("/evenimente/:id/prezente", async (req, res) => {
    try {
        const evenimentId = Number(req.params.id);

        const prezente = await prisma.prezenta.findMany({
            where: { evenimentId },
            include: { participant: true }
        });

        res.json(prezente);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare la obtinerea prezentei" });
    }
});

app.get("/evenimente", async (req, res) => {
    try {
        const evenimente = await prisma.eveniment.findMany();
        res.json(evenimente);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare la obținerea evenimentelor" });
    }
});

app.get("/grupuri", async (req, res) => {
    try {
        const grupuri = await prisma.grupEvenimente.findMany();
        res.json(grupuri);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare la obținerea grupurilor" });
    }
});




app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});
