<<<<<<< HEAD
' TODO Model
=======
' Objective: Video Item Data Structure helper
' Responsibilities: Create standardized AssociativeArray representation for videos

function VideoModel(id as String, title as String, url as String, thumbnail as String) as Object
    return {
        id: id,
        title: title,
        url: url,
        thumbnail: thumbnail
    }
end function
>>>>>>> 98d9cbe (feat: initial commit with SceneGraph structure and Web simulator)
