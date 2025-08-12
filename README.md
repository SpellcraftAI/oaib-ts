# oaib

**OpenAI batching library** - For batch processing of LLM API requests with
concurrency control and progress tracking.

## Installation

```bash
bun add oaib
```

*We recommend using [Bun](https://bun.com) for the best performance and compatibility.*

## Usage

```typescript
import { batch } from "oaib"
import { openai } from "@ai-sdk/openai"

// Generate random strings of different lengths
const randomStrings = [60, 100, 200, 500, 1000]
  .flatMap(n => Array.from({ length: 10 }, () => n))
  .map(n => "x".repeat(n * (1 + Math.random() * 0.1)))

const conversations = randomStrings.map((string) => ({
  // Add columns to results
  data: { solution: string.length },
  messages: [
    { 
      role: "user", 
      content: `Count characters in this string. Answer with <count>{number}</count>.\n${string}` 
    }
  ]
}))

const results = await batch(conversations, {
  model: openai("gpt-4"),
  concurrency: 8,
  process: ({ text }) => {
    // Maps model response to { result }
    const match = text.match(/<count>(.*?)<\/count>/)
    if (!match?.[1]) throw new Error("No <count> tags found")
    return parseInt(match[1], 10)
  },
})

// results.results contains { input, response, result, ...data }
await Bun.write("results.json", JSON.stringify(results, null, 2))
```

See the full example in `src/letter-count.ts`.

## Requirements

- **TypeScript 5+** required  
- **Bun recommended** for optimal performance
- For Node.js users: Handle TypeScript transpilation on your end*

---

*This is a pure TypeScript repository optimized for Bun. Node.js users will need to set up their own transpilation pipeline (e.g., ts-node, tsx, or build step).

## Quick Start

```typescript
import { batch } from 'oaib'
import { openai } from '@ai-sdk/openai'

const conversations = [
  {
    messages: [{ role: 'user', content: 'What is 2+2?' }],
    data: { id: 1 }
  },
  {
    messages: [{ role: 'user', content: 'What is 3+3?' }],
    data: { id: 2 }
  }
]

const results = await batch(conversations, {
  model: openai('gpt-4'),
  process: ({ text }) => {
    // Process the AI response
    return text.trim()
  },
  concurrency: 5
})

console.log(results)
```

## API Reference

### `batch<TOOLS, PROCESSED>(items, options)`

Process multiple AI conversations concurrently with built-in progress tracking.

#### Parameters

- **`items`** (`BatchItem[]`) - Array of conversation items to process
- **`options`** (`BatchOptions<TOOLS, PROCESSED>`) - Configuration options

#### `BatchItem`

```typescript
type BatchItem = {
  messages: ModelMessage[]     // Conversation messages
  data?: Record<string, unknown>  // Optional metadata
}
```

#### `BatchOptions<TOOLS, PROCESSED>`

```typescript
interface BatchOptions<TOOLS, PROCESSED> {
  model: LanguageModel              // AI model to use
  tools?: TOOLS                     // Available tools for the model
  process: (response) => PROCESSED  // Function to process AI responses
  concurrency?: number              // Max concurrent requests (default: 8)
  timeout?: number                  // Timeout per request in ms
  spinner?: boolean                 // Show progress spinner (default: true)
}
```

## Features

- **Concurrent Processing**: Control the number of simultaneous AI requests
- **Progress Tracking**: Built-in spinner showing real-time progress
- **Error Handling**: Graceful handling of failed requests with error reporting
- **Flexible Processing**: Custom processing functions for AI responses
- **Type Safety**: Full TypeScript support with generic types
- **AI SDK Integration**: Works with any AI SDK provider (OpenAI, Anthropic, etc.)

## Examples

### Basic Usage

```typescript
import { batch } from 'oaib'
import { openai } from '@ai-sdk/openai'

const conversations = [
  { messages: [{ role: 'user', content: 'Translate "hello" to Spanish' }] },
  { messages: [{ role: 'user', content: 'Translate "goodbye" to French' }] }
]

const results = await batch(conversations, {
  model: openai('gpt-4'),
  process: ({ text }) => text
})
```

### With Custom Processing

```typescript
const results = await batch(conversations, {
  model: openai('gpt-4'),
  process: ({ text }) => {
    // Extract structured data from AI response
    const match = text.match(/<answer>(.*?)<\/answer>/)
    return match?.[1] || text
  },
  concurrency: 3,
  timeout: 30000
})
```

### With Metadata

```typescript
const conversations = [
  {
    messages: [{ role: 'user', content: 'Count characters: "hello"' }],
    data: { expectedLength: 5, id: 'test1' }
  }
]

const results = await batch(conversations, {
  model: openai('gpt-4'),
  process: ({ text }) => parseInt(text.match(/\d+/)?.[0] || '0')
})

// Access metadata in results
results.results.forEach(result => {
  console.log(result.id, result.expectedLength, result.result)
})
```

### Disable Progress Spinner

```typescript
const results = await batch(conversations, {
  model: openai('gpt-4'),
  process: ({ text }) => text,
  spinner: false  // No progress indicator
})
```

## Development

This project uses Bun for development:

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run the example
bun src/letter-count.ts
```

## Requirements

- **TypeScript 5+** required
- **Bun recommended** for optimal performance
- For Node.js users: Handle TypeScript transpilation on your end*

---

*This is a pure TypeScript repository optimized for Bun. Node.js users will need to set up their own transpilation pipeline (e.g., ts-node, tsx, or build step).
