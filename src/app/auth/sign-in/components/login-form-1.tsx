"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"
import { ApiException } from "@/services/api.service"
import { toast } from "sonner"

type LoginFormValues = {
  login: string
  password: string
}

export function LoginForm1({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { t } = useTranslation('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)

  const loginFormSchema = z.object({
    login: z.string().min(1, t('login.errors.usernameTooShort')),
    password: z.string().min(1, t('login.errors.passwordRequired')),
  })

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true)
      setErrorMessage("")
      
      await login(values)
      
      toast.success(t('login.success.title'), {
        description: t('login.success.message'),
      })

      // Redirect to the page user was trying to access, or dashboard
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard"
      navigate(from, { replace: true })
    } catch (error) {
      console.error("Login error:", error)
      
      if (error instanceof ApiException) {
        // Handle specific error messages from backend
        const errorData = error.data
        
        if (errorData.detail) {
          setErrorMessage(errorData.detail)
        } else if (errorData.login) {
          setErrorMessage(Array.isArray(errorData.login) ? errorData.login[0] : errorData.login)
        } else if (errorData.password) {
          setErrorMessage(Array.isArray(errorData.password) ? errorData.password[0] : errorData.password)
        } else {
          setErrorMessage(t('login.errors.invalidCredentials'))
        }
      } else {
        setErrorMessage(t('login.errors.unexpectedError'))
      }
      
      toast.error(t('login.errors.invalidCredentials'), {
        description: errorMessage || t('login.errors.unexpectedError'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('login.title')}</CardTitle>
          <CardDescription>
            {t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                {errorMessage && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {errorMessage}
                  </div>
                )}
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="login"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('login.usernameLabel')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder={t('login.usernamePlaceholder')}
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>{t('login.passwordLabel')}</FormLabel>
                          <a
                            href="/auth/forgot-password"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            {t('login.forgotPassword')}
                          </a>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder={t('login.passwordPlaceholder')}
                              disabled={isLoading}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
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
                  <Button 
                    type="submit" 
                    className="w-full cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? t('login.loggingIn') : t('login.loginButton')}
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full cursor-pointer" 
                    type="button"
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    {t('login.loginWithGoogle')}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  {t('login.noAccount')}{" "}
                  <a href="/auth/sign-up" className="underline underline-offset-4">
                    {t('login.signUp')}
                  </a>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        {t('login.termsPrefix')} <a href="#">{t('login.termsOfService')}</a>{" "}
        {t('login.and')} <a href="#">{t('login.privacyPolicy')}</a>.
      </div>
    </div>
  )
}
