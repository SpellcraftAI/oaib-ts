import { openai } from "@ai-sdk/openai"
import { batch, type BatchItem } from "."

const rand36 = (n: number) => {
  let s = ""
  while (s.length < n) s += Math.random().toString(36).slice(2)
  return s.slice(0, n)
}

const randomStrings = 
  Array
    .from({ length: 50 }, (_, i) => Array.from({ length: 10 }, () => rand36((i + 1))))
    .flat()

    
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