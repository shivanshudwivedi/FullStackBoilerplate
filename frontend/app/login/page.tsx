import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;
export const runtime = "edge";
export async function generateStaticParams() {
  return [];
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading login...</div>}>
      <LoginClient />
    </Suspense>
  );
}
