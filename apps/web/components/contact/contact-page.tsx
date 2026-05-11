"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { Mail } from "lucide-react"

const topicOptions = [
  "I have a question about Vitrine",
  "I need help with my account",
  "I\u2019m a collector interested in testing new categories",
  "Press or media inquiry",
  "Partnership or community collaboration",
  "Something else",
]

const directChannels = [
  { label: "General inquiries", email: "hello@vitrine.app" },
  { label: "Support", email: "support@vitrine.app" },
  { label: "Press", email: "press@vitrine.app" },
]

export function ContactPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 })
  const [submitted, setSubmitted] = useState(false)
  const [topic, setTopic] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-24 pb-24 md:pt-32 md:pb-32"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-6">
        {/* Hero */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-6">
            <SectionLabel>Contact</SectionLabel>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-balance">
            <span className="text-foreground">Real people.</span>{" "}
            <span className="text-muted-foreground">Real answers.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Whether you have a question about the product, need help with your account, or want to talk about a partnership&nbsp;&mdash; you&apos;ll hear back from a person. Not a queue.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {submitted ? (
            <motion.div
              className="rounded-2xl border border-primary/20 bg-card p-8 md:p-10 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Got it.</h3>
              <p className="text-muted-foreground leading-relaxed">
                A real person will see this and get back to you&nbsp;&mdash; usually within a day.
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card p-8 md:p-10 space-y-6"
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-foreground mb-2">
                  What&apos;s this about?
                </label>
                <select
                  id="topic"
                  name="topic"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="" disabled>Select a topic</option>
                  {topicOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors resize-none"
                  placeholder="What can we help with?"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-all hover:bg-primary/80 hover:shadow-[var(--shadow-accent)]"
              >
                Send it
              </button>
            </form>
          )}
        </motion.div>

        {/* Direct Channels */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {directChannels.map((channel) => (
              <div
                key={channel.email}
                className="p-5 rounded-2xl border border-border bg-card text-center"
              >
                <p className="text-sm text-muted-foreground mb-1">{channel.label}</p>
                <a
                  href={`mailto:${channel.email}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {channel.email}
                </a>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            If you prefer email directly, those work too. Same people. Same response time.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
