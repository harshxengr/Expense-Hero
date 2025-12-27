import z from "zod";

export const RegisterFormSchema = z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(4, "Password is required"),
    confirmPassword: z.string()
})
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password don't match",
        path: ["confirmPassword"]
    })

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export const LoginFormSchema = z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required")
})

export type LoginFormValues = z.infer<typeof LoginFormSchema>;