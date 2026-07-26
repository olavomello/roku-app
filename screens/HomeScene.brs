<<<<<<< HEAD
' TODO
=======
' Objective: Display video list items using RowList component
' Responsibilities: Manage focus and item selection event output
' Dependencies: VideoModel

sub init()
    m.rowList = m.top.findNode("rowList")
    m.rowList.observeField("rowItemSelected", "onItemSelected")
end sub

sub onContentChanged()
    if m.top.content <> invalid
        m.rowList.content = m.top.content
        m.rowList.setFocus(true)
    end if
end sub

sub onItemSelected()
    itemSelected = m.rowList.rowItemSelected
    if itemSelected <> invalid
        rowContent = m.rowList.content.getChild(itemSelected[0])
        if rowContent <> invalid
            videoNode = rowContent.getChild(itemSelected[1])
            m.top.selectedVideo = videoNode
        end if
    end if
end sub
>>>>>>> 98d9cbe (feat: initial commit with SceneGraph structure and Web simulator)
