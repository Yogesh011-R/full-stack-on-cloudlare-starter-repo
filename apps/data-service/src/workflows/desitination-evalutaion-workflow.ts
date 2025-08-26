import { WorkerEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers'
import { collectDestinationInfo } from '@/helpers/browser-render'
import { aiDestinationChecker } from '@/helpers/ai-destination-checker'
import { addEvaluation } from '@repo/data-ops/queries/evaluations'
import { initDatabase } from '@repo/data-ops/database'

export class DestinationEvaluationWorkflow extends WorkerEntrypoint<Env> {
  async run(event: Readonly<WorkflowEvent<DestinationStatusEvaluationParams>>, step: WorkflowStep): Promise<void> {
    initDatabase(this.env.DB)
    const collectedData = await step.do("Collect rendered destination page data", async () => {
      return collectDestinationInfo(this.env, event.payload.destinationUrl)
    })

    const aiResult = await step.do("AI Destination Status Evaluation", {
      retries: {
        limit: 0,
        delay: 0
      }
    }, async () => {
      return aiDestinationChecker(this.env, collectedData.bodyText)
    })




    const evaluationId = await step.do("Save evaluation to DB", async () => {
      return addEvaluation({
        linkId: event.payload.linkId,
        accountId: event.payload.accountId,
        destinationUrl: event.payload.destinationUrl,
        status: aiResult.status,
        reason: aiResult.statusReason,
      })
    })


    await step.do("Backup destination page HTML data to R2", async () => {
      const accountId = event.payload.accountId
      const r2PathHtml = `evaluations/${accountId}/html/${evaluationId}`
      const r2PathBodyText = `evaluations/${accountId}/body-text/${evaluationId}`
      await this.env.BUCKET.put(r2PathHtml, collectedData.html)
      await this.env.BUCKET.put(r2PathBodyText, collectedData.bodyText)
    })
  }

}
