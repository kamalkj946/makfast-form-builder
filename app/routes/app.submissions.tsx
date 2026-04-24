import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page, Layout, Card, DataTable, Badge, Button, Text,
  BlockStack, InlineStack, EmptyState, Modal, Box, Filters,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const formId = url.searchParams.get("formId") || undefined;

  const where = { shopDomain: session.shop, ...(formId ? { formId } : {}) };

  const [submissions, totalCount] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.submission.count({ where }),
  ]);

  return json({ submissions, totalCount, shopDomain: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "delete") {
    const submissionId = formData.get("submissionId") as string;
    await prisma.submission.deleteMany({
      where: { id: submissionId, shopDomain: session.shop },
    });
    return json({ success: true });
  }

  if (action === "markRead") {
    const submissionId = formData.get("submissionId") as string;
    await prisma.submission.update({
      where: { id: submissionId },
      data: { isRead: true },
    });
    return json({ success: true });
  }

  return json({ error: "Unknown action" });
};

export default function Submissions() {
  const { submissions, totalCount } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const rows = submissions.map((s) => {
    const data = s.data as Record<string, any>;
    const preview = Object.values(data).slice(0, 2).join(" · ");
    return [
      s.formTitle || "Unknown Form",
      preview.length > 60 ? preview.substring(0, 60) + "..." : preview,
      new Date(s.createdAt).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      }),
      <Badge tone={s.isRead ? "success" : "attention"} key={s.id}>
        {s.isRead ? "Read" : "New"}
      </Badge>,
      <Button
        size="slim"
        onClick={() => setSelectedSubmission(s)}
        key={`view-${s.id}`}
      >View</Button>,
    ];
  });

  return (
    <Page
      title="Form Submissions"
      subtitle={`${totalCount} total submissions`}
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {submissions.length === 0 ? (
              <EmptyState
                heading="No submissions yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>When customers submit your forms, their responses will appear here.</p>
              </EmptyState>
            ) : (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Form", "Preview", "Date", "Status", "Actions"]}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <Modal
          open={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={`Submission — ${selectedSubmission.formTitle || "Form"}`}
          primaryAction={{
            content: "Close",
            onAction: () => setSelectedSubmission(null),
          }}
          secondaryActions={[{
            content: "Delete",
            destructive: true,
            onAction: () => {
              const fd = new FormData();
              fd.append("action", "delete");
              fd.append("submissionId", selectedSubmission.id);
              submit(fd, { method: "POST" });
              setSelectedSubmission(null);
            },
          }]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text as="p" variant="bodySm" tone="subdued">
                Submitted on {new Date(selectedSubmission.createdAt).toLocaleString()}
              </Text>
              {Object.entries(selectedSubmission.data as Record<string, any>)
                .filter(([k]) => !k.startsWith("_"))
                .map(([key, value]) => (
                  <Box key={key} padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">{key}</Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {String(value)}
                      </Text>
                    </BlockStack>
                  </Box>
                ))}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
