import { LinkClickMessageType } from './../../../packages/data-ops/dist/zod/queue.d';
import { getLink } from '@repo/data-ops/queries/links';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { Hono } from 'hono';
import { getDestinationForCountry, getGeoRoutingDestination } from './helpers/route-ops';

export const App = new Hono<{ Bindings: Env }>();

App.get('/:id', async (c) => {
  const id = c.req.param('id');

  const linkInfo = await getGeoRoutingDestination(c.env, id);

  if (!linkInfo) {
    return c.json(
      {
        error: 'Destination not found',
      },
      404
    );
  }

  const cloudflareInfo = cloudflareInfoSchema.safeParse(c.req.raw?.cf);

  if (!cloudflareInfo.success) {
    return c.json(
      {
        error: 'Cloudflare info not found',
      },
      404
    );
  }
  const { country, latitude, longitude } = cloudflareInfo.data;

  const destination = getDestinationForCountry(linkInfo, country);

  const queueMessage: LinkClickMessageType = {
    type: "LINK_CLICK",
    data: {
      id,
      country,
      destination,
      accountId: linkInfo.accountId,
      timestamp: new Date().toISOString(),
      latitude,
      longitude
    }
  }
  c.executionCtx.waitUntil(
    c.env.QUEUE.send(queueMessage, {
      // contentType: "json",
      // delaySeconds: 10 * 60 // 10 minutes
    })
  )
  return c.redirect(destination);
});
