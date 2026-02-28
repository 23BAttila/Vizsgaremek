# Vizsgaremek
Böjtös Attila, Kuik Filep Balázs, Horváth Botond

Mi arra a problémára szeretnénk megoldást, hogy a felhasználó ne a sötétbe kutatva keressen játékot, ami még nem is biztos hogy kedvére való. 
Ezért egy olyan projektet kezdtünk el, ahol a felhasználó nyugodtan kialakíthatja és kedvére szabhatja a találatokat, emellett mi a programunkal az ő preferenciájukra rásegítünk.

Vizsgánk ötlete a "Steam interactive recommender"-ből jött, ehhez hasonló játék ajánló webalkalmazás, ami a felhasználó ízlésvilágát követi platformtól függetlenül.
A webalkalmazás főbb funkciói regisztráció/belépés után érhetőek el. 
Viszont:
    Eleinte populáris játékokat dob fel, felhasználó adataitól függetlenül.
    Ha bejelentkezve elkezdi a keresést az oldal igazodni fog hozzá,
    ha guestként kezdi akkor az oldal nem fogja tudni követni így csak gyors játékkeresésre szolgál
Weboldal:
-játékkereső bővitett funkciókkal(tag/popularity/stb. beállítások)
-egyéb felhasználói játékbeállítások/preferenciák/stb. (Guest vagy Loginelt felhasználótól függően). 
-felhasználói beállítások
-egyéb funkciók
-x-

!!! (1/2)
A felhasználó adatai külső saját adatbázisban tárolandó,
 mint például a keresett vagy a kedvenc játékok vagy kategóriák. 
Ezek alapján fog frissülni a felhasználó ízlése szerint webalkalmazás 
által ajánlott játékok összessége.
    (2/2)
A projekt letöltve ID/SECRET/TOKEN ismerése nélkül nem futtatható
Ezeket az információkat https://api-docs.igdb.com/?#getting-started oldalon követve tudhatóak meg.
!!!

Ha a szerver el van indítva ezen az URL-en található meg: 
https://vizsgaremek-1kus.onrender.com
Ehhez nem kell az ID, Secret vagy Token.
Saját futtatásra a mappa gyökerében ahol a server.js található CMD-t megnyitva "node server.js" paranccsal indítható el és a kijelzett "localhost:port"-on érhető el.
