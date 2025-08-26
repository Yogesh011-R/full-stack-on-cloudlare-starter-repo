import { getLink } from "@repo/data-ops/queries/links";
import { linkSchema, LinkSchemaType } from "@repo/data-ops/zod-schema/links";

const TTL_TIME = 60 * 60 * 24 // 1 day

export const getLinkInfoFromKv = async (env: Env, linkId: string) => {
  const linkInfo = await env.CACHE.get(linkId)

  if (!linkInfo) {
    return null
  }

  const linkInfoJson = JSON.parse(linkInfo)
  const linkSchemaResult = linkSchema.safeParse(linkInfoJson)

  if (!linkSchemaResult.success) {
    return null
  }

  return linkSchemaResult.data
}

export const getGeoRoutingDestination = async (env: Env, linkId: string) => {
  const linkInfo = await getLinkInfoFromKv(env, linkId)
  if (linkInfo) return linkInfo
  const linkInfoFromDb = await getLink({ linkId })
  if (!linkInfoFromDb) return null

  await saveLinkInfoToKv(env, linkId, linkInfoFromDb)

  return linkInfoFromDb
}


export const saveLinkInfoToKv = async (env: Env, linkId: string, linkInfo: LinkSchemaType) => {
  try {
    await env.CACHE.put(linkId, JSON.stringify(linkInfo), {
      expirationTtl: TTL_TIME
    })
  } catch (error) {
    console.error('Error saving link info to KV:', error)
  }
}
export const getDestinationForCountry = (linkInfo: LinkSchemaType, countryCode?: string) => {
  if (!countryCode) {
    return linkInfo.destinations.default
  }

  if (linkInfo.destinations[countryCode]) {
    return linkInfo.destinations[countryCode]
  }

  return linkInfo.destinations.default
}


