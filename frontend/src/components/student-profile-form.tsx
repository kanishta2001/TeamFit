"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type StudentProfileFormData = {
  fullName: string;
  universityEmail: string;
  preferredRole: string;
  bio: string;
};

type FormStatus =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

const emptyForm: StudentProfileFormData = {
  fullName: "",
  universityEmail: "",
  preferredRole: "",
  bio: "",
};

// Browser code can only read environment variables that begin with NEXT_PUBLIC_.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5273";

async function getApiErrorMessage(response: Response): Promise<string> {
  try {
    const errorData: { message?: string } = await response.json();
    return errorData.message ?? "Please check the information and try again.";
  } catch {
    return "Please check the information and try again.";
  }
}

export default function StudentProfileForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<StudentProfileFormData>(emptyForm);
  const [formStatus, setFormStatus] = useState<FormStatus>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof StudentProfileFormData, value: string) => {
    setFormData((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormStatus(null);

    try {
      // Send the same fields required by the ASP.NET Core CreateStudentRequest DTO.
      const response = await fetch(`${apiBaseUrl}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
      }

      setFormData(emptyForm);
      setFormStatus({
        type: "success",
        message: "Your student profile was created successfully.",
      });

      // Re-render Server Components so the directory immediately receives fresh database data.
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setFormStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="create-profile" className="bg-slate-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8">
        <div className="lg:pt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Student profile</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Start with your strengths.
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-8 text-slate-600">
            Add a simple profile so TeamFit can display your preferred project role. Skills and availability will be added in the next stages.
          </p>
          <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm leading-6 text-indigo-950">
            <p className="font-bold">What happens when you submit?</p>
            <p className="mt-2">The form sends a POST request to the TeamFit API, which validates and saves your profile in SQL Server.</p>
          </div>
        </div>

        <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-800">Full name</span>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                type="text"
                value={formData.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="e.g. Nimal Perera"
                maxLength={100}
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-800">University email</span>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                type="email"
                value={formData.universityEmail}
                onChange={(event) => updateField("universityEmail", event.target.value)}
                placeholder="e.g. name@nsbm.ac.lk"
                maxLength={150}
                required
              />
              <span className="mt-2 block text-xs leading-5 text-slate-500">Each email can be used for only one profile.</span>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-800">Preferred project role</span>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                type="text"
                value={formData.preferredRole}
                onChange={(event) => updateField("preferredRole", event.target.value)}
                placeholder="e.g. Frontend Developer"
                maxLength={50}
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-800">Short bio <span className="font-normal text-slate-500">(optional)</span></span>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                value={formData.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                placeholder="Tell teammates a little about your interests or experience."
                maxLength={500}
              />
            </label>
          </div>

          {formStatus ? (
            <div
              className={`mt-6 rounded-xl border p-4 text-sm leading-6 ${
                formStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
              role="status"
              aria-live="polite"
            >
              {formStatus.message}
            </div>
          ) : null}

          <button
            className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating profile..." : "Create student profile"}
          </button>
        </form>
      </div>
    </section>
  );
}
