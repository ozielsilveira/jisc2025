import { toast } from "@/hooks/use-toast"

export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "success",
  })
}

export const showErrorToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "destructive",
  })
}

export const showWarningToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "warning",
  })
}

export const showInfoToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
  })
}

export const showLoadingToast = (title: string, description?: string) => {
  return toast({
    title,
    description,
    variant: "default",
    // Don't auto-dismiss loading toasts
  })
}
