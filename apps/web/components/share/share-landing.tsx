import Link from "next/link"
import Image from "next/image"
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants"

interface ShareLandingProps {
  type: "collectible" | "showcase" | "profile"
  title: string
  subtitle?: string
  description?: string | null
  imageUrl?: string | null
  stats?: { label: string; value: string }[]
}

const TYPE_LABELS = {
  collectible: "Collectible",
  showcase: "Showcase",
  profile: "Collector",
} as const

export function ShareLanding({
  type,
  title,
  subtitle,
  description,
  imageUrl,
  stats,
}: ShareLandingProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <p className="mb-6 font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">
          {TYPE_LABELS[type]} on Vitrine
        </p>

        {imageUrl && (
          <div className="mb-8 aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-lg">
            <Image
              src={imageUrl}
              alt={title}
              width={640}
              height={640}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        )}

        <h1 className="mb-2 font-serif text-3xl text-foreground md:text-4xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mb-3 text-sm text-muted-foreground">{subtitle}</p>
        )}

        {description && (
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {stats && stats.length > 0 && (
          <div className="mb-8 flex gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-mono text-lg font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <Link
            href={APP_STORE_URL}
            className="inline-flex rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            Open in Vitrine
          </Link>
          <Link
            href={PLAY_STORE_URL}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Get it on Google Play
          </Link>
        </div>

        <p className="mt-12 max-w-xs text-xs leading-relaxed text-muted-foreground/60">
          Vitrine is the premier app for collectors to catalog, showcase, and connect.
        </p>
      </div>
    </main>
  )
}

export function ShareNotFound({ type }: { type: "collectible" | "showcase" | "profile" }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="relative z-10 max-w-md text-center">
        <p className="mb-4 font-mono text-5xl text-primary">404</p>
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          {TYPE_LABELS[type]} not found
        </h1>
        <p className="mb-8 text-muted-foreground">
          This {type} may have been removed or the link may be incorrect.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground transition-all hover:opacity-90"
        >
          Go to Vitrine
        </Link>
      </div>
    </main>
  )
}
