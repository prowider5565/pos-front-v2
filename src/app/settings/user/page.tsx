"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { invoke } from '@tauri-apps/api/core'
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Link2, Unlink, ExternalLink } from "lucide-react"

export default function UserSettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  const { user, refreshUserData } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTelegramLinking, setIsTelegramLinking] = useState(false)
  const [isTelegramUnlinking, setIsTelegramUnlinking] = useState(false)
  const [isPollingLinkStatus, setIsPollingLinkStatus] = useState(false)
  const [showManualLinkDialog, setShowManualLinkDialog] = useState(false)
  const [manualTelegramId, setManualTelegramId] = useState("")
  const [manualTelegramUsername, setManualTelegramUsername] = useState("")
  const [isManualLinking, setIsManualLinking] = useState(false)

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

  // Check if running in Tauri environment
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

  // Poll link status when linking is in progress
  useEffect(() => {
    if (!isPollingLinkStatus) return

    const pollInterval = setInterval(async () => {
      try {
        const status = await authService.checkTelegramLinkStatus()
        if (status.linked) {
          // Account was linked successfully
          setIsPollingLinkStatus(false)
          setIsTelegramLinking(false)
          await refreshUserData()
          toast.success(t('settings:telegram.linkSuccess'))
        }
      } catch (error) {
        console.error('Failed to check link status:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      setIsPollingLinkStatus(false)
      setIsTelegramLinking(false)
      toast.error(t('settings:telegram.linkTimeout'))
    }, 120000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [isPollingLinkStatus, refreshUserData, t])

  // Handle Telegram link button click
  const handleLinkTelegram = async () => {
    setIsTelegramLinking(true)
    
    try {
      // Check if Telegram Desktop is installed (only in Tauri)
      if (isTauri) {
        const isInstalled = await invoke<boolean>('check_telegram_installed')
        
        if (!isInstalled) {
          // Show dialog to user
          const shouldInstall = window.confirm(
            t('settings:telegram.notInstalledPrompt') + '\n\n' +
            t('settings:telegram.installOptions')
          )
          
          if (!shouldInstall) {
            // User chose manual input
            setIsTelegramLinking(false)
            setShowManualLinkDialog(true)
            return
          } else {
            // User wants to install - show instructions
            toast.info(t('settings:telegram.installInstructions'))
            setIsTelegramLinking(false)
            return
          }
        }
      }
      
      // Telegram is installed or browser mode - proceed with bot link
      const { token, bot_username } = await authService.generateTelegramLinkToken()
      
      // Check if user is admin
      const isAdmin = user?.is_superuser || false
      
      // Build Telegram bot deep link with admin flag
      const botLink = authService.getTelegramBotLink(bot_username, token, isAdmin)
      console.log('Opening Telegram bot link:', botLink, { isAdmin })
      
      if (isTauri) {
        // Open Telegram using Tauri command
        await invoke('open_telegram_link', { url: botLink })
      } else {
        // Fallback for browser development - open in new tab
        window.open(botLink, '_blank')
      }
      
      // Start polling for link status
      setIsPollingLinkStatus(true)
      toast.info(t('settings:telegram.linkingInProgress'))
    } catch (error) {
      console.error('Failed to open Telegram link:', error)
      toast.error(t('settings:telegram.linkError'))
      setIsTelegramLinking(false)
    }
  }

  // Handle manual Telegram ID link
  const handleManualLink = async () => {
    if (!manualTelegramId.trim()) {
      toast.error(t('settings:telegram.telegramIdRequired'))
      return
    }
    
    setIsManualLinking(true)
    try {
      await authService.linkTelegramManually(
        manualTelegramId.trim(),
        manualTelegramUsername.trim() || undefined
      )
      await refreshUserData()
      toast.success(t('settings:telegram.linkSuccess'))
      setShowManualLinkDialog(false)
      setManualTelegramId("")
      setManualTelegramUsername("")
    } catch (error: any) {
      console.error('Failed to link manually:', error)
      toast.error(t('settings:telegram.manualLinkError'))
    } finally {
      setIsManualLinking(false)
    }
  }

  // Handle Telegram unlink button click
  const handleUnlinkTelegram = async () => {
    setIsTelegramUnlinking(true)
    try {
      await authService.unlinkTelegramAccount()
      await refreshUserData()
      toast.success(t('settings:telegram.unlinkSuccess'))
    } catch (error: any) {
      console.error('Failed to unlink Telegram:', error)
      toast.error(t('settings:telegram.unlinkError'))
    } finally {
      setIsTelegramUnlinking(false)
    }
  }

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

        {/* Telegram Account Linking Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('settings:telegram.title')}</CardTitle>
            <CardDescription>{t('settings:telegram.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.telegram_id ? (
              // Telegram account is linked
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    <Link2 className="h-3 w-3" />
                    {t('settings:telegram.linked')}
                  </Badge>
                </div>
                
                <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
                  {user.telegram_username && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('settings:telegram.username')}:</span>
                      <span className="text-sm">@{user.telegram_username}</span>
                    </div>
                  )}
                  {user.telegram_first_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('settings:telegram.name')}:</span>
                      <span className="text-sm">{user.telegram_first_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('settings:telegram.userId')}:</span>
                    <span className="text-sm font-mono">{user.telegram_id}</span>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleUnlinkTelegram}
                  disabled={isTelegramUnlinking}
                  className="gap-2"
                >
                  {isTelegramUnlinking ? (
                    <LoadingSpinner className="h-4 w-4" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                  {t('settings:telegram.unlinkButton')}
                </Button>
              </div>
            ) : (
              // Telegram account is not linked
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Unlink className="h-3 w-3" />
                    {t('settings:telegram.notLinked')}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {t('settings:telegram.linkDescription')}
                </p>

                <Button
                  variant="default"
                  onClick={handleLinkTelegram}
                  disabled={isTelegramLinking}
                  className="gap-2"
                >
                  {isTelegramLinking ? (
                    <LoadingSpinner className="h-4 w-4" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {t('settings:telegram.linkButton')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Telegram ID Link Dialog */}
        <Dialog open={showManualLinkDialog} onOpenChange={setShowManualLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings:telegram.manualLinkTitle')}</DialogTitle>
              <DialogDescription>
                {t('settings:telegram.manualLinkDescription')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram-id">
                  {t('settings:telegram.telegramIdLabel')} *
                </Label>
                <Input
                  id="telegram-id"
                  placeholder="123456789"
                  value={manualTelegramId}
                  onChange={(e) => setManualTelegramId(e.target.value)}
                  disabled={isManualLinking}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings:telegram.telegramIdHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram-username">
                  {t('settings:telegram.telegramUsernameLabel')} ({t('common:optional')})
                </Label>
                <Input
                  id="telegram-username"
                  placeholder="@username"
                  value={manualTelegramUsername}
                  onChange={(e) => setManualTelegramUsername(e.target.value)}
                  disabled={isManualLinking}
                />
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-1">{t('settings:telegram.howToFindId')}</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>{t('settings:telegram.findIdStep1')}</li>
                  <li>{t('settings:telegram.findIdStep2')}</li>
                  <li>{t('settings:telegram.findIdStep3')}</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualLinkDialog(false)
                  setManualTelegramId("")
                  setManualTelegramUsername("")
                }}
                disabled={isManualLinking}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                onClick={handleManualLink}
                disabled={isManualLinking || !manualTelegramId.trim()}
              >
                {isManualLinking ? <LoadingSpinner className="mr-2" /> : null}
                {t('settings:telegram.linkButton')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BaseLayout>
  )
}
