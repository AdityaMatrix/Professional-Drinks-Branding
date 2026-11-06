import { AboutSection } from '../components/AboutSection';
import { ContactSection } from '../components/ContactSection';
import { HeroCarousel } from '../components/HeroCarousel';
import { InspirationsSection } from '../components/InspirationsSection';
import { defaultFilters, fallbackProducts } from '../data/products';
import { useProducts } from '../hooks/useProducts';

export function HomePage() {
  const { data } = useProducts(defaultFilters, fallbackProducts);

  return (
    <>
      <h1 className="visually-hidden">Valo Drinks</h1>
      <HeroCarousel products={data ?? fallbackProducts} />
      <AboutSection />
      <InspirationsSection />
      <ContactSection />
    </>
  );
}
