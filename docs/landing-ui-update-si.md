# TeamFit — homepage UI update

## වෙනස් කළ දේ

ඔබගේ Guest home page සහ Signed-In Users home page references අනුව navy/white UI එක, විශාල condensed heading එක, supplied background එක සහ layered project-card layout එක සකස් කර ඇත.

### Guest view

- Top navigation: Login, Register.
- Hero: Build student teams that fit the project.
- Create your profile button → Register.
- Project cards ස්වයංක්‍රීයව මාරු වෙයි. Feature bullets වෙනුවට hero buttons යට How it works → link එක පෙන්වයි.
- Browse projects button, workspace navigation සහ user-specific data නොපෙන්වයි.

### Signed-in view

- Top-right: profile නමෙන් ගත් username සහ Log out.
- Dashboard, My Profile, Students, Projects, Invitations navigation row එක homepage හෝ workspace pages තුළ නැත.
- Hero actions: My profile සහ Browse projects.
- Create your profile සහ Login/Register buttons නොපෙන්වයි.
- සාමාන්‍ය Login එකෙන් workspace dashboard එකට යයි. Protected page එකකට යමින් login කළොත් එම page එකටම නැවත යයි.
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

සෑම card එකකම title, description, required skills, team size, roles needed සහ difficulty තිබේ. Cards තත්පර 10කට වරක් ස්වයංක්‍රීයව මාරු වෙයි. Manual arrows/dots, Fictional example heading සහ 01 / 03 counter එක ඉවත් කර ඇත. ඒවා real invitations නොවන බව කුඩා disclaimer එකකින් සඳහන් කර ඇත.

කියවීමට පහසු වීම සඳහා mouse hover හෝ keyboard focus ඇති විට rotation තාවකාලිකව නවතියි. Hidden tabs සහ reduced-motion setting භාවිත කරන විටත් cards මාරු නොවේ.

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
4. Login කළ විට dashboard එක විවෘත වේ. එහි navigation row සහ project action buttons තුන නැති බව බලන්න. Logo එකෙන් නැවත dashboard වෙත යා හැක.
5. My Profile → Edit my profile වෙතින් නම වෙනස් කර save කළ විට header නම වෙනස් වන බව බලන්න.
6. Hero buttons යට How it works → link එකෙන් වෙනම guide page එක විවෘත කරන්න.
7. Log out කළ විට guest view එකට නැවත මාරු වන බව බලන්න.

Database migration එකක් හෝ අලුත් package install එකක් අවශ්‍ය නැත. Existing accounts, projects සහ tasks වෙනස් කර නැත.

## Verification

Tests මඟින් guest/member controls, profile display names, login/logout, protected navigation, connection errors, automatic rotation සහ viewport fit පරීක්ෂා කරයි.

Latest verification: lint සහ production build pass; browser tests 11/11 pass. Guest/member දෙකටම cards තුනම 1920×1080, 1440×900, 1366×768, 1280×720, 1024×600, 888×429 සහ 390×844 viewport sizes වල horizontal/vertical scroll නැති බව පරීක්ෂා කර ඇත.

සාමාන්‍ය desktop/laptop window sizes සඳහා homepage දෙකම scroll නොවී fit වන ලෙස spaces සහ font sizes සකසා ඇත. අන්තර්ගතය කපා දැමීමට overflow hidden භාවිත කර නැත. ඉතා කුඩා screen හෝ විශාල browser zoom එකකදී කියවීමේ හැකියාව රැකගැනීමට scrolling තිබිය හැක.

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

Title: fix: fit landing pages and automate project cards

Description:

```text
Fit guest and signed-in homepages to desktop and laptop viewports.
Remove homepage workspace links, feature bullets, and card counters.
Move How It Works below the hero buttons.
Rotate project cards automatically without manual controls.
Test all slides, viewport sizes, and accessibility pause behavior.
```
