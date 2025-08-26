import { addLinkClick } from "@repo/data-ops/queries/links";
import { LinkClickMessageType } from "@repo/data-ops/zod-schema/queue";

export const handleLinkClick = async (env: Env, event: LinkClickMessageType) => {
  await addLinkClick(event.data)
}
