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
                "fi": 'Teksti on saatavilla <a rel="license" href="//fi.wikipedia.org/wiki/Wikipedia:Creative_Commons_Attribution-Share_Alike_3.0_Unported_-lisenssiehdot" target="_blank">Creative Commons Attribution/Share-Alike</a> -lisenssillä; lisäehtoja voi sisältyä. Katso <a href="//wikimediafoundation.org/wiki/Terms_of_Use/fi" target="_blank">käyttöehdot</a>. Wikipedia® on <a href="http://www.wikimediafoundation.org" target="_blank">Wikimedia Foundationin</a> rekisteröimä tavaramerkki.',

                "sv": 'Wikipedias text är tillgänglig under licensen  <a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/deed.sv" target="_blank">Creative Commons Erkännande-dela-lika 3.0 Unported</a>. För bilder, se respektive bildsida (klicka på bilden). Se vidare <a href="//sv.wikipedia.org/wiki/Wikipedia:Upphovsrätt" target="_blank">Wikipedia:Upphovsrätt</a> och <a href="//wikimediafoundation.org/wiki/Terms_of_Use" target="_blank">användarvillkor</a>.',

                "en": 'Text is available under the <a rel="license" href="//en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License" target="_blank">Creative Commons Attribution-ShareAlike License</a><a rel="license" href="//creativecommons.org/licenses/by-sa/3.0/" target="_blank" style="display:none;"></a>; additional terms may apply.  By using this site, you agree to the <a href="//wikimediafoundation.org/wiki/Terms_of_Use" target="_blank">Terms of Use</a> and <a href="//wikimediafoundation.org/wiki/Privacy_policy" target="_blank">Privacy Policy</a>. Wikipedia® is a registered trademark of the <a href="//www.wikimediafoundation.org/" target="_blank">Wikimedia Foundation, Inc.</a>, a non-profit organization.'
            }[getLang];
        }
        else if (key === "wikipediaCredit") {
            return {
               'fi': 'Katso sivu Wikipediassa: ',
               'sv': 'Se sidan på Wikipedia: ',
               'en': 'See the page in Wikipedia: '
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
            if (elem.hash && elem.hash.startsWith("#cite_")) {
                elem.href = WIKI.address + elem.hash;
            }
            else {
                elem.target = "_blank";
            }
            $.each(attrs[elem.tagName], function (i2, attr) {
                WIKI.linkHelper(elem, attr, wikiAddress);
            });
        });

        $.each($(".thumbinner", temp), function (i, elem) {
            // add 8 pixels to make the child elements of these to behave normally w.r.t. wikipedia-defined css styles (e.g., float, clear)
            this.style['max-width'] = parseInt(this.style['max-width']) + 8 + "px";
            this.style.width = parseInt(this.style.width) + 8 + "px";
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
            else if ($elem.attr(attr).startsWith("/wiki/")) {
                $elem.attr(attr, wikiAddress + $elem.attr(attr).substring(6));
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
    updateWikipediaURL: function (url) {
        this.wikipediaURL = url;
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
                // fix too eager downloading of image sources
                cleaned = cleaned.replace(/src="\/(?!\/)/g, 'src="https://' + wikiLang + ".wikipedia.org/");

                // fix links in dom nodes
                cleaned = WIKI.fixLinks(cleaned, wikiLang);

                WIKI.widget.render({
                    data: cleaned,
                    message: WIKI.getTranslation("wikipediaCaption"),
                    terms: WIKI.getTranslation("wikipediaTerms"),
                    credit: WIKI.getTranslation("wikipediaCredit"),
                    wikiLang: wikiLang,
                    wikipediaURL: WIKI.wikipediaURL,
                    succeeded: true
                });
                // fix overwide tables
                $.each($("#wiki table"), function (i, elem) {
                    $(this).addClass("table");
                        var temp2 = $("<div class='table-responsive-sm'></div>");
                        if (this.tagName === "FIGURE") {
                            temp2.css("margin-bottom", $(this).css("margin-bottom"));
                            this.style["margin-bottom"] = 0;
                        }
                        temp2.insertAfter($(this));
                        $(this).detach().appendTo(temp2);
                });
                // fix overwide thumbinner classes
                $.each($("#wiki .thumbinner"), function (i, elem) {
                    if ($(this).width() > wikiWidgetWidth) {
                       this.style.width = "";
                       this.parentNode.style["overflow-x"] = "auto";
                    }
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
                    diff: content_lang !== object.wikiLang,
                    value: object.wikiLang
                },
                wikipediaCaption: object.message,
                wikipediaTermsAndConditions: object.terms,
                wikipediaCredit: object.credit,
                wikipediaURL: object.wikipediaURL,
                succeeded: object.succeeded,
                prefLang: object.prefLang,
                data: object.data
            };
            $('.concept-info').after(Handlebars.compile($('#wiki-template').html())(context));
            this.addAccordionToggleEvents();
        },
        // Handles the collapsing and expanding actions of the widget.
        toggleAccordion: function() {
            $('#collapseWiki').collapse('toggle');
            // switching the glyphicon to indicate a change in the accordion state
            WIKI.widget.flipChevron();
        },
    },
    wikipediaURL: "" // to be updated
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
        var wikiURL = null;
        var wikiLang;
        $.each(languageOrder, function (key, value) {
            if (keyLangUriValue[value]) {
                restURL = WIKI.generateQueryString(value, keyLangUriValue[value]);
                wikiLang = value;
                return false;
            }
        });

        if (restURL) {
            WIKI.updateWikipediaURL(keyLangUriValue[wikiLang]);
            WIKI.updateAddress();
            WIKI.queryWiki(restURL, wikiLang);
        }
        else {
            WIKI.widget.render({succeeded: false, message: WIKI.getTranslation("404")});
        }
    }

});
