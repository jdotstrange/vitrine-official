import { Header } from "../profile/page"

export default function PrivacyPolicyPage() {
  return (
    <div className="px-8 py-8 max-w-2xl">
      <Header title="Privacy Policy" subtitle="Last updated: January 2026" />

      <div className="prose prose-invert mt-8 space-y-5 text-[14px] text-fg2 leading-relaxed">
        <p>
          Vitrine is a platform for collectors. We take privacy seriously and
          aim to give you full control over your data.
        </p>

        <h2 className="text-fg1 text-base font-semibold mt-6">
          What we collect
        </h2>
        <p>
          We collect the information you provide (profile, collectibles,
          showcases, messages) plus minimal technical metadata to keep the
          service running (device info, error logs, anonymized analytics).
        </p>

        <h2 className="text-fg1 text-base font-semibold mt-6">
          How we use it
        </h2>
        <p>
          Your collection is shown to other users based on the visibility
          settings you choose. We do not sell your data to third parties.
        </p>

        <h2 className="text-fg1 text-base font-semibold mt-6">Your controls</h2>
        <p>
          Adjust per-list visibility under Privacy. Export everything from
          Settings → Export Data. Delete your account permanently from Settings →
          Account.
        </p>

        <p className="text-fg3 text-[12px] pt-6">
          For the full policy, contact{" "}
          <a className="underline" href="mailto:privacy@vitrine.app">
            privacy@vitrine.app
          </a>
          .
        </p>
      </div>
    </div>
  )
}
