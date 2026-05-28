/* global Vue */

const WIKI = {
  vueApp: null,
  createVueApp: function () {
    return Vue.createApp({
      data () {
        return {
          succeeded: WIKI.succeeded,
          //wikipediaLang: WIKI.wikiLang,
          wikipediaCaption: WIKI.getTranslation("wikipediaCaption"),
          wikipediaTermsAndConditions: WIKI.getTranslation("wikipediaTerms"),
          wikipediaCredit: WIKI.getTranslation("wikipediaCredit"),
          wikipediaURL: WIKI.wikipediaURL,
          restURL: WIKI.restURL,
          wikipediaHTML: WIKI.wikipediaHTML,
          mappings: {},
          loading: true
        }
      },
      template: `<div class="concept-widget panel-group" id="wikiAccordion" role="tablist" aria-multiselectable="true">
                  <div class="panel panel-default">
                    <div class="panel-heading" role="tab" id="headingWiki">
                      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseWiki" aria-expanded="true" aria-controls="collapseWiki">
                        {{wikipediaCaption}}
                      </button>
                      <!--
                      <div v-if="wikipediaLang.diff">
                        {{wikipediaLang.value}}
                      </div>
                      <div v-else>
                        {{wikipediaCaption}}
                      </div>
                      -->
                    </div>
                    <div id="collapseWiki" class="panel-collapse collapse show sidebar-grey" role="tabpanel" aria-labelledby="headingWiki">
                      <div class="panel-body">
                        <div v-html="wikipediaHTML" id="wiki" class="panel mw-parser-output" role="tabpanel" aria-labelledby="headingWikiWidget">
                        </div>
                        <!--
                        <iframe :src="restURL"></iframe>
                        -->
                      </div>
                      <div class="wikipedia-disclaimer versal">
                        <div v-html="wikipediaTermsAndConditions" class="wikipedia-terms"></div>
                        <div class="wikipedia-credit">{{wikipediaCredit}}<a href="{{wikipediaURL}}" target="_blank">{{wikipediaURL}}</a></div>
                      </div>
                    </div>
                  </div>
                </div>
              `
    })
  },
  succeeded: false,
  wikiLang: null,
  wikipediaURL: null,
  restURL: null,
  wikipediaHTML: null,
  address: "",
  getTranslation: function (key) {
    const getLang = window.SKOSMOS.lang;
    if (getLang !== "fi" && getLang !== "sv") {
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
      const pref = window.SKOSMOS.prefLabels.find(item => item.lang === getLang).label
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
    const temp = document.createElement('div');
    temp.innerHTML = data;

    const wikiAddress = 'https://' + wikiLang + '.wikipedia.org/wiki/';
    const attrs = {
      A:    ['href'],
      LINK: ['href'],
      IMG:  ['src', 'srcset', 'resource']
    };

    const elements = temp.querySelectorAll('a, link, img');
    elements.forEach(elem => {
      if (elem.hash && elem.hash.startsWith('#cite_')) {
        elem.href = WIKI.address + elem.hash;
      } else {
        elem.target = '_blank';
      }

      const tagAttrs = attrs[elem.tagName];
      if (!tagAttrs) return;

      tagAttrs.forEach(attr => {
        WIKI.linkHelper(elem, attr, wikiAddress);
      });
    });

    const thumbinners = temp.querySelectorAll('.thumbinner');
    thumbinners.forEach(elem => {
      const maxWidth = parseInt(elem.style.maxWidth, 10);
      const width = parseInt(elem.style.width, 10);

      if (!isNaN(maxWidth)) {
        elem.style.maxWidth = (maxWidth + 8) + 'px';
      }
      if (!isNaN(width)) {
        elem.style.width = (width + 8) + 'px';
      }
    });

    return temp.innerHTML;
  },
  linkHelper: function (elem, attr, wikiAddress) {
    if (elem.hasAttribute(attr)) {
      const value = elem.getAttribute(attr);

      if (value && value.startsWith('./')) {
        // fix relative links
        elem.setAttribute(attr, wikiAddress + value.substring(2));
      } else if (value && value.startsWith('//')) {
        // force https
        elem.setAttribute(attr, 'https:' + value);
      } else if (value && value.startsWith('/wiki/')) {
        elem.setAttribute(attr, wikiAddress + value.substring(6));
      }
    }
  },
  generateQueryString: function (wikiLang, url) {
      var title = url.substring(url.lastIndexOf('/') + 1, url.length);
      return 'https://' + wikiLang +'.wikipedia.org/api/rest_v1/page/html/' + title;
  },
  //generateTOC: function () {}, //TODO?
  updateAddress: function () {
      this.address = window.location.protocol + "//" +  window.location.host + window.location.pathname + window.location.search;
  },
  updateWikipediaURL: function (url) {
      this.wikipediaURL = url;
  },
  queryWiki: function(url, wikiLang) {
    const headers = new Headers({
      "Accept": "text/html; charset=utf-8; profile='https://www.mediawiki.org/wiki/Specs/HTML/1.6.0'",
      "Api-User-Agent": "Finto.fi wikipedia widget - finto-posti@helsinki.fi"
    })

    fetch(url, { headers })
      .then(response => {
        return response.text()
      })
      .then(data => {
        WIKI.succeeded = true
        // clean data for rendering purposes
        //take only sections
        const n = data.indexOf("<section");
        const m = data.lastIndexOf("</section>") + 10;
        let cleaned = data.substring(n, m);
        // fix links in json data
        cleaned = cleaned.replace(/href":"\.\//g, "https://" + wikiLang + ".wikipedia.org/wiki/");
        // fix too eager downloading of image sources
        cleaned = cleaned.replace(/src="\/(?!\/)/g, 'src="https://' + wikiLang + ".wikipedia.org/");

        // fix links in dom nodes
        cleaned = WIKI.fixLinks(cleaned, wikiLang);
        WIKI.wikipediaHTML = cleaned
        this.render()
      })
      .catch(error => {
        WIKI.succeeded = false
        this.render({
          succeeded: false,
          message: WIKI.getTranslation("error")
        })
      })
  },
  render: function (object) {
    const mountPoint = document.getElementById('wiki-plugin')
    if (mountPoint) {
      if (this.vueApp) {
        this.vueApp.unmount()
      }
      mountPoint.remove()
    }
    const newMountPoint = document.createElement('div')
    newMountPoint.id = 'wiki-plugin'
    document.getElementById('main-content-bottom-slot').appendChild(newMountPoint)

    this.vueApp = this.createVueApp()
    this.vueApp.mount('#wiki-plugin')

  },
  remove: function () {
    if (this.vueApp) {
      this.vueApp.unmount()
      this.vueApp = null
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {

  window.wikiWidget = function (data) {
    // Only activate the widget when
    // 1) on a concept page
    // 2) and there is a prefLabel
    // 3) and the json-ld data can be found
    // 4) and there exists a wikidata object
    if (data.pageType !== 'concept' || data.prefLabels === undefined || Object.keys(data.jsonLd).length === 0) {
        return;
    }
    var wikidata;
    const graph = data.jsonLd.graph

    for (const value of graph) {
      if (value.uri.startsWith("wd:")) {
        wikidata = value.uri
        break
      }
    }

    if (!wikidata) {
        return;
    }

    var wikiURL = null;
    WIKI.wikiLang;
    const prefLabel = window.SKOSMOS.prefLabels.find(item => item.lang === window.SKOSMOS.lang).label

    // quick fix for missing data containing Wikipedia URLs:
    const pref = window.SKOSMOS.prefLabels.find(item => item.lang === window.SKOSMOS.lang).label
    WIKI.restURL = WIKI.generateQueryString(window.SKOSMOS.lang, "https://fi.wikipedia.org/wiki/" + prefLabel);

    if (WIKI.restURL) {
      WIKI.updateWikipediaURL(WIKI.restURL);
      WIKI.updateAddress();
      WIKI.queryWiki(WIKI.restURL, WIKI.wikiLang);
    }
    else {
      WIKI.widget.render({succeeded: false, message: WIKI.getTranslation("404")});
    }
  }

})
