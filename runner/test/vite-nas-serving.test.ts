import {
  appendFileSync,
  fstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer as createHttpServer, request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { createServer as createViteServer, isFileServingAllowed, resolveConfig as resolveViteConfig } from "vite";

import viteConfig, {
  assertLoopbackViteHost,
  assertCanonicalViteRoots,
  createGutcheckIndexHandler,
  createNasRequestHandler,
  createViteLocalFileBoundary,
  loadNasAssetCatalog,
  NAS_ASSET_CATALOG,
  NAS_ASSET_CATALOG_PATH,
  type NasRequestHandler,
  validateGutcheckIndexForServing,
} from "../../app/vite.config.ts";
import { openContainedRegularFile } from "../../scripts/nas-asset-lib.ts";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");
const SERVED_PREFIX = "out/gutcheck-gg-realism/large";
const SERVED_FILE = `${SERVED_PREFIX}/fixture.bin`;
const PRIVATE_PREFIX = "research-cache/content";
const roots: string[] = [];
const paths: string[] = [];

const temporaryRoot = (label: string): string => {
  const root = mkdtempSync(join(tmpdir(), `vite-nas-${label}-`));
  roots.push(root);
  return root;
};

const fixtureShare = (): string => {
  const root = temporaryRoot("share");
  mkdirSync(join(root, ...SERVED_PREFIX.split("/")), { recursive: true });
  mkdirSync(join(root, ...PRIVATE_PREFIX.split("/")), { recursive: true });
  writeFileSync(join(root, ...SERVED_FILE.split("/")), "0123456789");
  writeFileSync(join(root, ...PRIVATE_PREFIX.split("/"), "existing.bin"), "private");
  return root;
};

interface HttpResult {
  readonly status: number;
  readonly headers: IncomingHttpHeaders;
  readonly body: Buffer;
}

const withServer = async <T>(
  handler: NasRequestHandler,
  action: (port: number) => Promise<T>,
): Promise<T> => {
  const server = createHttpServer((request, response) => handler(request, response));
  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  try {
    const address = server.address();
    if (address === null || typeof address === "string") throw new Error("test server has no TCP address");
    return await action(address.port);
  } finally {
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
  }
};

const fetchFixture = async (
  port: number,
  path: string,
  options: { readonly method?: string; readonly headers?: Readonly<Record<string, string>> } = {},
): Promise<HttpResult> => new Promise<HttpResult>((resolvePromise, rejectPromise) => {
  const request = httpRequest(
    {
      hostname: "127.0.0.1",
      port,
      path,
      method: options.method ?? "GET",
      headers: options.headers,
      agent: false,
    },
    (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.once("end", () => resolvePromise({
        status: response.statusCode ?? 0,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }));
    },
  );
  request.once("error", rejectPromise);
  request.end();
});

afterEach(() => {
  for (const path of paths.splice(0)) rmSync(path, { recursive: true, force: true });
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Vite NAS catalogue startup authority", () => {
  it("eagerly loaded the tracked strict catalogue", () => {
    expect(NAS_ASSET_CATALOG.format).toBe("snowflake-nas-asset-catalog-v1");
    expect(NAS_ASSET_CATALOG.projectId).toBe("virtual-cloud-chamber");
    expect(NAS_ASSET_CATALOG_PATH).toBe(join(REPOSITORY_ROOT, "docs", "nas-assets.json"));
  });

  it("rejects missing, malformed, and unknown-field catalogues", () => {
    const root = temporaryRoot("catalog");
    expect(() => loadNasAssetCatalog(join(root, "missing.json"))).toThrow(/cannot load NAS asset catalogue/u);

    const malformed = join(root, "malformed.json");
    writeFileSync(malformed, "{");
    expect(() => loadNasAssetCatalog(malformed)).toThrow(/catalog is not JSON/u);

    const unknownField = join(root, "unknown-field.json");
    const value = JSON.parse(readFileSync(NAS_ASSET_CATALOG_PATH, "utf8")) as Record<string, unknown>;
    value.unreviewedServeOverride = true;
    writeFileSync(unknownField, JSON.stringify(value));
    expect(() => loadNasAssetCatalog(unknownField)).toThrow(/keys must be exactly/u);
  });
});

const safeGutcheckIndex = (): Record<string, unknown> => ({
  generated: "2026-08-15T12:00:00.000Z",
  root: "out/gutcheck-gg-realism",
  sections: [
    {
      title: "fixture",
      items: [
        {
          label: "generated image",
          href: `/nas/${SERVED_PREFIX}/fixture.png`,
          image: `/nas/${SERVED_PREFIX}/fixture.png`,
        },
      ],
      rows: [
        {
          label: "generated mesh",
          comparisons: [],
          viewers: [
            {
              label: "viewer",
              href: `/spike-gg-realism.html?look=glass&interactive=1&mesh=/nas/${SERVED_FILE}`,
            },
          ],
        },
      ],
    },
  ],
});

describe("Vite gutcheck index boundary", () => {
  it("accepts the current logical schema with only catalogue-authorized links", () => {
    expect(() => validateGutcheckIndexForServing(
      JSON.stringify(safeGutcheckIndex()),
      NAS_ASSET_CATALOG,
    )).not.toThrow();
  });

  it("rejects stale roots, absolute paths, /@fs, and private /nas links", () => {
    const unsafe: Record<string, unknown>[] = [];

    const absoluteRoot = structuredClone(safeGutcheckIndex());
    absoluteRoot.root = "/Users/author/checkout/out/gutcheck-gg-realism";
    unsafe.push(absoluteRoot);

    const fsHref = structuredClone(safeGutcheckIndex());
    ((fsHref.sections as Array<Record<string, unknown>>)[0]!.items as Array<Record<string, unknown>>)[0]!.href =
      "/@fs/Users/author/checkout/research/private.png";
    unsafe.push(fsHref);

    const absoluteImage = structuredClone(safeGutcheckIndex());
    ((absoluteImage.sections as Array<Record<string, unknown>>)[0]!.items as Array<Record<string, unknown>>)[0]!.image =
      "file:///Users/author/checkout/research/private.png";
    unsafe.push(absoluteImage);

    const privateHref = structuredClone(safeGutcheckIndex());
    ((privateHref.sections as Array<Record<string, unknown>>)[0]!.items as Array<Record<string, unknown>>)[0]!.href =
      "/nas/research-cache/content/private.png";
    unsafe.push(privateHref);

    const privateViewerAsset = structuredClone(safeGutcheckIndex());
    const row = (((privateViewerAsset.sections as Array<Record<string, unknown>>)[0]!.rows as Array<Record<string, unknown>>)[0]);
    (row.viewers as Array<Record<string, unknown>>)[0]!.href =
      "/spike-gg-realism.html?look=glass&mesh=/nas/research-cache/content/private.bin";
    unsafe.push(privateViewerAsset);

    for (const value of unsafe) {
      expect(() => validateGutcheckIndexForServing(JSON.stringify(value), NAS_ASSET_CATALOG)).toThrow();
    }
  });

  it("returns no stale index bytes when endpoint validation fails", async () => {
    const root = temporaryRoot("stale-index");
    const indexPath = join(root, "index.json");
    const unsafe = safeGutcheckIndex();
    unsafe.root = "/private/checkout/out/gutcheck-gg-realism";
    const source = JSON.stringify(unsafe);
    writeFileSync(indexPath, source);
    const handler = createGutcheckIndexHandler(indexPath, NAS_ASSET_CATALOG);
    await withServer(handler, async (port) => {
      const result = await fetchFixture(port, "/gutcheck-index.json");
      expect(result.status).toBe(409);
      expect(result.headers["cache-control"]).toBe("no-store");
      expect(result.body.toString("utf8")).not.toContain("/private/checkout");
      expect(result.body.toString("utf8")).not.toBe(source);
    });
  });
});

describe("Vite /nas catalogue and filesystem boundary", () => {
  it("serves only a catalogue-authorized exact path", async () => {
    const root = fixtureShare();
    const handler = createNasRequestHandler({ catalog: NAS_ASSET_CATALOG, resolveNasRoot: () => root });
    await withServer(handler, async (port) => {
      const result = await fetchFixture(port, `/${SERVED_FILE}`);
      expect(result.status).toBe(200);
      expect(result.body.toString("utf8")).toBe("0123456789");
      expect(result.headers["content-type"]).toBe("application/octet-stream");
      expect(result.headers["content-length"]).toBe("10");
      expect(result.headers["accept-ranges"]).toBe("bytes");
      expect(result.headers["x-content-type-options"]).toBe("nosniff");
    });
  });

  it("bounds a full response to the descriptor size observed before a concurrent append", async () => {
    const root = fixtureShare();
    const handler = createNasRequestHandler({
      catalog: NAS_ASSET_CATALOG,
      resolveNasRoot: () => root,
      openFile: (nasRoot, relativePath, allowedPrefix) => {
        const opened = openContainedRegularFile(nasRoot, relativePath, allowedPrefix);
        if (opened.kind === "ok") appendFileSync(opened.path, "APPENDED");
        return opened;
      },
    });
    await withServer(handler, async (port) => {
      const result = await fetchFixture(port, `/${SERVED_FILE}`);
      expect(result.status).toBe(200);
      expect(result.headers["content-length"]).toBe("10");
      expect(result.body.toString("utf8")).toBe("0123456789");
    });
  });

  it("returns one 403 before mount or filesystem access for every catalogue denial", async () => {
    fixtureShare();
    let mountCalls = 0;
    let openCalls = 0;
    const handler = createNasRequestHandler({
      catalog: NAS_ASSET_CATALOG,
      resolveNasRoot: () => {
        mountCalls += 1;
        throw new Error("must not resolve a denied request");
      },
      openFile: () => {
        openCalls += 1;
        throw new Error("must not open a denied request");
      },
    });
    const denied = [
      `/${PRIVATE_PREFIX}/existing.bin`,
      `/${PRIVATE_PREFIX}/missing.bin`,
      "/unknown/existing.bin",
      "/unknown/missing.bin",
      "/out/gutcheck-gg-realism/LARGE/fixture.bin",
      `/${SERVED_PREFIX}/cafe%CC%81.bin`,
      "/%256fut/gutcheck-gg-realism/large/fixture.bin",
      "/%252e%252e/out/gutcheck-gg-realism/large/fixture.bin",
    ];
    await withServer(handler, async (port) => {
      const results = await Promise.all(denied.map((path) => fetchFixture(port, path)));
      expect(results.map(({ status }) => status)).toEqual(denied.map(() => 403));
      expect(results.map(({ body }) => body.byteLength)).toEqual(denied.map(() => 0));
    });
    expect(mountCalls).toBe(0);
    expect(openCalls).toBe(0);
  });

  it("checks the method before decoding or resolving the share", async () => {
    let mountCalls = 0;
    const handler = createNasRequestHandler({
      catalog: NAS_ASSET_CATALOG,
      resolveNasRoot: () => {
        mountCalls += 1;
        return null;
      },
    });
    await withServer(handler, async (port) => {
      const result = await fetchFixture(port, `/${SERVED_FILE}`, { method: "POST" });
      expect(result.status).toBe(405);
      expect(result.headers.allow).toBe("GET, HEAD");
    });
    expect(mountCalls).toBe(0);
  });

  it.skipIf(process.platform === "win32")("refuses a served-path symlink into a denied collection", async () => {
    const root = fixtureShare();
    const link = join(root, ...SERVED_PREFIX.split("/"), "private-link.bin");
    symlinkSync(join(root, ...PRIVATE_PREFIX.split("/"), "existing.bin"), link);
    const handler = createNasRequestHandler({ catalog: NAS_ASSET_CATALOG, resolveNasRoot: () => root });
    await withServer(handler, async (port) => {
      const result = await fetchFixture(port, `/${SERVED_PREFIX}/private-link.bin`);
      expect(result.status).toBe(403);
      expect(result.body.byteLength).toBe(0);
    });
  });

  it("distinguishes an authorized missing file only after share resolution", async () => {
    const root = fixtureShare();
    let mountCalls = 0;
    const handler = createNasRequestHandler({
      catalog: NAS_ASSET_CATALOG,
      resolveNasRoot: () => {
        mountCalls += 1;
        return root;
      },
    });
    await withServer(handler, async (port) => {
      expect((await fetchFixture(port, `/${SERVED_PREFIX}/missing.bin`)).status).toBe(404);
    });
    expect(mountCalls).toBe(1);
  });

  it("supports bodyless HEAD and bounded and suffix ranges", async () => {
    const root = fixtureShare();
    const handler = createNasRequestHandler({ catalog: NAS_ASSET_CATALOG, resolveNasRoot: () => root });
    await withServer(handler, async (port) => {
      const head = await fetchFixture(port, `/${SERVED_FILE}`, { method: "HEAD" });
      expect(head.status).toBe(200);
      expect(head.headers["content-length"]).toBe("10");
      expect(head.body.byteLength).toBe(0);

      const rangedHead = await fetchFixture(port, `/${SERVED_FILE}`, {
        method: "HEAD",
        headers: { range: "bytes=2-5" },
      });
      expect(rangedHead.status).toBe(206);
      expect(rangedHead.headers["content-range"]).toBe("bytes 2-5/10");
      expect(rangedHead.headers["content-length"]).toBe("4");
      expect(rangedHead.body.byteLength).toBe(0);

      const bounded = await fetchFixture(port, `/${SERVED_FILE}`, { headers: { range: "bytes=2-5" } });
      expect(bounded.status).toBe(206);
      expect(bounded.headers["content-range"]).toBe("bytes 2-5/10");
      expect(bounded.body.toString("utf8")).toBe("2345");

      const suffix = await fetchFixture(port, `/${SERVED_FILE}`, { headers: { range: "bytes=-3" } });
      expect(suffix.status).toBe(206);
      expect(suffix.headers["content-range"]).toBe("bytes 7-9/10");
      expect(suffix.body.toString("utf8")).toBe("789");
    });
  });

  it("closes the descriptor on an unsatisfiable range", async () => {
    const root = fixtureShare();
    let openedFd: number | null = null;
    const handler = createNasRequestHandler({
      catalog: NAS_ASSET_CATALOG,
      resolveNasRoot: () => root,
      openFile: (nasRoot, relativePath, allowedPrefix) => {
        const opened = openContainedRegularFile(nasRoot, relativePath, allowedPrefix);
        if (opened.kind === "ok") openedFd = opened.fd;
        return opened;
      },
    });
    await withServer(handler, async (port) => {
      const result = await fetchFixture(port, `/${SERVED_FILE}`, { headers: { range: "bytes=999-1000" } });
      expect(result.status).toBe(416);
      expect(result.headers["content-range"]).toBe("bytes */10");
    });
    expect(openedFd).not.toBeNull();
    expect(() => fstatSync(openedFd as unknown as number)).toThrow(/EBADF/u);
  });
});

describe("Vite loopback and /@fs boundary", () => {
  it("accepts only numeric loopback listen addresses", () => {
    expect(() => assertLoopbackViteHost("127.0.0.1", "server.host")).not.toThrow();
    expect(() => assertLoopbackViteHost("127.42.0.1", "server.host")).not.toThrow();
    expect(() => assertLoopbackViteHost("::1", "server.host")).not.toThrow();
    for (const host of [true, false, undefined, "0.0.0.0", "::", "192.168.1.2", "localhost"]) {
      expect(() => assertLoopbackViteHost(host, "server.host")).toThrow(/numeric loopback/u);
    }
  });

  it("pins the development root and either pins or disables publicDir", () => {
    expect(() => assertCanonicalViteRoots(join(REPOSITORY_ROOT, "app"), false)).not.toThrow();
    expect(() => assertCanonicalViteRoots(
      join(REPOSITORY_ROOT, "app"),
      join(REPOSITORY_ROOT, "app", "public"),
    )).not.toThrow();
    expect(() => assertCanonicalViteRoots(join(REPOSITORY_ROOT, "core"), false)).toThrow(/canonical app/u);
    expect(() => assertCanonicalViteRoots(
      join(REPOSITORY_ROOT, "app"),
      temporaryRoot("public-override"),
    )).toThrow(/publicDir/u);
  });

  it("rejects fully merged development and preview host overrides", async () => {
    const configFile = join(REPOSITORY_ROOT, "app", "vite.config.ts");
    await expect(resolveViteConfig({
      configFile,
      server: { host: "0.0.0.0" },
    }, "serve")).rejects.toThrow(/server\.host/u);
    await expect(resolveViteConfig({
      configFile,
      preview: { host: "::" },
    }, "serve")).rejects.toThrow(/preview\.host/u);
    await expect(resolveViteConfig({
      root: join(REPOSITORY_ROOT, "core"),
      configFile,
    }, "serve")).rejects.toThrow(/canonical app/u);
    await expect(resolveViteConfig({
      root: join(REPOSITORY_ROOT, "app"),
      publicDir: temporaryRoot("resolved-public-override"),
      configFile,
    }, "serve")).rejects.toThrow(/publicDir/u);
  });

  it("keeps the NAS outside Vite's /@fs allow-list", () => {
    const config = viteConfig as {
      readonly server?: {
        readonly host?: string | boolean;
        readonly fs?: {
          readonly strict?: boolean;
          readonly allow?: readonly string[];
          readonly deny?: readonly string[];
        };
      };
      readonly preview?: { readonly host?: string | boolean };
    };
    expect(config.server?.host).toBe("127.0.0.1");
    expect(config.preview?.host).toBe("127.0.0.1");
    expect(config.server?.fs?.strict).toBe(true);
    expect(config.server?.fs?.allow).toEqual([REPOSITORY_ROOT]);
    expect(config.server?.fs?.deny).toEqual(expect.arrayContaining(["**/research/**", "**/out/**"]));
  });

  it("denies an ignored local research file through Vite's resolved /@fs policy", async () => {
    const privateRoot = mkdtempSync(join(REPOSITORY_ROOT, "research", "vite-private-fixture-"));
    roots.push(privateRoot);
    const privateFile = join(privateRoot, "copyrighted.bin");
    writeFileSync(privateFile, "PRIVATE-FIXTURE-BYTES");

    const resolved = await resolveViteConfig({
      root: join(REPOSITORY_ROOT, "app"),
      configFile: join(REPOSITORY_ROOT, "app", "vite.config.ts"),
    }, "serve");
    const privateUrl = `/@fs/${encodeURI(privateFile.replaceAll("\\", "/"))}`;
    expect(isFileServingAllowed(resolved, privateUrl)).toBe(false);
    const outUrl = `/@fs/${encodeURI(join(REPOSITORY_ROOT, "out", "private.bin").replaceAll("\\", "/"))}`;
    expect(isFileServingAllowed(resolved, outUrl)).toBe(false);

    const coreModule = join(REPOSITORY_ROOT, "core", "src", "index.ts");
    const coreUrl = `/@fs/${encodeURI(coreModule.replaceAll("\\", "/"))}`;
    expect(isFileServingAllowed(resolved, coreUrl)).toBe(true);
  });

  it.skipIf(process.platform === "win32")(
    "denies persistent symlinks to research and outside bytes before Vite serves them",
    async () => {
      const privateRoot = mkdtempSync(join(REPOSITORY_ROOT, "research", "vite-private-link-target-"));
      roots.push(privateRoot);
      const privateFile = join(privateRoot, "copyrighted.txt");
      writeFileSync(privateFile, "PRIVATE-RESEARCH-BYTES");
      const outside = temporaryRoot("outside-link-target");
      const outsideFile = join(outside, "secret.txt");
      writeFileSync(outsideFile, "OUTSIDE-SECRET-BYTES");

      const suffix = privateRoot.slice(privateRoot.lastIndexOf("-") + 1);
      const researchLink = join(REPOSITORY_ROOT, "app", `vite-private-link-${suffix}.txt`);
      const outsideLink = join(REPOSITORY_ROOT, "app", `vite-outside-link-${suffix}.txt`);
      symlinkSync(privateFile, researchLink);
      symlinkSync(outsideFile, outsideLink);
      paths.push(researchLink, outsideLink);

      const boundary = createViteLocalFileBoundary();
      await withServer(
        (request, response) => boundary(request, response, () => {
          response.statusCode = 204;
          response.end();
        }),
        async (port) => {
          const requests = [
            `/@fs/${encodeURI(researchLink.replaceAll("\\", "/"))}`,
            `/@fs/${encodeURI(outsideLink.replaceAll("\\", "/"))}`,
            `/${encodeURIComponent(researchLink.slice(researchLink.lastIndexOf("/") + 1))}`,
            `/${encodeURIComponent(outsideLink.slice(outsideLink.lastIndexOf("/") + 1))}`,
          ];
          const results = await Promise.all(requests.map((path) => fetchFixture(port, path)));
          expect(results.map((result) => result.status)).toEqual([403, 403, 403, 403]);
          expect(Buffer.concat(results.map((result) => result.body)).toString("utf8")).not.toContain("SECRET");
          expect(Buffer.concat(results.map((result) => result.body)).toString("utf8")).not.toContain("PRIVATE");

          const coreSource = join(REPOSITORY_ROOT, "core", "src", "index.ts");
          const allowed = await Promise.all([
            fetchFixture(port, "/src/main.ts"),
            fetchFixture(port, `/@fs/${encodeURI(coreSource.replaceAll("\\", "/"))}`),
          ]);
          expect(allowed.map((result) => result.status)).toEqual([204, 204]);
        },
      );

      // A live Vite instance pins middleware ordering: both /@fs and root-file routes must hit
      // the guard before Vite's lexical serving checks follow either link.
      const vite = await createViteServer({
        root: join(REPOSITORY_ROOT, "app"),
        configFile: join(REPOSITORY_ROOT, "app", "vite.config.ts"),
        logLevel: "silent",
        server: { host: "127.0.0.1", port: 0, strictPort: false },
      });
      await vite.listen();
      try {
        const address = vite.httpServer?.address();
        if (address === null || address === undefined || typeof address === "string") {
          throw new Error("live Vite fixture has no TCP address");
        }
        const fsResult = await fetchFixture(
          address.port,
          `/@fs/${encodeURI(outsideLink.replaceAll("\\", "/"))}`,
        );
        const rootResult = await fetchFixture(
          address.port,
          `/${encodeURIComponent(outsideLink.slice(outsideLink.lastIndexOf("/") + 1))}`,
        );
        expect([fsResult.status, rootResult.status]).toEqual([403, 403]);
        expect(Buffer.concat([fsResult.body, rootResult.body]).toString("utf8")).not.toContain("OUTSIDE-SECRET-BYTES");

        const home = await fetchFixture(address.port, "/");
        expect(home.status).toBe(200);
        expect(home.headers["content-type"]).toContain("text/html");
      } finally {
        await vite.close();
      }
    },
  );
});
