<p align="center">
  <img src="https://i.ibb.co/0RDJqVYL/gamehunt-logo.png" width="450"><br><br>
  <img src="https://img.shields.io/badge/IGDB%20API-6218c5?style=for-the-badge&logo=twitch&logoColor=white" alt="IGDB API">
  <img src="https://img.shields.io/badge/Visual%20Studio%20Code-007ACC.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="VS Code">
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render">
  <br>
  <img src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/REST%20API-02303A?style=for-the-badge&logo=insomnia&logoColor=white" alt="REST API">
  <img src="https://img.shields.io/badge/Jest-323330?style=for-the-badge&logo=Jest&logoColor=white" alt="JEST">
</p>

# Gamehunt – Játék Katalógus

Ez a projekt egy platformfüggetlen játék katalógus, amelyet a "Steam interactive recommender" ihletett. A Gamehunt egy könnyen elérhető játékadatbázis.

## Projekt management

**TRELLO:** [https://trello.com/b/yHRLy9VS/jatek-ajanlo](https://trello.com/b/yHRLy9VS/jatek-ajanlo)
<br>

| Funkció | Vendég | Regisztrált Felhasználó | Állapot |
| :--- | :---: | :---: | :---: |
| Gyors játékkeresés | ✅ | ✅ | Kész |
| Népszerű játékok listázása | ✅ | ✅ | Kész |
| Preferenciák mentése | ❌ | ✅ | Kész |
| Kedvencek követése | ❌ | ✅ | Kész |
| Bővített kereső és szűrők | ❌ | ✅ | Béta |
| Személyre szabott ajánlások | ❌ | ✅ | Továbbfejlesztési cél |

## 👥 Fejlesztői Csapat

<p align="center">
  <img src="https://i.ibb.co/b5bwrHP6/git-profiles.png" width="450" alt="Git Profiles">
</p>

| Név | Szerepkör | Feladatok |
| :--- | :--- | :--- |
| **Böjtös Attila** | Backend fejlesztő | Node.js szerver, RESTful API, IGDB API integráció, hitelesítés. |
| **Horváth Botond** | Frontend fejlesztő | UI/UX tervezés, kliensoldali logika (HTML5, CSS3, JavaScript). |
| **Kuik-Filep Balázs** | Adatbázis-tervező | MongoDB adatmodell, ER diagramok, adatkonzisztencia. |
## Működés

A felhasználói adatok külső MongoDB adatbázisban tárolódnak. <br>A játékadatokat az **IGDB API** szolgáltatja. <br>Élőben futtatást a **Render** teszi lehetővé.

## Elérés

A projektet jelenleg csak a Render szerverünkön lehet elérni az alábbi link/domain-en:
[https://gamehunt-hctq.onrender.com/](https://gamehunt-hctq.onrender.com/)

## Lokális Futtatás

Amennyiben lokálisan szeretné futtatni a projektet - <br><br>
[A] - Vizsga miatt: Tudunk szolgáltatni .env fájl-t amit gyökérkönyvtárba téve, majd az ugyanitt: `npm install` és `node server.js` -t futtatva válik lokálisan elérhetővé. <br><br>
[B] - Saját okokból: IGDB/TWITCH regisztráció, POSTMAN lekérés, .env-fájl létrehozása



## Tesztelés (Jest)
<img src="https://i.ibb.co/4w6DGnTz/npmtest.png">
A projekt automatizált tesztekkel biztosítja a stabil működést a Jest és Supertest keretrendszerek segítségével. <br>
- Egységtesztek: Az API végpontok és a belső logika ellenőrzése. <br>
- Mocking: Az adatbázis és a külső API (IGDB) hívások szimulálása az izolált tesztkörnyezet érdekében. <br>

A tesztek futtatásához használd a következő parancsot: `npm test`
