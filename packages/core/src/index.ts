// Top-level convenience barrel — usually consumers will import from subpaths
// (./blocks, ./manager, ./renderer, ./editors, ./lib, …) for tighter trees.
export * from "./types";
export {
  HeroBlock,
  FeaturesBlock,
  TeamBlock,
  TestimonialBlock,
  PricingBlock,
  CallToActionBlock,
  FooterBlock,
  PopularLabel,
  BLOCK_LABELS,
  BLOCK_DESCRIPTIONS,
  createDefaultBlock,
} from "./blocks";
export { BlockRenderer, EditableBlock } from "./renderer";
export { BlockManager } from "./manager";
export {
  EditableText,
  EditableRichText,
  EditableImage,
  EditModeProvider,
  useEditMode,
  EditModeIndicator,
  AIActionsOverlay,
} from "./editors";
export { setByPath } from "./lib";
export {
  DEFAULT_LOCALE,
  LOCALE_REGEX,
  localeName,
  localeFlag,
} from "./i18n";
