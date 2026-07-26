' Objective: High level Feed Service wrapper for feed URL routing
' Responsibilities: Select target feed source (local pkg or remote HTTP endpoint)

function FeedService_GetFeedUrl() as String
    return "pkg:/feeds/sample-feed.json"
end function
