' CategoryNav.brs
' Horizontal focusable tab bar for category selection.
' Creates one pill (Rectangle + Label) per category dynamically.
' Key handling: Left/Right move selection, OK fires selectedRowIndex, Down returns focus.

sub init()
    m.focusIdx  = 0
    m.isFocused = false
    m.catNodes  = []
end sub

sub onCategoriesChanged()
    cats = m.top.categories
    if cats = invalid then return
    if cats.Count() = 0 then return

    ' Remove previously created pill nodes
    for each item in m.catNodes
        m.top.removeChild(item.bg)
        m.top.removeChild(item.lbl)
    end for
    m.catNodes = []

    PILL_W   = 110
    PILL_H   = 24
    PILL_GAP = 6
    x        = 0

    for i = 0 to cats.Count() - 1
        cat = cats[i]

        bg = m.top.createChild("Rectangle")
        bg.width           = PILL_W
        bg.height          = PILL_H
        bg.translation     = [x, 0]
        bg.color           = "0x2E106566"
        bg.blendingEnabled = true

        lbl = m.top.createChild("Label")
        lbl.text        = cat
        lbl.translation = [x + 4, 0]
        lbl.width       = PILL_W - 8
        lbl.height      = PILL_H
        lbl.font        = "font:SmallSystemFont"
        lbl.color       = "0x6B7280FF"
        lbl.horizAlign  = "center"
        lbl.vertAlign   = "center"

        entry = {}
        entry.bg  = bg
        entry.lbl = lbl
        m.catNodes.Push(entry)

        x = x + PILL_W + PILL_GAP
    end for

    m.focusIdx = 0
    renderHighlight()
end sub

sub onNavFocusedChanged()
    m.isFocused = m.top.navFocused
    renderHighlight()
end sub

sub renderHighlight()
    n = m.catNodes.Count()
    for i = 0 to n - 1
        item = m.catNodes[i]
        if m.isFocused and i = m.focusIdx
            item.bg.color  = "0x662D91FF"
            item.lbl.color = "0xFFFFFFFF"
        else if i = m.focusIdx
            item.bg.color  = "0x3B1F60FF"
            item.lbl.color = "0xDDD6FEFF"
        else
            item.bg.color  = "0x1A0D2EAA"
            item.lbl.color = "0x6B7280FF"
        end if
    end for
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false

    if key = "left"
        if m.focusIdx > 0
            m.focusIdx = m.focusIdx - 1
            renderHighlight()
        end if
        return true
    else if key = "right"
        if m.focusIdx < m.catNodes.Count() - 1
            m.focusIdx = m.focusIdx + 1
            renderHighlight()
        end if
        return true
    else if key = "OK"
        m.top.selectedRowIndex = m.focusIdx
        return true
    else if key = "down"
        m.isFocused = false
        renderHighlight()
        m.top.requestFocusDown = not m.top.requestFocusDown
        return true
    end if

    return false
end function
