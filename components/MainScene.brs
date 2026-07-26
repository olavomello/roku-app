' Objective: Root Manager Scene for Navigation and Feed initialization
' Responsibilities: Manage screen transitions between HomeScene and PlayerScene
' Event Handlers: itemSelected on HomeScene, back key press on PlayerScene

sub init()
    m.log = Logger("MainScene")
    m.log.info("Initializing MainScene")

    m.homeScene = m.top.findNode("homeScene")
    m.playerScene = m.top.findNode("playerScene")

    if m.homeScene <> invalid
        m.homeScene.observeField("selectedVideo", "onVideoSelected")
        m.homeScene.setFocus(true)
    end if

    if m.playerScene <> invalid
        m.playerScene.observeField("state", "onPlayerStateChanged")
    end if

    ' Start loading content feed
    loadContentFeed()
end sub

sub loadContentFeed()
    m.log.info("Starting LoadFeedTask Node")
    m.feedTask = CreateObject("roSGNode", "LoadFeedTask")
    if m.feedTask <> invalid
        m.feedTask.observeField("content", "onFeedLoaded")
        m.feedTask.control = "RUN"
    else
        m.log.error("Failed to create LoadFeedTask node")
    end if
end sub

sub onFeedLoaded()
    if m.feedTask <> invalid and m.feedTask.content <> invalid
        m.log.info("Feed loaded successfully")
        m.homeScene.content = m.feedTask.content
        m.homeScene.setFocus(true)
    else
        m.log.error("Failed to load feed content")
    end if
end sub

sub onVideoSelected()
    selectedVideo = m.homeScene.selectedVideo
    if selectedVideo <> invalid
        m.log.info("Navigating to PlayerScene for video: " + selectedVideo.title)
        m.homeScene.visible = false
        m.playerScene.content = selectedVideo
        m.playerScene.visible = true
        m.playerScene.setFocus(true)
    end if
end sub

sub onPlayerStateChanged()
    if m.playerScene <> invalid and m.log <> invalid
        m.log.info("Player state changed: " + m.playerScene.state)
    end if
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press
        if key = "back"
            if m.playerScene <> invalid and m.playerScene.visible
                m.log.info("Back pressed in PlayerScene. Returning to HomeScene.")
                m.playerScene.control = "stop"
                m.playerScene.visible = false
                m.homeScene.visible = true
                m.homeScene.setFocus(true)
                return true
            end if
        end if
    end if
    return false
end function
