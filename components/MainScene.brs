' Objective: Root Manager Scene for Navigation and Feed initialization
' Responsibilities: Manage screen transitions between HomeScene and PlayerScene
' Event Handlers: itemSelected on HomeScene, back key press on PlayerScene

sub init()
    m.log = Logger("MainScene")
    m.log.info("Initializing MainScene")

    m.homeScene = m.top.findNode("homeScene")
    m.playerScene = m.top.findNode("playerScene")

    ' Observe events from HomeScene
    m.homeScene.observeField("selectedVideo", "onVideoSelected")

    ' Observe events from PlayerScene
    m.playerScene.observeField("state", "onPlayerStateChanged")

    ' Start loading content feed
    loadContentFeed()
end sub

sub loadContentFeed()
    m.log.info("Starting LoadFeedTask Node")
    m.feedTask = CreateObject("roSGNode", "LoadFeedTask")
    m.feedTask.observeField("content", "onFeedLoaded")
    m.feedTask.control = "RUN"
end sub

sub onFeedLoaded()
    if m.feedTask.content <> invalid
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

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press
        if key = "back"
            if m.playerScene.visible
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
