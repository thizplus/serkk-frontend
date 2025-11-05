
import Image from "next/image"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          
            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={30}
                                height={30}
                                className="rounded-lg"
                              />
        
            <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {process.env.NEXT_PUBLIC_APP_NAME || "My App"}
                  </span>
                  <span className="truncate text-xs">
                    {process.env.NEXT_PUBLIC_APP_PLAN || "Free Plan"}
                  </span>
                </div>
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
