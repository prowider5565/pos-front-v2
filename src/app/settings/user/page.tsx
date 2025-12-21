"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { authService } from "@/services/auth.service"
import { useAuth } from "@/contexts/auth-context"
import type { UpdateProfileRequest } from "@/types/auth"

export default function UserSettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  const { user, refreshUserData } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Phone number validation with country code
  const phoneRegex = /^\+?[1-9]\d{1,14}$/

  // Form schema with validation - matches API fields
  const profileFormSchema = z.object({
    username: z.string().min(3, t('settings:validation.usernameMin', { min: 3 })).max(150, t('settings:validation.usernameMax', { max: 150 })),
    first_name: z.string().min(1, t('common:form.required')).max(150, t('settings:validation.nameMax', { max: 150 })),
    last_name: z.string().min(1, t('common:form.required')).max(150, t('settings:validation.nameMax', { max: 150 })),
    phone_number: z.string()
      .min(9, t('settings:validation.phoneMin', { min: 9 }))
      .max(15, t('settings:validation.phoneMax', { max: 15 }))
      .regex(phoneRegex, t('settings:validation.phoneInvalid')),
  })

  // Form value type based on API requirements
  type ProfileFormValues = z.infer<typeof profileFormSchema>
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      phone_number: "",
    },
  })

  // Load current user data into form
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
      })
      setIsLoading(false)
    }
  }, [user, form])

  // Handle form submission
  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true)
    try {
      // Create update request with only changed fields
      const updateData: UpdateProfileRequest = {}
      
      if (data.username !== user?.username) {
        updateData.username = data.username
      }
      if (data.first_name !== user?.first_name) {
        updateData.first_name = data.first_name
      }
      if (data.last_name !== user?.last_name) {
        updateData.last_name = data.last_name
      }
      if (data.phone_number !== user?.phone_number) {
        updateData.phone_number = data.phone_number
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.info(t('settings:messages.noChanges'))
        return
      }

      await authService.updateProfile(updateData)
      
      // Refresh user data in context
      await refreshUserData()
      
      toast.success(t('settings:messages.profileUpdated'))
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      
      // Handle specific error messages
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Display field-specific errors
        Object.keys(errorData).forEach((field) => {
          const message = Array.isArray(errorData[field]) 
            ? errorData[field][0] 
            : errorData[field]
          
          if (field === 'username' || field === 'first_name' || field === 'last_name' || field === 'phone_number') {
            form.setError(field as keyof ProfileFormValues, {
              type: 'manual',
              message: message,
            })
          }
        })
        
        // Show general error if exists
        if (errorData.detail) {
          toast.error(errorData.detail)
        }
      } else {
        toast.error(t('settings:messages.errorSaving'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <BaseLayout title={t('settings:user.title')} description={t('settings:user.description')}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout title={t('settings:user.title')} description={t('settings:user.description')}>
      <div className="px-4 lg:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings:user.fields.username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('settings:user.placeholders.username')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings:user.fields.phoneNumber')}</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder={t('settings:user.placeholders.phoneNumber')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First Name */}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings:user.fields.firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('settings:user.placeholders.firstName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings:user.fields.lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('settings:user.placeholders.lastName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-start">
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
                {t('common:actions.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
          </form>
        </Form>
      </div>
    </BaseLayout>
  )
}
