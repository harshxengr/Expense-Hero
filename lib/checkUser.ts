import { currentUser } from "@clerk/nextjs/server"
import prisma from "./prisma";

const checkUser = async () => {
    const user = await currentUser();

    if (!user) return null

    try {
        const loggedInUser = await prisma.user.findUnique({
            where: { clerkUserId: user.id }
        })

        if (loggedInUser) return loggedInUser

        const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

        const newUser = await prisma.user.create({
            data: {
                clerkUserId: user.id,
                name,
                imageUrl: user.imageUrl,
                email: user.emailAddresses[0].emailAddress
            }
        })

        return newUser;

    } catch (error) {
        console.error((error as Error).message);
        return null
    }
}

export default checkUser