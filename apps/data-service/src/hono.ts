import { getLink } from '@repo/data-ops/queries/links'
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links'
import { Hono } from 'hono'
import { getDestinationForCountry, getGeoRoutingDestination } from './helpers/route-ops'

export const App = new Hono<{ Bindings: Env }>()


App.get('/:id', async (c) => {
  const id = c.req.param('id')

  const linkInfo = await getGeoRoutingDestination(c.env, id)

  if (!linkInfo) {
    return c.json({
      error: 'Destination not found',
    }, 404)
  }

  const cloudflareInfo = cloudflareInfoSchema.safeParse(c.req.raw?.cf)

  if (!cloudflareInfo.success) {
    return c.json({
      error: 'Cloudflare info not found',
    }, 404)
  }
  const { country, latitude, longitude } = cloudflareInfo.data

  const destination = getDestinationForCountry(linkInfo, country)






  return c.redirect(destination)
})