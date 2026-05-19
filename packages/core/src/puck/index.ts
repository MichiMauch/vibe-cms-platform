export { buildPuckConfig, type PuckData, type RootProps } from "./config";
export * from "./blocks";
export { RichTextField } from "./fields/RichTextField";
export { ImageField } from "./fields/ImageField";
export { TextWithAIField } from "./fields/TextWithAIField";
export {
  BLOCK_DEFAULTS,
  BLOCK_TYPES,
  ROOT_DEFAULTS,
  type BlockType,
} from "./defaults";
export {
  SCAFFOLD_BLOCKS,
  renderSchemaForPrompt,
  VIBES,
  renderVibesForPrompt,
  type BlockSpec,
  type BlockFieldSpec,
  type Vibe,
} from "./scaffold-schema";
