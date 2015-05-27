/* File save dialog */
const {Cc, Ci} = require("chrome");
const {getMostRecentBrowserWindow} = require("sdk/window/utils");
const fileIO = require("sdk/io/file");

const { Log } = require('./Log.js');
const log = Log("dialogs");


/* Create file with the specified text content. */
function createFile(path, text){
    if (fileIO.exists(path) && !fileIO.isFile(path)) {
        return false;
    }
    let file = fileIO.open(path, "w");
    if (file.closed){
        return false;
    }
    file.write(text);
    file.close();
    return true;
}


/* Display a save dialog and write 'text' content to the selected file */
function saveDialog(title, defaultFileName, text, extension="json"){
    let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    let window = getMostRecentBrowserWindow();

    fp.init(window, title, Ci.nsIFilePicker.modeSave);
    fp.defaultExtension = extension;
    fp.defaultString = defaultFileName;
    if (extension == "html") {
        fp.appendFilter("HTML files", Ci.nsIFilePicker.filterHTML);
    }
    else if (extension == "json") {
        fp.appendFilter("JSON files", "*.json");
    }
    fp.appendFilter("All files", Ci.nsIFilePicker.filterAll);

    let rv = fp.show();
    if (rv == Ci.nsIFilePicker.returnOK || rv == Ci.nsIFilePicker.returnReplace) {
        let ok = createFile(fp.file.path, text);
        if (!ok){
            log("error writing to file", fp.file.path);
        }
        return ok;
    }
    return false;
}

exports.save = saveDialog;
