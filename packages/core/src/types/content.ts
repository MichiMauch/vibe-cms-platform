/** Page-level types still used by live components.
 *
 * The block-shape types (HeroData, Section, BlockType, Content, …) used to
 * live here too. They were removed when the editor moved to Puck — block
 * shapes are now declared as Puck `Components` in `packages/core/src/puck/`.
 */

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
