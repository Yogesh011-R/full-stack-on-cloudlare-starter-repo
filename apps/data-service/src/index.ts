import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();


app.get("/", (c) => c.text("Hello World! 123"));

app.get('/save-id/:id', async (c) => {
	const id = c.req.param('id');
	await c.env.CACHE.put('test', id);
	return c.text(`Saved ID: ${id}`);
})

app.get('/get-id', async (c) => {
	const id = await c.env.CACHE.get('test');
	return c.text(`ID: ${id}`);
})

export default app;
