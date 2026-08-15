# Turso, för dig som kommer från Supabase

En genomgång av exakt vad du gör hos Turso för att få igång TeleHjälp.
Räkna med tio minuter.

---

## Först: hur Turso skiljer sig från Supabase

| Supabase | Turso | Kommentar |
|---|---|---|
| Ett **projekt** | En **databas** | Ingen inbyggd inloggning, lagring eller API – bara databasen. |
| Postgres | SQLite | Samma SQL i praktiken för vårt behov. |
| SQL Editor i webben | `turso db shell` eller SQL-vyn i webbpanelen | |
| **Project URL** | `turso db show --url` | Börjar med `libsql://` i stället för `https://`. |
| **anon**-nyckeln | *finns inte* | Ingen webbläsare pratar med databasen. Bara servern gör det. |
| **service_role**-nyckeln | `turso db tokens create` | Motsvarigheten. Ligger bara som miljövariabel. |
| RLS-policyer | *behövs inte* | Eftersom ingen klient har direktåtkomst finns inget att skydda mot. |
| Pausas efter 7 dagars stiltje | **Pausas aldrig** | Skälet till att vi valde Turso. |

Det du slipper jämfört med Supabase: ingen `anon`-nyckel, inga RLS-policyer, ingen
SQL att klistra in. TeleHjälp skapar tabellerna själv.

---

## 1. Installera Turso CLI

Webbpanelen fungerar också, men CLI:t är det som Turso dokumenterar och det går
snabbast. På macOS:

```bash
brew install tursodatabase/tap/turso
```

Har du inte Homebrew:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

Kontrollera att det gick vägen:

```bash
turso --version
```

---

## 2. Skapa konto

```bash
turso auth signup
```

Kommandot öppnar webbläsaren. Logga in med GitHub eller e-post. Inget kort behövs
för gratisnivån.

Har du redan ett konto: `turso auth login`.

---

## 3. Skapa databasen

```bash
turso db create telehjalp
```

> **Viktigt:** kör kommandot **utan** flaggan `--tursodb`.
>
> Turso Cloud har numera två motorer: den nya `--tursodb` och den beprövade
> libSQL, som du får som standard. TeleHjälp pratar med databasen över
> `/v2/pipeline`-protokollet, som libSQL-motorn är byggd för. Vill du prova den
> nya motorn senare går det troligen bra – TeleHjälp känner igen både
> `libsql://` och `turso://` – men börja med standardvalet.

Turso väljer automatiskt en region nära dig. Det räcker gott.

Titta på resultatet:

```bash
turso db show telehjalp
```

---

## 4. Hämta de två värdena du behöver

**Adressen:**

```bash
turso db show telehjalp --url
```

Du får något i stil med `libsql://telehjalp-dittnamn.turso.io`.
Klistra in den precis som den är – TeleHjälp översätter själv till `https://`.

**Tokenen:**

```bash
turso db tokens create telehjalp
```

Du får en lång sträng. **Den visas bara en gång.** Spara den i Proton Pass under
"TeleHjälp databas", tillsammans med adressen.

> Tokenen motsvarar Supabases `service_role`-nyckel: full läs- och skrivrätt.
> Den får bara ligga som miljövariabel – aldrig i koden, aldrig i Git.

---

## 5. Lägg in värdena

**Lokalt**, i `.env.local`:

```
TURSO_DATABASE_URL=libsql://telehjalp-dittnamn.turso.io
TURSO_AUTH_TOKEN=<den långa strängen>
```

**I Netlify**, under *Site configuration → Environment variables*, samma två
variabler. Kör sedan **Deploys → Trigger deploy → Deploy site** så att bygget
får med dem.

---

## 6. Starta TeleHjälp och fyll databasen

```bash
npm run dev
```

Öppna `http://localhost:3000/admin?k=DIN-ADMIN_KEY` och knappa in PIN-koden.

Nu händer två saker automatiskt:

1. **Tabellerna skapas.** `nodes`, `solutions` och `settings`. Du behöver inte
   köra någon SQL – det är därför det inte finns någon `schema.sql` i projektet.
2. **Rutan "Databasen är tom" visas.** Tryck på **Fyll på från innehållsfilen**.
   Grundstrukturen och de två färdiga exemplen läses in.

Gå till `http://localhost:3000` och kontrollera att knapparna syns.

---

## 7. Kontrollera att det verkligen ligger i databasen

```bash
turso db shell telehjalp
```

I skalet:

```sql
.tables
select label, slug from nodes order by sort_order;
select count(*) from solutions;
.quit
```

Du ska se elva knappar och sex lösningar.

---

## Vardagen efteråt

**Titta på och rätta data**

```bash
turso db shell telehjalp
```

Eller använd SQL-vyn i webbpanelen på [app.turso.tech](https://app.turso.tech).
Motsvarar Supabases Table Editor.

**Säkerhetskopiera**

```bash
turso db shell telehjalp ".dump" > telehjalp-backup.sql
```

Gör det efter större omskrivningar av instruktionerna.

**Börja om från noll**

```bash
turso db shell telehjalp
```

```sql
delete from solutions;
delete from nodes;
.quit
```

Nästa gång du öppnar admin dyker knappen *Fyll på från innehållsfilen* upp igen.

**Se hur mycket du använder**

```bash
turso db inspect telehjalp
```

Gratisnivån ger 5 GB lagring, 500 miljoner lästa rader och 10 miljoner skrivna
rader i månaden. TeleHjälp använder en försvinnande liten del av det.

---

## Om något inte stämmer

| Symptom | Vad du gör |
|---|---|
| `turso: command not found` | Öppna ett nytt terminalfönster, eller installera om enligt steg 1. |
| Admin: "Databasen är inte inkopplad" | `TURSO_DATABASE_URL` eller `TURSO_AUTH_TOKEN` saknas. Lokalt: kontrollera `.env.local` och starta om `npm run dev`. I drift: kontrollera Netlify och deploya om. |
| Admin: "Databasen nekade åtkomst" | Tokenen hör till en annan databas, eller har återkallats. Skapa en ny med `turso db tokens create telehjalp`. |
| Gul ruta på sidan: "en äldre version av hjälpen" | Sidan når inte databasen och visar reservinnehållet. Den tekniska orsaken står i rutan. |
| Fel om `no such table` | Öppna `/admin` en gång – tabellerna skapas då. |
| Knappen "Fyll på från innehållsfilen" syns inte | Databasen är inte tom. Den knappen visas bara när det inte finns några knappar. |

---

## Om du hellre gör allt i webben

[app.turso.tech](https://app.turso.tech) har samma funktioner: skapa konto,
skapa databas, hämta adress och skapa token. Stegen 3 och 4 blir då knapptryck
i stället för kommandon. Resten av guiden är densamma.

Jag beskriver CLI-vägen i detalj eftersom det är den Turso själv dokumenterar,
och därför den som är minst benägen att se annorlunda ut än vad som står här.
