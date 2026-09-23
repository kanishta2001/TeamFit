# TeamFit — draw.io structure upgrade

ඔබ ලබාදුන් teamfit.drawio.html diagram එක අනුව එකම workspace එකේ tabs පෙන්වන ක්‍රමය වෙනුවට වෙනම URLs සහිත pages සකස් කර ඇත. මෙය navigation වෙනස් කිරීම පමණක් නොවේ: task assignment සහ saved task progress ද එක් කර ඇත.

## Pages සහ ඒවායේ කාර්යයන්

| Diagram එකේ කොටස | URL | කළ හැකි දේ |
| --- | --- | --- |
| Home | / | Intro, sample projects, how it works, Login/Register, Browse projects |
| Login | /login | දැනට තිබෙන account එකට ඇතුළු වීම |
| Register | /register | අලුත් account එකක් සෑදීම |
| Create my profile | /profile/create | නම, bio, role, skills, availability ඇතුළත් කිරීම |
| Signed-in workspace | /dashboard | Students, My projects, Pending invitations counts, project shortcuts සහ accepted tasks |
| My profile | /profile | තමන්ගේ profile විස්තර බැලීම |
| Edit my profile | /profile/edit | විස්තර වෙනස් කර save කිරීම |
| Students | /students | Name, role, skill, availability අනුව සෙවීම |
| Browse projects | /projects | පවතින projects සහ requirements බැලීම |
| My projects | /projects/mine | තමන් owner වන සහ joined වූ projects එකම list එකක බැලීම; Owner/Joined labels පෙන්වයි |
| Joined projects (පැරණි link) | /projects/joined | /projects/mine වෙත යවයි |
| Create project | /projects/new | Requirements සහ team size සමඟ project එක සෑදීම |
| Project details | /projects/123 | Team, requirements, status, tasks, progress; 123 වෙනුවට project ID |
| Edit project | /projects/123/edit | Ownerට project විස්තර සහ status වෙනස් කිරීම |
| Invitations | /invitations | Project සහ task invitations accept/reject කිරීම |

Edit/remove member/invite/assign task සඳහා diagram එකේ තිබෙන actions project details page එකේ අදාළ controls ලෙස තිබේ. සෑම button එකකටම අනවශ්‍ය වෙනම page එකක් සාදා නැත.

## User ගමන

```text
Home
 ├─ Register → Create my profile → Dashboard
 ├─ Login → Dashboard (හෝ කලින් ඉල්ලූ protected page එක)
 └─ Browse projects → Login අවශ්‍යයි

Dashboard
 ├─ My profile → Edit my profile → Save → My profile
 ├─ Students → Search / filter
 ├─ Projects
 │   ├─ Browse projects → Project details
 │   ├─ Create project → Save → Project details
 │   └─ My projects → Owner/Joined label → Project details → Manage team / tasks හෝ Leave team
 └─ Invitations → Accept / Reject
```

පැරණි /workspace link එකත් වැඩ කරයි; එය /dashboard වෙත යවයි. Refresh, direct links සහ browser navigation සඳහා එක් එක් screen එකට URL එකක් තිබේ.

## Tasks සහ අවසර

- Owner: task create, members එක්කෙනෙක් හෝ කිහිපදෙනෙක් assign/reassign කිරීම, deadline days දීම, edit සහ delete කිරීම.
- Assigned member: task invitation accept/reject කිරීම සහ accept කළ task එක Completed / Not completed ලෙස වෙනස් කිරීම.
- Other students: project requirements සහ team summary බැලිය හැකි නමුත් task contents බැලිය නොහැක.
- Assignment සඳහා දැනට team එකේ සිටින members පමණක් තෝරාගත හැකි අතර අවම වශයෙන් එක් member කෙනෙක් අවශ්‍යයි.
- Member leave/remove කළ විට task එක මැකෙන්නේ නැත; එම memberගේ assignment එක පමණක් ඉවත් වේ.
- Project delete කළොත් එහි tasks ද මැකෙයි. UI එකේ confirmation එකක් පෙන්වයි.

