/**
 * Cloudflare Pages Function — proxies form submissions to Airtable.
 *
 * Expects POST JSON: { baseId, table, fields }
 * Requires an environment variable AIRTABLE_TOKEN set in the
 * Cloudflare Pages project settings (Settings > Environment variables).
 * Never expose the Airtable token to the client — this function is the
 * only place it should ever be read from.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid JSON body.' }, 400);
  }

  const { baseId, table, fields } = body || {};

  if (!baseId || !table || !fields || typeof fields !== 'object') {
    return jsonResponse({ message: 'Missing baseId, table, or fields.' }, 400);
  }

  if (!env.AIRTABLE_TOKEN) {
    return jsonResponse({ message: 'Server is not configured with an Airtable token.' }, 500);
  }

  const airtableUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;

  try {
    const airtableResponse = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields, typecast: true })
    });

    const data = await airtableResponse.json();

    if (!airtableResponse.ok) {
      return jsonResponse({ message: data?.error?.message || 'Airtable request failed.' }, airtableResponse.status);
    }

    return jsonResponse({ success: true, id: data.id }, 200);
  } catch (err) {
    return jsonResponse({ message: 'Could not reach Airtable.' }, 502);
  }
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
