export type Seo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string;
};

export type Chatbot = {
  isEnabled: boolean;
  botName: string;
  welcomeMessage: string;
};

export type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image: string;
};

export type HeroData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type FeaturesData = {
  title: string;
  subtitle: string;
  items: FeatureItem[];
};

export type TeamData = {
  title: string;
  subtitle: string;
  members: TeamMember[];
};

export type TestimonialData = {
  quote: string;
  author: string;
  role: string;
};

export type CallToActionData = {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type FooterData = {
  copyright: string;
  tagline: string;
};

export type PricingPlan = {
  icon: string;
  name: string;
  price: string;
  priceCaption: string;
  features: string[];
  cta: string;
  featured: boolean;
};

export type PricingData = {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
};

export type BlockType =
  | "Hero"
  | "Features"
  | "Team"
  | "Testimonial"
  | "Pricing"
  | "CallToAction"
  | "Footer";

export type BlockDataMap = {
  Hero: HeroData;
  Features: FeaturesData;
  Team: TeamData;
  Testimonial: TestimonialData;
  Pricing: PricingData;
  CallToAction: CallToActionData;
  Footer: FooterData;
};

export type Section<T extends BlockType = BlockType> = {
  id: string;
  type: T;
  data: BlockDataMap[T];
};

export type Content = {
  seo: Seo;
  chatbot: Chatbot;
  sections: Section[];
};
