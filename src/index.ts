import PromisePool from "@supercharge/promise-pool"
import type { ToolSet } from "ai"
import { generateText } from "ai"
import type { BatchItem, BatchOptions } from "./types"
import type { Ora } from "ora"
import ora from "ora"

interface RenderSpinnerMessageArgs {
  started: number
  finished: number
  total: number
  errors: number
}

const renderSpinnerMessage = ({ started, finished, total, errors }: RenderSpinnerMessageArgs) => {
  return `Processing | Started: ${started} | Finished: ${finished} | Total: ${total} | Errors: ${errors}`
}

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
    spinner = ora("Starting batch job...").start()
  }

  let started = 0
  let finished = 0
  let errors = 0

  const results = await pool.process(
    async (batchItem) => {
      started++
      if (spinner) {
        spinner.text = renderSpinnerMessage({ started, finished, total: items.length, errors })
      }

      const response = await generateText({
        messages: batchItem.messages,
        ...options,
      })

      finished++
      if (spinner) {
        spinner.text = renderSpinnerMessage({ started, finished, total: items.length, errors })
      }

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
        if (spinner) {
          spinner.text = renderSpinnerMessage({ started, finished, total: items.length, errors })
        }
      
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