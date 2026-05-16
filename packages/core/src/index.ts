// Top-level convenience barrel — consumers usually import from subpaths.
export type { Chatbot, Seo } from "./types/content";
export { PopularLabel } from "./blocks/PopularLabel";
export {
  DEFAULT_LOCALE,
  LOCALE_REGEX,
  localeName,
  localeFlag,
} from "./i18n";
