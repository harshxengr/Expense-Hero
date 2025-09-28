/**
 * Custom Hook for API Calls
 * 
 * This hook simplifies making API calls by providing:
 * - Loading state management
 * - Error handling with toast notifications
 * - Data state management
 * - Type safety with TypeScript generics
 * 
 * Usage:
 * const { data, loading, error, fn } = useFetch(createAccount);
 * await fn(accountData);
 */

import { useState } from "react";
import { toast } from "sonner";

// Return type for the useFetch hook
interface UseFetchReturn<T> {
    data: T | null;           // The response data from the API call
    loading: boolean;         // Whether an API call is currently in progress
    error: Error | null;      // Any error that occurred during the API call
    fn: (...args: any[]) => Promise<void>;  // Function to trigger the API call
    setData: (data: T | null) => void;      // Function to manually update the data
}

/**
 * Custom hook for making API calls with loading and error states
 * 
 * @param callback - The async function to call (usually an action from /actions)
 * @returns Object with data, loading state, error, and function to call
 */
const useFetch = <T = any>(callback: (...args: any[]) => Promise<T>): UseFetchReturn<T> => {
    // State management
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Function to execute the API call
    const fn = async (...args: any[]) => {
        setLoading(true);      // Start loading
        setError(null);        // Clear any previous errors

        try {
            // Call the provided function with the arguments
            const response = await callback(...args);
            setData(response);  // Store the response
            setError(null);     // Clear any errors
        } catch (err) {
            // Handle any errors that occur
            const error = err as Error;
            setError(error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);  // Stop loading
        }
    };

    return { data, loading, error, fn, setData };
};

export default useFetch;