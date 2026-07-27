' FeedParser.brs
' Parses the JSON feed and builds a ContentNode tree for RowList.
' Row 0: "All" -- todos os itens
' Row 1..N: uma linha por categoria (Wartime, Comedy, Classic, etc.)
' Cada item e normalizado individualmente por linha (ContentNode nao pode ser compartilhado).

' ------------------------------------------------------------------
' Fallback stream URLs used when an item has no valid stream URL.
' ------------------------------------------------------------------
function FeedParser_FallbackStreams() as Object
    return [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    ]
end function

' ------------------------------------------------------------------
' FeedParser_GetCategory
' Reads the category string from a raw JSON item.
' ------------------------------------------------------------------
function FeedParser_GetCategory(item as Object) as String
    if item.category <> invalid and item.category <> ""
        return item.category.toStr()
    end if
    if item.Genre <> invalid and item.Genre <> ""
        parts = item.Genre.split(",")
        if parts.count() > 0 then return parts[0]
    end if
    if item.genre <> invalid and item.genre <> ""
        return item.genre.toStr()
    end if
    return "General"
end function

' ------------------------------------------------------------------
' FeedParser_Parse -- main entry point
' Returns: ContentNode tree (rootNode -> rowNode[] -> itemNode[])
' ------------------------------------------------------------------
function FeedParser_Parse(jsonString as String) as Object
    logTag = "FeedParser"
    LogInfo(logTag, "Parsing feed")

    rootNode = CreateObject("roSGNode", "ContentNode")

    json = ParseJson(jsonString)
    if json = invalid
        LogError(logTag, "ParseJson failed")
        return rootNode
    end if

    items = []

    ' Format: root-level array
    if type(json) = "roArray"
        items = json

    ' Format: { "videos": [...] } or Roku Content Feed
    else if type(json) = "roAssociativeArray"
        if json.videos <> invalid and type(json.videos) = "roArray"
            items = json.videos
        else if json.movie <> invalid or json.shortFormVideos <> invalid or json.tvSpecial <> invalid
            if json.movie <> invalid and type(json.movie) = "roArray"
                for each it in json.movie
                    items.Push(it)
                end for
            end if
            if json.shortFormVideos <> invalid and type(json.shortFormVideos) = "roArray"
                for each it in json.shortFormVideos
                    items.Push(it)
                end for
            end if
            if json.tvSpecial <> invalid and type(json.tvSpecial) = "roArray"
                for each it in json.tvSpecial
                    items.Push(it)
                end for
            end if
        else
            ' Fallback: find first array key
            for each key in json
                if type(json[key]) = "roArray"
                    items = json[key]
                    exit for
                end if
            end for
        end if
    end if

    LogInfo(logTag, "Items: " + items.count().toStr())
    fallbacks = FeedParser_FallbackStreams()

    ' ---------------------------------------------------------------
    ' Row 0: "All" -- todos os itens
    ' ---------------------------------------------------------------
    todosRow = rootNode.createChild("ContentNode")
    todosRow.title = "All"

    i = 0
    while i < items.count()
        item = items[i]
        if item <> invalid
            node = FeedParser_NormalizeItem(item, i, fallbacks)
            if node <> invalid
                todosRow.appendChild(node)
            end if
        end if
        i = i + 1
    end while

    ' ---------------------------------------------------------------
    ' Rows 1..N: one row per category
    ' categoryMap: cat -> [item indices into items[]]
    ' ---------------------------------------------------------------
    categoryOrder = []
    categoryMap   = {}

    i = 0
    while i < items.count()
        item = items[i]
        if item <> invalid
            cat = FeedParser_GetCategory(item)
            if categoryMap[cat] = invalid
                categoryMap[cat] = []
                categoryOrder.Push(cat)
            end if
            categoryMap[cat].Push(i)
        end if
        i = i + 1
    end while

    for each cat in categoryOrder
        catRow = rootNode.createChild("ContentNode")
        catRow.title = cat
        idxArr = categoryMap[cat]
        for each idx in idxArr
            srcItem = items[idx]
            if srcItem <> invalid
                ' Re-normalize: ContentNode children cannot be shared between rows
                node = FeedParser_NormalizeItem(srcItem, idx, fallbacks)
                if node <> invalid
                    catRow.appendChild(node)
                end if
            end if
        end for
    end for

    LogInfo(logTag, "Rows: " + rootNode.getChildCount().toStr())
    return rootNode
