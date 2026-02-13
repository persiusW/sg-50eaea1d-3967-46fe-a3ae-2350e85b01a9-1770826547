import { toast } from "@/components/ui/use-toast";
/**
 * Show a success toast
 */
export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: "default",
  });
}
/**
 * Show an error toast
 */
export function showErrorToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: "destructive",
  });
}
/**
 * Show toast for successful create operation
 */
export function showCreateSuccessToast(entity: string) {
  showSuccessToast(`Successfully created ${entity}`);
}
/**
 * Show toast for successful update operation
 */
export function showUpdateSuccessToast(entity: string) {
  showSuccessToast(`Successfully updated ${entity}`);
}
/**
 * Show toast for successful delete operation
 */
export function showDeleteSuccessToast(entity: string) {
  showSuccessToast(`Successfully deleted ${entity}`);
}
/**
 * Show toast for failed operation
 */
export function showOperationErrorToast(action: string, entity: string, error?: string) {
  const baseMessage = `Failed to ${action} ${entity}`;
  const description = error || "Please try again.";
  showErrorToast(baseMessage, description);
}
/**
 * Show toast for successful bulk operation
 */
export function showBulkSuccessToast(action: string, entity: string, count: number) {
  showSuccessToast(`Successfully ${action} ${count} ${entity}`);
}