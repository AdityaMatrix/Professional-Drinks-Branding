import { AboutSection } from '../components/AboutSection';
import { ContactSection } from '../components/ContactSection';
import { HeroCarousel } from '../components/HeroCarousel';
import { InspirationsSection } from '../components/InspirationsSection';
import { drinks } from '../data/drinks';

export function HomePage() {
  return (
    <>
      <h1 className="visually-hidden">Valo Drinks</h1>
      <HeroCarousel drinks={drinks} />
      <AboutSection />
      <InspirationsSection />
      <ContactSection />
    </>
  );
}
