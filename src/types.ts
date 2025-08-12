import type { generateText, GenerateTextResult, LanguageModel, ModelMessage, ToolSet } from "ai"

type GenerateTextParameters<TOOLS extends ToolSet> = 
  Parameters<typeof generateText<TOOLS, never>>[0]

export type BatchItem = {
  messages: ModelMessage[]
  data?: Record<string, unknown>
}

export interface BatchOptions<TOOLS extends ToolSet, PROCESSED> extends GenerateTextParameters<TOOLS> {
  /**
   * The language model to use for this batch.
   */
  model: LanguageModel;
  /**
   * The tools available for this batch.
   */
  tools?: TOOLS;
  /**
   * The callback to process the model response.
   */
  process: (response: GenerateTextResult<TOOLS, never>) => PROCESSED | Promise<PROCESSED>;
  /**
   * Maximum number of concurrent requests.
   */
  concurrency?: number;
  /**
   * Timeout for batch items.
   */
  timeout?: number;
  /**
   * Whether to enable the spinner. Set to `false` to disable.
   * @default true
   */
  spinner?: boolean;
  /**
   * @deprecated Experimental output is disabled for oaib.
   */
  experimental_output?: never;
}