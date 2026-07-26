' Objective: Video playback component wrapper for native SceneGraph Video Node
' Responsibilities: Auto-play selected video content and handle playback control

sub init()
    m.videoPlayer = m.top.findNode("videoPlayer")
end sub

sub onContentChanged()
    if m.top.content <> invalid and m.videoPlayer <> invalid
        m.videoPlayer.content = m.top.content
        m.videoPlayer.control = "play"
        m.videoPlayer.setFocus(true)
    end if
end sub
