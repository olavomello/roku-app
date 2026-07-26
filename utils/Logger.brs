' Objective: Centralized Logger Utility for Roku SceneGraph
' Responsibilities: Print formatted logs to stdout console

function Logger(moduleName as String) as Object
    return {
        module: moduleName,
        info: sub(msg as String)
            print "[INFO][" + m.module + "] " + msg
        end sub,
        error: sub(msg as String)
            print "[ERROR][" + m.module + "] " + msg
        end sub,
        debug: sub(msg as String)
            print "[DEBUG][" + m.module + "] " + msg
        end sub
    }
end function
