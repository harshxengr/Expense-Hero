"use server";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export async function sendEmail({ to, subject, react }: any) {
    if (!apiKey) {
        console.error("RESEND_API_KEY is missing!");
        return { success: false, error: "Missing Resend API key" };
    }

    const resend = new Resend(apiKey);

    try {
        const response = await resend.emails.send({
            from: "Finance App <onboarding@resend.dev>",
            to,
            subject,
            react,
        });

        return { success: true, data: response };
    } catch (err) {
        console.error("Failed to send email:", err);
        return { success: false, error: err };
    }
}