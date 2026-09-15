type Student = {
  id: number;
  fullName: string;
  universityEmail: string;
  bio: string | null;
  preferredRole: string;
};

type StudentDirectoryData = {
  students: Student[];
  errorMessage: string | null;
};

// This URL is used by the Next.js server, so it is not exposed in browser JavaScript.
const apiBaseUrl = process.env.TEAMFIT_API_URL ?? "http://localhost:5273";

async function getStudents(): Promise<StudentDirectoryData> {
  try {
    // Fetch the student profiles from the ASP.NET Core API, not from static sample data.
    const response = await fetch(`${apiBaseUrl}/api/students`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("The API did not return a successful response.");
    }

    const students: Student[] = await response.json();
    return { students, errorMessage: null };
  } catch {
    return {
      students: [],
      errorMessage:
        "Student profiles could not be loaded. Check that the backend is running on port 5273."
    };
  }
}

export default async function StudentDirectory() {
  const { students, errorMessage } = await getStudents();

  return (
    <section id="students" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
            Student directory
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Live student profiles from TeamFit.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            These profiles are loaded from the TeamFit API and SQL Server database.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800" role="alert">
            <p className="font-semibold">We could not load the student directory.</p>
            <p className="mt-2 text-sm leading-6">{errorMessage}</p>
          </div>
        ) : null}

        {!errorMessage && students.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-lg font-bold text-slate-800">No student profiles yet</h3>
            <p className="mt-2 text-slate-600">
              Create a student through Swagger first, then refresh this page.
            </p>
          </div>
        ) : null}

        {students.length > 0 ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <article key={student.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-indigo-600">Student profile</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">{student.fullName}</h3>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                    #{student.id}
                  </span>
                </div>

                <p className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                  {student.preferredRole}
                </p>
                <p className="mt-4 break-words text-sm font-medium text-slate-600">{student.universityEmail}</p>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                  {student.bio || "This student has not added a bio yet."}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
