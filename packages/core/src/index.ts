// Top-level convenience barrel — consumers usually import from subpaths.
export type { Chatbot, Seo } from "./types/content";
export {
  DEFAULT_LOCALE,
  LOCALE_REGEX,
  localeName,
  localeFlag,
} from "./i18n";
