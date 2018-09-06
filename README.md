## Skosmos plugin for displaying wikipedia articles on concept pages
### Motivation
In order to improve user experience for users of a Skosmos installation, display the corresponding wikipedia page in a plugin.

### How does it work?
This plugin fulfills the requirements for [Skosmos](https://github.com/NatLibFi/Skosmos) [plugins](https://github.com/NatLibFi/Skosmos/wiki/Plugins). Functionality-wise, reads concept data as JSON-LD and searches for the possible wikidata link. If one is found, looks for the best available content language wikipedia page (which is determined by the preferred language order of the Skosmos vocabulary) and asynchronically queries that via the [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/). Finally, the response is rendered to the user.

### Noteworthy
- Pollutes the global namespace with `WIKI`.
- If one wants to update the wiki css, run `python.py` (see the file for details) on unminified file to prepend rules with `#wiki` in order to avoid polluting the global css definitions.
