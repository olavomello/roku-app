' Objective: Item renderer component for RowList items
' Responsibilities: Populate poster image and title, manage visual focus state

sub init()
    m.poster = m.top.findNode("poster")
    m.title = m.top.findNode("title")
    m.focusBorder = m.top.findNode("focusBorder")
end sub

sub onItemContentChanged()
    item = m.top.itemContent
    if item <> invalid
        if item.title <> invalid
            m.title.text = item.title
        end if
        if item.HDPosterUrl <> invalid and item.HDPosterUrl <> ""
            m.poster.uri = item.HDPosterUrl
        end if
    end if
end sub

sub onFocusPercentChanged()
    if m.top.focusPercent > 0.5
        m.focusBorder.visible = true
    else
        m.focusBorder.visible = false
    end if
end sub
