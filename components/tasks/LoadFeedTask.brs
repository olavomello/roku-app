' LoadFeedTask.brs
' Task node: busca o feed JSON via HTTP e repassa para o FeedParser.

sub init()
    m.top.functionName = "executeTask"
end sub

' Mirrors: async function fetchFeed(url: string): Promise<void>
sub executeTask()
    logTag = "LoadFeedTask"
    LogInfo(logTag, "Executing LoadFeedTask -- URL: " + m.top.url)

    url = m.top.url
    jsonString = ""

    ' Mirrors: if (!targetUrl || targetUrl === 'local' || local path)
    '          -> return SAMPLE_FEED_DATA (ReadAsciiFile for pkg: paths)
    ' Mirrors: await fetch(targetUrl, { headers: { Accept: application/json } })
    '          -> roUrlTransfer.GetToString()
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

    ' Mirrors: if (!response.ok) throw new Error(`HTTP ${status}`)
    if jsonString = "" or jsonString = invalid
        errMsg = "Failed to read feed from: " + url
        LogError(logTag, errMsg)
        m.top.errorMessage = errMsg
        return
    end if

    ' Mirrors: const parsedFeed = FeedParser.parseFeed(json)
    LogInfo(logTag, "Feed fetched -- passing to FeedParser_Parse")
    parsed = FeedParser_Parse(jsonString)

    if parsed = invalid
        errMsg = "FeedParser returned invalid result"
        LogError(logTag, errMsg)
        m.top.errorMessage = errMsg
        return
    end if

    ' Mirrors: setFeedData(parsedFeed) -- fires onFeedLoaded observer in MainScene
    m.top.content = parsed
    LogInfo(logTag, "Task complete -- content node set, observer will fire")
end sub
