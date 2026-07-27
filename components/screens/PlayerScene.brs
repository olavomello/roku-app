' PlayerScene.brs -- player de video com OSD e controles de reproducao
' showOSD state + timer      -> m.osdTimer (Timer node, 4s) + setOsdVisible()
' currentTime state          -> videoPlayer.position (observe)
' duration state             -> videoPlayer.duration / m.totalDuration
' handleLoadedMetadata       -> onVideoState() -> "readyToPlay" / "playing"
' togglePlayPause()          -> videoPlayer.control = "play" | "pause"
' handleSeekRelative(s)      -> videoPlayer.seek = position + s
' handleVideoError()         -> onVideoState() -> "error"
' FALLBACK_MIRRORS           -> not implemented (Roku handles stream errors natively)
' AUTO_HIDE_OSD_MS = 4000    -> osdTimer.duration = 4

sub init()
    m.logTag = "PlayerScene"
    LogInfo(m.logTag, "Initializing PlayerScene")

    m.videoPlayer     = m.top.findNode("videoPlayer")
    m.osdTitle        = m.top.findNode("osdTitle")
    m.progressFill    = m.top.findNode("progressFill")
    m.progressHandle  = m.top.findNode("progressHandle")
    m.timeElapsed     = m.top.findNode("timeElapsed")
    m.timeRemaining   = m.top.findNode("timeRemaining")
    m.playPauseLabel  = m.top.findNode("playPauseLabel")
    m.pauseIndicatorBg   = m.top.findNode("pauseIndicatorBg")
    m.pauseIndicatorIcon = m.top.findNode("pauseIndicatorIcon")
    m.osdTimer        = m.top.findNode("osdTimer")

    m.totalDuration   = 0.0
    m.osdVisible      = true

    if m.videoPlayer <> invalid
        ' Mirrors: onTimeUpdate -> progress bar update
        m.videoPlayer.observeField("position", "onVideoPosition")
        ' Mirrors: handleLoadedMetadata + handleVideoError + onEnded state handlers
        m.videoPlayer.observeField("state", "onVideoState")
    end if

    if m.osdTimer <> invalid
        ' Mirrors: setTimeout(() => setShowOSD(false), AUTO_HIDE_OSD_MS)
        m.osdTimer.observeField("fire", "onOsdTimerFired")
    end if
end sub

' Mirrors: useEffect on video prop + autoplay logic
sub onContentChanged()
    if m.top.content = invalid then return
    if m.videoPlayer = invalid then return

    video = m.top.content
    LogInfo(m.logTag, "PlayerScene content: " + video.title)

    ' Set OSD title -- mirrors <h1>{video.title}</h1>
    if m.osdTitle <> invalid then m.osdTitle.text = video.title

    ' Build Video node ContentNode -- mirrors configuring <video src= poster=>
    videoContent = CreateObject("roSGNode", "ContentNode")
    videoContent.url          = video.url
    videoContent.streamFormat = "mp4"
    videoContent.title        = video.title
    if video.HDPosterUrl <> invalid then videoContent.HDPosterUrl = video.HDPosterUrl

    m.videoPlayer.content = videoContent

    ' Mirrors: videoRef.current.play() in handleLoadedMetadata
    m.videoPlayer.control = "play"
    m.videoPlayer.setFocus(true)

    ' Show OSD initially then start auto-hide timer
    showOsd()
end sub

' Mirrors: handleTimeUpdate -> setCurrentTime(cur) -> progress bar + time labels
sub onVideoPosition()
    if m.videoPlayer = invalid then return

    curPos = m.videoPlayer.position
    dur = m.videoPlayer.duration
    if dur = invalid or dur <= 0 then return
    if m.totalDuration <= 0 then m.totalDuration = dur

    ' Progress fill width -- mirrors width: `${(currentTime/duration)*100}%`
    progress  = curPos / dur
    fillWidth = int(1776 * progress)
    if m.progressFill <> invalid    then m.progressFill.width = fillWidth
    if m.progressHandle <> invalid  then m.progressHandle.translation = [66 + fillWidth, 835]

    ' Time labels -- mirrors formatTime(currentTime) / formatTime(duration - currentTime)
    if m.timeElapsed <> invalid   then m.timeElapsed.text   = fmtSec(curPos)
    if m.timeRemaining <> invalid then m.timeRemaining.text = "-" + fmtSec(dur - curPos)
end sub

