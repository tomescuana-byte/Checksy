# Checksy
Aplicatie web monitorizare prezenta

 Checksy – Backend RESTful

Checksy este o aplicație web pentru monitorizarea prezenței la evenimente.
Backend-ul oferă un API REST care permite organizatorilor să creeze grupuri de evenimente, să adauge evenimente, să genereze coduri de acces și să înregistreze prezența participanților prin check-in.

Backend realizat în Node.js + Express + Prisma ORM cu stocare în MySQL.

 1. Funcționalități principale

Înregistrare organizator

Autentificare organizator

Creare grupuri de evenimente

Creare eveniment cu generare automată a codului de acces

Check-in participanți

Listare prezențe pentru un eveniment

Listare evenimente

 2. Tehnologii folosite

Node.js

Express.js

Prisma ORM

MySQL

Postman (testare API)

 3. Instrucțiuni de instalare și rulare
3.1. Clonarea proiectului
git clone https://github.com/tomescuana-byte/Checksy.git
cd Checksy/backend

3.2. Instalarea dependențelor
npm install

3.3. Configurarea bazei de date

Creează fișierul .env în folderul backend:

DATABASE_URL="mysql://root:PAROLA_TA@localhost:3306/checksy_db"

3.4. Crearea tabelelor
npx prisma migrate dev

3.5. Pornirea serverului
node index.js


Serverul rulează la adresa:

http://localhost:3000

 4. Endpoint-uri API
4.1. POST /register

Creează un organizator.

Body:

{
  "nume": "Clim",
  "prenume": "Antonio",
  "email": "clim@antonio.com",
  "parola": "1234"
}

4.2. POST /login

Autentificare organizator.

Body:

{
  "email": "clim@antonio.com",
  "parola": "1234"
}

4.3. POST /grupuri

Creează un grup de evenimente.

Body:

{
  "nume": "Evenimente ASE",
  "organizatorId": 1
}

4.4. POST /evenimente

Creează eveniment + generează automat codAcces.

Body:

{
  "titlu": "Hackathon ASE",
  "data": "2025-12-20T10:00:00.000Z",
  "grupEvenimenteId": 1
}

4.5. POST /checkin

Înregistrează prezența unui participant.

Body:

{
  "codAcces": "N6KPFE",
  "nume": "Tomescu",
  "prenume": "Annie",
  "email": "annie.tomescu@gmail.com"
}

4.6. GET /evenimente/:id/prezente

Listează toți participanții unui eveniment.

4.7. GET /evenimente

Listează toate evenimentele.

4.8. GET /grupuri

Listează toate grupurile de evenimente.

 5. Structura proiectului
backend/
 ├── index.js
 ├── package.json
 ├── prisma/
 │    ├── schema.prisma
 │    └── migrations/
 ├── .env
 └── README.md

 6. Starea proiectului (Etapa 2)

Backend REST complet funcțional

Prisma + MySQL configurate

Generare cod de acces activă

Endpoint-uri testate în Postman

Documentație de rulare inclusă

Proiect versionat în GitHub

