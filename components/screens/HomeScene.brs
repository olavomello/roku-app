' HomeScene.brs
' Layout: NAV BAR (y=0-50) + HERO SPOTLIGHT (y=51-375) + ROWLIST (y=410+)
' Row 0 = Todos os Videos (Destaques), rows 1..N = one per category.
' CategoryNav in the nav bar is focusable via remote.
' To package: npm run package   To deploy: npm run deploy

sub init()
    m.logTag = "HomeScene"
    LogInfo(m.logTag, "init")

    ' Hero spotlight nodes
    m.focusedTitle    = m.top.findNode("focusedTitle")
    m.focusedDesc     = m.top.findNode("focusedDesc")
    m.focusedCategory = m.top.findNode("focusedCategory")
    m.focusedRating   = m.top.findNode("focusedRating")
    m.focusedYear     = m.top.findNode("focusedYear")
    m.focusedDuration = m.top.findNode("focusedDuration")
    m.focusedPoster   = m.top.findNode("focusedPoster")

    ' CategoryNav tab bar
    m.categoryNav = m.top.findNode("categoryNav")
    if m.categoryNav <> invalid
        m.categoryNav.observeField("selectedRowIndex", "onCategorySelected")
        m.categoryNav.observeField("requestFocusDown",  "onCategoryFocusDown")
    end if

    ' RowList
    m.rowList = m.top.findNode("rowList")
    if m.rowList = invalid then return

    ' Card: 300 wide x 230 tall (poster 300x180 + info bar 50)
    m.rowList.rowItemSize    = [[300, 230]]
    m.rowList.rowItemSpacing = [[24, 0]]
    m.rowList.rowLabelColor  = "0xA78BFAFF"
    m.rowList.rowLabelFont   = "font:SmallBoldSystemFont"

    m.rowList.observeField("rowItemSelected", "onItemSelected")
    m.rowList.observeField("rowItemFocused",  "onRowItemFocused")
end sub

sub onContentChanged()
    if m.top.content = invalid then return
    if m.rowList = invalid then return

    LogInfo(m.logTag, "onContentChanged")
    m.rowList.content = m.top.content

    numRows    = m.top.content.getChildCount()
    showLabels = []
    catNames   = []

    i = 0
    while i < numRows
        showLabels.Push(true)
        rowChild = m.top.content.getChild(i)
        if rowChild <> invalid
            if rowChild.title <> invalid and rowChild.title <> ""
                catNames.Push(rowChild.title)
            end if
        end if
        i = i + 1
    end while

    m.rowList.showRowLabel = showLabels

    ' Populate CategoryNav with category names
    if m.categoryNav <> invalid
        m.categoryNav.categories = catNames
    end if

    m.rowList.setFocus(true)
    updateSpotlight([0, 0])
end sub

' Called when RowList cannot navigate further up (key bubbles to parent Group).
' Give focus to the CategoryNav tab bar.
function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false
    if key = "up"
        if m.categoryNav <> invalid
            m.categoryNav.navFocused = true
            m.categoryNav.setFocus(true)
            return true
        end if
    end if
    return false
end function

' Called when user selects a category in CategoryNav (OK key).
' Scroll the RowList to that category row.
sub onCategorySelected()
    if m.categoryNav = invalid then return
    rowIdx = m.categoryNav.selectedRowIndex
    if m.rowList <> invalid
        m.rowList.animateToRow = rowIdx
        m.categoryNav.navFocused = false
        m.rowList.setFocus(true)
    end if
end sub

' Called when CategoryNav Down key fires -- return focus to RowList.
sub onCategoryFocusDown()
    if m.rowList <> invalid
        m.categoryNav.navFocused = false
        m.rowList.setFocus(true)
    end if
end sub

sub onRowItemFocused()
    if m.rowList = invalid then return
    focusedPos = m.rowList.rowItemFocused
    if focusedPos <> invalid
        updateSpotlight(focusedPos)
    end if
end sub

sub updateSpotlight(itemPos as Object)
    if m.top.content = invalid then return

    rowNode = m.top.content.getChild(itemPos[0])
    if rowNode = invalid then return

    video = rowNode.getChild(itemPos[1])
    if video = invalid then return

    ' Title
    if m.focusedTitle <> invalid
        t = video.title
        if t = invalid then t = ""
        m.focusedTitle.text = t
    end if

    ' Description
    if m.focusedDesc <> invalid
        desc = video.description
        if desc = invalid or desc = ""
            desc = "Nenhuma sinopse disponivel."
        end if
        m.focusedDesc.text = desc
    end if

    ' Category -- read categories[0]
    if m.focusedCategory <> invalid
        catStr = ""
        if video.categories <> invalid
            if type(video.categories) = "roArray"
                if video.categories.Count() > 0
                    c = video.categories[0]
                    if c <> invalid then catStr = c
                end if
            end if
        end if
        m.focusedCategory.text = catStr
    end if

    ' Rating
    if m.focusedRating <> invalid
        rStr = ""
        if video.rating <> invalid then rStr = video.rating.toStr()
        m.focusedRating.text = rStr
    end if

    ' Release year
    if m.focusedYear <> invalid
        yrStr = ""
        if video.releaseDate <> invalid then yrStr = video.releaseDate.toStr()
        m.focusedYear.text = yrStr
    end if

    ' Poster
    if m.focusedPoster <> invalid
        pUrl = video.hdPosterUrl
        if pUrl <> invalid and pUrl <> ""
            m.focusedPoster.uri = pUrl
        end if
    end if

    ' Duration mm:ss
    if m.focusedDuration <> invalid
        durStr = "0:00"
        if video.length <> invalid
            if video.length > 0
                mins   = Int(video.length / 60)
                secs   = video.length Mod 60
                secStr = secs.toStr()
                if secs < 10 then secStr = "0" + secStr
                durStr = mins.toStr() + ":" + secStr
            end if
        end if
        m.focusedDuration.text = durStr
    end if
end sub

sub onItemSelected(event as Object)
    selectedPos = event.getData()
    if m.top.content = invalid or selectedPos = invalid then return

    rowNode = m.top.content.getChild(selectedPos[0])
    if rowNode = invalid then return

    videoNode = rowNode.getChild(selectedPos[1])
    if videoNode <> invalid
        LogInfo(m.logTag, "Selected: " + videoNode.title)
        m.top.selectedVideo = videoNode
    end if
end sub
