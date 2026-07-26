/**
 * transpile-roku.js
 * Roku SceneGraph Transpiler — converts src/ (TypeScript/React) → Roku BRS + XML
 *
 * Source of truth: src/ (TSX/TS)
 * Output targets:  utils/, services/, models/, components/
 *
 * Mapping reference:
 *   React concept          → BrightScript / SceneGraph equivalent
 *   ─────────────────────────────────────────────────────────────
 *   useState<T>(init)      → XML <field id="..." type="..."/> + BRS variable
 *   useEffect(fn, [])      → sub init() body
 *   useEffect(fn, [dep])   → observeField("dep", "handler")
 *   async function/fetch() → Task node (roUrlTransfer off render thread)
 *   props (interface)      → XML <interface> fields
 *   JSX <div>              → <Group> or <Rectangle>
 *   JSX <img>              → <Poster>
 *   JSX <video>            → <Video>
 *   JSX <p>/<h1>/<span>   → <Label>
 *   CSS bg-[#hex]          → color="0xRRGGBBAA"
 *   Tailwind font-bold     → font:MediumBoldSystemFont
 *   CSS flex layout        → translation="[x,y]" + width/height (absolute 1920x1080)
 *   localStorage           → roRegistry
 *   console.log            → print
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ══════════════════════════════════════════════════════════════════════
// COLOR SYSTEM
// CSS hex / Tailwind utility classes → Roku 0xRRGGBBAA format
// Roku colors are 32-bit ARGB: 0xRRGGBBAA
// ══════════════════════════════════════════════════════════════════════

/** Named Tailwind colors used in this project */
const TAILWIND_COLORS = {
  'white':        'FFFFFF', 'black':        '000000',
  'gray-100':     'F3F4F6', 'gray-200':     'E5E7EB', 'gray-300':     'D1D5DB',
  'gray-400':     '9CA3AF', 'gray-500':     '6B7280', 'gray-600':     '4B5563',
  'gray-700':     '374151', 'gray-800':     '1F2937', 'gray-900':     '111827',
  'purple-200':   'DDD6FE', 'purple-300':   'C4B5FD', 'purple-400':   'A78BFA',
  'purple-500':   '8B5CF6', 'purple-600':   '7C3AED', 'purple-700':   '6D28D9',
  'purple-800':   '5B21B6', 'purple-900':   '4C1D95', 'purple-950':   '2E1065',
  'red-400':      'F87171', 'red-500':      'EF4444',
  'emerald-400':  '34D399', 'rose-400':     'FB7185',
};

/** Convert 3/6/8-digit CSS hex string to Roku 0xRRGGBBAA */
function hexToRoku(hex, alpha = 'FF') {
  const h = hex.replace('#', '').toUpperCase();
  if (h.length === 3)  return `0x${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}${alpha}`;
  if (h.length === 6)  return `0x${h}${alpha}`;
  if (h.length === 8)  return `0x${h}`;
  return `0x${h.padEnd(8, 'F')}`;
}

/** Attempt to convert a CSS color string (hex, named, rgba) → Roku format */
function cssToRoku(colorStr, alphaHex = 'FF') {
  if (!colorStr) return null;
  // CSS hex
  const hexMatch = colorStr.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hexMatch) return hexToRoku(hexMatch[1], alphaHex);
  // Tailwind named
  const twKey = Object.keys(TAILWIND_COLORS).find(k => colorStr === k);
  if (twKey) return hexToRoku(TAILWIND_COLORS[twKey], alphaHex);
  return null;
}

/**
 * Scan TSX content and extract every distinct hex color found in:
 *  bg-[#xxx], text-[#xxx], border-[#xxx], color-[#xxx], shadow-[#xxx], ring-[#xxx]
 *  and bare string literals '#xxxxxx'
 * Returns a map { '#rrggbb': '0xRRGGBBAA' }
 */
