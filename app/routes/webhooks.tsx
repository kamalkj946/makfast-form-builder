import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session } = await authenticate.webhook(request);
  console.log(`Webhook received: ${topic} from ${shop}`);

  switch (topic) {
    case "APP_UNINSTALLED":
      // Clean up sessions when app is uninstalled
      console.log(`App uninstalled from ${shop}`);
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response("OK", { status: 200 });
};
