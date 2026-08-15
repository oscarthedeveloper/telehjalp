# TeleHjälp

En liten hjälpsida för farmor och farfar. Stora knappar leder steg för steg fram till
ett konkret problem, visar lösningar på begriplig svenska, länkar till Proton Pass när
ett lösenord behövs och kan lämna över till Claude när inget av förslagen räcker.

Sidan läggs till på iPhones hemskärm och ligger i en mapp tillsammans med Proton Pass
och Claude.

## Kom igång

Läs **[DEPLOY.md](./DEPLOY.md)** – den tar dig hela vägen från tomt konto till färdig
mapp på deras telefoner.

Kortversionen:

```bash
npm install
cp .env.example .env.local   # fyll i
npm run dev
```

## Så är det byggt

| Del | Val |
|---|---|
| Ramverk | Next.js 14 (App Router), TypeScript, Tailwind |
| Typsnitt | IBM Plex Sans, självhostad via `next/font` |
| Innehåll | Turso (SQLite över HTTP) |
| Redigering | `/admin` – lägg till, ändra, flytta och ta bort, med direkt verkan |
| Publicering | Netlify, bygger automatiskt vid varje push |
| Lösenord | Proton Pass, öppnas via app-länk från lösningarna |
| AI-hjälp | Claude, färdigskrivet meddelande som kopieras och klistras in |

### Varför Turso

TeleHjälp används sällan – men just när något krånglar. Att sidan då vore nere
hade varit det värsta tänkbara felet. Tursos gratisnivå pausar aldrig databasen
vid inaktivitet, till skillnad från flera konkurrenter, och det avgjorde valet.

Databasen nås över Tursos HTTP-API direkt från `src/lib/db.ts`. Det är ett
sextiotal rader och gör projektet fritt från databasberoenden i `package.json`.

### Reservläge

Skulle databasen ändå inte svara faller sidan tillbaka på `content/telehjalp.json`,
som bakas in i bygget. Farmor och farfar får då fortfarande sin hjälp, med en tydlig
gul ruta högst upp om att texten kan vara något gammal. Samma fil används för att
fylla databasen första gången.

`npm run validate` kontrollerar filen och körs automatiskt före varje bygge.

### Innehållsmodellen

Tre tabeller, som skapas automatiskt första gången adminpanelen öppnas:

- **`nodes`** – varje rad är en knapp. `parent_id = null` betyder startsidan.
  Trädet kan bli hur djupt som helst. `sort_order` styr ordningen.
- **`solutions`** – orsaker och lösningar som hör till en knapp. `steps` är en
  JSON-lista med korta instruktioner.
- **`settings`** – texter som kan behöva justeras på plats, till exempel app-länken
  till Proton Pass och avslutningen i AI-meddelandet.

`slug` är adressdelen och måste vara unik – för noder i hela trädet, för lösningar
inom sin knapp. Databasen håller själv reda på det, och admin ger ett begripligt
felmeddelande vid krock.

### Sidor

| Adress | Vad den visar |
|---|---|
| `/` | "Jag har besvär med …" – knapparna på översta nivån |
| `/hjalp/[slug]` | Nästa nivå av knappar, eller "Det kan bero på …" |
| `/hjalp/[slug]/[losning]` | En lösning med numrerade steg och eventuell Proton Pass-knapp |
| `/fraga-ai/[slug]` | Kopiera frågan → öppna Claude → klistra in |
| `/admin?k=…` | Redigering. Utan rätt nyckel: "Sidan finns inte" |

De publika sidorna cachas i 60 sekunder. Efter varje ändring i admin rensas cachen,
så det du sparar syns direkt.

### Säkerheten kring admin

1. Adressen kräver `?k=<ADMIN_KEY>`. Fel eller saknad nyckel ger en vanlig 404 –
   det går alltså inte att snubbla in på panelen.
2. Därefter en PIN-kod, som ger en HMAC-signerad `httpOnly`-kaka i 8 timmar.
   Åtta felaktiga försök spärrar IP-adressen en kvart.
3. Databastoken används bara i serverkod och når aldrig webbläsaren.
4. All SQL använder bundna parametrar – ingen sträng byggs ihop av användardata.
5. Allt som sparas granskas först: adressdelar måste vara rätt formaterade,
   texter måste finnas, och bara kända fält skrivs till databasen.
6. Nya knappar och lösningar skapas dolda, så inget halvfärdigt visas.

### Anpassningar för äldre användare

- Grundtext 20 px, knapptext 24 px, tryckytor minst 76 px höga
- Zoom är medvetet inte avstängd
- Alltid en "Tillbaka till …"-knapp överst och "Börja om från början" nederst
- Inga menyer, flikar eller svepgester – bara knappar
- Ett steg per rad i instruktionerna, med beskrivning av var på skärmen saken finns
