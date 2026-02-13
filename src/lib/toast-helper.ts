import { useToast } from "@/hooks/use-toast";
// In your component:
const { toast } = useToast();
// Success toast:
toast({
    title: "Success!",
    description: "Operation completed",
});
// Error toast:
toast({
    title: "Error",
    description: "Something went wrong",
    variant: "destructive",
});