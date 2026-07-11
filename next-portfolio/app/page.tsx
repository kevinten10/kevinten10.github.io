import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollProgress from '@/components/layout/ScrollProgress';
import HeroSection from '@/components/sections/HeroSection';
import PhilosophySection from '@/components/sections/PhilosophySection';
import ImpactSection from '@/components/sections/ImpactSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import TechSection from '@/components/sections/TechSection';
import ContributionsSection from '@/components/sections/ContributionsSection';
import AwardsSection from '@/components/sections/AwardsSection';
import WritingSection from '@/components/sections/WritingSection';
import GallerySection from '@/components/sections/GallerySection';
import ContactSection from '@/components/sections/ContactSection';
import SectionBridge from '@/components/ui/SectionBridge';

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <a href="#main-content" className="skip-to-content sr-only">跳转到主要内容</a>
      <Header />

      <main id="main-content">
        <HeroSection />
        <SectionBridge variant="dots" />
        <PhilosophySection />
        <SectionBridge variant="dots" />
        <ImpactSection />
        <SectionBridge variant="diamond" />
        <ExperienceSection />
        <SectionBridge variant="dots" />
        <ProjectsSection />
        <SectionBridge variant="dots" />
        <TechSection />
        <SectionBridge variant="dots" />
        <ContributionsSection />
        <SectionBridge variant="diamond" />
        <AwardsSection />
        <SectionBridge variant="dots" />
        <WritingSection />
        <SectionBridge variant="dots" />
        <GallerySection />
        <SectionBridge variant="diamond" />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}
