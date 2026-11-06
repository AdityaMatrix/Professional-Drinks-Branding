import agentJett from '../assets/images/agent-jett.webp';
import agentPhoenix from '../assets/images/agent-phoenix.webp';
import agentReyna from '../assets/images/agent-reyna.webp';
import agentSage from '../assets/images/agent-sage.webp';

export type Agent = {
  id: string;
  name: string;
  bio: string;
  image: string;
};

export const agents: Agent[] = [
  {
    id: 'phoenix',
    name: 'Phoenix',
    bio: 'In the UK, Phoenix blazes across the battlefield, igniting fights with his signature flash and flare, always charging into combat on his own terms, with or without backup.',
    image: agentPhoenix,
  },
  {
    id: 'jett',
    name: 'Jett',
    bio: 'Jett, from South Korea, moves with unmatched agility and evasiveness, taking daring risks and swiftly eliminating enemies before they react.',
    image: agentJett,
  },
  {
    id: 'sage',
    name: 'Sage',
    bio: 'Sage creates a fortress of safety for herself and her team, wielding revival powers and strategic defenses to anchor them in the chaos of battle.',
    image: agentSage,
  },
  {
    id: 'reyna',
    name: 'Reyna',
    bio: 'Forged in the heart of Mexico, Reyna dominates single combat with each kill, her raw skill driving her relentless performance.',
    image: agentReyna,
  },
];
