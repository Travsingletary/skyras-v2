interface NotionPagePayload {
  title: string;
  properties?: Record<string, unknown>;
}

interface NotionPageResponse {
  success: boolean;
  pageId?: string;
  url?: string;
  error?: string;
  data?: NotionPagePayload;
}

// TODO: call the real Notion REST API using the official SDK or fetch.
export async function createNotionPage(payload: NotionPagePayload): Promise<NotionPageResponse> {
  if (!process.env.NOTION_API_KEY) {
    return { success: false, error: "Missing NOTION_API_KEY" };
  }

  return {
    success: true,
    pageId: `page_${Date.now()}`,
    url: "https://www.notion.so/dummy",
    data: payload,
  };
}
