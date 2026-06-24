import axios from "axios";
import { CrawlResult } from "@/lib/types";

type SpiderResponse = Array<{ content?: string }>;
const CRAWL_TIMEOUT_MS = 10000;

async function crawlSingle(url: string): Promise<CrawlResult> {
  try {
    const response = await axios.post<SpiderResponse>(
      "https://api.spider.cloud/crawl",
      { limit: 1, url, return_format: "markdown" },
      {
        timeout: CRAWL_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${process.env.SPIDER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data?.[0]?.content ?? "";
    if (!content) {
      return {
        url,
        success: false,
        content: "",
        error: "No readable content extracted from this URL.",
      };
    }

    return { url, success: true, content };
  } catch (error) {
    const timedOut = axios.isAxiosError(error) && error.code === "ECONNABORTED";
    return {
      url,
      success: false,
      content: "",
      error: timedOut
        ? "Crawl request timed out after 10 seconds."
        : "Failed to crawl URL (possibly blocked or paywalled).",
    };
  }
}

export async function crawlUrls(urls: string[]): Promise<CrawlResult[]> {
  if (!process.env.SPIDER_API_KEY) {
    throw new Error("SPIDER_API_KEY is missing.");
  }

  const uniqueUrls = Array.from(new Set(urls.map((u) => u.trim())));
  return Promise.all(uniqueUrls.map(crawlSingle));
}
