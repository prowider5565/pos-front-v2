"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { authService } from "@/services/auth.service"
import { apiService } from "@/services/api.service"
import type { User } from "@/types/auth"

const createUserFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  phone_number: z.string().min(1, "Phone number is required"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

const editUserFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  phone_number: z.string().min(1, "Phone number is required"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Only validate password match if password is provided
  if (data.password || data.confirmPassword) {
    if (!data.password || data.password.length < 6) {
      return false
    }
    return data.password === data.confirmPassword
  }
  return true
}, {
  message: "Passwords do not match or password is too short (min 6 characters)",
  path: ["confirmPassword"],
})

type CreateUserFormValues = z.infer<typeof createUserFormSchema>
type EditUserFormValues = z.infer<typeof editUserFormSchema>

interface UserFormDialogProps {
  user?: User
  onSuccess?: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function UserFormDialog({ user, onSuccess, trigger, open: controlledOpen, onOpenChange }: UserFormDialogProps) {
  const { t } = useTranslation(['users', 'common'])
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const isEditMode = !!user
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  const form = useForm<CreateUserFormValues | EditUserFormValues>({
    resolver: zodResolver(isEditMode ? editUserFormSchema : createUserFormSchema),
    defaultValues: {
      username: "",
      phone_number: "",
      first_name: "",
      last_name: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Reset form when user prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        form.reset({
          username: user.username,
          phone_number: user.phone_number,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          password: "",
          confirmPassword: "",
        })
      } else {
        form.reset({
          username: "",
          phone_number: "",
          first_name: "",
          last_name: "",
          password: "",
          confirmPassword: "",
        })
      }
    }
  }, [open, user, isEditMode, form])

  const onSubmit = async (data: CreateUserFormValues | EditUserFormValues) => {
    setIsLoading(true)
    try {
      if (isEditMode && user) {
        // Edit existing user
        const updateData: any = {
          username: data.username,
          phone_number: data.phone_number,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
        }
        
        // Only include password if it's provided
        if (data.password && data.password.length > 0) {
          updateData.password = data.password
        }
        
        await apiService.patch(`/auth/users/${user.id}/`, updateData)
        toast.success(t('messages.userUpdated'))
      } else {
        // Create new user
        await authService.addUser({
          username: data.username,
          phone_number: data.phone_number,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          password: data.password!,
        })
        toast.success(t('messages.userCreated'))
      }
      
      setOpen(false)
      form.reset()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} user:`, error)
      const errorMessage = error?.response?.data?.detail || error?.message || `Failed to ${isEditMode ? 'update' : 'create'} user`
      toast.error(t('common:messages.error'), {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="cursor-pointer">
      <Plus className="mr-2 size-4" />
      {t('addUser')}
    </Button>
  )

  const dialogContent = (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? t('editUser') : t('addUser')}</DialogTitle>
        <DialogDescription>
          {t('subtitle')}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.username')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('form.usernamePlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.phoneNumber')}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      international
                      defaultCountry="UZ"
                      value={field.value}
                      onChange={field.onChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.firstName')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('form.firstNamePlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.lastName')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('form.lastNamePlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('form.password')}
                    {isEditMode && <span className="text-xs text-muted-foreground ml-2">(Leave blank to keep current)</span>}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder={t('form.passwordPlaceholder')} 
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.confirmPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t('form.confirmPasswordPlaceholder')} 
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="cursor-pointer"
              >
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading} className="cursor-pointer">
                {isLoading ? t('common:actions.saving') : t('common:actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
  )

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
