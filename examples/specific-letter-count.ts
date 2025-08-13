import { openai } from "@ai-sdk/openai"
import { batch, type BatchItem } from ".."

const randomString = (i: number) => {
  let result = ""
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

  for (let j = 0; j < i; j++) {
    result += letters[Math.floor(Math.random() * letters.length)]
  }

  return result
}

const stringLength = 
  // Larger lengths
  [
    ...Array.from({ length: 50 }, (_, i) => i + 1),
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
    .flat()
    // Add 10% variance
    .map((n) => n * (1 + Math.random() * 0.1))
    .map(Math.floor)
    // 10 copies of each length
    .flatMap((n) => Array.from({ length: 10 }, () => n))
    // Generate random strings of that length
    .map(randomString)
    
const conversations: BatchItem[] = stringLength.map((string) => {
  const randomLetter = string.charAt(Math.floor(Math.random() * string.length))
  const letterCount = string.split(randomLetter).length - 1

  return ({
    data: { string, length: string.length, solution: letterCount, letter: randomLetter },
    messages: [
      { 
        role: "user", 
        content: 
`Count the number of ${randomLetter}'s in the following string.
Wrap answer with count tags: <count>{answer}</count>.

<string>${string}</string>` 
      }
    ]
  })
})

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