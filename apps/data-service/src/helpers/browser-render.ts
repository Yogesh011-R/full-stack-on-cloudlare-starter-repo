import puppeteer from "@cloudflare/puppeteer";

export const collectDestinationInfo = async (env: Env, destinationUrl: string) => {
  const browser = await puppeteer.launch(env.VIRTUAL_BROWSER)
  const page = await browser.newPage()
  const res = await page.goto(destinationUrl)

  await page.waitForNetworkIdle()

  const bodyText = (await page.$eval('body', (el) => el.innerText)) as string

  const html = await page.content()
  const statusCode = res ? res?.status() : 0



  console.log("Collecting rendered destination page data")
  await browser.close()
  return {
    bodyText,
    html,
    statusCode
  }
}

