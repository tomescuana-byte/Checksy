# Checksy
Aplicatie web monitorizare prezenta

 Checksy – Backend RESTful

Checksy este un serviciu REST pentru gestionarea prezenței la evenimente.
Permite crearea organizatorilor, grupurilor de evenimente, evenimentelor, coduri generate automat și check-in pentru participanți.

📥 Instalare & Setup

Urmărește pașii de mai jos pentru instalarea și rularea backend-ului.

1. Clonează repository-ul
git clone https://github.com/tomescuana-byte/Checksy.git
cd Checksy/backend

2. Instalează pachetele necesare
npm install

3. Configurează conexiunea la baza de date

Creează fișierul .env în folderul backend:

DATABASE_URL="mysql://root:PAROLA_TA@localhost:3306/checksy_db"


Înlocuiește PAROLA_TA cu parola reală de la MySQL.

4. Creează tabelele în baza de date (Prisma migrate)
npx prisma migrate dev

5. Pornește serverul
node index.js


Serverul va rula la:

http://localhost:3000

🔌 API Endpoints
▶ Register organizer

POST /register

Body:

{
  "nume": "Clim",
  "prenume": "Antonio",
  "email": "clim@antonio.com",
  "parola": "1234"
}

▶ Login

POST /login

{
  "email": "clim@antonio.com",
  "parola": "1234"
}

▶ Create group

POST /grupuri

{
  "nume": "Evenimente ASE",
  "organizatorId": 1
}

▶ Create event (codAcces se generează automat)

POST /evenimente

{
  "titlu": "Hackathon ASE",
  "data": "2025-12-20T10:00:00.000Z",
  "grupEvenimenteId": 1
}

▶ Check-in participant

POST /checkin

{
  "codAcces": "N6KPFE",
  "nume": "Tomescu",
  "prenume": "Annie",
  "email": "annie.tomescu@gmail.com"
}

📦 Structura proiectului
backend/
 ├── index.js
 ├── prisma/
 │    ├── schema.prisma
 │    └── migrations/
 ├── package.json
 ├── .env
 └── README.md

📘 Usage

Poți testa API-ul folosind Postman.
Importă request-urile și trimite payload-uri JSON conform exemplelor de mai sus.

👩‍💻 Status proiect

✓ API REST funcțional
✓ Bază de date configurată
✓ Cod acces generat automat
✓ Endpoint-uri testate
✓ Documentație de rulare inclusă

