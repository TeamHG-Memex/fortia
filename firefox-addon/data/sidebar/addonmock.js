/*
Mock 'addon' object for developing sidebar without loading it into an extension.
*/
if (typeof addon == "undefined"){
    addon = {
        mocked: true,
        port: {
            emit: function(){
                console.log("addon.emit", arguments);
            },
            on: function(){
                console.log("addon.on", arguments);
            },
            off: function(){
                console.log("addon.off", arguments);
            }
        }
    }
}
