' Logger.brs -- utilitario de log do canal
' Uso: m.logTag = "Tag" / LogInfo(m.logTag, "mensagem")

sub LogInfo(tag as String, msg as String)
    print "[INFO ][" + tag + "] " + msg
end sub

sub LogWarn(tag as String, msg as String)
    print "[WARN ][" + tag + "] " + msg
end sub

sub LogError(tag as String, msg as String)
    print "[ERROR][" + tag + "] " + msg
end sub

sub LogDebug(tag as String, msg as String)
    print "[DEBUG][" + tag + "] " + msg
end sub