function extractColors(tsxContent) {
  const map = {};
  const utilityHex = tsxContent.matchAll(/(?:bg|text|border|color|ring|shadow|from|to|via)-\[#([0-9a-fA-F]{3,8})\]/g);
  for (const m of utilityHex) map[`#${m[1]}`] = hexToRoku(m[1]);
  const bareHex = tsxContent.matchAll(/'(#[0-9a-fA-F]{6,8})'/g);
  for (const m of bareHex) map[m[1]] = hexToRoku(m[1].replace('#', ''));
  return map;
}

// ══════════════════════════════════════════════════════════════════════
// FILE HELPERS
// ══════════════════════════════════════════════════════════════════════

function readSrc(relPath) {
  return readFileSync(join(ROOT, 'src', relPath), 'utf8');
}
function readRoot(relPath) {
  return readFileSync(join(ROOT, relPath), 'utf8');
}
function writeOut(relPath, content) {
  const full = join(ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  console.log(`  ✓  ${relPath}`);
}

// ══════════════════════════════════════════════════════════════════════
// UTILITY LAYER GENERATORS
// src/utils/*.ts  →  utils/*.brs
// ══════════════════════════════════════════════════════════════════════

/**
 * src/utils/constants.ts → utils/Constants.brs
 * Converts: export const ROKU_CONSTANTS = { KEY: 'value', ... }
 *        → function GetRokuConstants() as Object / return { KEY: "value" }
 */
function generateConstants() {
  const src = readSrc('utils/constants.ts');
  const block = src.match(/ROKU_CONSTANTS\s*=\s*\{([\s\S]+?)\};/)?.[1] ?? '';
  const lines = [];

  for (const line of block.split('\n')) {
    // String fields
    const str = line.match(/(\w+)\s*:\s*['"](.+?)['"]/);
    if (str) {
      let [, key, val] = str;
      // Convert hex colors to Roku format
      if (/^#[0-9a-fA-F]{3,8}$/.test(val)) val = hexToRoku(val.replace('#', ''));
      lines.push(`        ${key}: "${val}"`);
      continue;
    }
    // Numeric fields
    const num = line.match(/(\w+)\s*:\s*(\d+)/);
    if (num) {
      lines.push(`        ${num[1]}: ${num[2]}`);
    }
  }

  writeOut('utils/Constants.brs', `' Auto-generated by transpile-roku.js ← src/utils/constants.ts
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile

function GetRokuConstants() as Object
    return {
${lines.join(',\n')}
    }
end function
`);
}

/**
 * app.config.json + src/utils/config.ts → utils/Config.brs
 * Converts config values to BRS associative array.
 * devMode controls debug logging; defaultFeedUrl maps to pkg: path.
 */
function generateConfig() {
  const cfg = JSON.parse(readRoot('app.config.json'));
  const feedUrl = (cfg.defaultFeedUrl || '/feeds/sample-feed.json')
    .replace(/^\//, 'pkg:/');

  writeOut('utils/Config.brs', `' Auto-generated by transpile-roku.js ← app.config.json + src/utils/config.ts
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile

function GetRokuConfig() as Object
    return {
        appName:            "${cfg.appName        || 'Roku Channel'}",
        appSubtitle:        "${cfg.appSubtitle    || 'Enjoy your videos'}",
        version:            "${cfg.version        || '1.0.0'}",
        devMode:            ${cfg.devMode         ? 'true' : 'false'},
        wifiCheckIntervalMs: ${cfg.wifiCheckIntervalMs || 120000},
        defaultFeedUrl:     "${feedUrl}"
    }
end function
`);
}

/**
 * src/utils/logger.ts → utils/Logger.brs
 * Mirrors: Logger class createEntry(level, module, message)
 * Implementation: standalone global subs — avoids BrightScript compilation errors
 * caused by using `m` (component namespace) inside anonymous AA subs in SceneGraph context.
 * Usage in each component:
 *   m.logTag = "ComponentName"       (string tag stored in component namespace)
 *   LogInfo(m.logTag, "message")     (call global sub — always compiles safely)
 */
function generateLogger() {
  writeOut('utils/Logger.brs', `' Auto-generated by transpile-roku.js <- src/utils/logger.ts
' Mirrors: Logger class createEntry(level, module, message)
' Uses standalone global subs — avoids BrightScript compile errors from anonymous
' sub closures that reference the SceneGraph component namespace via m.
' Usage: m.logTag = "Tag" / LogInfo(m.logTag, "message")
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile

sub LogInfo(tag as String, msg as String)
    print "[INFO ][" + tag + "] " + msg
end sub

sub LogWarn(tag as String, msg as String)
    print "[WARN ][" + tag + "] " + msg
end sub

sub LogError(tag as String, msg as String)
    print "[ERROR][" + tag + "] " + msg
end sub

sub LogDebug(tag as String, msg as String)
    print "[DEBUG][" + tag + "] " + msg
end sub
`);
}

// ══════════════════════════════════════════════════════════════════════
// SERVICE LAYER GENERATORS
// src/services/*.ts  →  services/*.brs
// ══════════════════════════════════════════════════════════════════════

/**
 * src/services/feedService.ts → services/FeedService.brs
 * Mirrors: FeedService.loadFeed(feedUrl?) URL routing logic.
 * Local sample feed maps to pkg: path; remote feeds are passed through.
 */
function generateFeedService() {
  const cfg = JSON.parse(readRoot('app.config.json'));
  const feedUrl = (cfg.defaultFeedUrl || '/feeds/sample-feed.json')
    .replace(/^\//, 'pkg:/');

  writeOut('services/FeedService.brs', `' Auto-generated by transpile-roku.js ← src/services/feedService.ts
' Mirrors: FeedService.loadFeed(feedUrl?) — URL routing (local pkg vs HTTP)
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile

' Mirrors: static loadFeed(feedUrl?) URL selection
' Returns the pkg: local feed path or custom remote URL
function FeedService_GetFeedUrl() as String
    return "${feedUrl}"
end function
`);
}

/**
 * src/services/feedParser.ts → services/FeedParser.brs
 * Mirrors: FeedParser.parseFeed() + normalizeVideoItem() + normalizeRokuContentFeedItem()
 * Output is a ContentNode tree: rootNode → rowNode → itemNodes
 * This tree directly feeds RowList via homeScene.content = feedTask.content
 *
 * ContentNode field mapping (mirrors Video interface from src/types.ts):
 *   Video.id          → ContentNode.id
 *   Video.title       → ContentNode.title
 *   Video.thumbnail   → ContentNode.HDPosterUrl
 *   Video.url         → ContentNode.url
 *   Video.description → ContentNode.description
 *   Video.duration    → ContentNode.length
 *   Video.category    → ContentNode.categories
 *   Video.rating      → ContentNode.ratingValue
 *   Video.releaseDate → ContentNode.releaseDate
 *   Video.artist      → ContentNode.actors
 */
function generateFeedParser() {
  writeOut('services/FeedParser.brs', `' Auto-generated by transpile-roku.js ← src/services/feedParser.ts
' Mirrors: FeedParser.parseFeed(rawData) → FeedData
'          FeedParser.normalizeVideoItem(item, index) → Video
'          FeedParser.normalizeRokuContentFeedItem(item, index) → Video
' Output: ContentNode tree (rootNode → rowNode → itemNodes) for RowList
' ContentNode fields mirror Video interface from src/types.ts
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile

' ─────────────────────────────────────────────────────────────────────
' FALLBACK_MIRRORS — mirrors PlayerScene.tsx FALLBACK_MIRRORS array
' Used when no stream URL is found in feed item
' ─────────────────────────────────────────────────────────────────────
function FeedParser_FallbackStreams() as Object
    return [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    ]
end function

' ─────────────────────────────────────────────────────────────────────
' FeedParser_Parse — main entry point
' Mirrors: FeedParser.parseFeed(rawData: unknown): FeedData
' Detects feed format and routes to the correct normalizer
' ─────────────────────────────────────────────────────────────────────
function FeedParser_Parse(jsonString as String) as Object
    logTag = "FeedParser"
    LogInfo(logTag, "Starting feed parse — ContentNode tree construction")

    rootNode = CreateObject("roSGNode", "ContentNode")
    rowNode = rootNode.createChild("ContentNode")
    rowNode.title = "Featured Catalog"

    json = ParseJson(jsonString)
    if json = invalid
        LogError(logTag, "ParseJson failed — invalid JSON string")
        return rootNode
    end if

    items = []

    ' Format 0: Root-level array [ { title, url, ... } ]
    ' Mirrors: if (Array.isArray(parsed)) items = parsed
    if type(json) = "roArray"
        LogInfo(logTag, "Detected root-level array (" + json.count().toStr() + " items)")
        items = json

    ' Format 1: Simple { "videos": [...] }
    ' Mirrors: else if (Array.isArray(parsed.videos)) items = parsed.videos
    else if type(json) = "roAssociativeArray" and json.videos <> invalid and type(json.videos) = "roArray"
        LogInfo(logTag, "Detected videos array (" + json.videos.count().toStr() + " items)")
        items = json.videos

    ' Format 2: Roku Content Feed { "movie":[...], "shortFormVideos":[...], ... }
    ' Mirrors: else if (Array.isArray(parsed.shortFormVideos) || ...)
    else if type(json) = "roAssociativeArray" and (json.movie <> invalid or json.shortFormVideos <> invalid or json.tvSpecial <> invalid)
        LogInfo(logTag, "Detected Roku Content Feed schema")
        if json.movie <> invalid and type(json.movie) = "roArray"
            for each item in json.movie
                items.push(item)
            end for
        end if
        if json.shortFormVideos <> invalid and type(json.shortFormVideos) = "roArray"
            for each item in json.shortFormVideos
                items.push(item)
            end for
        end if
        if json.tvSpecial <> invalid and type(json.tvSpecial) = "roArray"
            for each item in json.tvSpecial
                items.push(item)
            end for
        end if

    ' Fallback: search all keys for first array — mirrors the fallback loop
    else if type(json) = "roAssociativeArray"
        LogWarn(logTag, "Unrecognized feed structure — searching all array keys")
        for each key in json
            if type(json[key]) = "roArray"
                items = json[key]
                LogInfo(logTag, "Found array under key: " + key)
                exit for
            end if
        end for
    end if

    LogInfo(logTag, "Normalizing " + items.count().toStr() + " feed items → ContentNodes")
    fallbacks = FeedParser_FallbackStreams()

    for i = 0 to items.count() - 1
        item = items[i]
        if item = invalid then goto nextItem

        node = FeedParser_NormalizeItem(item, i, fallbacks)
        if node <> invalid
            rowNode.appendChild(node)
        end if

        nextItem:
    end for

    LogInfo(logTag, "ContentNode tree built: " + rowNode.getChildCount().toStr() + " items in row")
    return rootNode
end function

' ─────────────────────────────────────────────────────────────────────
' FeedParser_NormalizeItem
' Mirrors: normalizeVideoItem(item, index) → Video
' Maps raw JSON item fields to ContentNode fields (Video interface)
' ─────────────────────────────────────────────────────────────────────
function FeedParser_NormalizeItem(item as Object, idx as Integer, fallbacks as Object) as Object
    node = CreateObject("roSGNode", "ContentNode")

    ' id — mirrors: String(item.id || item.imdbID || item.guid || \`vid-N\`)
    if item.id <> invalid
        node.id = item.id.toStr()
    else if item.imdbID <> invalid
        node.id = item.imdbID.toStr()
    else
        node.id = "vid-" + (idx + 1).toStr()
    end if

    ' title — mirrors: item.title || item.Title || item.name || "Video #N"
    if item.title <> invalid and item.title <> ""
        node.title = item.title
    else if item.Title <> invalid
        node.title = item.Title
    else if item.name <> invalid
        node.name = item.name
    else
        node.title = "Video #" + (idx + 1).toStr()
    end if

    ' thumbnail → HDPosterUrl — mirrors: item.thumbnail || item.poster || item.Poster || fallback
    if item.thumbnail <> invalid and item.thumbnail <> ""
        node.HDPosterUrl = item.thumbnail
    else if item.poster <> invalid and item.poster <> ""
        node.HDPosterUrl = item.poster
    else if item.Poster <> invalid and item.Poster <> ""
        node.HDPosterUrl = item.Poster
    else if item.imageUrl <> invalid
        node.HDPosterUrl = item.imageUrl
    else
        node.HDPosterUrl = "https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=800"
    end if

    ' url → stream URL — mirrors: item.url || item.streamUrl || item.contentUrl || fallback
    if item.url <> invalid and item.url <> ""
        node.url = item.url
    else if item.streamUrl <> invalid and item.streamUrl <> ""
        node.url = item.streamUrl
    else if item.contentUrl <> invalid
        node.url = item.contentUrl
    else if item.content <> invalid and type(item.content) = "roAssociativeArray"
        ' Roku Content Feed: content.videos[0].url
        if item.content.videos <> invalid and type(item.content.videos) = "roArray" and item.content.videos.count() > 0
            node.url = item.content.videos[0].url.toStr()
        else if item.content.url <> invalid
            node.url = item.content.url.toStr()
        end if
    end if

    if node.url = invalid or node.url = ""
        node.url = fallbacks[idx mod fallbacks.count()]
    end if

    node.streamFormat = "mp4"

    ' description — mirrors: item.description || item.Plot || item.plot || fallback
    if item.description <> invalid and item.description <> ""
        node.description = item.description
    else if item.Plot <> invalid
        node.description = item.Plot
    else if item.shortDescription <> invalid
        node.description = item.shortDescription
    else
        node.description = "No description provided."
    end if

    ' duration → length (seconds) — mirrors: typeof item.duration === 'number' ? item.duration : parse Runtime
    if item.duration <> invalid and type(item.duration) = "roInteger"
        node.length = item.duration
    else if item.duration <> invalid and type(item.duration) = "roFloat"
        node.length = int(item.duration)
    else
        node.length = 120
    end if

    ' category → categories — mirrors: item.category || Genre.split(",")[0]
    if item.category <> invalid and item.category <> ""
        node.categories = item.category
    else if item.Genre <> invalid
        ' Take first genre from comma-separated list
        genres = item.Genre.split(",")
        firstGenre = genres[0]
        node.categories = firstGenre
    else if item.genre <> invalid
        node.categories = item.genre
    else if item.genres <> invalid and type(item.genres) = "roArray" and item.genres.count() > 0
        node.categories = item.genres[0].toStr()
    else
        node.categories = "General"
    end if

    ' rating → ratingValue — mirrors: item.rating || item.Rated
    if item.rating <> invalid and item.rating <> ""
        if type(item.rating) = "roAssociativeArray" and item.rating.rating <> invalid
            node.ratingValue = item.rating.rating.toStr()
        else
            node.ratingValue = item.rating.toStr()
        end if
    else if item.Rated <> invalid
        node.ratingValue = item.Rated.toStr()
    else
        node.ratingValue = "G"
    end if

    ' releaseDate — mirrors: item.releaseDate || item.Year || item.Released
    if item.releaseDate <> invalid
        node.releaseDate = item.releaseDate.toStr()
    else if item.Year <> invalid
        node.releaseDate = item.Year.toStr()
    else if item.Released <> invalid
        node.releaseDate = item.Released.toStr()
    end if

    ' artist → actors — mirrors: item.artist || item.Director || item.Writer
    if item.artist <> invalid and item.artist <> ""
        node.actors = item.artist
    else if item.Director <> invalid and item.Director <> ""
        node.actors = item.Director
    else if item.Writer <> invalid
        node.actors = item.Writer
    end if

    return node
end function
`);
}

// ══════════════════════════════════════════════════════════════════════
// MODEL LAYER
// src/types.ts → models/VideoModel.brs
// ══════════════════════════════════════════════════════════════════════

/**
 * src/types.ts (Video interface) → models/VideoModel.brs
 * BrightScript doesn't have interfaces — we use a ContentNode factory function
 * that mirrors the Video interface field structure.
 */
function generateVideoModel() {
  writeOut('models/VideoModel.brs', `' Auto-generated by transpile-roku.js ← src/types.ts (Video interface)
' Mirrors: interface Video { id, title, description, thumbnail, url, duration, ... }
' In BrightScript, structured video data is stored as ContentNode fields.
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile

' Mirrors: interface Video constructor / object literal
' ContentNode field mapping (mirrors Video interface from src/types.ts):
'   Video.id          → ContentNode.id
'   Video.title       → ContentNode.title
'   Video.thumbnail   → ContentNode.HDPosterUrl  (Roku standard field)
'   Video.url         → ContentNode.url
'   Video.description → ContentNode.description
'   Video.duration    → ContentNode.length       (Roku standard field, seconds)
'   Video.category    → ContentNode.categories
'   Video.rating      → ContentNode.ratingValue
'   Video.releaseDate → ContentNode.releaseDate
'   Video.artist      → ContentNode.actors
function VideoModel(id as String, title as String, url as String, thumbnail as String) as Object
    node = CreateObject("roSGNode", "ContentNode")
    node.id          = id
    node.title       = title
    node.url         = url
    node.HDPosterUrl = thumbnail
    node.streamFormat = "mp4"
    return node
end function
`);
}

// ══════════════════════════════════════════════════════════════════════
// TASK LAYER
// Mirrors: MainScene.tsx fetchFeed() async function
// ══════════════════════════════════════════════════════════════════════

/**
 * components/tasks/LoadFeedTask.xml + LoadFeedTask.brs
 * Mirrors: MainScene.tsx fetchFeed(url) async function
 * In Roku, async work MUST run in a Task node (off the render thread).
 * Task.control = "RUN" starts execution; observeField("content") fires when done.
 *
 * React async pattern → Roku Task pattern:
 *   setIsLoading(true)         → set before task.control = "RUN"
 *   await FeedService.loadFeed → executeTask() runs in worker thread
 *   setFeedData(data)          → m.top.content = parsed (fires observer in MainScene)
 *   setErrorMsg(msg)           → m.top.errorMessage = msg (fires observer in MainScene)
 *   setIsLoading(false)        → triggered by onFeedLoaded / onFeedError in MainScene
 */
function generateLoadFeedTask() {
  const cfg = JSON.parse(readRoot('app.config.json'));
  const feedUrl = (cfg.defaultFeedUrl || '/feeds/sample-feed.json').replace(/^\//, 'pkg:/');

  writeOut('components/tasks/LoadFeedTask.xml', `<?xml version="1.0" encoding="utf-8" ?>
<!-- Auto-generated by transpile-roku.js ← src/services/feedService.ts (fetchFeed async logic) -->
<!-- Mirrors: MainScene.tsx fetchFeed() async function → Task node (off render thread)      -->
<!-- React: async function / await fetch()  →  Roku: Task node + roUrlTransfer              -->
<component name="LoadFeedTask" extends="Task">
    <script type="text/brightscript" uri="pkg:/components/tasks/LoadFeedTask.brs" />
    <script type="text/brightscript" uri="pkg:/services/FeedService.brs" />
    <script type="text/brightscript" uri="pkg:/services/FeedParser.brs" />
    <script type="text/brightscript" uri="pkg:/models/VideoModel.brs" />
    <script type="text/brightscript" uri="pkg:/utils/Logger.brs" />

    <interface>
        <!-- Mirrors: fetchFeed(url) parameter — defaults to local pkg feed -->
        <field id="url" type="string" value="${feedUrl}" />
        <!-- Mirrors: setFeedData(data) — ContentNode tree output for RowList -->
        <field id="content" type="node" />
        <!-- Mirrors: setErrorMsg(msg) — error string output -->
        <field id="errorMessage" type="string" value="" />
    </interface>
</component>
`);

  writeOut('components/tasks/LoadFeedTask.brs', `' Auto-generated by transpile-roku.js ← src/services/feedService.ts + feedParser.ts
' Mirrors: MainScene.tsx fetchFeed(url) async function as a Roku Task node
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile
'
' React async pattern → Roku Task pattern:
'   const response = await fetch(url, { headers: {...} })
'   → http = CreateObject("roUrlTransfer") / http.GetToString()
'
'   FeedParser.parseFeed(json) → FeedParser_Parse(jsonString)
'   setFeedData(data)          → m.top.content = parsed
'   setErrorMsg(msg)           → m.top.errorMessage = msg

sub init()
    m.top.functionName = "executeTask"
end sub

' Mirrors: async function fetchFeed(url: string): Promise<void>
sub executeTask()
    logTag = "LoadFeedTask"
    LogInfo(logTag, "Executing LoadFeedTask — URL: " + m.top.url)

    url = m.top.url
    jsonString = ""

    ' Mirrors: if (!targetUrl || targetUrl === 'local' || local path)
    '          → return SAMPLE_FEED_DATA (ReadAsciiFile for pkg: paths)
    ' Mirrors: await fetch(targetUrl, { headers: { Accept: application/json } })
    '          → roUrlTransfer.GetToString()
    if left(url, 4) = "http"
        http = CreateObject("roUrlTransfer")
        http.SetCertificatesFile("common:/certs/ca-bundle.crt")
        http.InitClientCertificates()
        http.SetUrl(url)
        http.AddHeader("Accept", "application/json")
        jsonString = http.GetToString()
        LogInfo(logTag, "HTTP response length: " + jsonString.len().toStr() + " bytes")
    else
        ' Local pkg: file (mirrors SAMPLE_FEED_DATA path)
        jsonString = ReadAsciiFile(url)
        LogInfo(logTag, "Local feed read: " + jsonString.len().toStr() + " bytes")
    end if

    ' Mirrors: if (!response.ok) throw new Error(\`HTTP \${status}\`)
    if jsonString = "" or jsonString = invalid
        errMsg = "Failed to read feed from: " + url
        LogError(logTag, errMsg)
        m.top.errorMessage = errMsg
        return
    end if

    ' Mirrors: const parsedFeed = FeedParser.parseFeed(json)
    LogInfo(logTag, "Feed fetched — passing to FeedParser_Parse")
    parsed = FeedParser_Parse(jsonString)

    if parsed = invalid
        errMsg = "FeedParser returned invalid result"
        LogError(logTag, errMsg)
        m.top.errorMessage = errMsg
        return
    end if

    ' Mirrors: setFeedData(parsedFeed) — fires onFeedLoaded observer in MainScene
    m.top.content = parsed
    LogInfo(logTag, "Task complete — content node set, observer will fire")
end sub
`);
}

// ══════════════════════════════════════════════════════════════════════
// ITEM RENDERER
// Mirrors: HomeScene.tsx video card <motion.div> → VideoRowListItem component
// ══════════════════════════════════════════════════════════════════════

/**
 * components/items/VideoRowListItem.xml + VideoRowListItem.brs
 * Mirrors: the video card in HomeScene.tsx (motion.div with poster/title/category/focus border)
 *
 * RowList passes itemContent ContentNode to each item renderer.
 * focusPercent (0.0→1.0) controls the focus ring animation.
 * Layout (300×230): poster(300×180) + title bg(300×50)
 */
function generateVideoRowListItem() {
  writeOut('components/items/VideoRowListItem.xml', `<?xml version="1.0" encoding="utf-8" ?>
<!-- Auto-generated by transpile-roku.js ← HomeScene.tsx video card <motion.div>         -->
<!-- Mirrors: poster image + title bar + focus ring + category + rating + play indicator  -->
<!-- Item size: 300×230 (poster 300×180 + info bar 300×50)                               -->
<component name="VideoRowListItem" extends="Group">
    <script type="text/brightscript" uri="pkg:/components/items/VideoRowListItem.brs" />

    <interface>
        <!-- Mirrors: video prop passed to each card -->
        <field id="itemContent" type="node" onChange="onItemContentChanged" />
        <!-- Mirrors: isFocused state (0.0=unfocused, 1.0=fully focused) -->
        <field id="focusPercent" type="float" onChange="onFocusPercentChanged" />
    </interface>

    <children>
        <!-- Poster image — mirrors <img src={video.thumbnail} className="aspect-video"> -->
        <Poster id="poster"
                width="300" height="180"
                loadDisplayMode="scaleToFit" />

        <!-- Focus border ring — mirrors border-[#9e46ea] ring-4 ring-purple-500/30 when isFocused -->
        <Rectangle id="focusBorder"
                   width="308" height="188"
                   translation="[-4, -4]"
                   color="0x9E46EAFF"
                   visible="false"
                   blendingEnabled="true" />

        <!-- Focus gradient overlay — mirrors bg-gradient-to-t from-[#662D91]/70 when isFocused -->
        <Rectangle id="focusGradient"
                   width="300" height="90"
                   translation="[0, 90]"
                   color="0x662D9190"
                   visible="false"
                   blendingEnabled="true" />

        <!-- Play icon (center) — mirrors pulsing Play button when isFocused -->
        <Label id="playIcon"
               text="▶"
               translation="[245, 132]"
               width="44" height="40"
               font="font:LargeBoldSystemFont"
               color="0xFFFFFFFF"
               horizAlign="center"
               visible="false" />

        <!-- Title background bar — mirrors card bottom bg-[#161024] -->
        <Rectangle id="titleBg"
                   width="300" height="50"
                   translation="[0, 180]"
                   color="0x161024FF" />

        <!-- Title label — mirrors <h3 className="font-semibold text-xs line-clamp-1"> -->
        <Label id="title"
               width="284" height="28"
               translation="[8, 184]"
               font="font:SmallBoldSystemFont"
               color="0xE5E7EBFF"
               horizAlign="left"
               vertAlign="center"
               truncateOnDelimiter=" " />

        <!-- Category label — mirrors <span>{video.category}</span> -->
        <Label id="category"
               width="155" height="18"
               translation="[8, 212]"
               font="font:SmallSystemFont"
               color="0x9CA3AFFF"
               horizAlign="left" />

        <!-- Rating badge bg — mirrors rating pill bg-purple-950/60 -->
        <Rectangle id="ratingBg"
                   width="36" height="18"
                   translation="[258, 212]"
                   color="0x2E106580"
                   blendingEnabled="true" />

        <!-- Rating badge label — mirrors text-purple-300 font-bold text-[10px] -->
        <Label id="rating"
               width="36" height="18"
               translation="[258, 212]"
               font="font:SmallSystemFont"
               color="0xC4B5FDFF"
               horizAlign="center"
               vertAlign="center" />
    </children>
</component>
`);

  writeOut('components/items/VideoRowListItem.brs', `' Auto-generated by transpile-roku.js ← HomeScene.tsx video card rendering
' Mirrors: <motion.div> card with poster/title/category/focus ring/play overlay
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile

sub init()
    m.poster       = m.top.findNode("poster")
    m.title        = m.top.findNode("title")
    m.category     = m.top.findNode("category")
    m.rating       = m.top.findNode("rating")
    m.focusBorder  = m.top.findNode("focusBorder")
    m.focusGradient = m.top.findNode("focusGradient")
    m.playIcon     = m.top.findNode("playIcon")
end sub

' Mirrors: card re-render when video prop changes
' Populates all visual fields from ContentNode (mirrors Video interface fields)
sub onItemContentChanged()
    item = m.top.itemContent
    if item = invalid then return

    ' title — mirrors video.title
    if item.title <> invalid and item.title <> ""
        m.title.text = item.title
    end if

    ' HDPosterUrl — mirrors <img src={video.thumbnail}>
    if item.HDPosterUrl <> invalid and item.HDPosterUrl <> ""
        m.poster.uri = item.HDPosterUrl
    end if

    ' categories — mirrors <span>{video.category}</span>
    if item.categories <> invalid and item.categories <> ""
        m.category.text = item.categories
    else
        m.category.text = "General"
    end if

    ' ratingValue — mirrors rating badge
    if item.ratingValue <> invalid and item.ratingValue <> ""
        m.rating.text = item.ratingValue
    end if
end sub

' Mirrors: isFocused CSS classes — border-[#9e46ea] ring-4 scale-[1.02] when focused
' focusPercent transitions 0.0→1.0 as RowList animates focus between items
sub onFocusPercentChanged()
    focused = (m.top.focusPercent > 0.5)

    m.focusBorder.visible  = focused
    m.focusGradient.visible = focused
    m.playIcon.visible     = focused

    ' Mirrors: text-white font-bold when isFocused vs text-gray-200
    if focused
        m.title.color = "0xFFFFFFFF"
    else
        m.title.color = "0xE5E7EBFF"
    end if
end sub
`);
}

// ══════════════════════════════════════════════════════════════════════
// MAIN SCENE GENERATOR
// src/components/MainScene.tsx → components/MainScene.xml + MainScene.brs
// ══════════════════════════════════════════════════════════════════════

/**
 * MainScene is the root orchestrator:
 *   - Manages scene switching (HOME ↔ PLAYER) — mirrors useState<SceneType>
 *   - Loads the content feed — mirrors fetchFeed() + LoadFeedTask
 *   - Shows loading/error overlays — mirrors isLoading/errorMsg states
 *   - Handles global key events — mirrors global keydown listener
 */
function generateMainScene(colors) {
  const bg       = colors['#0b0813'] || hexToRoku('0b0813');
  const darkBg   = colors['#100c19'] || hexToRoku('100c19');
  const errorRed = hexToRoku('F87171');
  const textGray = hexToRoku('9CA3AF');
  const textPurp = hexToRoku('E9D5FF');

  writeOut('components/MainScene.xml', `<?xml version="1.0" encoding="utf-8" ?>
<!-- Auto-generated by transpile-roku.js ← src/components/MainScene.tsx      -->
<!-- Mirrors: root App container with HOME/PLAYER scene switching             -->
<!-- React state → SceneGraph:                                                -->
<!--   currentScene: 'HOME'|'PLAYER' → homeScene.visible / playerScene.visible -->
<!--   isLoading                     → loadingOverlay.visible                -->
<!--   errorMsg                      → errorOverlay.visible + label          -->
<component name="MainScene" extends="Scene" backgroundColor="${bg}" backgroundUri="">
    <script type="text/brightscript" uri="pkg:/components/MainScene.brs" />
    <script type="text/brightscript" uri="pkg:/services/FeedService.brs" />
    <script type="text/brightscript" uri="pkg:/services/FeedParser.brs" />
    <script type="text/brightscript" uri="pkg:/utils/Logger.brs" />
    <script type="text/brightscript" uri="pkg:/utils/Constants.brs" />
    <script type="text/brightscript" uri="pkg:/utils/Config.brs" />

    <children>
        <!-- Root background — mirrors bg-[#0b0813] on root <div> -->
        <Rectangle id="background" width="1920" height="1080" color="${bg}" />

        <!-- HOME scene — mirrors: currentScene === 'HOME' && <HomeScene ...> -->
        <HomeScene id="homeScene" visible="true" />

        <!-- PLAYER scene — mirrors: currentScene === 'PLAYER' && <PlayerScene ...> -->
        <PlayerScene id="playerScene" visible="false" />

        <!-- Loading overlay — mirrors: isLoading && <div><spinner /><p>Loading...</p></div> -->
        <Rectangle id="loadingOverlay" width="1920" height="1080" color="${bg}" visible="true">
            <Label id="loadingLabel"
                   text="Loading Roku Content Feed..."
                   translation="[560, 490]"
                   width="800" height="60"
                   font="font:LargeBoldSystemFont"
                   color="${textPurp}"
                   horizAlign="center" />
            <Label id="loadingSubLabel"
                   text="Executing LoadFeedTask node"
                   translation="[660, 558]"
                   width="600" height="30"
                   font="font:SmallSystemFont"
                   color="${textGray}"
                   horizAlign="center" />
        </Rectangle>

        <!-- Error overlay — mirrors: errorMsg && <ErrorScreen message={errorMsg} /> -->
        <Rectangle id="errorOverlay" width="1920" height="1080" color="${bg}" visible="false">
            <Label id="errorTitle"
                   text="Failed to Load Feed"
                   translation="[560, 450]"
                   width="800" height="60"
                   font="font:LargeBoldSystemFont"
                   color="${errorRed}"
                   horizAlign="center" />
            <Label id="errorMessageLabel"
                   text=""
                   translation="[560, 520]"
                   width="800" height="80"
                   font="font:SmallSystemFont"
                   color="${textGray}"
                   horizAlign="center"
                   wrap="true" />
        </Rectangle>
    </children>
</component>
`);

  writeOut('components/MainScene.brs', `' Auto-generated by transpile-roku.js ← src/components/MainScene.tsx
' Mirrors: App root state machine — feed loading + HOME/PLAYER scene switching
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile
'
' React concept         → BrightScript equivalent
' ──────────────────────────────────────────────────────────────────────────
' useState('HOME')      → homeScene.visible / playerScene.visible toggle
' useState(null)        → homeScene.content (ContentNode from Task)
' useState(null)        → playerScene.content (selected video ContentNode)
' useState(true)        → loadingOverlay.visible
' useState(null)        → errorOverlay.visible + errorMessageLabel.text
' useEffect([], init)   → sub init() → loadContentFeed()
' async fetchFeed()     → LoadFeedTask node (runs off render thread)
' handleSelectVideo     → onVideoSelected() (observeField on homeScene)
' handleBackToHome      → navigateToHome() (called from key event or player state)
' global keydown        → onKeyEvent(key, press)

sub init()
    m.logTag = "MainScene"
    LogInfo(m.logTag, "Initializing MainScene — Roku SceneGraph Channel")

    ' Cache node refs — mirrors useRef / DOM refs
    m.homeScene          = m.top.findNode("homeScene")
    m.playerScene        = m.top.findNode("playerScene")
    m.loadingOverlay     = m.top.findNode("loadingOverlay")
    m.errorOverlay       = m.top.findNode("errorOverlay")
    m.errorMessageLabel  = m.top.findNode("errorMessageLabel")

    ' Mirrors: observeField for selectedVideo → handleSelectVideo(video)
    if m.homeScene <> invalid
        m.homeScene.observeField("selectedVideo", "onVideoSelected")
    end if

    ' Mirrors: state "finished"|"error" → handleBackToHome()
    if m.playerScene <> invalid
        m.playerScene.observeField("state", "onPlayerStateChanged")
    end if

    ' Mirrors: useEffect(() => fetchFeed(feedUrl), [fetchFeed, feedUrl])
    loadContentFeed()
end sub

' Mirrors: async function fetchFeed(url: string)
' Creates LoadFeedTask node and starts it — equivalent to initiating an async fetch
sub loadContentFeed()
    LogInfo(m.logTag, "Creating LoadFeedTask — mirrors async fetchFeed()")

    m.feedTask = CreateObject("roSGNode", "LoadFeedTask")
    if m.feedTask = invalid
        showError("Failed to create LoadFeedTask node")
        return
    end if

    m.feedTask.url = FeedService_GetFeedUrl()

    ' Mirrors: .then(data => setFeedData(data))
    m.feedTask.observeField("content", "onFeedLoaded")
    ' Mirrors: .catch(err => setErrorMsg(err.message))
    m.feedTask.observeField("errorMessage", "onFeedError")

    ' Mirrors: setIsLoading(true)
    if m.loadingOverlay <> invalid then m.loadingOverlay.visible = true

    ' Mirrors: await fetch() — kicks off Task execution in worker thread
    m.feedTask.control = "RUN"
end sub

' Mirrors: .then(data => { setFeedData(data); setIsLoading(false) })
sub onFeedLoaded()
    if m.feedTask = invalid then return
    if m.feedTask.content = invalid then return

    LogInfo(m.logTag, "Feed loaded — setting HomeScene content")

    ' Mirrors: setFeedData(data) → passes ContentNode tree to HomeScene
    if m.homeScene <> invalid
        m.homeScene.content = m.feedTask.content
    end if

    ' Mirrors: setIsLoading(false) + setErrorMsg(null)
    if m.loadingOverlay <> invalid then m.loadingOverlay.visible = false
    if m.errorOverlay <> invalid then m.errorOverlay.visible = false

    ' Initial focus — mirrors: HomeScene receives focus after load
    if m.homeScene <> invalid
        m.homeScene.setFocus(true)
    end if
end sub

' Mirrors: .catch(err => { setErrorMsg(err.message); setIsLoading(false) })
sub onFeedError()
    if m.feedTask = invalid then return
    errMsg = m.feedTask.errorMessage
    if errMsg <> "" and errMsg <> invalid
        showError(errMsg)
    end if
end sub

sub showError(msg as String)
    LogError(m.logTag, "Feed load error: " + msg)
    if m.loadingOverlay <> invalid  then m.loadingOverlay.visible = false
    if m.errorOverlay <> invalid    then m.errorOverlay.visible = true
    if m.errorMessageLabel <> invalid then m.errorMessageLabel.text = msg
end sub

' Mirrors: handleSelectVideo(video) → setSelectedVideo(video) + setCurrentScene('PLAYER')
sub onVideoSelected()
    if m.homeScene = invalid then return
    selectedVideo = m.homeScene.selectedVideo
    if selectedVideo = invalid then return

    LogInfo(m.logTag, "Navigating to PlayerScene: " + selectedVideo.title)

    ' Mirrors: setCurrentScene('PLAYER') — hide HOME, show PLAYER
    m.homeScene.visible  = false
    if m.playerScene <> invalid
        m.playerScene.content  = selectedVideo
        m.playerScene.visible  = true
        m.playerScene.setFocus(true)
    end if
end sub

' Mirrors: state "finished"|"error" → handleBackToHome()
sub onPlayerStateChanged()
    if m.playerScene = invalid then return
    state = m.playerScene.state
    LogInfo(m.logTag, "Player state: " + state)
    if state = "finished" or state = "error"
        navigateToHome()
    end if
end sub

' Mirrors: handleBackToHome() → setCurrentScene('HOME')
sub navigateToHome()
    LogInfo(m.logTag, "Returning to HomeScene — mirrors handleBackToHome()")
    if m.playerScene <> invalid
        m.playerScene.control = "stop"
        m.playerScene.visible = false
    end if
    if m.homeScene <> invalid
        m.homeScene.visible = true
        m.homeScene.setFocus(true)
    end if
end sub

' Mirrors: global keydown listener (Escape/Backspace → back from PLAYER)
function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false
    if key = "back"
        if m.playerScene <> invalid and m.playerScene.visible
            LogInfo(m.logTag, "Back key — navigating to HomeScene")
            navigateToHome()
            return true
        end if
    end if
    return false
end function
`);
}

// ══════════════════════════════════════════════════════════════════════
// HOME SCENE GENERATOR
// src/components/HomeScene.tsx → components/screens/HomeScene.xml + HomeScene.brs
// ══════════════════════════════════════════════════════════════════════

/**
 * HomeScene layout (1920×1080):
 *   Left section  (x:0–1260):   Category header (y:40–120) + RowList grid (y:140–1040)
 *   Right section (x:1300–1840): Spotlight info panel — mirrors lg:col-span-4
 *
 * Mirrors from HomeScene.tsx:
 *   - "Channel Catalog" title + "{N} Titles" badge
 *   - 3-col RowList grid (videos) with VideoRowListItem
 *   - Right panel: focused video title, rating, duration, category, description, artist, play CTA
 */
function generateHomeScene(colors) {
  const purple     = hexToRoku('662D91');
  const purpleGlow = hexToRoku('9E46EA');
  const textWhite  = hexToRoku('FFFFFF');
  const textGray2  = hexToRoku('E5E7EB');
  const textGray4  = hexToRoku('9CA3AF');
  const textGray3  = hexToRoku('D1D5DB');
  const textPurp2  = hexToRoku('DDD6FE');
  const textPurp3  = hexToRoku('C4B5FD');
  const panelBg    = hexToRoku('150F22', '90');
  const darkCard   = hexToRoku('1C152D');

  writeOut('components/screens/HomeScene.xml', `<?xml version="1.0" encoding="utf-8" ?>
<!-- Auto-generated by transpile-roku.js ← src/components/HomeScene.tsx                   -->
<!-- Mirrors: category pills (left header) + 3-col grid (RowList) + spotlight panel (right) -->
<!-- Layout: 1920×1080 / Left col: 0–1270 / Right col: 1300–1840                           -->
<component name="HomeScene" extends="Group">
    <script type="text/brightscript" uri="pkg:/components/screens/HomeScene.brs" />
    <script type="text/brightscript" uri="pkg:/utils/Logger.brs" />

    <interface>
        <!-- Mirrors: videos prop → ContentNode tree from MainScene (LoadFeedTask result) -->
        <field id="content" type="node" onChange="onContentChanged" />
        <!-- Mirrors: onSelectVideo(video) callback → triggers MainScene.handleSelectVideo -->
        <field id="selectedVideo" type="node" />
    </interface>

    <children>
        <!-- ══════════════════════════════════════════════════════
             LEFT SECTION (0–1270px)
             Mirrors: lg:col-span-8 in HomeScene.tsx
             ══════════════════════════════════════════════════════ -->

        <!-- "Channel Catalog" heading — mirrors <h2>Channel Catalog</h2> -->
        <Label id="titleLabel"
               text="Channel Catalog"
               translation="[80, 45]"
               width="420" height="50"
               font="font:LargeBoldSystemFont"
               color="${textGray2}" />

        <!-- "{N} Titles" badge — mirrors text-purple-400 bg-purple-950/60 badge -->
        <Rectangle id="countBadgeBg"
                   translation="[82, 100]"
                   width="100" height="26"
                   color="0x4C1D9550"
                   blendingEnabled="true" />
        <Label id="countBadge"
               text="0 Titles"
               translation="[82, 102]"
               width="100" height="22"
               font="font:SmallBoldSystemFont"
               color="${textPurp3}"
               horizAlign="center" />

        <!-- RowList grid — mirrors 3-col grid of <motion.div> video cards -->
        <!-- itemComponentName mirrors the card component (VideoRowListItem)  -->
        <!-- rowItemSize [300,230] = poster(300×180) + info bar(300×50)       -->
        <RowList
            id="rowList"
            translation="[80, 135]"
            itemSize="[1180, 240]"
            numRows="3"
            rowItemSize="[[300, 230]]"
            rowItemSpacing="[[28, 0]]"
            itemSpacing="[0, 30]"
            itemComponentName="VideoRowListItem"
            rowFocusAnimationStyle="floatingFocus" />

        <!-- ══════════════════════════════════════════════════════
             RIGHT SECTION (1300–1840px): Spotlight / HUD
             Mirrors: lg:col-span-4 info panel in HomeScene.tsx
             ══════════════════════════════════════════════════════ -->

        <!-- Panel background — mirrors bg-[#150f22] border border-[#2d2147] rounded-2xl -->
        <Rectangle id="infoPanelBg"
                   translation="[1300, 35]"
                   width="548" height="1010"
                   color="${panelBg}"
                   blendingEnabled="true" />

        <!-- "Roku Focused Item" badge — mirrors <span><Sparkles/>Roku Focused Item</span> -->
        <Rectangle id="focusedBadgeBg"
                   translation="[1328, 75]"
                   width="210" height="28"
                   color="0x662D9140"
                   blendingEnabled="true" />
        <Label id="focusedBadgeLabel"
               text="● Roku Focused Item"
               translation="[1333, 78]"
               width="200" height="22"
               font="font:SmallBoldSystemFont"
               color="${textPurp3}" />

        <!-- Video ID — mirrors <span className="font-mono">ID: {focusedVideo.id}</span> -->
        <Label id="focusedId"
               text=""
               translation="[1540, 78]"
               width="290" height="22"
               font="font:SmallSystemFont"
               color="${textGray4}"
               horizAlign="right" />

        <!-- Focused video title — mirrors <h1 className="text-2xl font-bold"> -->
        <Label id="focusedTitle"
               text=""
               translation="[1328, 118]"
               width="492" height="90"
               font="font:LargeBoldSystemFont"
               color="${textWhite}"
               wrap="true" />

        <!-- Metadata row — mirrors rating + Clock + releaseDate + category badges -->
        <Label id="focusedRating"
               text=""
               translation="[1328, 220]"
               width="70" height="26"
               font="font:SmallBoldSystemFont"
               color="${textPurp2}" />
        <Label id="focusedDuration"
               text=""
               translation="[1408, 220]"
               width="120" height="26"
               font="font:SmallSystemFont"
               color="${textGray4}" />
        <Label id="focusedCategory"
               text=""
               translation="[1538, 220]"
               width="240" height="26"
               font="font:SmallSystemFont"
               color="${textPurp3}" />

        <!-- Description — mirrors <p className="text-gray-300 text-xs line-clamp-6"> -->
        <Label id="focusedDesc"
               text=""
               translation="[1328, 262]"
               width="492" height="216"
               font="font:SmallSystemFont"
               color="${textGray3}"
               wrap="true" />

        <!-- Artist / Studio section — mirrors artist card block -->
        <Rectangle id="artistBg"
                   translation="[1328, 498]"
                   width="492" height="62"
                   color="${darkCard}"
                   visible="false" />
        <Label id="artistSectionLabel"
               text="Creator / Studio"
               translation="[1344, 503]"
               width="460" height="18"
               font="font:SmallBoldSystemFont"
               color="${textPurp3}"
               visible="false" />
        <Label id="artistName"
               text=""
               translation="[1344, 523]"
               width="460" height="24"
               font="font:SmallBoldSystemFont"
               color="${textGray2}"
               visible="false" />

        <!-- Divider — mirrors border-t border-[#2a1d42] -->
        <Rectangle id="divider"
                   translation="[1328, 580]"
                   width="492" height="2"
                   color="0x2A1D42FF" />

        <!-- Play CTA — mirrors <button onClick={onSelectVideo}>▶ Play Stream (Press OK)</button> -->
        <Rectangle id="playBtnBg"
                   translation="[1328, 602]"
                   width="492" height="68"
                   color="${purple}" />
        <Label id="playBtnLabel"
               text="▶  Play Stream  (Press OK / Enter)"
               translation="[1328, 618]"
               width="492" height="36"
               font="font:MediumBoldSystemFont"
               color="${textWhite}"
               horizAlign="center" />

        <!-- Hint — mirrors "Press Enter or OK on remote to start playback" -->
        <Label id="playHint"
               text="Press OK on remote to start playback"
               translation="[1328, 682]"
               width="492" height="28"
               font="font:SmallSystemFont"
               color="${textGray4}"
               horizAlign="center" />
    </children>
</component>
`);

  writeOut('components/screens/HomeScene.brs', `' Auto-generated by transpile-roku.js ← src/components/HomeScene.tsx
' Mirrors: RowList grid + right spotlight info panel + focus tracking
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile
'
' React concept              → BrightScript equivalent
' ──────────────────────────────────────────────────────────────────────
' videos prop                → RowList.content (ContentNode tree)
' focusedIndex state         → rowItemFocused (RowList native, fires observer)
' focusedVideo (useMemo)     → updateSpotlight() called on rowItemFocused change
' onSelectVideo(video)       → m.top.selectedVideo = node (observeField in MainScene)
' playbackHistory            → (future: roRegistry)
' categories / category pills → (future: LabelList above RowList)

sub init()
    m.logTag = "HomeScene"
    LogInfo(m.logTag, "Initializing HomeScene")

    m.rowList          = m.top.findNode("rowList")
    m.countBadge       = m.top.findNode("countBadge")
    m.focusedTitle     = m.top.findNode("focusedTitle")
    m.focusedDesc      = m.top.findNode("focusedDesc")
    m.focusedRating    = m.top.findNode("focusedRating")
    m.focusedDuration  = m.top.findNode("focusedDuration")
    m.focusedCategory  = m.top.findNode("focusedCategory")
    m.focusedId        = m.top.findNode("focusedId")
    m.artistBg         = m.top.findNode("artistBg")
    m.artistSectionLabel = m.top.findNode("artistSectionLabel")
    m.artistName       = m.top.findNode("artistName")

    if m.rowList <> invalid
        ' Mirrors: onClick / onMouseEnter → select / focus
        m.rowList.observeField("rowItemSelected", "onItemSelected")
        ' Mirrors: setFocusedIndex(idx) on hover/d-pad → right panel update
        m.rowList.observeField("rowItemFocused", "onRowItemFocused")
    end if
end sub

' Mirrors: useEffect on videos prop change → populate RowList grid
' Called when MainScene sets homeScene.content after feed loads
sub onContentChanged()
    if m.top.content = invalid then return
    if m.rowList = invalid then return

    LogInfo(m.logTag, "Content received — populating RowList")
    m.rowList.content = m.top.content

    ' Count badge — mirrors "{videos.length} Titles"
    firstRow = m.top.content.getChild(0)
    if firstRow <> invalid and m.countBadge <> invalid
        count = firstRow.getChildCount()
        m.countBadge.text = count.toStr() + " Titles"
    end if

    ' Initial spotlight + focus — mirrors initial focusedIndex = 0
    m.rowList.setFocus(true)
    updateSpotlight([0, 0])
end sub

' Mirrors: setFocusedIndex(idx) — right panel spotlight update on d-pad move
sub onRowItemFocused()
    if m.rowList = invalid then return
    pos = m.rowList.rowItemFocused
    if pos <> invalid
        updateSpotlight(pos)
    end if
end sub

' Update spotlight panel with the currently focused video
' Mirrors: all the focusedVideo rendering in the lg:col-span-4 section of HomeScene.tsx
sub updateSpotlight(itemPos as Object)
    if m.top.content = invalid then return

    rowNode = m.top.content.getChild(itemPos[0])
    if rowNode = invalid then return

    video = rowNode.getChild(itemPos[1])
    if video = invalid then return

    ' Title — mirrors <h1>{focusedVideo.title}</h1>
    if m.focusedTitle <> invalid
        m.focusedTitle.text = video.title
    end if

    ' ID — mirrors "ID: {focusedVideo.id}"
    if m.focusedId <> invalid
        m.focusedId.text = "ID: " + video.id.toStr()
    end if

    ' Description — mirrors <p>{focusedVideo.description}</p>
    if m.focusedDesc <> invalid
        if video.description <> invalid and video.description <> ""
            m.focusedDesc.text = video.description
        else
            m.focusedDesc.text = "No description available."
        end if
    end if

    ' Rating — mirrors rating badge
    if m.focusedRating <> invalid
        if video.ratingValue <> invalid and video.ratingValue <> ""
            m.focusedRating.text = video.ratingValue
        else
            m.focusedRating.text = "G"
        end if
    end if

    ' Duration — mirrors formatDuration(focusedVideo.duration)
    if m.focusedDuration <> invalid
        dur = 0
        if video.length <> invalid then dur = video.length
        mins = int(dur / 60)
        secs = dur mod 60
        secsPrefix = ""
        if secs < 10 then secsPrefix = "0"
        m.focusedDuration.text = mins.toStr() + ":" + secsPrefix + secs.toStr()
    end if

    ' Category — mirrors category badge
    if m.focusedCategory <> invalid
        cat = ""
        if video.categories <> invalid and video.categories <> ""
            cat = video.categories
        else
            cat = "General"
        end if
        m.focusedCategory.text = cat
    end if

    ' Artist / Studio — mirrors artist card (conditionally visible)
    hasArtist = video.actors <> invalid and video.actors <> ""
    if m.artistBg <> invalid        then m.artistBg.visible = hasArtist
    if m.artistSectionLabel <> invalid then m.artistSectionLabel.visible = hasArtist
    if m.artistName <> invalid
        m.artistName.visible = hasArtist
        if hasArtist then m.artistName.text = video.actors
    end if
end sub

' Mirrors: onClick → onSelectVideo(video)
sub onItemSelected()
    if m.rowList = invalid or m.rowList.content = invalid then return
    pos = m.rowList.rowItemSelected
    if pos = invalid then return

    rowNode = m.rowList.content.getChild(pos[0])
    if rowNode = invalid then return

    video = rowNode.getChild(pos[1])
    if video = invalid then return

    LogInfo(m.logTag, "Video selected: " + video.title)
    ' Mirrors: onSelectVideo(video) → triggers MainScene.handleSelectVideo via observeField
    m.top.selectedVideo = video
end sub
`);
}

// ══════════════════════════════════════════════════════════════════════
// PLAYER SCENE GENERATOR
// src/components/PlayerScene.tsx → components/screens/PlayerScene.xml + PlayerScene.brs
// ══════════════════════════════════════════════════════════════════════

/**
 * PlayerScene layout (1920×1080):
 *   Video node (full screen)
 *   OSD overlay (top bar + bottom controls) — visible when showOSD or paused
 *
 * Mirrors from PlayerScene.tsx:
 *   - HTML5 <video> → Roku Video node
 *   - Top bar: back button + video title
 *   - Bottom bar: progress track/fill + elapsed/remaining + rewind/play/fwd buttons
 *   - Center: big pause indicator when paused
 *   - OSD auto-hides after 4s (AUTO_HIDE_OSD_MS) when playing
 */
function generatePlayerScene(colors) {
  const purple   = hexToRoku('662D91');
  const btnBg    = hexToRoku('2D2442');
  const osdPanBg = hexToRoku('100C19', '90');
  const topBarBg = hexToRoku('1A1426', 'D0');
  const trackBg  = hexToRoku('4C1D95', '80');
  const fillClr  = hexToRoku('9E46EA');
  const textWh   = hexToRoku('FFFFFF');
  const textGr   = hexToRoku('D1D5DB');
  const textGr4  = hexToRoku('9CA3AF');

  writeOut('components/screens/PlayerScene.xml', `<?xml version="1.0" encoding="utf-8" ?>
<!-- Auto-generated by transpile-roku.js ← src/components/PlayerScene.tsx             -->
<!-- Mirrors: full-screen Video node + OSD overlay (top bar + timeline + controls)     -->
<!-- OSD auto-hides after 4s (AUTO_HIDE_OSD_MS) when playing — mirrors resetOSDTimer  -->
<component name="PlayerScene" extends="Group">
    <script type="text/brightscript" uri="pkg:/components/screens/PlayerScene.brs" />
    <script type="text/brightscript" uri="pkg:/utils/Logger.brs" />
    <script type="text/brightscript" uri="pkg:/utils/Constants.brs" />

    <interface>
        <!-- Mirrors: video prop { title, url, thumbnail, ... } -->
        <field id="content" type="node" onChange="onContentChanged" />
        <!-- Aliases bubble Video node state/control to parent (MainScene) -->
        <field id="state"   type="string" alias="videoPlayer.state" />
        <field id="control" type="string" alias="videoPlayer.control" />
    </interface>

    <children>
        <!-- ═══════════════════════════════════════════════════
             VIDEO NODE — mirrors <video ref={videoRef} src={url}>
             Full 1920×1080 playback
             ═══════════════════════════════════════════════════ -->
        <Video id="videoPlayer" width="1920" height="1080" focusable="true" />

        <!-- ═══════════════════════════════════════════════════
             OSD — mirrors: showOSD || !isPlaying conditional
             Top gradient + bottom gradient for readability
             ═══════════════════════════════════════════════════ -->

        <!-- Top scrim — mirrors from-black/80 in top gradient -->
        <Rectangle id="topScrim"
                   width="1920" height="180"
                   translation="[0, 0]"
                   color="0x000000CC"
                   blendingEnabled="true"
                   visible="false" />

        <!-- Bottom scrim — mirrors bottom portion of gradient -->
        <Rectangle id="bottomScrim"
                   width="1920" height="280"
                   translation="[0, 800]"
                   color="0x000000CC"
                   blendingEnabled="true"
                   visible="false" />

        <!-- Back button — mirrors <button onClick={onBack}>◀ Back to Home (Esc)</button> -->
        <Rectangle id="backBtnBg"
                   translation="[48, 44]"
                   width="260" height="52"
                   color="${topBarBg}"
                   blendingEnabled="true"
                   visible="false" />
        <Label id="backBtnLabel"
               text="◀  Back to Home"
               translation="[58, 56]"
               width="240" height="30"
               font="font:SmallBoldSystemFont"
               color="${textWh}"
               visible="false" />

        <!-- Video title (top right) — mirrors <h1>{video.title}</h1> at top right -->
        <Label id="osdTitle"
               text=""
               translation="[820, 50]"
               width="1052" height="50"
               font="font:LargeBoldSystemFont"
               color="${textWh}"
               horizAlign="right"
               visible="false" />

        <!-- OSD bottom panel — mirrors bg-[#100c19]/90 rounded-2xl control bar -->
        <Rectangle id="osdPanel"
                   translation="[48, 820]"
                   width="1824" height="220"
                   color="${osdPanBg}"
                   blendingEnabled="true"
                   visible="false" />

        <!-- Progress bar track — mirrors <input type="range" className="accent-[#9e46ea]"> -->
        <Rectangle id="progressTrack"
                   translation="[72, 840]"
                   width="1776" height="6"
                   color="${trackBg}"
                   blendingEnabled="true"
                   visible="false" />

        <!-- Progress fill — mirrors width: \`\${(currentTime/duration)*100}%\` -->
        <Rectangle id="progressFill"
                   translation="[72, 840]"
                   width="0" height="6"
                   color="${fillClr}"
                   visible="false" />

        <!-- Progress scrubber handle dot -->
        <Rectangle id="progressHandle"
                   translation="[66, 835]"
                   width="18" height="18"
                   color="${purple}"
                   visible="false" />

        <!-- Elapsed time — mirrors formatTime(currentTime) -->
        <Label id="timeElapsed"
               text="0:00"
               translation="[72, 855]"
               width="130" height="30"
               font="font:SmallBoldSystemFont"
               color="${textGr}"
               visible="false" />

        <!-- Remaining time — mirrors "-" + formatTime(duration - currentTime) -->
        <Label id="timeRemaining"
               text="-0:00"
               translation="[1718, 855]"
               width="130" height="30"
               font="font:SmallBoldSystemFont"
               color="${textGr}"
               horizAlign="right"
               visible="false" />

        <!-- Rewind -10s — mirrors <button onClick={() => handleSeekRelative(-10)}> -->
        <Rectangle id="rewindBg"
                   translation="[72, 898]"
                   width="100" height="52"
                   color="${btnBg}"
                   visible="false" />
        <Label id="rewindLabel"
               text="◀◀ -10s"
               translation="[74, 912]"
               width="96" height="26"
               font="font:SmallBoldSystemFont"
               color="0xE9D5FFFF"
               horizAlign="center"
               visible="false" />

        <!-- Play/Pause — mirrors <button onClick={togglePlayPause}> -->
        <Rectangle id="playPauseBg"
                   translation="[192, 892]"
                   width="180" height="64"
                   color="${purple}"
                   visible="false" />
        <Label id="playPauseLabel"
               text="▶  Play"
               translation="[192, 911]"
               width="180" height="30"
               font="font:MediumBoldSystemFont"
               color="${textWh}"
               horizAlign="center"
               visible="false" />

        <!-- Fast Forward +10s — mirrors <button onClick={() => handleSeekRelative(10)}> -->
        <Rectangle id="fwdBg"
                   translation="[392, 898]"
                   width="100" height="52"
                   color="${btnBg}"
                   visible="false" />
        <Label id="fwdLabel"
               text="+10s ▶▶"
               translation="[394, 912]"
               width="96" height="26"
               font="font:SmallBoldSystemFont"
               color="0xE9D5FFFF"
               horizAlign="center"
               visible="false" />

        <!-- Center paused indicator — mirrors the big Play button when !isPlaying && !hasError -->
        <Rectangle id="pauseIndicatorBg"
                   translation="[860, 400]"
                   width="200" height="200"
                   color="${purple}"
                   visible="false" />
        <Label id="pauseIndicatorIcon"
               text="▶"
               translation="[870, 425]"
               width="180" height="150"
               font="font:LargeBoldSystemFont"
               color="${textWh}"
               horizAlign="center"
               vertAlign="center"
               visible="false" />

        <!-- OSD timer node — mirrors osdTimerRef (setTimeout 4000ms) -->
        <Timer id="osdTimer" duration="4" repeat="false" />
    </children>
</component>
`);

  writeOut('components/screens/PlayerScene.brs', `' Auto-generated by transpile-roku.js ← src/components/PlayerScene.tsx
' Mirrors: HTML5 Video + OSD overlay with auto-hide timer + playback controls
' DO NOT EDIT — edit the TypeScript source and re-run: npm run transpile
'
' React concept              → BrightScript equivalent
' ──────────────────────────────────────────────────────────────────────────
' useRef<HTMLVideoElement>   → m.top.findNode("videoPlayer")
' isPlaying state            → videoPlayer.state ("playing"/"paused")
' showOSD state + timer      → m.osdTimer (Timer node, 4s) + setOsdVisible()
' currentTime state          → videoPlayer.position (observe)
' duration state             → videoPlayer.duration / m.totalDuration
' handleLoadedMetadata       → onVideoState() → "readyToPlay" / "playing"
' togglePlayPause()          → videoPlayer.control = "play" | "pause"
' handleSeekRelative(s)      → videoPlayer.seek = position + s
' handleVideoError()         → onVideoState() → "error"
' FALLBACK_MIRRORS           → not implemented (Roku handles stream errors natively)
' AUTO_HIDE_OSD_MS = 4000    → osdTimer.duration = 4

sub init()
    m.logTag = "PlayerScene"
    LogInfo(m.logTag, "Initializing PlayerScene")

    m.videoPlayer     = m.top.findNode("videoPlayer")
    m.osdTitle        = m.top.findNode("osdTitle")
    m.progressFill    = m.top.findNode("progressFill")
    m.progressHandle  = m.top.findNode("progressHandle")
    m.timeElapsed     = m.top.findNode("timeElapsed")
    m.timeRemaining   = m.top.findNode("timeRemaining")
    m.playPauseLabel  = m.top.findNode("playPauseLabel")
    m.pauseIndicatorBg   = m.top.findNode("pauseIndicatorBg")
    m.pauseIndicatorIcon = m.top.findNode("pauseIndicatorIcon")
    m.osdTimer        = m.top.findNode("osdTimer")

    m.totalDuration   = 0.0
    m.osdVisible      = true

    if m.videoPlayer <> invalid
        ' Mirrors: onTimeUpdate → progress bar update
        m.videoPlayer.observeField("position", "onVideoPosition")
        ' Mirrors: handleLoadedMetadata + handleVideoError + onEnded state handlers
        m.videoPlayer.observeField("state", "onVideoState")
    end if

    if m.osdTimer <> invalid
        ' Mirrors: setTimeout(() => setShowOSD(false), AUTO_HIDE_OSD_MS)
        m.osdTimer.observeField("fire", "onOsdTimerFired")
    end if
end sub

' Mirrors: useEffect on video prop + autoplay logic
sub onContentChanged()
    if m.top.content = invalid then return
    if m.videoPlayer = invalid then return

    video = m.top.content
    LogInfo(m.logTag, "PlayerScene content: " + video.title)

    ' Set OSD title — mirrors <h1>{video.title}</h1>
    if m.osdTitle <> invalid then m.osdTitle.text = video.title

    ' Build Video node ContentNode — mirrors configuring <video src= poster=>
    videoContent = CreateObject("roSGNode", "ContentNode")
    videoContent.url          = video.url
    videoContent.streamFormat = "mp4"
    videoContent.title        = video.title
    if video.HDPosterUrl <> invalid then videoContent.HDPosterUrl = video.HDPosterUrl

    m.videoPlayer.content = videoContent

    ' Mirrors: videoRef.current.play() in handleLoadedMetadata
    m.videoPlayer.control = "play"
    m.videoPlayer.setFocus(true)

    ' Show OSD initially then start auto-hide timer
    showOsd()
end sub

' Mirrors: handleTimeUpdate → setCurrentTime(cur) → progress bar + time labels
sub onVideoPosition()
    if m.videoPlayer = invalid then return

    pos = m.videoPlayer.position
    dur = m.videoPlayer.duration
    if dur = invalid or dur <= 0 then return
    if m.totalDuration <= 0 then m.totalDuration = dur

    ' Progress fill width — mirrors width: \`\${(currentTime/duration)*100}%\`
    progress  = pos / dur
    fillWidth = int(1776 * progress)
    if m.progressFill <> invalid    then m.progressFill.width = fillWidth
    if m.progressHandle <> invalid  then m.progressHandle.translation = [66 + fillWidth, 835]

    ' Time labels — mirrors formatTime(currentTime) / formatTime(duration - currentTime)
    if m.timeElapsed <> invalid   then m.timeElapsed.text   = fmtSec(pos)
    if m.timeRemaining <> invalid then m.timeRemaining.text = "-" + fmtSec(dur - pos)
end sub

' Mirrors: state change handlers (readyToPlay→autoplay, playing, paused, finished, error)
sub onVideoState()
    if m.videoPlayer = invalid then return
    state = m.videoPlayer.state
    LogInfo(m.logTag, "Video state: " + state)

    if state = "playing"
        ' Mirrors: setIsPlaying(true) + hide pause indicator
        if m.playPauseLabel <> invalid then m.playPauseLabel.text = "⏸  Pause"
        if m.pauseIndicatorBg   <> invalid then m.pauseIndicatorBg.visible = false
        if m.pauseIndicatorIcon <> invalid then m.pauseIndicatorIcon.visible = false
        startOsdTimer()

    else if state = "paused"
        ' Mirrors: setIsPlaying(false) + show center Play button
        if m.playPauseLabel <> invalid then m.playPauseLabel.text = "▶  Play"
        if m.pauseIndicatorBg   <> invalid then m.pauseIndicatorBg.visible = true
        if m.pauseIndicatorIcon <> invalid then m.pauseIndicatorIcon.visible = true
        showOsd()

    else if state = "finished"
        ' Mirrors: onEnded → setIsPlaying(false) + showOSD(true)
        LogInfo(m.logTag, "Playback finished — mirrors onEnded handler")
        if m.pauseIndicatorBg   <> invalid then m.pauseIndicatorBg.visible = false
        if m.pauseIndicatorIcon <> invalid then m.pauseIndicatorIcon.visible = false
        showOsd()

    else if state = "error"
        ' Mirrors: handleVideoError — show OSD (Roku shows error message natively)
        LogError(m.logTag, "Video playback error")
        showOsd()
    end if
end sub

' Mirrors: setTimeout callback → setShowOSD(false) when still playing
sub onOsdTimerFired()
    if m.videoPlayer <> invalid and m.videoPlayer.state = "playing"
        hideOsd()
    end if
end sub

sub showOsd()
    m.osdVisible = true
    setOsdNodes(true)
    startOsdTimer()
end sub

sub hideOsd()
    m.osdVisible = false
    setOsdNodes(false)
end sub

sub startOsdTimer()
    if m.osdTimer <> invalid
        m.osdTimer.control = "stop"
        m.osdTimer.control = "start"
    end if
end sub

' Toggle all OSD nodes — mirrors opacity transition on the OSD container div
sub setOsdNodes(visible as Boolean)
    ids = ["topScrim", "bottomScrim", "backBtnBg", "backBtnLabel", "osdTitle",
           "osdPanel", "progressTrack", "progressFill", "progressHandle",
           "timeElapsed", "timeRemaining",
           "rewindBg", "rewindLabel", "playPauseBg", "playPauseLabel",
           "fwdBg", "fwdLabel"]
    for each nodeId in ids
        n = m.top.findNode(nodeId)
        if n <> invalid then n.visible = visible
    end for
end sub

' Mirrors: formatTime(secs) in PlayerScene.tsx
function fmtSec(secs as Float) as String
    if secs < 0 then secs = 0
    mins = int(secs / 60)
    s = int(secs) mod 60
    secsPrefix = ""
    if s < 10 then secsPrefix = "0"
    return mins.toStr() + ":" + secsPrefix + s.toStr()
end function

' Mirrors: global keydown listener (Space/OK → play/pause, ◄/► → seek, Esc/Back → navigate)
function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false

    ' Any key press shows OSD — mirrors onMouseMove/onClick → resetOSDTimer
    showOsd()

    if key = "play" or key = "pause" or key = "OK"
        ' Mirrors: togglePlayPause()
        if m.videoPlayer <> invalid
            ctrl = "play"
            if m.videoPlayer.state = "playing" then ctrl = "pause"
            m.videoPlayer.control = ctrl
            LogInfo(m.logTag, "Toggle play/pause → " + ctrl)
        end if
        return true

    else if key = "left" or key = "rewind"
        ' Mirrors: handleSeekRelative(-10)
        if m.videoPlayer <> invalid
            newPos = m.videoPlayer.position - 10
            if newPos < 0 then newPos = 0
            m.videoPlayer.seek = newPos
            LogInfo(m.logTag, "Seek -10s → " + newPos.toStr())
        end if
        return true

    else if key = "right" or key = "fastForward"
        ' Mirrors: handleSeekRelative(10)
        if m.videoPlayer <> invalid
            newPos = m.videoPlayer.position + 10
            if m.totalDuration > 0 and newPos > m.totalDuration - 1
                newPos = m.totalDuration - 1
            end if
            m.videoPlayer.seek = newPos
            LogInfo(m.logTag, "Seek +10s → " + newPos.toStr())
        end if
        return true

    else if key = "back"
        ' Mirrors: Escape/Backspace → onBack() (handled by MainScene.onKeyEvent)
        return false
    end if

    return false
end function
`);
}

// ══════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ══════════════════════════════════════════════════════════════════════

export async function transpileRoku() {
  console.log('\n🎬  Roku SceneGraph Transpiler');
  console.log('     src/ (TypeScript/React) → Roku BRS + XML');
  console.log('─'.repeat(60));

  // Extract colors from TSX source files for precise color matching
  let mainColors = {}, homeColors = {}, playerColors = {};
  try {
    const mainTsx   = readSrc('components/MainScene.tsx');
    const homeTsx   = readSrc('components/HomeScene.tsx');
    const playerTsx = readSrc('components/PlayerScene.tsx');
    mainColors   = extractColors(mainTsx);
    homeColors   = { ...mainColors, ...extractColors(homeTsx) };
    playerColors = { ...mainColors, ...extractColors(playerTsx) };
  } catch (e) {
    console.warn('⚠️   TSX color extraction skipped — using defaults');
  }

  console.log('\n  📦  Utility layer  (src/utils/*.ts → utils/*.brs)');
  generateConstants();
  generateConfig();
  generateLogger();

  console.log('\n  📦  Service layer  (src/services/*.ts → services/*.brs)');
  generateFeedService();
  generateFeedParser();

  console.log('\n  📦  Model layer  (src/types.ts → models/*.brs)');
  generateVideoModel();

  console.log('\n  📦  Task layer  (fetchFeed async → Task node)');
  generateLoadFeedTask();

  console.log('\n  📦  Item renderer  (HomeScene.tsx card → VideoRowListItem)');
  generateVideoRowListItem();

  console.log('\n  📦  Component layer  (src/components/*.tsx → components/**)');
  generateMainScene(mainColors);
  generateHomeScene(homeColors);
  generatePlayerScene(playerColors);

  console.log('\n' + '─'.repeat(60));
  console.log('  ✅  Transpilation complete — all Roku files regenerated from src/');
  console.log('      Run: npm run package:roku  to build roku-channel.zip\n');
}

// Direct execution
const isMain = process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  transpileRoku().catch(err => {
    console.error('❌  Transpiler error:', err.message || err);
    process.exit(1);
  });
}
