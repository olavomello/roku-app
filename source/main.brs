<<<<<<< HEAD
sub Main()
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)
    scene = screen.CreateScene("MainScene")
    screen.show()
    while true
        msg = wait(0, port)
=======
' Objective: Entry point for the Roku SceneGraph Application
' Responsibilities: Create roSGScreen, initialize MainScene, handle event loop
' Dependencies: MainScene.xml

sub Main()
    showChannelSGScreen()
end sub

sub showChannelSGScreen()
    print "========================================="
    print "   Starting Roku TV SceneGraph Channel   "
    print "========================================="

    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.SetMessagePort(m.port)

    scene = screen.CreateScene("MainScene")
    screen.show()

    while(true)
        msg = wait(0, m.port)
        msgType = type(msg)

        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed()
                return
            end if
        end if
>>>>>>> 98d9cbe (feat: initial commit with SceneGraph structure and Web simulator)
    end while
end sub
