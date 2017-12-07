// declaring a namespace for the plugin
var WIKI = WIKI || {};

WIKI = {
    widget: {
        render: function (data) {
            //TODO: render the data
        },
        generateWikimediaQueryURL: function(title) {
            return 'https://' + content_lang +'.wikipedia.org/api/rest_v1/page/html/' + encodeURIComponent(title);
        },
        generateWikidataQueryURL: function(id) {
            return 'http://www.wikidata.org/wiki/Special:EntityData/' + id +'.json?callback=?';
        },
        // queries the wikidata API.
        queryWiki: function (data) {
            //TODO: read the wikidata id from the Finto API
            var wikidataid = 'Q1571816';
            var url = this.generateWikidataQueryURL(wikidataid);
            $.get(url, function(data) {
                var entity = data.entities[wikidataid]
                if (entity && entity.sitelinks) {
                    if (entity.sitelinks[content_lang + 'wiki']) {
                        return entity.sitelinks[content_lang + 'wiki'].title;
                    }
                }
            });
        }
    }
};

$(function() { 
    
    window.wikiwidget = function (data) {
        // Only activating the widget when on a concept page and there is a prefLabel.
        if (data.page !== 'page' || data.prefLabels === undefined) {
            return;
        }
        // reading the id from the uri
        var id = data.uri.substr(data.uri.lastIndexOf('/p') + 2); 
        // query wikidata for possible wikipedia article title
        var wikititle = WIKI.widget.queryWiki(data);
        // TODO: query the wikimedia api for the article content and render it
    };

});
