/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";

global.fetch = jest.fn();

describe("GET /api/youtube-search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if query is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/youtube-search");
    const res = await GET(req);
    const json = await res.json();
    expect(json.error).toBe("Missing query");
  });

  it("should extract video ID from YouTube search page", async () => {
    const mockHtml = `
      <html>
        <body>
          <script> some stuff </script>
          <a href="/watch?v=dQw4w9WgXcQ">Video</a>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/youtube-search?q=Rick%20Astley",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.videoId).toBe("dQw4w9WgXcQ");

    // Verify fetch URL
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("youtube.com/results?search_query=Rick%20Astley"),
      expect.anything(),
    );
  });

  it("should return null if no video found", async () => {
    const mockHtml = `<html><body>No videos found</body></html>`;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => mockHtml,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/youtube-search?q=NonExistentVideo12345",
    );
    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(false);
    expect(json.videoId).toBeNull();
  });
});
