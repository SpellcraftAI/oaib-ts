import { openai } from "@ai-sdk/openai"
import { batch, type BatchItem } from ".."

const rand36 = (n: number) => {
  let s = ""
  while (s.length < n) s += Math.random().toString(36).slice(2)
  return s.slice(0, n)
}

const randomStrings = 
  // Larger lengths
  [
    60,
    70,
    80,
    90,
    100,
    120,
    140,
    150,
    200,
    250,
    300,
    400,
    500,
    600,
    800,
    1000
  ]
    // 10 copies of each length
    .flatMap((n) => Array.from({ length: 10 }, () => n))
    // Add 10% variance
    .flatMap((n) => n * (1 + Math.random() * 0.1))
    // Generate random strings of that length
    .map(rand36)

    
const conversations: BatchItem[] = randomStrings.map((string) => ({
  data: { solution: string.length },
  messages: [
    { role: "user", content: `Count the number of characters in the following string. Wrap answer with count tags: <count>{answer}</count>.\n${string}` }
  ]
}))

const results = await batch(
  conversations, 
  {
    model: openai("gpt-5"),
    process: ({ text }) => {
      // Strip <count> tags
      const match = text.match(/<count>(.*?)<\/count>/)
      if (!match?.[1]) {
        throw new Error("No <count> tags found")
      }

      return parseInt(match[1], 10)
    },
  }
)

await Bun.write("results.json", JSON.stringify(results, null, 2))