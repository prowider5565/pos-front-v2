"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"

type ForgotPasswordFormValues = {
  email: string
}

export function ForgotPasswordForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const forgotPasswordSchema = z.object({
    email: z.string().email(t('forgotPassword.errors.invalidEmail')),
  })

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (_values: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true)
      
      // TODO: Implement password reset API call when backend endpoint is ready
      // await authService.requestPasswordReset(values.email)
      
      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      setEmailSent(true)
      toast.success(t('forgotPassword.success.title'), {
        description: t('forgotPassword.success.message'),
      })
    } catch (error) {
      console.error("Password reset error:", error)
      toast.error(t('forgotPassword.errors.sendFailed'), {
        description: t('forgotPassword.errors.sendFailed'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('forgotPassword.title')}</CardTitle>
          <CardDescription>
            {emailSent 
              ? t('forgotPassword.success.checkInbox')
              : t('forgotPassword.subtitle')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="grid gap-6">
              <div className="rounded-md bg-green-500/10 p-4 text-center text-sm text-green-600 dark:text-green-400">
                <p className="font-medium">{t('forgotPassword.success.checkInbox')}</p>
                <p className="mt-1 text-xs">
                  {t('forgotPassword.success.checkSpam')}
                </p>
              </div>
              <div className="text-center text-sm">
                <a href="/auth/sign-in" className="underline underline-offset-4">
                  {t('forgotPassword.backToSignIn')}
                </a>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forgotPassword.emailLabel')}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t('forgotPassword.emailPlaceholder')}
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full cursor-pointer"
                      disabled={isLoading}
                    >
                      {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    {t('forgotPassword.rememberPassword')}{" "}
                    <a href="/auth/sign-in" className="underline underline-offset-4">
                      {t('forgotPassword.backToSignIn')}
                    </a>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
