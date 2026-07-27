' VideoRowListItem.brs
' Card component used by RowList rows.
' Shows: poster, title, category, rating badge, duration pill, focus ring.

sub init()
    m.poster       = m.top.findNode("poster")
    m.title        = m.top.findNode("title")
    m.category     = m.top.findNode("category")
    m.rating       = m.top.findNode("rating")
    m.durationTag  = m.top.findNode("durationTag")
    m.focusBorder  = m.top.findNode("focusBorder")
    m.focusGradient = m.top.findNode("focusGradient")
    m.playIcon     = m.top.findNode("playIcon")
end sub

sub onItemContentChanged()
    item = m.top.itemContent
    if item = invalid then return

    ' Title
    if item.title <> invalid and item.title <> ""
        m.title.text = item.title
    end if

    ' Poster (HDPosterUrl)
    if item.HDPosterUrl <> invalid and item.HDPosterUrl <> ""
        m.poster.uri = item.HDPosterUrl
    end if

    ' Category -- read categories[0] (array field)
    cat = "General"
    if item.categories <> invalid
        if type(item.categories) = "roArray" and item.categories.count() > 0
            if item.categories[0] <> invalid and item.categories[0] <> ""
                cat = item.categories[0]
            end if
        else if type(item.categories) = "roString" or type(item.categories) = "String"
            if item.categories <> "" then cat = item.categories
        end if
    end if
    m.category.text = cat

    ' Rating badge
    rVal = "G"
    if item.rating <> invalid and item.rating <> ""
        rVal = item.rating
    else if item.ratingValue <> invalid and item.ratingValue <> ""
        rVal = item.ratingValue
    end if
    m.rating.text = rVal

    ' Duration pill  mm:ss
    if m.durationTag <> invalid
        durStr = ""
        if item.length <> invalid and item.length > 0
            mins   = Int(item.length / 60)
            secs   = item.length Mod 60
            secStr = secs.toStr()
            if secs < 10 then secStr = "0" + secStr
            durStr = mins.toStr() + ":" + secStr
        end if
        m.durationTag.text = durStr
    end if
end sub

sub onFocusPercentChanged()
    focused = (m.top.focusPercent > 0.5)

    m.focusBorder.visible   = focused
    m.focusGradient.visible = focused
    m.playIcon.visible      = focused

    if focused
        m.title.color = "0xFFFFFFFF"
    else
        m.title.color = "0xE5E7EBFF"
    end if
end sub
