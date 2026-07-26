<<<<<<< HEAD
' TODO FeedParser
=======
' Objective: Parse raw JSON feed into SceneGraph ContentNodes
' Responsibilities: Convert JSON arrays/objects into ContentNode row and item trees

function FeedParser_Parse(jsonString as String) as Object
    rootNode = CreateObject("roSGNode", "ContentNode")
    rowNode = rootNode.createChild("ContentNode")
    rowNode.title = "Featured Catalog"

    json = ParseJson(jsonString)
    if json <> invalid
        items = []
        if type(json) = "roArray"
            items = json
        else if type(json) = "roAssociativeArray" and json.videos <> invalid
            items = json.videos
        end if

        for each item in items
            node = rowNode.createChild("ContentNode")
            
            ' Extract Title
            if item.title <> invalid
                node.title = item.title
            else if item.Title <> invalid
                node.title = item.Title
            else
                node.title = "Untitled Video"
            end if

            ' Extract Stream URL
            if item.url <> invalid
                node.url = item.url
            else if item.Url <> invalid
                node.url = item.Url
            else
                node.url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            end if

            ' Extract Poster
            if item.thumbnail <> invalid
                node.HDPosterUrl = item.thumbnail
            else if item.Poster <> invalid
                node.HDPosterUrl = item.Poster
            end if

            node.streamFormat = "mp4"
        end for
    end if

    return rootNode
end function
>>>>>>> 98d9cbe (feat: initial commit with SceneGraph structure and Web simulator)
