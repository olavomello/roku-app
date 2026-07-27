' FeedService.brs -- servico de feed do canal
' Retorna a URL do feed: remota (HTTP) ou local (pkg:)
function FeedService_GetFeedUrl() as String
    return "https://raw.githubusercontent.com/olavomello/roku-app/refs/heads/main/feeds/sample-feed.json"
end function
