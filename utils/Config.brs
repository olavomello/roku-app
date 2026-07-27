' Config.brs -- configuracoes do canal

function GetRokuConfig() as Object
    return {
        appName:            "Personal TV",
        appSubtitle:        "Enjoy your videos",
        version:            "1.0.0",
        devMode:            true,
        wifiCheckIntervalMs: 120000,
        defaultFeedUrl:     "https://raw.githubusercontent.com/olavomello/roku-app/refs/heads/main/feeds/sample-feed.json"
    }
end function
