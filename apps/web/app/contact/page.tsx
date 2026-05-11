import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ContactPage as ContactContent } from "@/components/contact/contact-page"

export const metadata = {
  title: "Contact | Vitrine",
  description:
    "Real people. Real answers. Whether you have a question about the product, need help with your account, or want to talk about a partnership.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <ContactContent />
      <Footer />
    </main>
  )
}
