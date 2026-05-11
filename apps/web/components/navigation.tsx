"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { DownloadModal } from "./download-modal"

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const { scrollY } = useScroll()
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.98])
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    if (latest > 100 && latest > previous) {
      setIsHidden(true)
    } else {
      setIsHidden(false)
    }
    setIsScrolled(latest > 20)
  })

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-[var(--z-sticky)] transition-all duration-300",
          isScrolled 
            ? "hud-overlay shadow-sm" 
            : "bg-gradient-to-b from-background/80 to-transparent"
        )}
        style={{ opacity: headerOpacity }}
        initial={{ y: 0 }}
        animate={{ y: isHidden ? -100 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <nav className="relative flex items-center justify-between px-6 sm:px-8 lg:px-12 py-3">
          {/* Wordmark */}
          <Link href="/" className="relative group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Image src="/logo.svg" alt="Vitrine" width={90} height={24} className="h-6 w-auto" priority />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center md:flex">
            <div className="flex items-center gap-1 rounded-full bg-foreground/[0.03] border border-border p-1">
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        "relative px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors",
                        isActive
                          ? "bg-primary text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="relative z-10">{link.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <motion.button
              onClick={() => setIsDownloadModalOpen(true)}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 hover:shadow-[var(--shadow-accent)]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Download Free
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-foreground/5 md:hidden"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              ref={menuRef}
              className="absolute left-0 right-0 top-full overflow-hidden md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="glass-premium px-4 py-6">
                <motion.div 
                  className="relative flex flex-col gap-1"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05 } },
                  }}
                >
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
                      <motion.div
                        key={link.href}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 },
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block rounded-xl px-4 py-3 text-base font-medium transition-colors",
                            isActive
                              ? "bg-primary text-foreground"
                              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                          )}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    )
                  })}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    className="pt-4 border-t border-border mt-2"
                  >
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setIsDownloadModalOpen(true)
                      }}
                      className="w-full rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90"
                    >
                      Download App
                    </button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[calc(var(--z-sticky)-1)] bg-foreground/10 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <DownloadModal open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen} />
    </>
  )
}