end function

' ------------------------------------------------------------------
' FeedParser_NormalizeItem
' Maps one raw JSON item to a ContentNode with standard fields.
' ------------------------------------------------------------------
function FeedParser_NormalizeItem(item as Object, idx as Integer, fallbacks as Object) as Object
    node = CreateObject("roSGNode", "ContentNode")

    ' id
    if item.id <> invalid
        node.id = item.id.toStr()
    else if item.imdbID <> invalid
        node.id = item.imdbID.toStr()
    else
        node.id = "vid-" + (idx + 1).toStr()
    end if

    ' title
    if item.title <> invalid and item.title <> ""
        node.title = item.title
    else if item.Title <> invalid and item.Title <> ""
        node.title = item.Title
    else if item.name <> invalid and item.name <> ""
        node.title = item.name
    else
        node.title = "Video #" + (idx + 1).toStr()
    end if

    ' HDPosterUrl -- thumbnail field from the feed
    if item.thumbnail <> invalid and item.thumbnail <> ""
        node.HDPosterUrl = item.thumbnail
    else if item.poster <> invalid and item.poster <> ""
        node.HDPosterUrl = item.poster
    else if item.Poster <> invalid and item.Poster <> ""
        node.HDPosterUrl = item.Poster
    else if item.imageUrl <> invalid and item.imageUrl <> ""
        node.HDPosterUrl = item.imageUrl
    else
        node.HDPosterUrl = "https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=400"
    end if

    ' Stream URL
    if item.url <> invalid and item.url <> ""
        node.url = item.url
    else if item.streamUrl <> invalid and item.streamUrl <> ""
        node.url = item.streamUrl
    else if item.contentUrl <> invalid and item.contentUrl <> ""
        node.url = item.contentUrl
    else if item.content <> invalid and type(item.content) = "roAssociativeArray"
        if item.content.videos <> invalid and type(item.content.videos) = "roArray"
            if item.content.videos.count() > 0
                node.url = item.content.videos[0].url.toStr()
            end if
        else if item.content.url <> invalid
            node.url = item.content.url.toStr()
        end if
    end if

    if node.url = invalid or node.url = ""
        node.url = fallbacks[idx mod fallbacks.count()]
    end if

    node.streamFormat = "mp4"

    ' description
    if item.description <> invalid and item.description <> ""
        node.description = item.description
    else if item.shortDescription <> invalid and item.shortDescription <> ""
        node.description = item.shortDescription
    else if item.Plot <> invalid and item.Plot <> ""
        node.description = item.Plot
    else
        node.description = "Sem sinopse disponivel."
    end if

    ' length (seconds)
    if item.duration <> invalid
        if type(item.duration) = "roInteger"
            node.length = item.duration
        else if type(item.duration) = "roFloat"
            node.length = Int(item.duration)
        else
            node.length = 120
        end if
    else
        node.length = 120
    end if

    ' categories array (derived from single category field)
    cat = FeedParser_GetCategory(item)
    node.categories = [cat]

    ' rating
    ratingVal = "NR"
    if item.rating <> invalid and item.rating <> ""
        if type(item.rating) = "roAssociativeArray"
            if item.rating.rating <> invalid
                ratingVal = item.rating.rating.toStr()
            end if
        else
            ratingVal = item.rating.toStr()
        end if
    else if item.Rated <> invalid and item.Rated <> ""
        ratingVal = item.Rated.toStr()
    end if
    node.rating = ratingVal

    ' releaseDate
    if item.releaseDate <> invalid and item.releaseDate <> ""
        node.releaseDate = item.releaseDate.toStr()
    else if item.Year <> invalid
        node.releaseDate = item.Year.toStr()
    else if item.Released <> invalid
        node.releaseDate = item.Released.toStr()
    end if

    return node
end function
