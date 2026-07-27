' Constants.brs -- constantes globais do canal

function GetRokuConstants() as Object
    return {
        APP_TITLE: "Personal TV",
        MANIFEST_VERSION: "1.0.0",
        RESOLUTION: "Full HD (1080p)",
        ROKU_PURPLE: "0x662D91FF",
        ROKU_DARK_BG: "0x100C19FF",
        DEFAULT_LOCAL_FEED_PATH: "feeds/sample-feed.json",
        MAX_COLUMNS: 4,
        AUTO_HIDE_OSD_MS: 4000
    }
end function
