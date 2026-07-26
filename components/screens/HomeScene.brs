' Objective: Display video list items using RowList component
' Responsibilities: Manage focus and item selection event output
' Dependencies: VideoModel

sub init()
    m.rowList = m.top.findNode("rowList")
    if m.rowList <> invalid
        m.rowList.observeField("rowItemSelected", "onItemSelected")
    end if
end sub

sub onContentChanged()
    if m.top.content <> invalid and m.rowList <> invalid
        m.rowList.content = m.top.content
        m.rowList.setFocus(true)
    end if
end sub

sub onItemSelected()
    if m.rowList <> invalid and m.rowList.content <> invalid
        itemSelected = m.rowList.rowItemSelected
        if itemSelected <> invalid
            rowContent = m.rowList.content.getChild(itemSelected[0])
            if rowContent <> invalid
                videoNode = rowContent.getChild(itemSelected[1])
                m.top.selectedVideo = videoNode
            end if
        end if
    end if
end sub
