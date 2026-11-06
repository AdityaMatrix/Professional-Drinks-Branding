import canJett from '../assets/images/can-jett.webp';
import canPhoenix from '../assets/images/can-phoenix.webp';
import canReyna from '../assets/images/can-reyna.webp';
import canSage from '../assets/images/can-sage.webp';

export type Drink = {
  id: string;
  name: string;
  agent: string;
  priceUsd: number;
  description: string;
  /** Background of the hero slide. */
  color: string;
  image: string;
  imageAlt: string;
};

export const drinks: Drink[] = [
  {
    id: 'vengeberry',
    name: 'VengeBerry',
    agent: 'Reyna',
    priceUsd: 20,
    description:
      "Unleash your power with Reyna's bold red berry blend, crafted for the ultimate fierce competitor. Embrace the intensity of Reyna's spirit as you conquer your opponents with ruthless determination.",
    color: '#e26060',
    image: canReyna,
    imageAlt: 'VengeBerry can featuring Reyna',
  },
  {
    id: 'pink-blaze',
    name: 'Pink Blaze',
    agent: 'Phoenix',
    priceUsd: 20,
    description:
      "Ignite your day with Phoenix's vibrant pink burst, bringing a fiery energy to every challenge. Feel the unstoppable surge of passion with each sip, empowering you to rise above the competition.",
    color: '#f5bfaf',
    image: canPhoenix,
    imageAlt: 'Pink Blaze can featuring Phoenix',
  },
  {
    id: 'frost-rush',
    name: 'Frost Rush',
    agent: 'Jett',
    priceUsd: 20,
    description:
      "Chill out with Jett's cool and exhilarating flavor, designed for those who thrive on speed and excitement. Experience the rush of the wind at your back, propelling you forward with every sip of icy exhilaration.",
    color: '#dedfe1',
    image: canJett,
    imageAlt: 'Frost Rush can featuring Jett',
  },
  {
    id: 'zengreen',
    name: 'ZenGreen',
    agent: 'Sage',
    priceUsd: 20,
    description:
      "Refresh your senses with Sage's invigorating green blend, perfect for keeping your cool in any situation. Let Sage guide you through the chaos with a taste of tranquility, ensuring clarity in every sip.",
    color: '#5da45d',
    image: canSage,
    imageAlt: 'ZenGreen can featuring Sage',
  },
];
