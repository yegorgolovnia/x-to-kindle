import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import Epub from "epub-gen-memory";

export async function POST(request: Request) {
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
            new URL(url);
            if (!url.includes("x.com") && !url.includes("twitter.com")) {
                throw new Error();
            }
        } catch {
            return NextResponse.json(
                { error: "Invalid X/Twitter URL. Please provide a direct link." },
                { status: 400 }
            );
        }

        // 2. Headless Scrape with Puppeteer
        console.log(`Starting Puppeteer for: ${url}`);
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        // Randomize user agent to help bypass bot detection
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Wait for the article data to load
        try {
            await page.waitForSelector('article', { timeout: 10000 });
        } catch (e) {
            await browser.close();
            return NextResponse.json(
                { error: "Could not find article content. It might be private or deleted." },
                { status: 404 }
            );
        }

        // Extract text and title
        const articleData = await page.evaluate(() => {
            const articles = Array.from(document.querySelectorAll('article'));
            if (!articles.length) return null;

            const mainArticle = articles[0];
            const textBlocks = Array.from(mainArticle.querySelectorAll('[data-testid="tweetText"]'));

            const fullText = textBlocks.map(b => (b as HTMLElement).innerText).join('\n\n');

            return {
                text: fullText,
                author: mainArticle.querySelector('[data-testid="User-Name"]')?.textContent?.split('@')[0] || "Unknown Author"
            };
        });

        await browser.close();

        if (!articleData || !articleData.text) {
            return NextResponse.json(
                { error: "Failed to extract text from the X Article." },
                { status: 500 }
            );
        }

        // 3. Generate EPUB in memory
        const epubContent = [
            {
                title: "Article Content",
                content: `<p>${articleData.text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`
            }
        ];

        const epubBuffer = await Epub(
            {
                title: `X Article by ${articleData.author}`,
                author: articleData.author,
                publisher: "x-to-kindle",
                cover: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
            },
            epubContent
        );

        // TODO: Send via Resend in Phase 5
        // For now, return success mock
        return NextResponse.json({
            message: "Successfully generated EPUB",
            author: articleData.author,
            textPreview: articleData.text.substring(0, 100) + "..."
        });

    } catch (error: any) {
        console.error("Processing Error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred: " + error.message },
            { status: 500 }
        );
    }
}
