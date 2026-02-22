import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import Epub from "epub-gen-memory";

export const maxDuration = 60; // Allow Vercel Function up to 60s to execute the scraper

function isAllowedXHostname(hostname: string): boolean {
    const normalizedHost = hostname.toLowerCase();
    return (
        normalizedHost === "x.com" ||
        normalizedHost.endsWith(".x.com") ||
        normalizedHost === "twitter.com" ||
        normalizedHost.endsWith(".twitter.com")
    );
}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function deriveEpubTitle(text: string, author: string): string {
    const firstMeaningfulLine = text
        .split(/\n+/)
        .map((line) => line.trim())
        .find((line) => line.length > 0);

    if (!firstMeaningfulLine) {
        return `X Article by ${author}`;
    }

    const normalized = firstMeaningfulLine.replace(/\s+/g, " ");
    const maxLength = 80;
    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export async function POST(request: Request) {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

    try {
        const { url, kindleEmail } = await request.json();

        if (!url || !kindleEmail) {
            return NextResponse.json(
                { error: "Missing required fields: url or kindleEmail" },
                { status: 400 }
            );
        }

        // 1. Validate URL
        try {
            const parsedUrl = new URL(url);
            if (!isAllowedXHostname(parsedUrl.hostname)) {
                throw new Error();
            }
        } catch {
            return NextResponse.json(
                { error: "Invalid X/Twitter URL. Please provide a direct link." },
                { status: 400 }
            );
        }

        // 2. Headless Scrape with Custom Headers
        console.log(`Starting Puppeteer for: ${url}`);

        const isLocal = !process.env.VERCEL_REGION;

        let executablePath: string;
        if (isLocal) {
            // Default Mac path for local dev testing
            executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
        } else {
            executablePath = await chromium.executablePath();
        }

        browser = await puppeteer.launch({
            args: isLocal
                ? [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--window-size=1920,1080"
                ]
                : [...chromium.args, "--disable-blink-features=AutomationControlled", "--disable-features=IsolateOrigins,site-per-process", "--window-size=1920,1080"],
            defaultViewport: { width: 1920, height: 1080 },
            executablePath: executablePath,
            headless: true,
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Mask as a real browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });

        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Evaluate exact content extraction on the page
        console.log("Waiting for article DOM...");
        try {
            await page.waitForSelector('article', { timeout: 15000 });
        } catch {
            // Dump page content to console for debugging if it fails
            const rawHtml = await page.content();
            console.log("DOM Dump (failed to find article):", rawHtml.substring(0, 500));

            return NextResponse.json(
                { error: "Could not find article content. It might be private or deleted." },
                { status: 404 }
            );
        }

        const { text, author, debugHtml } = await page.evaluate(() => {
            const articles = Array.from(document.querySelectorAll('article'));
            if (!articles.length) return { text: null, author: null, debugHtml: null };

            const mainArticle = articles[0];

            // X Articles use different data-testids or deeply nested spans compared to normal tweets.
            // Let's grab every text-containing node that is buried deep in the tree and isn't UI fluff.

            // Try specific content wrappers first (varies wildly on X)
            let possibleNodes = Array.from(mainArticle.querySelectorAll('[data-testid="article-content"], [data-testid="tweetText"]'));

            // If we didn't find the explicit wrappers, cast a wider net
            if (possibleNodes.length === 0) {
                possibleNodes = Array.from(mainArticle.querySelectorAll('span'));
            }

            const textBlocks = possibleNodes
                .map(node => (node as HTMLElement).innerText?.trim() || '')
                .filter(t => t.length > 20); // Arbitrary length filter to drop short UI strings (dates, counts, handles)

            // Deduplicate blocks (X's DOM often renders the same text multiple times in hidden nested elements)
            const uniqueBlocks = Array.from(new Set(textBlocks));

            const fullText = uniqueBlocks.join('\n\n');

            return {
                text: fullText,
                author: mainArticle.querySelector('[data-testid="User-Name"]')?.textContent?.split('@')[0] || "Unknown Author",
                debugHtml: mainArticle.innerHTML
            };
        });

        if (!text) {
            console.log("Extraction failed. Article HTML Dump (first 2000 chars):");
            console.log(debugHtml ? debugHtml.substring(0, 2000) : "No HTML returned.");

            return NextResponse.json(
                { error: "Failed to extract text from the X Article." },
                { status: 500 }
            );
        }

        // 3. Generate EPUB in memory
        const safeAuthor = author?.trim() || "Unknown Author";
        const epubTitle = deriveEpubTitle(text, safeAuthor);
        const escapedText = escapeHtml(text);

        const epubContent = [{
            title: epubTitle,
            content: `<p>${escapedText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`
        }];

        const epubBuffer = await Epub(
            {
                title: epubTitle,
                author: safeAuthor,
                publisher: "x-to-kindle",
            },
            epubContent
        );

        // 4. Send Email via Resend Native Fetch
        if (!process.env.RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY");
            // Don't crash entirely here just in case they're testing extraction locally
            return NextResponse.json({
                message: "⚠️ Successfully generated EPUB. Resend API missing in .env, skipping delivery.",
                author: safeAuthor,
                textPreview: text.substring(0, 100) + "..."
            });
        }

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "X-to-Kindle <kindle@yegorgolovnia.com>",
                to: [kindleEmail],
                subject: `X Article from ${safeAuthor}`,
                html: "<p>Your requested X Article</p>",
                attachments: [
                    {
                        filename: `Article_by_${safeAuthor.replace(/[^a-zA-Z0-9]/g, "_")}.epub`,
                        content: Buffer.from(epubBuffer).toString('base64'),
                    }
                ]
            })
        });

        if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            console.error("Resend API Error:", errorData);
            return NextResponse.json(
                { error: "Failed to deliver to Kindle via Resend Email. " + (errorData.message || "Unknown error") },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Successfully delivered to Kindle",
            author: safeAuthor,
            textPreview: text.substring(0, 100) + "..."
        });

    } catch (error: unknown) {
        console.error("Processing Error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred: " + (error instanceof Error ? error.message : "Unknown error") },
            { status: 500 }
        );
    } finally {
        if (browser) {
            await browser.close().catch((closeError: unknown) => {
                console.error("Error closing Puppeteer browser:", closeError);
            });
        }
    }
}
