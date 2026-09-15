# TeamFit run කරන හැටි

## 1. මුලින්ම

SQL Server service එක running වෙන්න ඕන. SSMS open කරගෙන ඉන්න අවශ්‍ය නැහැ: SSMS කියන්නේ database එක බලන tool එක; SQL Server කියන්නේ data තබන service එක.

VS Code එකේ TeamFit root folder එක open කරන්න. Terminal එක PowerShell වෙන්න ඕන.

## 2. Setup එක එක්වරක් කරන්න

Root folder එකේ:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup.ps1
```

මේක packages restore කරනවා, JWT signing secret එක local user-secrets store එකට දානවා, database migrations apply කරනවා, frontend dependencies install කරනවා. කලින් තියෙන secret එක හෝ .env.local overwrite කරන්නේ නැහැ.

Manual commands අවශ්‍ය නම්:

```powershell
cd backend
dotnet restore
dotnet tool restore
```

JWT key එක නැත්නම් setup script එක භාවිත කරන්න. එය random key එක generate කරයි. Key එක appsettings.json / GitHub තුළ ලියන්න එපා.

ඉන්පසු backend folder එකේ:

```powershell
dotnet build
dotnet tool run dotnet-ef database update
dotnet tool run dotnet-ef migrations list
```

Migration කියන්නේ database structure වෙනස්කම් version කරලා තබන ක්‍රමය. දැනට තිබෙන CompleteTeamFit migration එක apply කළාම Users, Projects, Invitations, TeamMembers සහ availability tables ලැබෙනවා. එකම නමින් නැවත migration add කරන්න අවශ්‍ය නැහැ.

## 3. Backend start කරන්න — Terminal 1

Root folder එකේ සිට:

```powershell
cd backend
dotnet run --launch-profile http
```

Expected: localhost:5273 listening message එක. Swagger: http://localhost:5273/swagger

මේ terminal එක close කරන්න එපා.

## 4. Frontend start කරන්න — Terminal 2

අලුත් terminal එකක් root folder එකේ open කරලා:

```powershell
cd frontend
npm run dev
```

Expected: localhost:3000. Browser එකේ http://localhost:3000/workspace open කරන්න.

Frontend කියන්නේ ඔබ click/type කරන screen එක. API කියන්නේ request එක validate කර database එකට යවන backend කොටස. ඒ නිසා දෙකම running වෙන්න ඕන.

## 5. මුල් user flow එක

1. New here? Create an account → register කරන්න.
2. Full name, preferred role, skills, availability දාලා Save profile කරන්න.
3. දෙවන student සඳහා වෙනම browser profile/incognito window එකක් භාවිත කරන්න.
4. පළමු student ලෙස Projects → Create project.
5. Required skills, desired roles, time periods select කර save කරන්න.
6. Recommendation එකේ points බලලා Invite student කරන්න.
7. දෙවන student ලෙස Refresh → Invitations → Accept.
8. පළමු studentගේ screen එක Refresh කර members බලන්න.
9. Edit project තුළ status එක InProgress / Completed කරන්න පුළුවන්.

පැරණි learning profiles මකා දමා නැහැ. ඒවාට login account link එකක් නැති නිසා read-only ලෙස පෙනෙනවා. ඒවායේ email භාවිත කර account claim කිරීමට ඉඩ දෙන්නේ නැහැ. අලුත් account සඳහා වෙනස් email එකක් භාවිත කරන්න.

## 6. Common errors

- **Build failed / file locked:** පරණ backend terminal එකේ Ctrl+C කරලා build කරන්න. Running exe එක overwrite කරන්න බැරි වෙන්න පුළුවන්.
- **Address already in use:** එම port එකේ server එක දැනටමත් running. දෙවැනි copy එක start කරන්න එපා.
- **Cannot connect to API:** backend running ද, frontend .env.local URL නිවැරදි ද බලන්න. URL වෙනස් කළොත් Next.js restart කරන්න.
- **401:** login/session අවසන්. Sign in නැවත කරන්න. Swagger සඳහා token එක Authorize තුළ දාන්න.
- **403:** ඔබට වෙනත් කෙනෙකුගේ profile/project වෙනස් කරන්න අවසර නැහැ.
- **409:** duplicate email/skill, full team, answered invitation වගේ business conflict එකක්. Response message එක කියවන්න.
- **429:** එක minute එකේ login/register attempts වැඩියි. Minute එකක් ඉඳලා retry කරන්න.
- **SQL certificate error:** local development connection එකේ TrustServerCertificate=True තිබේද බලන්න. Public server සඳහා trusted certificate අවශ්‍යයි.
- **Jwt:Key missing:** root folder එකේ setup script එක run කරන්න.
- **Same browser tabs change login together:** cookie එක shared. වෙනම browser profile හෝ incognito window භාවිත කරන්න.

## 7. Test commands

Root folder එකේ:

```powershell
dotnet run --project tests/MatchingChecks --configuration Release
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test.ps1
```

Full browser test සඳහා backend/frontend servers දෙකම stop කරලා:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test.ps1 -Browser
```

Tests සඳහා වෙනම temporary database එකක් සාදා අවසානයේ ඒක පමණක් ඉවත් කරනවා. TeamFitDb එක මකා දමන්නේ නැහැ.

## මේ කොටසෙන් ඉගෙනගත යුතු දේ

- Authentication = ඔබ කවුද කියලා තහවුරු කිරීම.
- Authorization = ඒ වෙනස්කම කිරීමට ඔබට අවසර තිබේද කියලා බැලීම.
- DTO = API එකට එන/යන data වල shape එක.
- Migration = database structure වෙනස්කම් සඳහා version history එක.
- Transaction = එකට සාර්ථක විය යුතු database changes එක unit එකක් ලෙස කිරීම.
- Automated test = ඔබ කරන test steps code එකක් ලෙස නැවත run කර bug එකක් ආපහු ආවාද බලන ක්‍රමය.
