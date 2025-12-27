import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export const authRequired = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) redirect("/login");

    return session;
}

export const noAuthRequired = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session) redirect("/");
}