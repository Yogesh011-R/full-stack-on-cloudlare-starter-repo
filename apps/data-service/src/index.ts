import { WorkerEntrypoint } from 'cloudflare:workers'
import { App } from './hono';
import { initDatabase } from '@repo/data-ops/database';
import { QueueMessageSchema } from '@repo/data-ops/zod-schema/queue';
import { handleLinkClick } from './queue-handlers/link-clicks';
export { DestinationEvaluationWorkflow } from './workflows/desitination-evalutaion-workflow';

export default class DataService extends WorkerEntrypoint<Env> {
	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env)
		initDatabase(env.DB)
	}
	fetch(request: Request) {
		return App.fetch(request, this.env, this.ctx);
	}
	async queue(batch: MessageBatch<unknown>) {
		for (const message of batch.messages) {
			const parsedMessage = QueueMessageSchema.safeParse(message.body)
			if (parsedMessage.success) {
				if (parsedMessage.data.type === "LINK_CLICK") {
					await handleLinkClick(this.env, parsedMessage.data)

				}
			} else {
				console.error("Invalid message", parsedMessage.error)
			}
		}
	}
}