import RegisterForm from "@/components/auth/register-form"
import { noAuthRequired } from "@/lib/auth/auth-utils"

const Page = async () => {
    await noAuthRequired();

    return <RegisterForm />;
}

export default Page