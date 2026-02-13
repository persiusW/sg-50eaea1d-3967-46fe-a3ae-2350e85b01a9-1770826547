import { useToast } from "@/hooks/use-toast";

export function useToastHelper() {
    const { toast } = useToast();

    const success = (description: string, title = "Success!") => {
        toast({ title, description });
    };

    const error = (description: string, title = "Error") => {
        toast({ title, description, variant: "destructive" });
    };

    return { success, error, toast };
}