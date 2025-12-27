"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type SerializedAccount = {
    id: string;
    name: string;
    type: "CURRENT" | "SAVINGS";
    balance: number;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        transactions: number;
    };
};

const serializeTransaction = (obj: any): SerializedAccount => {
    const serialized = { ...obj } as SerializedAccount;

    if (obj.balance) {
        serialized.balance = obj.balance.toNumber();
    }
    return serialized;
};

interface CreateAccountInput {
    name: string;
    type: "CURRENT" | "SAVINGS";
    balance: string;
    isDefault: boolean;
}

interface CreateAccountResponse {
    success: boolean;
    data: SerializedAccount;
}

export async function createAccount(data: CreateAccountInput): Promise<CreateAccountResponse> {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        const balanceFloat = parseFloat(data.balance);
        if (isNaN(balanceFloat)) throw new Error("Invalid balance amount");

        const existingAccounts = await prisma.account.findMany({
            where: { userId: user.id },
        });

        const shouldBeDefault = existingAccounts.length === 0 || data.isDefault;

        if (shouldBeDefault) {
            await prisma.account.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false },
            });
        }

        const account = await prisma.account.create({
            data: {
                ...data,
                balance: balanceFloat,
                userId: user.id,
                isDefault: shouldBeDefault,
            },
        });

        const serializedAccount = serializeTransaction(account);

        revalidatePath("/dashboard");

        return { success: true, data: serializedAccount };
    } catch (error) {
        const err = error as Error
        throw new Error(err.message || "Failed to create account");
    }
}


export async function getUserAccounts(): Promise<SerializedAccount[]> {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const accounts = await prisma.account.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    transactions: true,
                },
            },
        },
    });

    return accounts.map(serializeTransaction);
}

export type SerializedTransaction = {
    id: string;
    accountId: string;
    type: "EXPENSE" | "INCOME";
    amount: number;
    description?: string;
    date: Date;
    category: string;
    receiptUrl?: string;
    isRecurring: boolean;
    recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    nextRecurringDate?: Date;
    lastProcessed?: Date;
    status: "PENDING" | "COMPLETED" | "FAILED";
    userId: string;
    createdAt: Date;
    updatedAt: Date;
};

const serializeTransactionData = (obj: any): SerializedTransaction => {
    const serialized = { ...obj } as SerializedTransaction;

    if (obj.amount) {
        serialized.amount = obj.amount.toNumber();
    }
    return serialized;
};

export async function getDashboardData(): Promise<SerializedTransaction[]> {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
  
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });
  
    if (!user) {
      throw new Error("User not found");
    }
  
    // Get all user transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });
  
    return transactions.map(serializeTransactionData);
}