"use server"

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj: any) => {
    const serialized = { ...obj };

    if (obj.balance) serialized.balance = obj.balance.toNumber();
    if (obj.amount) serialized.amount = obj.amount.toNumber();

    return serialized
}

export async function updateDefaultAccount(accountId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        await prisma.account.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false }
        })

        const account = await prisma.account.update({
            where: { id: accountId, userId: user.id },
            data: { isDefault: true }
        })

        revalidatePath("/dashboard");
        return { success: true, data: serializeTransaction(account) }
    } catch (error: unknown) {
        const err = error as Error
        return { success: false, error: err.message }
    }
}

export async function getAccountWithTransactions(accountId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const account = await prisma.account.findUnique({
        where: { id: accountId, userId: user.id },
        include: {
            transactions: {
                orderBy: { date: "desc" },
            },
            _count: {
                select: { transactions: true }
            }
        }
    })

    if (!account) return null;

    return {
        ...serializeTransaction(account),
        transactions: account.transactions.map(serializeTransaction),
    }
}

export async function bulkDeleteTransactions(transactionIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        // Step 1: Get the transactions to be deleted
        const transactions = await prisma.transaction.findMany({
            where: {
                id: { in: transactionIds },
                userId: user.id,
            },
        });

        // Step 2: Calculate balance changes per account
        const accountBalanceChanges: Record<string, number> = transactions.reduce((acc, transaction) => {
            const change = transaction.type === "EXPENSE" ? transaction.amount : -transaction.amount;
            acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
            return acc;
        }, {} as Record<string, number>);

        // Step 3: Perform deletion and balance updates in a transaction
        await prisma.$transaction(async (tx) => {
            await tx.transaction.deleteMany({
                where: {
                    id: { in: transactionIds },
                    userId: user.id,
                },
            });

            // Update account balances
            for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            increment: balanceChange,
                        },
                    },
                });
            }
        });

        // Step 4: Revalidate paths
        revalidatePath("/dashboard");
        revalidatePath("/account/[id]");

        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
