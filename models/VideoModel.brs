' VideoModel.brs -- modelo de dados de video
' Campos: id, title, description, thumbnail, url, duration, category, rating, releaseDate
' Dados estruturados sao armazenados como campos de ContentNode no BrightScript.

' Mirrors: interface Video constructor / object literal
' ContentNode field mapping (mirrors Video interface from src/types.ts):
'   Video.id          -> ContentNode.id
'   Video.title       -> ContentNode.title
'   Video.thumbnail   -> ContentNode.HDPosterUrl  (Roku standard field)
'   Video.url         -> ContentNode.url
'   Video.description -> ContentNode.description
'   Video.duration    -> ContentNode.length       (Roku standard field, seconds)
'   Video.category    -> ContentNode.categories
'   Video.rating      -> ContentNode.ratingValue
'   Video.releaseDate -> ContentNode.releaseDate
'   Video.artist      -> ContentNode.actors
function VideoModel(id as String, title as String, url as String, thumbnail as String) as Object
    node = CreateObject("roSGNode", "ContentNode")
    node.id          = id
    node.title       = title
    node.url         = url
    node.HDPosterUrl = thumbnail
    node.streamFormat = "mp4"
    return node
end function
