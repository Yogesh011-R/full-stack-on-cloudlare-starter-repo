import { getDb } from "@/db/database";
import { linkClicks, links } from "@/drizzle-out/schema";
import { CreateLinkSchemaType, destinationsSchema, DestinationsSchemaType, linkSchema } from "@/zod/links";
import { LinkClickMessageType } from "@/zod/queue";
import { and, desc, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";

export const createLink = async (link: CreateLinkSchemaType & { accountId: string }) => {
  const db = getDb();
  const id = nanoid(10);

  await db.insert(links).values({
    linkId: id,
    accountId: link.accountId,
    destinations: JSON.stringify(link.destinations),
    name: link.name,
  });

  return id
};



export const getLinks = async ({
  accountId,
  createdBefore,

}: {
  accountId: string;
  createdBefore?: string;
}) => {
  const db = getDb();
  const conditions = [eq(links.accountId, accountId)];
  if (createdBefore) {
    conditions.push(gt(links.created, createdBefore));
  }
  const result = await db.select({
    linkId: links.linkId,
    name: links.name,
    destinations: links.destinations,
    created: links.created,
  }).from(links).where(and(...conditions)).orderBy(desc(links.created)).limit(25);

  return result.map((link) => ({
    ...link,
    lastSixHours: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100)),
    linkClicks: 6,
    destinations: Object.keys(JSON.parse(link.destinations)).length,
  }));
};

export const updateLinkName = async ({ linkId, name }: { linkId: string, name: string }) => {
  const db = getDb();
  await db.update(links).set({ name }).where(eq(links.linkId, linkId));
};

export const getLink = async ({ linkId }: { linkId: string }) => {
  const db = getDb();
  const result = await db.select().from(links).where(eq(links.linkId, linkId)).limit(1);
  if (!result.length) return null
  const link = result[0]
  const parsedLink = linkSchema.safeParse(link)
  if (!parsedLink.success) {
    console.log(parsedLink.error)
    throw new Error("Invalid link data")
  }
  return parsedLink.data
};

export const updateLinkDestinations = async ({ linkId, destinations }: { linkId: string, destinations: DestinationsSchemaType }) => {
  const db = getDb();
  const destinationsParsed = destinationsSchema.parse(destinations);
  await db.update(links).set({ destinations: JSON.stringify(destinationsParsed) }).where(eq(links.linkId, linkId));
};


export const addLinkClick = async (info: LinkClickMessageType['data']) => {
  const db = getDb();
  await db.insert(linkClicks).values({
    id: info.id,
    accountId: info.accountId,
    destination: info.destination,
    clickedTime: info.timestamp,
    country: info.country,
    latitude: info.latitude,
    longitude: info.longitude,
  });
}