Task status dropdown එකක් නැහැ. Assigned memberට **Mark as completed** සහ **Mark as not completed** buttons තිබේ.

```text
Task progress = සියලු accepted assignees complete කළ tasks / All tasks × 100
```

උදාහරණයක් ලෙස tasks 4කින් 3ක accepted assignees සියලුදෙනා Completed කළා නම් progress 75%. Pending task invitation එකක් තිබෙන task එක complete නොවේ. Tasks නැතිනම් 0%. Project status (Open/InProgress/Completed) owner විසින් වෙනම සකස් කරයි.

## ඔබ පරීක්ෂා කරන ආකාරය

1. Backend සහ frontend run කර http://localhost:3000 විවෘත කරන්න.
2. Register → Create my profile → Save → Dashboard.
3. වෙනම incognito/browser profile එකකින් දෙවැනි student account එකක් හදා profile එක save කරන්න.
4. Ownerගේ Projects → Create project භාවිත කර requirements තෝරන්න.
5. Details page එකේ Recommended teammates වෙතින් දෙවැනි studentට invite කරන්න.
6. දෙවැනි studentගේ Invitations → Accept.
7. Ownerගේ project page එකේ Refresh කර Task title, members සහ Deadline (days) දී Create task කරන්න.
8. Memberගේ Invitations තුළ Task invitation එක Accept කර Workspace → My accepted tasks තුළ පෙනෙන බව බලන්න.
9. Memberගේ Projects → My projects → Joined label ඇති project → View project ගොස් Mark as completed කරන්න. Progress වෙනස් වන බව බලන්න.
10. Ownerගේ My projects → View project → Edit project මඟින් project status වෙනස් කරන්න.

එකම browser profile එකේ tabs login cookie share කරන නිසා users දෙදෙනා වෙනම browser sessions වලින් පරීක්ෂා කරන්න. වෙනත් user කරන වෙනස්කම් බැලීමට Refresh භාවිත කරන්න; මෙය real-time notification system එකක් නොවේ.

## Database සහ පවතින දත්ත

AddTaskAssignmentsAndDeadlines migration එක multi-member task assignments, task invitations සහ deadlines එකතු කරයි. Existing users, students සහ projects reset නොවේ. පරණ single assignee එක Accepted assignment එකක් ලෙසත් පරණ Done state එක completion ලෙසත් ආරක්ෂා වේ.

Code update එක වෙනත් machine එකක ලබාගත් විට backend folder එකේ:

```powershell
dotnet tool restore
dotnet tool run dotnet-ef database update
dotnet run --launch-profile http
```

වෙනම terminal එකක frontend folder එකේ:

```powershell
npm ci
npm run dev
```

Build කරන විට TeamFit.Api.exe locked කියා error එකක් ආවොත් දැනට backend run වන terminal එකේ Ctrl+C කර නැවත command එක run කරන්න. Migration එක අලුතින් generate කිරීම අවශ්‍ය නැත; එය repository එකේ ඇත.

## විෂය පථයේ තීරණ

- Home sample projects පැහැදිලිව Example only ලෙස සඳහන් කළ නිර්මාණාත්මක උදාහරණ වේ; real private data නොවේ.
- Real student/project directory සඳහා login අවශ්‍යයි; diagram එක නිසා private API public කර නැත.
- Registration අවසන් වූ විට profile setup අවශ්‍යයි.
- Forgot password, email verification, admin console, public deployment මෙම structure upgrade එකේ අලුතින් එක් කර නැත.
- දැනට තිබෙන visual style තබා page structure සහ functionality වෙනස් කර ඇත.

## Suggested Git commit

Title: feat: align TeamFit pages and team tasks with the draw.io structure

Description:

```text
Split authentication and workspace screens into dedicated routes.
Add profile onboarding and owned/joined project navigation.
Implement team task assignment, status updates, and saved progress.
Preserve existing data and verify permissions with API/browser tests.
```
