export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("user_id");
  const { results } = await env.DB
    .prepare("SELECT * FROM sessions WHERE user_id = ?")
    .bind(id)
    .all();

  return Response.json(results);
}
