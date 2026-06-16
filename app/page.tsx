import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/hero-section'
import { AboutSection } from '@/components/about-section'
import { FeaturesSection } from '@/components/features-section'
import { ProductsSection } from '@/components/products-section'
import { SensorySection } from '@/components/sensory-section'
import { CtaSection } from '@/components/cta-section'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <SensorySection />
      <ProductsSection />
      {/* <CtaSection /> */}
      <Footer />
    </main>
  )
}