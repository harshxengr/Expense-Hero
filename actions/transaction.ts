"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const serializeAmount = (obj: any) => ({
    ...obj,
    amount: obj.amount.toNumber(),
});

interface CreateTransactionData {
    type: "EXPENSE" | "INCOME";
    amount: number;
    description?: string;
    date: Date;
    accountId: string;
    category: string;
    isRecurring?: boolean;
    recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
}
export async function createTransaction(data: CreateTransactionData) {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error("You must be logged in to create a transaction");
        }

        try {
            const req = await request();
            const decision = await aj.protect(req, {
                requested: 1,
            });

            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    throw new Error("Too many requests. Please wait a moment and try again.");
                }
                throw new Error("Request blocked. Please try again.");
            }
        } catch (rateLimitError) {
            console.warn("Rate limiting check failed:", rateLimitError);
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User account not found. Please try logging in again.");
        }

        const account = await prisma.account.findUnique({
            where: {
                id: data.accountId,
                userId: user.id,
            },
        });

        if (!account) {
            throw new Error("Account not found. Please select a valid account.");
        }

        const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
        const newBalance = account.balance.toNumber() + balanceChange;
        const transaction = await prisma.$transaction(async (tx) => {
            const newTransaction = await tx.transaction.create({
                data: {
                    ...data,
                    userId: user.id,
                    nextRecurringDate: data.isRecurring && data.recurringInterval
                        ? calculateNextRecurringDate(data.date, data.recurringInterval)
                        : null,
                },
            });

            await tx.account.update({
                where: { id: data.accountId },
                data: { balance: newBalance },
            });

            return newTransaction;
        });

        revalidatePath("/dashboard");
        revalidatePath(`/account/${transaction.accountId}`);

        return { 
            success: true, 
            data: serializeAmount(transaction) 
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create transaction";
        throw new Error(errorMessage);
    }
}

export async function getTransaction(id: any) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const transaction = await prisma.transaction.findUnique({
        where: {
            id,
            userId: user.id,
        },
    });

    if (!transaction) throw new Error("Transaction not found");

    return serializeAmount(transaction);
}

export async function updateTransaction(id: any, data: any) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) throw new Error("User not found");

        // Get original transaction to calculate balance change
        const originalTransaction = await prisma.transaction.findUnique({
            where: {
                id,
                userId: user.id,
            },
            include: {
                account: true,
            },
        });

        if (!originalTransaction) throw new Error("Transaction not found");

        // Calculate balance changes
        const oldBalanceChange =
            originalTransaction.type === "EXPENSE"
                ? -originalTransaction.amount.toNumber()
                : originalTransaction.amount.toNumber();

        const newBalanceChange =
            data.type === "EXPENSE" ? -data.amount : data.amount;

        const netBalanceChange = newBalanceChange - oldBalanceChange;

        // Update transaction and account balance in a transaction
        const transaction = await prisma.$transaction(async (tx) => {
            const updated = await tx.transaction.update({
                where: {
                    id,
                    userId: user.id,
                },
                data: {
                    ...data,
                    nextRecurringDate:
                        data.isRecurring && data.recurringInterval
                            ? calculateNextRecurringDate(data.date, data.recurringInterval)
                            : null,
                },
            });

            // Update account balance
            await tx.account.update({
                where: { id: data.accountId },
                data: {
                    balance: {
                        increment: netBalanceChange,
                    },
                },
            });

            return updated;
        });

        revalidatePath("/dashboard");
        revalidatePath(`/account/${data.accountId}`);

        return { success: true, data: serializeAmount(transaction) };
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                ...query,
            },
            include: {
                account: true,
            },
            orderBy: {
                date: "desc",
            },
        });

        return { success: true, data: transactions };
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

// Interface for scanned receipt data
interface ScannedReceiptData {
    amount: number;
    date: Date;
    description: string;
    category: string;
    merchantName: string;
}

// Scan a receipt image using AI
export async function scanReceipt(file: File): Promise<ScannedReceiptData> {
    try {
        // Check if API key is available
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("AI service not configured. Please contact support.");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Convert file to base64 for AI processing
        const arrayBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString("base64");

        // Simple, clear prompt for the AI
        const prompt = `
            Analyze this receipt image and extract the following information in JSON format:
            - Total amount (just the number)
            - Date (in ISO format)
            - Description or items purchased (brief summary)
            - Merchant/store name
            - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense)
            
            Only respond with valid JSON in this exact format:
            {
              "amount": number,
              "date": "ISO date string",
              "description": "string",
              "merchantName": "string",
              "category": "string"
            }

            If it's not a receipt, return an empty object.
        `;

        // Send request to AI
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64String,
                    mimeType: file.type,
                },
            },
            prompt,
        ]);

        // Get and clean the response
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        // Parse the JSON response
        const data = JSON.parse(cleanedText);
        
        // Validate the response
        if (!data.amount || !data.date || !data.category) {
            throw new Error("Could not extract all required information from the receipt");
        }

        return {
            amount: parseFloat(data.amount),
            date: new Date(data.date),
            description: data.description || "Receipt scan",
            category: data.category,
            merchantName: data.merchantName || "Unknown merchant",
        };

    } catch (error) {
        console.error("Error scanning receipt:", error);
        
        // Return user-friendly error message
        if (error instanceof Error) {
            throw new Error(`Failed to scan receipt: ${error.message}`);
        }
        throw new Error("Failed to scan receipt. Please try again or enter the information manually.");
    }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate: any, interval: any) {
    const date = new Date(startDate);

    switch (interval) {
        case "DAILY":
            date.setDate(date.getDate() + 1);
            break;
        case "WEEKLY":
            date.setDate(date.getDate() + 7);
            break;
        case "MONTHLY":
            date.setMonth(date.getMonth() + 1);
            break;
        case "YEARLY":
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date;
}