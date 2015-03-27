## Fortia

Firefox extension for scrapely, integrated with SourcePin.

## Running

To run the extension, install [cfx](https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation),
then change folder to `firefox-addon` and execute `cfx run` 
from the command line.

## Addon Structure

The addon consists of several parts which communicate with each other using
messages. The parts are: 

* main addon code;
* sidebar UI code;
* content script.

Main addon code is located in `firefox-addon/lib`. It configures all components 
and glues them together.

The code for 'content script' is located at `firefox-addon/data/annotator`. 
Content script is JavaScript code executed in user's page context.
It draws interactive annotation elements on top of the web page and notifies
the addon when user interacts with them.
  
Sidebar UI is executed in a separate context; it doesn't have an access neither 
to main addon nor to the web page content. It communicates with the main addon
and with the content script by sending and receiving messages to/from the 
main addon. The code is located at `firefox-addon/data/sidebar`.
