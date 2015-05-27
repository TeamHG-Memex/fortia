/*
Mock 'addon' object for developing sidebar without loading it into an extension.
*/
if (typeof addon == "undefined"){
    var addonLog = debug("sidebar: addon:");
    addon = {
        mocked: true,
        port: {
            emit: function(){
                addonLog("emit", arguments);
            },
            on: function(){
                addonLog("on", arguments);
            },
            off: function(){
                addonLog("off", arguments);
            }
        }
    }
}
