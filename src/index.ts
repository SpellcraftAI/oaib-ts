import PromisePool from "@supercharge/promise-pool"
import type { ToolSet } from "ai"
import { generateText } from "ai"
import type { BatchItem, BatchOptions } from "./types"
import type { Ora } from "ora"
import ora from "ora"
import chalk from "chalk"

export const batch = async <
  TOOLS extends ToolSet, 
  PROCESSED
>(
  items: BatchItem[], 
  options: BatchOptions<TOOLS, PROCESSED>
) => {
  let pool = 
    PromisePool
      .withConcurrency(options.concurrency ?? 8)
      .for(items)

  if (options.timeout) {
    pool = pool.withTaskTimeout(options.timeout)
  }

  let spinner: Ora | null = null
  if (options.spinner !== false) {
    console.log()
    spinner = ora("Starting batch job...").start()
  }

  const startTime = Date.now()
  let started = 0
  let finished = 0
  let errors = 0

  let lastUserMessage: string | undefined
  let lastAssistantMessage: string | undefined
  const renderSpinnerMessage = () => {
    if (!spinner) return

    const msRemaining = Math.round(((Date.now() - startTime) / finished) * (items.length - finished))
    const errorText = (errors > 0 ? chalk.red : chalk.green)(`Errors: ${errors}`)
    const timeRemainingText = chalk.italic(`  ~${(msRemaining / 1000).toFixed(2)} seconds remaining...`)

    let lastMessageText = ""

    if (lastUserMessage) {
      lastMessageText += "  User: " + chalk.dim(`${lastUserMessage.slice(0, 40)}${lastUserMessage.length > 40 ? "..." : ""}`) + "\n"
    }

    if (lastAssistantMessage) {
      lastMessageText += "  Assistant: " + chalk.dim(`${lastAssistantMessage.slice(0, 40)}${lastAssistantMessage.length > 40 ? "..." : ""}\n  ${chalk.dim(new Date().toLocaleString())}`) + "\n"
    }

    spinner.text = 
`Processing | Started: ${started} | Finished: ${finished} | Total: ${items.length} | ${errorText}
${timeRemainingText}

${lastMessageText}\n`
  }

  const results = await pool.process(
    async (batchItem) => {
      started++
      lastUserMessage = batchItem.messages.at(-1)?.content.toString()
      renderSpinnerMessage()

      const response = await generateText({
        messages: batchItem.messages,
        ...options,
      })

      finished++
      lastAssistantMessage = response.text
      renderSpinnerMessage()

      try {
        const processed = await options.process(response)
        return {
          input: batchItem,
          response: response.response.messages,
          result: processed,
          ...batchItem.data
        }
      } catch (e) {
        errors++
        renderSpinnerMessage()
      
        throw e
      }
    }
  )

  if (!results.errors.length) {
    spinner?.succeed("Batch job completed successfully.")
  } else {
    spinner?.fail(`Batch job completed with ${results.errors.length} errors.`)
  }

  return results
}

export * from "./types"