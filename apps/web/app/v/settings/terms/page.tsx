import { Header } from "../profile/page"

export default function TermsPage() {
  return (
    <div className="px-8 py-8 max-w-2xl">
      <Header title="Terms of Service" subtitle="Last updated: January 2026" />

      <div className="prose prose-invert mt-8 space-y-5 text-[14px] text-fg2 leading-relaxed">
        <p>
          By using Vitrine, you agree to use the service responsibly. You retain
          ownership of the content you upload (photos, descriptions). You grant
          Vitrine a license to display that content within the service for
          discovery, sharing, and search.
        </p>

        <h2 className="text-fg1 text-base font-semibold mt-6">Conduct</h2>
        <p>
          Don't upload content that infringes others' rights, harass other
          users, or attempt to disrupt the service. Listings should reflect real
          collectibles — fraudulent or misleading content can be removed.
        </p>

        <h2 className="text-fg1 text-base font-semibold mt-6">Marketplace</h2>
        <p>
          Vitrine connects collectors. Vitrine itself is not a party to any
          transactions arranged between users; you are responsible for the
          terms, payment, and shipping of any sale or trade.
        </p>

        <h2 className="text-fg1 text-base font-semibold mt-6">Termination</h2>
        <p>
          You may delete your account at any time. We may suspend access for
          violations of these terms.
        </p>

        <p className="text-fg3 text-[12px] pt-6">
          Questions? Contact{" "}
          <a className="underline" href="mailto:legal@vitrine.app">
            legal@vitrine.app
          </a>
          .
        </p>
      </div>
    </div>
  )
}
