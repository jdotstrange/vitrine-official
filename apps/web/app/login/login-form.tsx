"use client"

import { useState, useRef, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"
import { VitrineMark } from "@/components/marketing/VitrineMark"

type Step = "email" | "otp"

const OTP_LENGTH = 6

export function LoginForm({
  redirectTo,
  mode = "signin",
}: {
  redirectTo: string
  mode?: "signin" | "signup"
}) {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (step === "otp") {
      otpRefs.current[0]?.focus()
    }
  }, [step])

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

  const maskedEmail = () => {
    const [local, domain] = email.trim().split("@")
    if (!local || !domain) return email
    const masked =
      local.length > 2
        ? `${local[0]}${"*".repeat(Math.min(local.length - 2, 3))}${local[local.length - 1]}`
        : local
    return `${masked}@${domain}`
  }

  function handleSendOtp() {
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })
      if (error) {
        setError(error.message)
      } else {
        setStep("otp")
      }
    })
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    if (value.length > 1) value = value[0]

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
    if (!pasted) return
    const newOtp = [...otp]
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i]
    }
    setOtp(newOtp)
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    otpRefs.current[nextIndex]?.focus()
  }

  function handleVerify() {
    const code = otp.join("")
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit code`)
      return
    }
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      })
      if (error) {
        setError(error.message)
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    })
  }

  function handleResend() {
    setOtp(Array(OTP_LENGTH).fill(""))
    setError(null)
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })
      if (error) setError(error.message)
      else otpRefs.current[0]?.focus()
    })
  }

  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-5">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Back button (OTP step only) */}
        {step === "otp" && (
          <button
            onClick={() => {
              setStep("email")
              setOtp(Array(OTP_LENGTH).fill(""))
              setError(null)
            }}
            className="self-start mb-8 text-fg3 hover:text-fg1 transition-colors"
            aria-label="Go back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Email step */}
        {step === "email" && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
            {/* Logo */}
            <div className="mb-8 text-fg1">
              <VitrineLogo size={200} />
            </div>

            {/* Title */}
            <p className="text-xs uppercase tracking-[0.15em] text-fg1 mb-2">
              {mode === "signup" ? "Create your account" : "Welcome Back"}
            </p>
            <p className="text-xs text-fg3 mb-12">
              {mode === "signup"
                ? "Enter your email to get started"
                : "Enter your email to sign in"}
            </p>

            {/* Email input */}
            <div className="w-full mb-6 relative">
              <div
                className={`absolute -inset-px rounded-xl transition-opacity duration-300 bg-brand-volt/20 ${
                  isFocused ? "opacity-100" : "opacity-0"
                }`}
              />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) =>
                  e.key === "Enter" && isValidEmail(email) && handleSendOtp()
                }
                autoFocus
                className="relative w-full rounded-xl border border-frost-border bg-sheet-bg px-4 py-3 text-base text-fg1 placeholder:text-fg3/50 outline-none transition-colors"
              />
            </div>

            {/* CTA */}
            <button
              onClick={handleSendOtp}
              disabled={!isValidEmail(email) || isPending}
              className="w-full rounded-full bg-brand-volt py-3.5 px-6 text-sm font-medium uppercase tracking-wider text-void shadow-[0_4px_12px_rgba(232,224,212,0.3)] transition-all hover:opacity-90 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isPending
                ? "Sending Code..."
                : mode === "signup"
                  ? "Create Account"
                  : "Sign In"}
            </button>

            {/* Error */}
            {error && (
              <p className="mt-4 text-xs text-semantic-red text-center">
                {error}
              </p>
            )}

            {/* Toggle */}
            <p className="mt-6 text-xs text-fg3">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <a href="/login" className="text-fg1 underline">
                    Sign in
                  </a>
                </>
              ) : (
                <>
                  New to Vitrine?{" "}
                  <a href="/signup" className="text-fg1 underline">
                    Create an account
                  </a>
                </>
              )}
            </p>

            {/* Footer */}
            <p className="mt-8 text-[10px] text-fg3 text-center leading-4">
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-fg1 underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-fg1 underline">
                Privacy Policy
              </a>
            </p>
          </div>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4 fade-in duration-300">
            {/* Crown mark */}
            <div className="mb-5 text-fg1">
              <VitrineMark size={48} />
            </div>

            {/* Title */}
            <p className="text-xs uppercase tracking-[0.15em] text-fg1 mb-2">
              Enter Verification Code
            </p>
            <p className="text-xs text-fg3 mb-10 text-center leading-5">
              We sent a {OTP_LENGTH}-digit code to
              <br />
              <span className="text-fg1 font-medium">{maskedEmail()}</span>
            </p>

            {/* OTP boxes */}
            <div className="flex gap-2 mb-5" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-[52px] rounded-[10px] border border-frost-border bg-sheet-bg text-center text-lg text-fg1 outline-none focus:border-brand-volt/50 transition-colors"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="mb-4 text-xs text-semantic-red text-center">
                {error}
              </p>
            )}

            {/* Resend */}
            <button
              onClick={handleResend}
              disabled={isPending}
              className="mb-6 text-xs text-fg3 underline underline-offset-2 hover:text-fg2 transition-colors disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Resend code"}
            </button>

            {/* Verify CTA */}
            <button
              onClick={handleVerify}
              disabled={otp.join("").length !== OTP_LENGTH || isPending}
              className="w-full rounded-full bg-brand-volt py-3.5 px-6 text-sm font-medium uppercase tracking-wider text-void shadow-[0_4px_12px_rgba(232,224,212,0.3)] transition-all hover:opacity-90 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isPending ? "Verifying..." : "Sign In"}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
