import LoginForm from "@/components/auth/login-form";
import { noAuthRequired } from "@/lib/auth/auth-utils";

const Page = async () => {
    await noAuthRequired();

    return <LoginForm />;
}

export default Page