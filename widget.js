/* global Vue */

const WIKI = {
  vueApp: null,
  createVueApp: function () {
    return Vue.createApp({
      data () {
        return {
          succeeded: WIKI.succeeded,
          message: WIKI.message,
          wikipediaLang: WIKI.wikiLang,
          wikipediaCaption: WIKI.getTranslation('wikipediaCaption'),
          wikipediaTermsAndConditions: WIKI.getTranslation('wikipediaTerms'),
          wikipediaCredit: WIKI.getTranslation('wikipediaCredit'),
          wikipediaURL: WIKI.wikipediaURL,
          wikipediaHTML: WIKI.wikipediaHTML,
          mappings: {},
          loading: true
        }
      },
      template: `<div id="wiki-widget" class="panel-group" role="tablist" aria-multiselectable="true">
                  <div class="panel panel-default">
                    <div class="panel-heading" role="tab" id="headingWiki">
                      <button
                       class="accordion-button accordion"
                       type="button"
                       data-bs-toggle="collapse"
                       data-bs-target="#collapseWiki"
                       aria-expanded="true"
                       aria-controls="collapseWiki"
                      >
                        {{wikipediaCaption}}
                      </button>
                    </div>
                    <div id="collapseWiki" class="panel-collapse collapse show" role="tabpanel" aria-labelledby="headingWiki">
                      <div v-if="succeeded" class="panel-body-wrapper">
                        <div class="panel-body">
                          <div id="wiki" class="panel mw-parser-output" role="tabpanel" aria-labelledby="headingWiki">
                            <div v-html="wikipediaHTML"></div>
                          </div>
                          <div class="wikipedia-disclaimer versal">
                            <div v-html="wikipediaTermsAndConditions" class="wikipedia-terms"></div>
                          </div>
                        </div>
                      </div>
                      <div class="wiki-missing" v-else>{{message}}</div>
                      <div v-if="succeeded" id="wikipedia-credit">
                        <a :href=wikipediaURL target="_blank" rel="noopener noreferrer">{{wikipediaCredit}}</a>
                      </div>
                    </div>
                  </div>
                </div>
              `
    })
  },
  succeeded: true,
  wikiLang: null,
  wikipediaURL: null,
  wikipediaHTML: null,
  address: '',
  getTranslation: function (key) {
    let getLang = window.SKOSMOS.lang
    if (getLang !== 'fi' && getLang !== 'sv') {
      getLang = 'en'
    }
    if (key === '404') {
      return {
        fi: 'Ei Wikipedia-sivua sanaston tukemilla kielillä.',
        sv: 'Inte något Wikipedia-sidan på vokabulär språk.',
        en: 'No Wikipedia article on any vocabulary language.'
      }[getLang]
    }
    if (key === 'error') {
      return {
        fi: 'Wikipedia-sivun lataamisessa tapahtui virhe.',
        sv: 'Wikipedia-sidan kan inte laddas.',
        en: 'Could not load Wikipedia page.'
      }[getLang]
    } else if (key === 'wikipediaCaption') {
      const pref = window.SKOSMOS.prefLabels.find(item => item.lang === getLang).label
      return {
        fi: pref + ' Wikipediassa',
        sv: pref + ' på Wikipedia',
        en: pref + ' in Wikipedia'
      }[getLang]
    } else if (key === 'wikipediaTerms') {
      return {
        fi: 'Teksti on saatavilla <a rel="license" href="//fi.wikipedia.org/wiki/Wikipedia:Creative_Commons_Attribution-Share_Alike_3.0_Unported_-lisenssiehdot" target="_blank">Creative Commons Attribution/Share-Alike</a> -lisenssillä; lisäehtoja voi sisältyä. Katso <a href="//wikimediafoundation.org/wiki/Terms_of_Use/fi" target="_blank">käyttöehdot</a>. Wikipedia® on <a href="http://www.wikimediafoundation.org" target="_blank">Wikimedia Foundationin</a> rekisteröimä tavaramerkki.',
        sv: 'Wikipedias text är tillgänglig under licensen  <a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/deed.sv" target="_blank">Creative Commons Erkännande-dela-lika 3.0 Unported</a>. För bilder, se respektive bildsida (klicka på bilden). Se vidare <a href="//sv.wikipedia.org/wiki/Wikipedia:Upphovsrätt" target="_blank">Wikipedia:Upphovsrätt</a> och <a href="//wikimediafoundation.org/wiki/Terms_of_Use" target="_blank">användarvillkor</a>.',
        en: 'Text is available under the <a rel="license" href="//en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License" target="_blank">Creative Commons Attribution-ShareAlike License</a><a rel="license" href="//creativecommons.org/licenses/by-sa/3.0/" target="_blank" style="display:none;"></a>; additional terms may apply.  By using this site, you agree to the <a href="//wikimediafoundation.org/wiki/Terms_of_Use" target="_blank">Terms of Use</a> and <a href="//wikimediafoundation.org/wiki/Privacy_policy" target="_blank">Privacy Policy</a>. Wikipedia® is a registered trademark of the <a href="//www.wikimediafoundation.org/" target="_blank">Wikimedia Foundation, Inc.</a>, a non-profit organization.'
      }[getLang]
    } else if (key === 'wikipediaCredit') {
      return {
        fi: 'Katso sivu Wikipediassa',
        sv: 'Se sidan på Wikipedia',
        en: 'See the page in Wikipedia'
      }[getLang]
    } else {
      return ''
    }
  },
  fixLinks: function (data) {
    const temp = document.createElement('div')
    temp.innerHTML = data

    const wikiAddress = 'https://' + WIKI.wikiLang + '.wikipedia.org/wiki/'
    const attrs = {
      A: ['href'],
      LINK: ['href'],
      IMG: ['src', 'srcset', 'resource']
    }

    const elements = temp.querySelectorAll('a, link, img')
    elements.forEach(elem => {
      if (elem.hash && elem.hash.startsWith('#cite_')) {
        elem.href = WIKI.address + elem.hash
      } else {
        elem.target = '_blank'
      }

      const tagAttrs = attrs[elem.tagName]
      if (!tagAttrs) return

      tagAttrs.forEach(attr => {
        WIKI.linkHelper(elem, attr, wikiAddress)
      })
    })

    const thumbinners = temp.querySelectorAll('.thumbinner')
    thumbinners.forEach(elem => {
      const maxWidth = parseInt(elem.style.maxWidth, 10)
      const width = parseInt(elem.style.width, 10)

      if (!isNaN(maxWidth)) {
        elem.style.maxWidth = (maxWidth + 8) + 'px'
      }
      if (!isNaN(width)) {
        elem.style.width = (width + 8) + 'px'
      }
    })

    return temp.innerHTML
  },
  linkHelper: function (elem, attr, wikiAddress) {
    if (elem.hasAttribute(attr)) {
      const value = elem.getAttribute(attr)

      if (value && value.startsWith('./')) {
        // fix relative links
        elem.setAttribute(attr, wikiAddress + value.substring(2))
      } else if (value && value.startsWith('//')) {
        // force https
        elem.setAttribute(attr, 'https:' + value)
      } else if (value && value.startsWith('/wiki/')) {
        elem.setAttribute(attr, wikiAddress + value.substring(6))
      }
    }
  },
  generateQueryString: function (lang, title) {
    return 'https://' + lang + '.wikipedia.org/api/rest_v1/page/html/' + title
  },
  // generateTOC: function () {}, //TODO?
  updateAddress: function () {
    this.address = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search
  },
  updateWikipediaURL: function (lang, title) {
    this.wikipediaURL = 'https://' + lang + '.wikipedia.org/wiki/' + title
  },
  queryWikidata: function (wikidataId) {
    const headers = new Headers({
      'Api-User-Agent': 'Finto.fi wikipedia widget - finto-posti@helsinki.fi'
    })
    let url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&props=sitelinks&origin=*&format=json&sitefilter='
    const languageCodes = ['fi', 'sv', 'en', 'se']
    for (const idx in languageCodes) {
      url += languageCodes[idx] + 'wiki|'
    }
    url = url.slice(0, -1)
    url += '&ids=' + wikidataId
    let wikiLabel = null
    return fetch(url, { headers })
      .then(response => {
        return response.json()
      })
      .then(data => {
        const siteLinks = data.entities[wikidataId].sitelinks
        if (Object.keys(siteLinks).length === 0) {
          return
        }
        let lang = WIKI.wikiLang
        if (WIKI.wikiLang + 'wiki' in siteLinks) {
          wikiLabel = siteLinks[WIKI.wikiLang + 'wiki'].title
        } else {
          for (const idx in languageCodes) {
            const siteName = languageCodes[idx] + 'wiki'
            if (siteName in siteLinks) {
              wikiLabel = siteLinks[siteName].title
              lang = languageCodes[idx]
              break
            }
          }
        }
        return {'lang': lang, 'label': wikiLabel}
      })
      .catch(error => {
        return {'error': 'Failed to fetch Wikidata'}
      })
  },
  queryWikipedia: function (url) {
    const headers = new Headers({
      Accept: "text/html; charset=utf-8; profile='https://www.mediawiki.org/wiki/Specs/HTML/1.6.0'",
      'Api-User-Agent': 'Finto.fi wikipedia widget - finto-posti@helsinki.fi'
    })
    fetch(url, { headers })
      .then(response => {
        if (response.status === 404) {
          WIKI.succeeded = false
          WIKI.message = WIKI.getTranslation('404')
          this.render()
          return
        }
        return response.text()
      })
      .then(data => {
        WIKI.succeeded = true
        // clean data for rendering purposes
        // take only sections
        const n = data.indexOf('<section')
        const m = data.lastIndexOf('</section>') + 10
        let cleaned = data.substring(n, m)
        // fix links in json data
        cleaned = cleaned.replace(/href":"\.\//g, 'https://' + WIKI.wikiLang + '.wikipedia.org/wiki/')
        // fix too eager downloading of image sources
        cleaned = cleaned.replace(/src="\/(?!\/)/g, 'src="https://' + WIKI.wikiLang + '.wikipedia.org/')

        // fix links in dom nodes
        cleaned = WIKI.fixLinks(cleaned)
        WIKI.wikipediaHTML = cleaned
        this.render()
      })
      .catch(error => {
        WIKI.succeeded = false
        WIKI.message = WIKI.getTranslation('error')
        this.render()
      })
  },
  appendMountPoint: function() {
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
  },
  render: function () {
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
      return
    }
    WIKI.appendMountPoint()
    WIKI.wikiLang = window.SKOSMOS.content_lang
    const context = data.jsonLd['@context']
    const jsonLdUriSpace = Object.keys(context).find(key => context[key] === window.SKOSMOS.uriSpace)
    const skosmosUriSpace = window.SKOSMOS.uriSpace
    const jsonLdUri = data.uri.replace(skosmosUriSpace, jsonLdUriSpace + ':')
    const graph = data.jsonLd.graph

    const closeMatches = []
    for (const concept of graph) {
      if (concept.uri === jsonLdUri) {
        if (Array.isArray(concept['skos:closeMatch'])) {
          for (const cm of concept['skos:closeMatch']) {
            if (cm.uri.startsWith('wd:')) {
              const wikidataId = cm.uri.replace('wd:', '')
              closeMatches.push(wikidataId)
            }
            // if Skosmos fails to fetch Wikidata:
            else if (cm.uri.startsWith('http://www.wikidata.org/wiki/')) {
              const wikidataId = cm.uri.replace('http://www.wikidata.org/wiki/', '')
              closeMatches.push(wikidataId)
            }
          }
        } else {
          if ('skos:closeMatch' in concept && concept['skos:closeMatch'].uri.startsWith('wd:')) {
            const wikidataId = concept['skos:closeMatch'].uri.replace('wd:', '')
            closeMatches.push(wikidataId)
          }
        }
      }
    }
    if (!closeMatches.length) {
      return
    }
    WIKI.wikipediaURL = null
    WIKI.address = ''
    WIKI.queryWikidata(closeMatches[0])
      .then(results => {
        if (results) {
          if (!('error' in results)) {
            // check that value is not null etc.
            if (typeof results.label === 'string') {
              const restURL = WIKI.generateQueryString(results.lang, results.label)
              WIKI.updateWikipediaURL(results.lang, results.label)
              WIKI.updateAddress()
              WIKI.queryWikipedia(restURL)
            }
          }
        }
        else {
          WIKI.succeeded = false
          WIKI.message = WIKI.getTranslation('404')
          WIKI.render()
        }
      })
  }
})
