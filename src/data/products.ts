import canJett from '../assets/images/can-jett.webp';
import canPhoenix from '../assets/images/can-phoenix.webp';
import canReyna from '../assets/images/can-reyna.webp';
import canSage from '../assets/images/can-sage.webp';

export const roles = ['duelist', 'sentinel'] as const;
export type Role = (typeof roles)[number];

export const sortLabels = {
  featured: 'Featured',
  name: 'Name',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
} as const;
export type SortKey = keyof typeof sortLabels;

export type Product = {
  id: string;
  name: string;
  agent: string;
  role: Role;
  priceCents: number;
  description: string;
  color: string;
  imageKey: string;
  stock: number;
};

export type ProductFilters = {
  role: Role | null;
  sort: SortKey;
  q: string;
};

export const defaultFilters: ProductFilters = { role: null, sort: 'featured', q: '' };

/** The URL is user input, so anything unrecognised falls back to the default. */
export function parseFilters(params: URLSearchParams): ProductFilters {
  const role = params.get('role');
  const sort = params.get('sort');
  return {
    role: roles.find((value) => value === role) ?? null,
    sort: sort && Object.hasOwn(sortLabels, sort) ? (sort as SortKey) : 'featured',
    q: (params.get('q') ?? '').slice(0, 50),
  };
}

const images: Record<string, string> = {
  reyna: canReyna,
  phoenix: canPhoenix,
  jett: canJett,
  sage: canSage,
};

export const getProductImage = (product: Pick<Product, 'imageKey'>) => images[product.imageKey];

/** The can files' real size, so the browser can reserve the space before they load. */
export const canSize = { width: 502, height: 900 };

/** Cans with the same name on two pages morph into each other during navigation. */
export const canTransitionName = (id: string) => `can-${id}`;

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  trailingZeroDisplay: 'stripIfInteger',
});

export const formatPrice = (cents: number) => priceFormat.format(cents / 100);

export const LOW_STOCK_LIMIT = 5;

/**
 * Shown on the home page until the API responds, and if it fails, so the hero never waits on the
 * network. The database is the source of truth for everything else.
 */
export const fallbackProducts: Product[] = [
  {
    id: 'vengeberry',
    name: 'VengeBerry',
    agent: 'Reyna',
    role: 'duelist',
    priceCents: 2000,
    description:
      "Unleash your power with Reyna's bold red berry blend, crafted for the ultimate fierce competitor. Embrace the intensity of Reyna's spirit as you conquer your opponents with ruthless determination.",
    color: '#e26060',
    imageKey: 'reyna',
    stock: 0,
  },
  {
    id: 'pink-blaze',
    name: 'Pink Blaze',
    agent: 'Phoenix',
    role: 'duelist',
    priceCents: 2000,
    description:
      "Ignite your day with Phoenix's vibrant pink burst, bringing a fiery energy to every challenge. Feel the unstoppable surge of passion with each sip, empowering you to rise above the competition.",
    color: '#f5bfaf',
    imageKey: 'phoenix',
    stock: 0,
  },
  {
    id: 'frost-rush',
    name: 'Frost Rush',
    agent: 'Jett',
    role: 'duelist',
    priceCents: 2000,
    description:
      "Chill out with Jett's cool and exhilarating flavor, designed for those who thrive on speed and excitement. Experience the rush of the wind at your back, propelling you forward with every sip of icy exhilaration.",
    color: '#dedfe1',
    imageKey: 'jett',
    stock: 0,
  },
  {
    id: 'zengreen',
    name: 'ZenGreen',
    agent: 'Sage',
    role: 'sentinel',
    priceCents: 2000,
    description:
      "Refresh your senses with Sage's invigorating green blend, perfect for keeping your cool in any situation. Let Sage guide you through the chaos with a taste of tranquility, ensuring clarity in every sip.",
    color: '#5da45d',
    imageKey: 'sage',
    stock: 0,
  },
];
