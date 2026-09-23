import AuthScreen from "@/components/auth-screen";
export default async function Page({ searchParams }: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const query = await searchParams;
  return <AuthScreen mode="register" next={typeof query.next === "string" ? query.next : undefined} />;
}
