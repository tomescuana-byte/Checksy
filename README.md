# Checksy – Aplicație web pentru monitorizarea prezenței

## Descriere
Checksy este o aplicație web de tip **Single Page Application (SPA)** care permite organizatorilor să gestioneze evenimente și să monitorizeze prezența participanților în timp real, folosind coduri de acces (text sau QR).

Aplicația poate fi accesată din browser, atât de pe desktop, cât și de pe dispozitive mobile sau tablete.

## Funcționalități

### Organizator de evenimente (OE)
- Crearea unui **grup de evenimente** (unul singur sau evenimente recurente).
- Fiecare eveniment are o stare:
  - `CLOSED` – înainte și după desfășurare
  - `OPEN` – în intervalul de timp programat
- Generarea automată a unui **cod de acces** pentru fiecare eveniment:
  - cod text
  - cod QR
- Afișarea codului pentru participanți (ex: proiector).

### Participanți
- Confirmarea prezenței prin:
  - scanare cod QR cu telefonul
  - introducere cod text
- Înregistrarea automată a orei de prezență.

### Monitorizare și export
- Vizualizarea listei de participanți prezenți, cu momentul confirmării.
- Export date în:
  - **CSV**
  - **XLSX**
pentru:
  - un eveniment
  - un grup de evenimente

## Tehnologii utilizate
- Frontend: HTML, CSS, JavaScript (SPA)
- Backend: (ex: Node.js / Express) *(completezi ce ai tu)*
- Bază de date: (ex: MongoDB / SQLite / MySQL)
- Generare QR: (ex: qrcode.js)

## Rulare locală

```bash
git clone https://github.com/username/checksy.git
cd checksy
npm install
npm start

