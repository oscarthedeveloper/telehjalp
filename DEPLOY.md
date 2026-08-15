# TeleHjälp – installation från början till slut

Räkna med 30–45 minuter första gången. Följ stegen i ordning.
Allt är gratis: GitHub och Netlify har gratisnivåer som räcker med marginal,
och TeleHjälp använder ingen databas alls.

---

## 0. Vad du behöver

- En dator med Node.js 18 eller senare (`node -v` för att kontrollera)
- Konto på [github.com](https://github.com) och [netlify.com](https://netlify.com)
- Farmors och farfars iPhones vid handen i steg 6

---

## 1. Lägg projektet i ett Git-repository

```bash
cd telehjalp
npm install
npm run validate      # kontrollerar innehållsfilen
git init
git add .
git commit -m "TeleHjälp"
```

Skapa ett **privat** repository på GitHub (t.ex. `telehjalp`) och koppla ihop:

```bash
git remote add origin git@github.com:DITT-NAMN/telehjalp.git
git branch -M main
git push -u origin main
```

> `.gitignore` ser till att `.env.local` aldrig hamnar i Git. Kontrollera ändå med
> `git status` att inga hemligheter följer med.

---

## 2. Skapa databasen hos Turso

Turso är en gratis databastjänst byggd på SQLite. Till skillnad från flera
konkurrenter pausas databasen aldrig vid inaktivitet – den svarar direkt även
om TeleHjälp inte använts på en månad.

**Via webben (enklast)**

1. Gå till [app.turso.tech](https://app.turso.tech) och skapa ett konto.
2. **Create Database**. Namn: `telehjalp`. Välj den region som ligger närmast
   Sverige, till exempel Frankfurt eller Amsterdam.
3. På databasens sida hittar du **Connect** eller **Database URL** – kopiera adressen
   (den börjar med `libsql://`).
4. Skapa en token på samma sida (**Create Token** / **Generate Token**) och kopiera den.

**Eller via terminalen**

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create telehjalp
turso db show telehjalp --url        # -> TURSO_DATABASE_URL
turso db tokens create telehjalp     # -> TURSO_AUTH_TOKEN
```

Spara båda värdena i Proton Pass under "TeleHjälp databas".

> Du behöver **inte** klistra in någon SQL. TeleHjälp skapar tabellerna själv
> första gången du öppnar adminpanelen.

## 3. Miljövariabler lokalt

```bash
cp .env.example .env.local
```

Skapa två långa slumpsträngar:

```bash
# hemlig del av adminlänken
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
# nyckel som signerar inloggningskakan
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Fyll i `.env.local`:

```
ADMIN_KEY=<första slumpsträngen>
ADMIN_SECRET=<andra slumpsträngen>
ADMIN_PIN=<en sexsiffrig kod du kommer ihåg>
TURSO_DATABASE_URL=<adressen från steg 2>
TURSO_AUTH_TOKEN=<tokenen från steg 2>
```

Lägg in `ADMIN_KEY` och `ADMIN_PIN` i Proton Pass under "TeleHjälp admin".

Prova lokalt:

```bash
npm run dev
```

- Sidan: <http://localhost:3000>
- Admin: <http://localhost:3000/admin?k=DIN-ADMIN_KEY>

Utan `?k=`-delen ska adressen `/admin` svara **"Sidan finns inte"**. Kontrollera det.

> Kör du lokalt mot samma databas som den publicerade sidan ändrar du på riktigt.
> Vill du experimentera i lugn och ro: skapa en andra databas med `turso db create telehjalp-test`
> och peka `.env.local` mot den.

---

## 4. Publicera på Netlify

1. [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** → GitHub → välj `telehjalp`.
2. Netlify läser `netlify.toml` och fyller i byggkommandot automatiskt. Ändra inget.
3. Innan du trycker Deploy: öppna **Add environment variables** och lägg in alla fem:

   ```
   ADMIN_KEY
   ADMIN_PIN
   ADMIN_SECRET
   TURSO_DATABASE_URL
   TURSO_AUTH_TOKEN
   ```

4. **Deploy**. Första bygget tar ett par minuter.
5. **Site configuration → Change site name** → t.ex. `telehjalp`.
   Adressen blir då `https://telehjalp.netlify.app`.

Varje `git push` till `main` gör en ny publicering automatiskt. Ändringar i
*innehållet* kräver ingen publicering alls – de ligger i databasen och slår igenom direkt.

---

## 5. Fyll på innehållet

Öppna `https://telehjalp.netlify.app/admin?k=DIN-ADMIN_KEY`, knappa in PIN-koden.

**Första gången** möts du av rutan *Databasen är tom*. Tryck på
**Fyll på från innehållsfilen** – då läses grundstrukturen och de två färdiga
exemplen in i databasen. Detta går bara att göra när databasen är tom, så du kan
inte råka skriva över ditt arbete senare.

**Så fungerar administrationen**

Administrationen ser ut precis som den riktiga sidan. Du klickar dig fram genom
samma knappar som farmor och farfar, och redigerar det du står på.

- **Pennan i knappens högra hörn** fäller ut allt du kan göra med den knappen:
  ändra text och ikon, flytta upp eller ned, dölja eller ta bort.
- **Pennan bredvid rubriken** ändrar sidan du står på just nu.
- **Lägg till knapp här** längst ned i listan skapar en ny knapp på den nivån.
- **Lägg till orsak här** skapar en ny lösning under "Det kan bero på …".
- En lösnings innehåll – orsaken, stegen och Proton Pass-knappen – redigerar du
  inne på lösningens egen sida, där du ser den som farmor och farfar ser den.
- Nya knappar och orsaker skapas **dolda**. De visas nedtonade med en gul
  markering i administrationen, och syns inte alls på den riktiga sidan förrän
  du kryssar i *Synlig*.
- **Inställningar** i det mörka fältet högst upp rymmer det som inte hör hemma i
  trädet: starttexten, Proton Pass-länken och meddelandet till Claude. Där finns
  också en förhandsvisning av hur meddelandet blir.

Ändringarna syns på sidan direkt – ingen ny publicering behövs.

**Skrivråd för texterna**

- En handling per steg. "Tryck på huset längst ned till vänster." – inte två saker i samma mening.
- Beskriv *var* på skärmen saken finns, inte bara vad den heter.
- Undvik ord som app-växlare, cache, konto-switch. Skriv vad man ser.
- Ingen ikon behövs om texten är tydlig, men en emoji hjälper igenkänningen.

**Reservfilen**

`content/telehjalp.json` är kvar i repot och fyller två roller: den är innehållet
som läses in första gången, och den är reserven som visas om databasen mot förmodan
inte skulle svara. Vill du att reserven ska vara aktuell kan du då och då uppdatera
filen så att den speglar databasen. Sidan fungerar utmärkt utan att du gör det –
men då är reserven den ursprungliga grundstrukturen.

## 6. Kontrollera Proton Pass-länken (viktigt)

Proton dokumenterar inte sin app-länk offentligt, så den kan behöva justeras.

1. Öppna på en iPhone **där Proton Pass är installerad** en lösning med lösenordsknapp.
2. Tryck på **Tryck här för att hitta lösenord**.
3. Öppnas Proton Pass? Klart.
4. Gör den inte det, gå till admin → **Inställningar** → *Länk som öppnar Proton Pass* och prova
   `proton-pass://` eller `protonpass:` i tur och ordning. Fungerar ingen: lämna fältet tomt.
   Då visas i stället en skriven instruktion, och inget går sönder.

Samma sak gäller **Fråga AI**: Claude stöder inte längre förifyllda chattmeddelanden via länk,
därför bygger TeleHjälp på "kopiera → öppna → klistra in" i tre numrerade steg. Det fungerar i
gratisversionen och kräver bara ett vanligt Claude-konto.

---

## 7. På farmors och farfars telefoner

Gör detta på **varje** iPhone och på iPaden.

**Lägg TeleHjälp på hemskärmen**

1. Öppna **Safari** (inte Chrome – bara Safari kan lägga till på hemskärmen).
2. Gå till `https://telehjalp.netlify.app`.
3. Tryck på delningsikonen (fyrkanten med pil uppåt) längst ned.
4. Bläddra ned till **Lägg till på hemskärmen** → **Lägg till**.

**Installera resten**

5. App Store → installera **Proton Pass** och **Claude**.
6. Logga in i Proton Pass. Slå på **Inställningar → Face ID** så slipper de huvudlösenordet.
7. Logga in i Claude med ett konto du skapar åt dem. Spara uppgifterna i Proton Pass.

**Skapa mappen**

8. Håll fingret på TeleHjälp-ikonen tills ikonerna vickar.
9. Dra TeleHjälp ovanpå Proton Pass. En mapp skapas.
10. Dra in Claude i samma mapp.
11. Tryck på mappens namn och döp den till **Hjälp**.
12. Dra mappen till **första hemskärmen**, gärna längst ned i dockan.

**Lösenordsstädningen**

13. I Proton Pass: gå igenom Facebook, Instagram, Messenger, WhatsApp, Apple-ID, e-post,
    bank och Göteborgsposten. Ett konto i taget.
14. Slå på **Inställningar → Lösenord → AutoFyll lösenord** på telefonen och välj **Proton Pass**.
    Då fylls lösenorden i automatiskt och de behöver sällan öppna appen alls.
15. Radera sparade lösenord från lappar, anteckningar och Safari när allt ligger i Proton Pass.

---

## 8. Efteråt

- **Ändra en instruktion:** logga in i admin, ändra, spara. Det syns direkt.
- **Säkerhetskopia:** `turso db shell telehjalp ".dump" > telehjalp-backup.sql`,
  eller **Export** i Tursos webbpanel. Gör det efter större omskrivningar.
- **Se datan direkt:** Tursos webbpanel har en SQL-vy där du kan titta på och
  rätta rader i tabellerna `nodes`, `solutions` och `settings`.
- **Byta PIN:** ändra `ADMIN_PIN` i Netlify → Environment variables, och kör
  **Deploys → Trigger deploy → Clear cache and deploy site**.
- **Börja om från början:** töm tabellerna i Tursos SQL-vy
  (`delete from solutions; delete from nodes;`) så dyker knappen
  *Fyll på från innehållsfilen* upp igen i admin.

---

## Om något strular

| Symptom | Trolig orsak |
|---|---|
| Gul ruta: "en äldre version av hjälpen" | Databasen svarade inte. Sidan visar reservinnehållet så länge. Orsaken står i rutan. |
| "Databasen är inte inkopplad" i admin | `TURSO_DATABASE_URL` eller `TURSO_AUTH_TOKEN` saknas i Netlify. |
| "Databasen nekade åtkomst" | Tokenen hör till en annan databas, eller har återkallats. Skapa en ny. |
| Admin ger "Sidan finns inte" trots rätt länk | `ADMIN_KEY` i Netlify stämmer inte med den i adressen. |
| "Ej behörig" i adminpanelen | Kakan har gått ut (8 timmar). Öppna adminlänken med `?k=` igen. |
| "En annan knapp använder redan den adressdelen" | Adressdelar måste vara unika i hela trädet. Välj en annan. |
| Startsidan är tom | Alla toppknappar är omarkerade som *Synlig*. |
