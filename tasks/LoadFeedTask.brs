' Objective: Asynchronous HTTP Network Task Node
' Responsibilities: Fetch feed JSON payload off the render thread and parse into ContentNodes

sub init()
    m.top.functionName = "executeTask"
end sub

sub executeTask()
    log = Logger("LoadFeedTask")
    log.info("Executing LoadFeedTask for URL: " + m.top.url)

    url = m.top.url
    jsonString = ""

    if url.left(4) = "http"
        http = CreateObject("roUrlTransfer")
        http.SetCertificatesFile("common:/certs/ca-bundle.crt")
        http.InitClientCertificates()
        http.SetUrl(url)
        jsonString = http.GetToString()
    else
        jsonString = ReadAsciiFile(url)
    end if

    if jsonString <> ""
        log.info("Feed fetched successfully. Parsing JSON.")
        m.top.content = FeedParser_Parse(jsonString)
    else
        log.error("Failed to read feed from source: " + url)
        m.top.content = invalid
    end if
end sub
