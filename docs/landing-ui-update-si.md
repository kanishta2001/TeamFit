# TeamFit — homepage UI update

## වෙනස් කළ දේ

ඔබගේ Guest home page සහ Signed-In Users home page references අනුව navy/white UI එක, විශාල condensed heading එක, supplied background එක සහ layered project-card layout එක සකස් කර ඇත.

### Guest view

- Top navigation: How it works, Login, Register.
- Hero: Build student teams that fit the project.
- Create your profile button → Register.
- Fictional project cards සහ කෙටි feature bullets පමණක් පෙන්වයි.
- Browse projects button, workspace navigation සහ user-specific data නොපෙන්වයි.

### Signed-in view

- Top-right: profile නමෙන් ගත් username සහ Log out.
- Dashboard, My Profile, Students, Projects, Invitations navigation.
- Hero actions: My profile සහ Browse projects.
- Create your profile සහ Login/Register buttons නොපෙන්වයි.
- සාමාන්‍ය Login එකෙන් signed-in homepage එකට යයි. Protected page එකකට යමින් login කළොත් එම page එකටම නැවත යයි.
- Register කළ පසු profile setup අවසන් කිරීම තවමත් අවශ්‍යයි.

## Temporary username කියන්නේ කුමක්ද?

Saved full name එකේ මුල් වචනය lowercase කර display කරයි:

- Nimal Perera → nimal
- Kasun Silva → kasun
- Profile එකක් තවම නැත්නම් → Student

මෙය unique username එකක් හෝ අලුත් login credential එකක් නොවේ. Login තවමත් email/password භාවිත කරයි. එකම මුල් නම තිබෙන students දෙදෙනෙකුට එකම display name තිබිය හැක.

Profile නම වෙනස් කළොත් header username එකත් වෙනස් වෙයි. Refresh කළත් saved profile එකෙන්ම නැවත ගන්නා නිසා නම තබාගනී. Email එක top-right header එකෙන් ඉවත් කර ඇත; profile එකේ account email field එක අවශ්‍ය නිසා තබා ඇත.

## Fictional project cards

Homepage එකේ real project API එකෙන් data ලබාගන්නේ නැත. Campus Connect, Study Circle, Green Campus යන static fictional examples පෙන්වයි.

සෑම card එකකම title, description, required skills, team size, roles needed සහ difficulty තිබේ. Arrow buttons හෝ dots මඟින් examples මාරු කළ හැක. ඒවා real invitations නොවන බව card එකේම සඳහන් කර ඇත.

## Homepage එකෙන් ඉවත් කළ කොටස්

- වෙනම Sample Projects section එක.
- Homepage How It Works section එක.
- Your next team starts here section එක සහ පහළ footer/text.

Hero එක අසල fictional project-card showcase එක තබා ඇත. How It Works දැන් /how-it-works page එකකි.

## Logo සහ background

- ඔබගේ transparent Logo.png → frontend/public/brand/teamfit-logo.png.
- ඔබගේ background → frontend/public/brand/home-background.png.
- Original PNG files වෙනස් කර නැත; logo එක reference එකේ navy පාටින් CSS mask එකකින් display කරයි.
- Logo 2.png හි white background ඇති නිසා transparent Logo.png තෝරාගෙන ඇත.

## ඔබට බලන්න

1. සාමාන්‍ය frontend/backend run කරන්න.
2. http://localhost:3000 විවෘත කර Ctrl+Shift+R ඔබන්න.
3. Guest view එක බැලීමට incognito window එක භාවිත කරන්න.
4. Login කර username, workspace navigation සහ hero buttons බලන්න.
5. My Profile → Edit my profile වෙතින් නම වෙනස් කර save කළ විට header නම වෙනස් වන බව බලන්න.
6. How it works navigation item එකෙන් වෙනම guide page එක විවෘත කරන්න.
7. Log out කළ විට guest view එකට නැවත මාරු වන බව බලන්න.

Database migration එකක් හෝ අලුත් package install එකක් අවශ්‍ය නැත. Existing accounts, projects සහ tasks වෙනස් කර නැත.

## Verification

Frontend lint සහ production build සාර්ථකයි. Landing UI browser tests 8/8 pass: guest/member controls, profile display names, login/logout, protected navigation, connection errors සහ 320px/390px/768px responsive widths.

Landing browser tests සැබෑ browser එකක UI පරීක්ෂා කළත් API responses mock කරන නිසා ඔබගේ SQL Server data වෙනස් නොවේ. Full backend/database workflow verification ඒවායින් තහවුරු කරන්නේ නැත.

Frontend folder එකේ:

```powershell
npm run lint
npm run build
npx playwright test tests/landing.spec.ts
```

Playwright tests සඳහා frontend server එක running විය යුතුය.

## Screenshots

පහත signed-in screenshot එක synthetic test profile එකකිනි; real user data නොවේ.

![Guest homepage](screenshots/home-guest.png)
![Signed-in homepage](screenshots/home-member.png)

## Commit

Title: feat: redesign guest and signed-in landing pages

Description:

```text
Apply the supplied TeamFit logo, background, and reference layout.
Separate guest and member navigation and homepage actions.
Show first-name display usernames instead of header emails.
Add fictional project cards and a dedicated How It Works page.
Cover session changes and responsive layouts with browser tests.
```
