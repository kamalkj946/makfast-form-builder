import type { FormConfig } from "./form-engine";

// ============================================================
// Metafield Storage — Save/Load Forms using Shopify Metafields
// Zero cost. Shopify stores the data for free.
// ============================================================

const METAFIELD_NAMESPACE = "makfast";
const METAFIELD_KEY = "forms";

/**
 * Load all form configs from the shop's metafield
 */
export async function loadForms(
  admin: any
): Promise<FormConfig[]> {
  try {
    const response = await admin.graphql(
      `#graphql
        query GetFormConfigs {
          currentAppInstallation {
            metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") {
              id
              value
            }
          }
        }
      `
    );

    const data = await response.json();
    const metafield = data?.data?.currentAppInstallation?.metafield;

    if (!metafield?.value) return [];

    const parsed = JSON.parse(metafield.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading forms from metafield:", error);
    return [];
  }
}

/**
 * Save all form configs to the shop's metafield
 */
export async function saveForms(
  admin: any,
  forms: FormConfig[]
): Promise<boolean> {
  try {
    const value = JSON.stringify(forms);

    await admin.graphql(
      `#graphql
        mutation SaveFormConfigs($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          metafields: [
            {
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEY,
              type: "json",
              value,
              ownerId: await getAppInstallationId(admin),
            },
          ],
        },
      }
    );

    return true;
  } catch (error) {
    console.error("Error saving forms to metafield:", error);
    return false;
  }
}

/**
 * Save a single form (add or update in the array)
 */
export async function saveForm(
  admin: any,
  form: FormConfig
): Promise<boolean> {
  const forms = await loadForms(admin);
  const index = forms.findIndex((f) => f.id === form.id);

  if (index >= 0) {
    forms[index] = { ...form, updatedAt: new Date().toISOString() };
  } else {
    forms.push(form);
  }

  return saveForms(admin, forms);
}

/**
 * Delete a form by ID
 */
export async function deleteForm(
  admin: any,
  formId: string
): Promise<boolean> {
  const forms = await loadForms(admin);
  const filtered = forms.filter((f) => f.id !== formId);
  return saveForms(admin, filtered);
}

/**
 * Get a single form by ID
 */
export async function getForm(
  admin: any,
  formId: string
): Promise<FormConfig | null> {
  const forms = await loadForms(admin);
  return forms.find((f) => f.id === formId) || null;
}

/**
 * Get the current app installation GID (for metafield ownership)
 */
async function getAppInstallationId(admin: any): Promise<string> {
  const response = await admin.graphql(
    `#graphql
      query GetAppInstallation {
        currentAppInstallation {
          id
        }
      }
    `
  );
  const data = await response.json();
  return data.data.currentAppInstallation.id;
}

// ============================================================
// Storefront Metafield — Published forms readable by Liquid
// ============================================================

/**
 * Publish form configs to a SHOP-level metafield so the
 * Theme App Extension can read them via Liquid.
 * Only published forms are synced.
 */
export async function publishFormsToStorefront(
  admin: any,
  forms: FormConfig[]
): Promise<boolean> {
  try {
    const publishedForms = forms.filter((f) => f.status === "published");

    // Slim down the data for storefront (remove unnecessary admin-only fields)
    const storefrontData = publishedForms.map((f) => ({
      id: f.id,
      title: f.title,
      fields: f.fields,
      conditions: f.conditions,
      steps: f.steps,
      settings: f.settings,
      style: f.style,
    }));

    // Get shop ID
    const shopResponse = await admin.graphql(`
      query GetShop { shop { id } }
    `);
    const shopData = await shopResponse.json();
    const shopId = shopData.data.shop.id;

    await admin.graphql(
      `#graphql
        mutation PublishForms($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id }
            userErrors { field message }
          }
        }
      `,
      {
        variables: {
          metafields: [
            {
              namespace: METAFIELD_NAMESPACE,
              key: "published_forms",
              type: "json",
              value: JSON.stringify(storefrontData),
              ownerId: shopId,
            },
          ],
        },
      }
    );

    return true;
  } catch (error) {
    console.error("Error publishing forms to storefront:", error);
    return false;
  }
}
