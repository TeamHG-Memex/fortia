Fortia Firefox Plugin
=====================

Installation
------------

Install JS dependencies using npm::

    npm install --dev

Run the extension::

    npm run ff

To create an XPI file (which you can drop to Firefox) use the following
command::

    npm run xpi

Architecture
------------

There are 3 separate contexts in which JS code is executed:

* the main addon;
* sidebars;
* in-page annotation UI.

Main addon communicates with sidebars and in-page annotators by sending
and receiving messages (through "ports", this is a standard feature
of FF extensions). Sidebar and in-page annotation UI communicate only
via main addon.

Main addon code is in :path:`lib/` folder.
Sidebar source code is in :path:`data/sidebar/` folder;
in-page annotation UI is in :path:`data/annotator` folder.

For each browser tab there is a separate Sidebar and a separate annotation UI.
SessionManager (located in :file:`lib/SessionManager.js`) creates
"annotation sessions" for each tab where user starts an annotation session.

A Session (located in :file:`lib/Session.js`) is an object which represents
an "annotation session"; it connects all the pieces
(main addon, annotation UI and a sidebar).

A sidebar is a stateless `React.js`_-based component. It gets all its data from
Session (by listening to messages) and sends updates back to the Session
without updating itself - Fortia tries to follow Flux_ ideology.

Annotation data is stored in 2 places: main addon code and an annotation
UI. Main addon code stores information about annotated fields - their names,
attributes, editing state, etc. TemplateStore (located
in :file:`lib/TemplateStore.js`) is a component which stores this data.
But main addon code doesn't store actual Scrapely_ template - HTML data
with inline Scrapely annotations is kept in the in-page annotation UI.
Fields in main addon and in annotation UI are connected via ids;
field id is generated when user creates a field.

TabAnnotator (located in :file:`lib/TabAnnotator.js`) is an object in
main addon which creates in-page annotation UI and communicates with it.

.. _Flux: http://facebook.github.io/flux/
.. _React.js: http://facebook.github.io/react/
.. _Scrapely: https://github.com/scrapy/scrapely
