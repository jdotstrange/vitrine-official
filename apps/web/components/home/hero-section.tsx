"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion"
import { MagneticButton } from "@/components/magnetic-button"
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants"

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function PlayStoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
    </svg>
  )
}

interface HeroSectionProps {
  mosaicImages?: string[]
}

export function HeroSection({ mosaicImages = [] }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 })
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 200])
  
  const gridX = useTransform(smoothMouseX, [0, 1], [-15, 15])
  const gridY = useTransform(smoothMouseY, [0, 1], [-15, 15])
  
  useEffect(() => {
    setIsLoaded(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth)
      mouseY.set(e.clientY / window.innerHeight)
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  }
  
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      filter: "blur(8px)",
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }

  const collectibleImages = mosaicImages

  return (
    <motion.section 
      ref={sectionRef} 
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background"
      style={{ opacity: heroOpacity }}
    >
      {/* Ambient gradient — warm neutral glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-secondary/30 blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px]" style={{ background: "var(--accent-glow)" }} />
      </div>

      {/* Background mosaic */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-0"
          style={{ x: gridX, y: gridY }}
        >
          <div className="h-full w-full perspective-container">
            <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {collectibleImages.map((imageUrl, i) => (
                <motion.div
                  key={i}
                  className="aspect-[3/4] rounded-xl border border-border overflow-hidden relative bg-secondary"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 0.4 - i * 0.01,
                    scale: 1,
                    y: 0,
                  }}
                  transition={{ 
                    duration: 0.6,
                    delay: 0.8 + i * 0.02,
                    ease: "easeOut",
                  }}
                >
                  <img
                    src={imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/30 to-background/10" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
      </div>

      {/* Content */}
      <motion.div 
        className="relative z-10 flex flex-1 flex-col px-5 sm:px-6"
        style={{ y: parallaxY }}
      >
        <motion.div 
          className="flex flex-1 flex-col items-center justify-center py-6"
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-center"
          >
            <span className="block text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              <span className="text-foreground">Your whole collection.</span>
              <br />
              <span className="text-muted-foreground">Finally home.</span>
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-xs text-pretty text-center text-base text-muted-foreground sm:max-w-lg sm:text-lg md:max-w-2xl md:text-xl"
          >
            Field-level depth for what you actually collect. Showcases that look right. Comps without the tab circus.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex w-full max-w-xs flex-col gap-4 sm:max-w-none sm:flex-row sm:w-auto"
          >
            <MagneticButton
              variant="primary"
              size="lg"
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <AppleIcon className="h-5 w-5" />
              <span>Download for iPhone</span>
            </MagneticButton>
            
            <MagneticButton
              variant="secondary"
              size="lg"
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PlayStoreIcon className="h-5 w-5" />
              <span>Download for Android</span>
            </MagneticButton>
          </motion.div>

          {/* Trust line */}
          <motion.p
            variants={itemVariants}
            className="mt-8 text-sm text-muted-foreground text-center"
          >
            Free on iOS and Android. No credit card. No item limits. Start with one piece.
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.section>
  )
}