' Mirrors: state change handlers (readyToPlay->autoplay, playing, paused, finished, error)
sub onVideoState()
    if m.videoPlayer = invalid then return
    state = m.videoPlayer.state
    LogInfo(m.logTag, "Video state: " + state)

    if state = "playing"
        ' Mirrors: setIsPlaying(true) + hide pause indicator
        if m.playPauseLabel <> invalid then m.playPauseLabel.text = "||  Pause"
        if m.pauseIndicatorBg   <> invalid then m.pauseIndicatorBg.visible = false
        if m.pauseIndicatorIcon <> invalid then m.pauseIndicatorIcon.visible = false
        startOsdTimer()

    else if state = "paused"
        ' Mirrors: setIsPlaying(false) + show center Play button
        if m.playPauseLabel <> invalid then m.playPauseLabel.text = ">  Play"
        if m.pauseIndicatorBg   <> invalid then m.pauseIndicatorBg.visible = true
        if m.pauseIndicatorIcon <> invalid then m.pauseIndicatorIcon.visible = true
        showOsd()

    else if state = "finished"
        ' Mirrors: onEnded -> setIsPlaying(false) + showOSD(true)
        LogInfo(m.logTag, "Playback finished -- mirrors onEnded handler")
        if m.pauseIndicatorBg   <> invalid then m.pauseIndicatorBg.visible = false
        if m.pauseIndicatorIcon <> invalid then m.pauseIndicatorIcon.visible = false
        showOsd()

    else if state = "error"
        ' Mirrors: handleVideoError -- show OSD (Roku shows error message natively)
        LogError(m.logTag, "Video playback error")
        showOsd()
    end if
end sub

' Mirrors: setTimeout callback -> setShowOSD(false) when still playing
sub onOsdTimerFired()
    if m.videoPlayer <> invalid and m.videoPlayer.state = "playing"
        hideOsd()
    end if
end sub

sub showOsd()
    m.osdVisible = true
    setOsdNodes(true)
    startOsdTimer()
end sub

sub hideOsd()
    m.osdVisible = false
    setOsdNodes(false)
end sub

sub startOsdTimer()
    if m.osdTimer <> invalid
        m.osdTimer.control = "stop"
        m.osdTimer.control = "start"
    end if
end sub

' Toggle all OSD nodes -- mirrors opacity transition on the OSD container div
sub setOsdNodes(visible as Boolean)
    ids = ["topScrim", "bottomScrim", "backBtnBg", "backBtnLabel", "osdTitle",
           "osdPanel", "progressTrack", "progressFill", "progressHandle",
           "timeElapsed", "timeRemaining",
           "rewindBg", "rewindLabel", "playPauseBg", "playPauseLabel",
           "fwdBg", "fwdLabel"]
    for each nodeId in ids
        n = m.top.findNode(nodeId)
        if n <> invalid then n.visible = visible
    end for
end sub

' Mirrors: formatTime(secs) in PlayerScene.tsx
function fmtSec(secs as Float) as String
    if secs < 0 then secs = 0
    mins = int(secs / 60)
    s = int(secs) mod 60
    secsPrefix = ""
    if s < 10 then secsPrefix = "0"
    return mins.toStr() + ":" + secsPrefix + s.toStr()
end function

' Mirrors: global keydown listener (Space/OK -> play/pause, </> -> seek, Esc/Back -> navigate)
function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false

    ' Any key press shows OSD -- mirrors onMouseMove/onClick -> resetOSDTimer
    showOsd()

    if key = "play" or key = "pause" or key = "OK"
        ' Mirrors: togglePlayPause()
        if m.videoPlayer <> invalid
            ctrl = "play"
            if m.videoPlayer.state = "playing" then ctrl = "pause"
            m.videoPlayer.control = ctrl
            LogInfo(m.logTag, "Toggle play/pause -> " + ctrl)
        end if
        return true

    else if key = "left" or key = "rewind"
        ' Mirrors: handleSeekRelative(-10)
        if m.videoPlayer <> invalid
            newPos = m.videoPlayer.position - 10
            if newPos < 0 then newPos = 0
            m.videoPlayer.seek = newPos
            LogInfo(m.logTag, "Seek -10s -> " + newPos.toStr())
        end if
        return true

    else if key = "right" or key = "fastForward"
        ' Mirrors: handleSeekRelative(10)
        if m.videoPlayer <> invalid
            newPos = m.videoPlayer.position + 10
            if m.totalDuration > 0 and newPos > m.totalDuration - 1
                newPos = m.totalDuration - 1
            end if
            m.videoPlayer.seek = newPos
            LogInfo(m.logTag, "Seek +10s -> " + newPos.toStr())
        end if
        return true

    else if key = "back"
        ' Mirrors: Escape/Backspace -> onBack() (handled by MainScene.onKeyEvent)
        return false
    end if

    return false
end function
