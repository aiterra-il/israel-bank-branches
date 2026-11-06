<div dir="rtl">

# israel-bank-branches · סניפי בנקים בישראל

[![npm](https://img.shields.io/npm/v/israel-bank-branches?color=2447D6)](https://www.npmjs.com/package/israel-bank-branches)
[![tests](https://github.com/aiterra-il/israel-bank-branches/actions/workflows/tests.yml/badge.svg)](https://github.com/aiterra-il/israel-bank-branches/actions/workflows/tests.yml)
[![license](https://img.shields.io/badge/license-MIT-3E96F9)](LICENSE)
![dependencies](https://img.shields.io/badge/dependencies-0-060B22)

כל סניפי הבנקים בישראל, יותר מ-1,100, ישר מהמאגר הפתוח של **בנק ישראל** ב-data.gov.il: כתובת, טלפון, נגישות, יום סגירה, מיקום על המפה, סניפים שנסגרו ולאן הם מוזגו, וקודי SWIFT של הבנקים. אין צורך במפתח API.

**למה זה שימושי?**

- **טפסי תשלום והחזרים.** הלקוח מקליד בנק ומספר סניף, ומיד רואים שם הסניף וכתובת, ותופסים טעות לפני שההעברה נכשלת.
- **חשבוניות ומערכות שכר.** מוודאים שהסניף קיים ושלא נסגר.
- **אפליקציות.** הסניף הקרוב למשתמש לפי מיקום, עם קישור לגוגל מפות.

## התקנה

```bash
npm install israel-bank-branches
```

בלי תלויות. עובד ב-Node.js 20 ומעלה ובדפדפן (data.gov.il מאפשר CORS), וכולל טיפוסים ל-TypeScript.

## שימוש

```js
import { getBranch, loadBranches, searchBranches, nearestBranches, loadBanks } from 'israel-bank-branches'

await getBranch(12, 532)
// {
//   bankCode: 12, bankName: 'בנק הפועלים', code: 532, name: 'שאול המלך',
//   address: 'דניאל פריש 3', city: 'תל אביב -יפו', phone: '03-6935769',
//   accessible: true, closedDay: 'שישי', openedOn: '1949-01-01', closedOn: '',
//   latitude: 32.074431, longitude: 34.782914, ...
// }

const branches = await loadBranches()

searchBranches(branches, 'בת ים', { bankCode: 10 })
// סניפי לאומי בבת ים

nearestBranches(branches, 32.0167, 34.75, { limit: 3 })
// [{ bankName: 'בנק הפועלים', name: 'בת ים', distanceKm: 0.4, ... }, ...]

const banks = await loadBanks()
banks.find((bank) => bank.code === 12).swift
// 'POALILITXXX'
```

`getBranch()` טוענת את כל המאגר פעם אחת ושומרת אותו בזיכרון, כך שהבדיקה הבאה לא פונה שוב לרשת. כדי לרענן: `getBranch(12, 532, { refresh: true })`.

### שגיאות

כשהמאגר לא זמין נזרקת `BranchLookupError` עם `code` אחד מאלה: `network`, `timeout`, `blocked`, `server`, `format`.

## API

| פונקציה | מה היא עושה |
|---|---|
| `getBranch(bankCode, branchCode)` | סניף לפי קוד בנק ומספר סניף, או `null` |
| `loadBranches()` | כל הסניפים, כולל סניפים שנסגרו |
| `searchBranches(branches, text, { bankCode, includeClosed, limit })` | חיפוש לפי עיר, שם סניף או רחוב |
| `nearestBranches(branches, lat, lng, { bankCode, limit })` | הסניפים הקרובים, עם מרחק בק״מ |
| `findBranch(branches, bankCode, branchCode)` | כמו `getBranch`, על רשימה שכבר נטענה |
| `loadBanks()` | הבנקים: שם, אתר, SWIFT, כתובת וטלפון |
| `mapUrl(branch)` | קישור לסניף בגוגל מפות |

## לנסות בלי קוד

**[חיפוש סניף בנק לפי מספר או עיר](https://www.aiterra.co.il/tools/bank-branch-lookup)** באתר של Aiterra.

## מקור הנתונים

[מאגר סניפי הבנקים של בנק ישראל](https://data.gov.il/he/datasets/bank_israel/branches) ב-data.gov.il. זו ספרייה של הקהילה, ואין לה קשר רשמי לבנק ישראל. לפני העברה גדולה כדאי לוודא את הפרטים מול הבנק.

---

נבנה ב-**[Aiterra](https://www.aiterra.co.il)**, סטודיו לבניית אתרים, אוטומציה וסוכני AI בישראל. רישיון MIT.

</div>

## English

Every Israeli bank branch (1,100+) from the Bank of Israel open dataset on data.gov.il: look up a branch by bank code and branch number, search by city, branch name or street, find the nearest branches to a coordinate, and get bank SWIFT codes. Records come back clean and typed (ISO dates, accessibility flag, closed day, merge target, coordinates). It needs no API key, has no dependencies, works in Node 20+ and browsers, and ships TypeScript types. MIT, by [Aiterra](https://www.aiterra.co.il).
