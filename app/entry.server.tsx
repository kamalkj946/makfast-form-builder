import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  // Shopify embedded headers are helpful, but should not hard-crash the app
  // when a preview domain or temporary env mismatch is hit.
  try {
    const { addDocumentResponseHeaders } = await import("./shopify.server");
    addDocumentResponseHeaders(request, responseHeaders);
  } catch (error) {
    console.error("Skipping Shopify document headers:", error);
  }
  const userAgent = request.headers.get("user-agent") || "";

  const body = await renderToReadableStream(
    <RemixServer
      context={remixContext}
      url={request.url}
      abortDelay={ABORT_DELAY}
    />,
    {
      signal: AbortSignal.timeout(ABORT_DELAY),
      onError(error: unknown) {
        responseStatusCode = 500;
        console.error(error);
      },
    }
  );

  if (isbot(userAgent)) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
