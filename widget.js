// declaring a namespace for the plugin
var WIKI = WIKI || {};

WIKI = {
    address: "", // to be updated
    getTranslation: function (key) {
        var getLang = lang;
        if (lang !== "fi" && lang !== "sv") {
            getLang = "en";
        }
        if (key === "404") {
            return {
                "fi": "Ei wikipedia-sivua sanaston tukemalla kielellä.",
                "sv": "Inte något wikipedia-sidan på vokabulär språk.",
                "en": "No wikipedia article on any vocabulary language."
            }[getLang];
        }
        if (key === "error") {
            return {
                "fi": "Wikipedia-sivun lataamisessa tapahtui virhe.",
                "sv": "Wikipedia-sidan kan inte laddas.",
                "en": "Could not load wikipedia page."
            }[getLang];
        }
        else if (key === "wikipediaCaption") {
            var pref = $("span.prefLabel.conceptlabel")[0].innerHTML;
            return {
                "fi": pref + " Wikipediassa",
                "sv": pref + " på Wikipedia",
                "en": pref + " in Wikipedia"
            }[getLang];
        }
        else if (key === "wikipediaTerms") {
            return {
                "fi": 'Teksti on saatavilla <a rel="license" href="//fi.wikipedia.org/wiki/Wikipedia:Creative_Commons_Attribution-Share_Alike_3.0_Unported_-lisenssiehdot">Creative Commons Attribution/Share-Alike</a> -lisenssillä; lisäehtoja voi sisältyä. Katso <a href="//wikimediafoundation.org/wiki/Terms_of_Use/fi">käyttöehdot</a>. Wikipedia® on <a href="http://www.wikimediafoundation.org">Wikimedia Foundationin</a> rekisteröimä tavaramerkki.',

                "sv": 'Wikipedias text är tillgänglig under licensen  <a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/deed.sv">Creative Commons Erkännande-dela-lika 3.0 Unported</a>. För bilder, se respektive bildsida (klicka på bilden). Se vidare <a href="//sv.wikipedia.org/wiki/Wikipedia:Upphovsrätt">Wikipedia:Upphovsrätt</a> och <a href="//wikimediafoundation.org/wiki/Terms_of_Use">användarvillkor</a>.',

                "en": 'Text is available under the <a rel="license" href="//en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License">Creative Commons Attribution-ShareAlike License</a><a rel="license" href="//creativecommons.org/licenses/by-sa/3.0/" style="display:none;"></a>; additional terms may apply.  By using this site, you agree to the <a href="//wikimediafoundation.org/wiki/Terms_of_Use">Terms of Use</a> and <a href="//wikimediafoundation.org/wiki/Privacy_policy">Privacy Policy</a>. Wikipedia® is a registered trademark of the <a href="//www.wikimediafoundation.org/">Wikimedia Foundation, Inc.</a>, a non-profit organization.'
            }[getLang];
        }
        else {
            return "";
        }
    },
    fixLinks: function (data, wikiLang) {
        // create a temp jQuery object to help element manipulation
        var temp = $("<div></div>");
        temp.html(data);
        var wikiAddress = "https://" + wikiLang + ".wikipedia.org/wiki/";
        var attrs = {A: ["href"], LINK: ["href"], IMG: ["src", "srcset", "resource"]};
        $.each($("a, link, img", temp), function (i, elem) {
            if (elem.hash && elem.hash.length > 0) {
                elem.href = WIKI.address + elem.hash;
            }
            $.each(attrs[elem.tagName], function (i2, attr) {
                WIKI.linkHelper(elem, attr, wikiAddress);
            });
        });
        return temp.html();
    },
    linkHelper: function (elem, attr, wikiAddress) {
        if (elem.attributes[attr]) {
            var $elem = $(elem);
            if ($elem.attr(attr).startsWith("./")) {
                // fix relative links
                $elem.attr(attr, wikiAddress +  $elem.attr(attr).substring(2));
            }
            else if ($elem.attr(attr).startsWith("//")) {
                // force https
                $elem.attr(attr, "https:" + $elem.attr(attr));
            }
        }
    },
    generateQueryString: function (wikiLang, url) {
        var title = url.substring(url.lastIndexOf('/') + 1, url.length);
        return 'https://' + wikiLang +'.wikipedia.org/api/rest_v1/page/html/' + title;
    },
    generateTOC: function () {}, //TODO?
    updateAddress: function () {
        this.address = window.location.protocol + "//" +  window.location.host + window.location.pathname + window.location.search;
    },
    queryWiki: function (url, wikiLang) {
        var returnValue = {};
        $.ajax({
            url : url,
            headers: {
                "Accept": "text/html; charset=utf-8; profile='https://www.mediawiki.org/wiki/Specs/HTML/1.6.0'"
            },
            beforeSend: function (request) { request.setRequestHeader("Api-User-Agent", "Finto.fi wikipedia widget - finto-posti@helsinki.fi") },
            error: function (jqXHR, textStatus, errorThrown) {
                WIKI.widget.render({succeeded: false,
                    message: WIKI.getTranslation("error")
                    //message: (textStatus) ? textStatus : errorThrown // TODO: improve translations
                });
            },
            success : function(data) {
                // clean data for rendering purposes
                //take only sections
                var n = data.indexOf("<section");
                var m = data.lastIndexOf("</section>") + 10;
                var cleaned = data.substring(n, m);
                // fix links in json data
                cleaned = cleaned.replace(/href":"\.\//g, "https://" + wikiLang + ".wikipedia.org/wiki/");

                // fix links in dom nodes
                cleaned = WIKI.fixLinks(cleaned, wikiLang);

                WIKI.widget.render({
                    data: cleaned,
                    message: WIKI.getTranslation("wikipediaCaption"),
                    terms: WIKI.getTranslation("wikipediaTerms"),
                    wikiLang: wikiLang,
                    succeeded: true
                });
            }
        });
    },
    widget: {
        addAccordionToggleEvents: function() {
            $('#headingWiki > a > .glyphicon').on('click', function() {
                WIKI.widget.toggleAccordion();
            });
            $('#headingWiki > a.versal').on('click', function() {
                WIKI.widget.toggleAccordion();
            });
        },
        addScrollingFixEvents: function() {
            $("#collapseWiki a").on("click", function(e) {
                if (this.hash && this.hash.length > 0 && this.href.startsWith(WIKI.address)) {
                    var $hash = $(this.hash);
                    var scrollbar = $hash.parents(".mCustomScrollbar");
                    if (scrollbar.length){
                        e.preventDefault();
                        var scrollmem = $('html,body').scrollTop();
                        window.location.hash = this.hash;
                        $('html,body').scrollTop(scrollmem);
                        scrollbar.mCustomScrollbar("scrollTo", $hash);
                    }
                }
            });
        },
        // Flips the icon displayed on the top right corner of the widget header
        flipChevron: function() {
            var $glyph = $('#headingWiki > a > .glyphicon');
            if ($glyph.hasClass('glyphicon-chevron-down')) {
                $glyph.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
                createCookie('WIKI_WIDGET_OPEN', 1);
            } else {
                $glyph.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
                createCookie('WIKI_WIDGET_OPEN', 0);
            }
        },
        render: function (object) {
            var openCookie = readCookie('WIKI_WIDGET_OPEN');
            var isOpen = openCookie !== null ? parseInt(openCookie, 10) : 1;
            var context = {
                opened: Boolean(isOpen),
                wikipediaLang: {
                    diff: lang !== object.wikiLang,
                    value: object.wikiLang
                },
                wikipediaCaption: object.message,
                wikipediaTermsAndConditions: object.terms,
                succeeded: object.succeeded,
                prefLang: object.prefLang,
                data: object.data
            };
            $('.concept-info').after(Handlebars.compile($('#wiki-template').html())(context));
            $("#collapseWiki").mCustomScrollbar({
                scrollInertia: 0,
                mouseWheel:{ scrollAmount: 45 },
                snapAmount: 15,
                snapOffset: 1
            });
            this.addAccordionToggleEvents();
            this.addScrollingFixEvents();
        },
        // Handles the collapsing and expanding actions of the widget.
        toggleAccordion: function() {
            $('#collapseWiki').collapse('toggle');
            // switching the glyphicon to indicate a change in the accordion state
            WIKI.widget.flipChevron();
        },
    }
};

$(function() {

    window.wikiWidget = function (data) {
        // Only activate the widget when
        // 1) on a concept page
        // 2) and there is a prefLabel
        // 3) and the json-ld data can be found
        // 4) and there exists a wikidata object
        if (data.page !== 'page' || data.prefLabels === undefined || $.isEmptyObject(data["json-ld"])) {
            return;
        }
        var wikidata;
        $.each(data["json-ld"].graph, function (key, value) {
            if (value.uri.startsWith("wd:")) {
                wikidata = value;
                return false;
            }
        });
        if (!wikidata) {
            return;
        }

        var keyLangUriValue = {};
        var wikiArticlesList = [];

        wikiArticlesList = $.grep(data["json-ld"].graph, function (obj) {
            return obj.type === "schema:Article" && obj["schema:isPartOf"].uri.endsWith(".wikipedia.org/");
        });

        $.each(wikiArticlesList, function (key, value) {
            if (value["schema:inLanguage"] && value.uri) {
                keyLangUriValue[value["schema:inLanguage"]] = value.uri;
            }
        });
        var restURL = null;
        var wikiLang;
        $.each(languageOrder, function (key, value) {
            if (keyLangUriValue[value]) {
                restURL = WIKI.generateQueryString(value, keyLangUriValue[value]);
                wikiLang = value;
                return false;
            }
        });

        if (restURL) {
            WIKI.updateAddress();
            WIKI.queryWiki(restURL, wikiLang);
        }
        else {
            WIKI.widget.render({succeeded: false, message: WIKI.getTranslation("404")});
        }
    }

});
