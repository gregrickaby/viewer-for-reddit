;(function (e) {
  function t(t) {
    for (
      var s, o, a = t[0], d = t[1], u = t[2], c = 0, h = [];
      c < a.length;
      c++
    )
      (o = a[c]),
        Object.prototype.hasOwnProperty.call(r, o) && r[o] && h.push(r[o][0]),
        (r[o] = 0)
    for (s in d) Object.prototype.hasOwnProperty.call(d, s) && (e[s] = d[s])
    l && l(t)
    while (h.length) h.shift()()
    return n.push.apply(n, u || []), i()
  }
  function i() {
    for (var e, t = 0; t < n.length; t++) {
      for (var i = n[t], s = !0, a = 1; a < i.length; a++) {
        var d = i[a]
        0 !== r[d] && (s = !1)
      }
      s && (n.splice(t--, 1), (e = o((o.s = i[0]))))
    }
    return e
  }
  var s = {},
    r = {app: 0},
    n = []
  function o(t) {
    if (s[t]) return s[t].exports
    var i = (s[t] = {i: t, l: !1, exports: {}})
    return e[t].call(i.exports, i, i.exports, o), (i.l = !0), i.exports
  }
  ;(o.m = e),
    (o.c = s),
    (o.d = function (e, t, i) {
      o.o(e, t) || Object.defineProperty(e, t, {enumerable: !0, get: i})
    }),
    (o.r = function (e) {
      'undefined' !== typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, {value: 'Module'}),
        Object.defineProperty(e, '__esModule', {value: !0})
    }),
    (o.t = function (e, t) {
      if ((1 & t && (e = o(e)), 8 & t)) return e
      if (4 & t && 'object' === typeof e && e && e.__esModule) return e
      var i = Object.create(null)
      if (
        (o.r(i),
        Object.defineProperty(i, 'default', {enumerable: !0, value: e}),
        2 & t && 'string' != typeof e)
      )
        for (var s in e)
          o.d(
            i,
            s,
            function (t) {
              return e[t]
            }.bind(null, s)
          )
      return i
    }),
    (o.n = function (e) {
      var t =
        e && e.__esModule
          ? function () {
              return e['default']
            }
          : function () {
              return e
            }
      return o.d(t, 'a', t), t
    }),
    (o.o = function (e, t) {
      return Object.prototype.hasOwnProperty.call(e, t)
    }),
    (o.p = '/')
  var a = (window['webpackJsonp'] = window['webpackJsonp'] || []),
    d = a.push.bind(a)
  ;(a.push = t), (a = a.slice())
  for (var u = 0; u < a.length; u++) t(a[u])
  var l = d
  n.push([0, 'chunk-vendors']), i()
})({
  0: function (e, t, i) {
    e.exports = i('cd49')
  },
  '0ab4': function (e, t, i) {},
  '0ace': function (e, t, i) {},
  '1c26': function (e, t, i) {
    'use strict'
    i('b67a')
  },
  2174: function (e, t, i) {
    'use strict'
    i('3136')
  },
  '249d': function (e, t, i) {
    'use strict'
    i('7197')
  },
  '24cb': function (e, t, i) {},
  '2a03': function (e, t, i) {},
  3136: function (e, t, i) {},
  '3bc3': function (e, t, i) {
    'use strict'
    i('5ffc')
  },
  '446c': function (e, t, i) {
    'use strict'
    i('24cb')
  },
  '5b63': function (e, t, i) {},
  '5ffc': function (e, t, i) {},
  '6ca3': function (e, t, i) {},
  '70a6': function (e, t, i) {},
  7197: function (e, t, i) {},
  7264: function (e, t, i) {},
  9741: function (e, t, i) {},
  '992c': function (e, t, i) {
    'use strict'
    i('0ab4')
  },
  afc3: function (e, t, i) {
    'use strict'
    i('0ace')
  },
  b67a: function (e, t, i) {},
  bef4: function (e, t, i) {
    'use strict'
    i('5b63')
  },
  c561: function (e, t, i) {
    'use strict'
    i('7264')
  },
  c6f0: function (e, t, i) {},
  cd49: function (e, t, i) {
    'use strict'
    i.r(t)
    var s = i('ad3d'),
      r = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i(
          'body',
          {style: e.bodyStyle},
          [
            e.isEmbedded
              ? i('div', {attrs: {id: 'app__redirect-banner'}}, [
                  i('a', {attrs: {href: e.getRedirectURL(), target: '_top'}}, [
                    e._v(e._s(e.t('views.app.redirectLink')))
                  ])
                ])
              : e._e(),
            i('Sidebar', {
              attrs: {showSidebar: e.showSidebar},
              on: {
                close: function (t) {
                  e.showSidebar = !1
                }
              }
            }),
            i(
              'div',
              {
                staticClass: 'app__navigation',
                class: {'app__navigation--hide': e.showSidebar}
              },
              [
                i('div', {staticClass: 'app__navigation-item'}, [
                  i(
                    'button',
                    {
                      staticClass: 'app__navigation-icon',
                      on: {
                        click: function (t) {
                          e.showSidebar = !0
                        }
                      }
                    },
                    [i('font-awesome-icon', {attrs: {icon: e.faBars}})],
                    1
                  )
                ]),
                i(
                  'div',
                  {staticClass: 'app__navigation-item'},
                  [
                    i(
                      'router-link',
                      {staticClass: 'app__navigation-link', attrs: {to: '/'}},
                      [e._v('popular.pics')]
                    )
                  ],
                  1
                ),
                i('div', {staticClass: 'app__navigation-item'}, [
                  i(
                    'button',
                    {
                      staticClass: 'app__navigation-icon',
                      on: {click: e.showSearch}
                    },
                    [i('font-awesome-icon', {attrs: {icon: e.faSearch}})],
                    1
                  )
                ]),
                e.showSignInSignOutLink
                  ? i('div', {staticClass: 'app__navigation-item'}, [
                      i(
                        'button',
                        {
                          staticClass: 'app__navigation-icon',
                          on: {click: e.onUserIconClick}
                        },
                        [
                          i('font-awesome-icon', {
                            attrs: {icon: e.faUserCircle}
                          }),
                          e._v(' ' + e._s(e.userIconLabel) + ' ')
                        ],
                        1
                      )
                    ])
                  : e._e()
              ]
            ),
            i('router-view')
          ],
          1
        )
      },
      n = [],
      o = i('c074')
    i('5319')
    async function a(e) {
      0
    }
    const d = new Map([
      [
        'components.post.commentsLink',
        {one: '{count} Comment', other: '{count} Comments'}
      ],
      ['components.posts.moreButton.label', 'More'],
      ['components.psearchinput.button.clear', 'Clear input'],
      ['components.sidebar.aboutLink.text', 'About'],
      ['components.sidebarSearch.searchInput.placeholder', 'Subreddit'],
      ['documentTitle.suffix', 'Viewer for Reddit'],
      ['reddit.heading.frontpage', 'Reddit frontpage'],
      ['reddit.heading.multireddit', 'Multireddit'],
      ['reddit.sort.best', 'Best'],
      ['reddit.sort.controversial', 'Controversial'],
      ['reddit.sort.hot', 'Hot'],
      ['reddit.sort.new', 'New'],
      ['reddit.sort.old', 'Old'],
      ['reddit.sort.qa', 'Q&A'],
      ['reddit.sort.rising', 'Rising'],
      ['reddit.sort.top', 'Top'],
      ['reddit.timeRange.all', 'All'],
      ['reddit.timeRange.day', 'Past day'],
      ['reddit.timeRange.hour', 'Past hour'],
      ['reddit.timeRange.month', 'Past month'],
      ['reddit.timeRange.week', 'Past week'],
      ['reddit.timeRange.year', 'Past year'],
      ['time.months.short.april', 'Apr'],
      ['time.months.short.august', 'Aug'],
      ['time.months.short.december', 'Dec'],
      ['time.months.short.february', 'Feb'],
      ['time.months.short.january', 'Jan'],
      ['time.months.short.july', 'Jul'],
      ['time.months.short.june', 'Jun'],
      ['time.months.short.march', 'Mar'],
      ['time.months.short.may', 'May'],
      ['time.months.short.november', 'Nov'],
      ['time.months.short.october', 'Oct'],
      ['time.months.short.september', 'Sep'],
      ['views.about.emailInput.placeholder', 'Your e-mail address (optional)'],
      ['views.about.heading.about', 'About popular.pics'],
      ['views.about.heading.contact', 'Contact'],
      ['views.about.messageInput.placeholder', 'Message'],
      ['views.about.pageTitle', 'About'],
      ['views.about.submission.error', 'Sending feedback failed'],
      ['views.about.submission.success', 'Thanks for the feedback!'],
      ['views.about.submitButton.label', 'Send'],
      ['views.app.redirectLink', 'Continue on popular.pics'],
      ['views.notFound.pageTitle', 'Not found']
    ])
    function u(e) {
      a('i18n: ' + e)
    }
    function l(e, t) {
      t.includes('{count}') &&
        u(
          `translation for key "${e}" has placeholder but count is not provided`
        )
    }
    function c(e, t) {
      t.includes('{count}') ||
        u(`translation for key "${e}" has no placeholder but count is provided`)
    }
    function h(e, t) {
      const i = d.get(e)
      return void 0 === i
        ? (u(`translation for key "${e}" not found`), e)
        : 'object' === typeof i
        ? 'number' !== typeof t
          ? (l(e, i.other), i.other)
          : i.one && 1 === t
          ? (c(e, i.one), i.one.replace('{count}', t.toString(10)))
          : (c(e, i.other), i.other.replace('{count}', t.toString(10)))
        : 'number' === typeof t
        ? (c(e, i), i.replace('{count}', t.toString(10)))
        : (l(e, i), i)
    }
    i('2b3d')
    class m {
      static array(e, t = []) {
        return Array.isArray(e) ? e : t
      }
      static boolean(e) {
        return Boolean(e)
      }
      static isObject(e) {
        return 'object' === typeof e && null !== e
      }
      static number(e, t = 0) {
        switch (typeof e) {
          case 'number':
            return e
          case 'string':
            return Number.parseFloat(e)
          default:
            return t
        }
      }
      static numberArray(e, t = []) {
        return Array.isArray(e) ? e.map((e) => this.number(e)) : t
      }
      static object(e, t = {}) {
        return m.isObject(e) ? e : t
      }
      static string(e, t = '') {
        switch (typeof e) {
          case 'number':
            return e.toString(10)
          case 'string':
            return e
          default:
            return t
        }
      }
      static stringArray(e, t = []) {
        return Array.isArray(e) ? e.map((e) => this.string(e)) : t
      }
    }
    function p(e) {
      return new Error('GfyItem: invalid input: ' + e)
    }
    class g {
      constructor() {
        ;(this.avgColor = ''),
          (this.contentURLs = {}),
          (this.copyrightClaimant = ''),
          (this.createDate = 0),
          (this.description = ''),
          (this.dislikes = 0),
          (this.domainWhitelist = []),
          (this.extraLemmas = ''),
          (this.frameRate = 0),
          (this.gatekeeper = 0),
          (this.geoWhitelist = []),
          (this.gfyID = ''),
          (this.gfyName = ''),
          (this.gfyNumber = 0),
          (this.gfySlug = ''),
          (this.gif100px = ''),
          (this.gifSize = 0),
          (this.gifURL = ''),
          (this.hasAudio = !1),
          (this.hasTransparency = !1),
          (this.height = 0),
          (this.languageCategories = []),
          (this.languageText = ''),
          (this.likes = 0),
          (this.max1mbGif = ''),
          (this.max2mbGif = ''),
          (this.max5mbGif = ''),
          (this.md5 = ''),
          (this.miniPosterURL = ''),
          (this.miniURL = ''),
          (this.mobilePosterURL = ''),
          (this.mobileURL = ''),
          (this.mp4Size = 0),
          (this.mp4URL = ''),
          (this.nsfw = 0),
          (this.numFrames = 0),
          (this.posterURL = ''),
          (this.published = !1),
          (this.rating = ''),
          (this.source = 0),
          (this.tags = []),
          (this.thumb100PosterURL = ''),
          (this.title = ''),
          (this.userDisplayName = ''),
          (this.userName = ''),
          (this.userProfileImageURL = ''),
          (this.views = 0),
          (this.webmSize = 0),
          (this.webmURL = ''),
          (this.webpURL = ''),
          (this.width = 0)
      }
      static fromJSON(e) {
        if (!m.isObject(e)) throw p(e)
        const t = new g()
        return (
          (t.avgColor = m.string(e.avgColor)),
          (t.contentURLs = this.contentURLsFromJSON(e.content_urls)),
          (t.copyrightClaimant = m.string(e.copyrightClaimaint)),
          (t.createDate = m.number(e.createDate)),
          (t.description = m.string(e.description)),
          (t.dislikes = m.number(e.dislikes)),
          (t.domainWhitelist = m.stringArray(e.domainWhitelist)),
          (t.extraLemmas = m.string(e.extraLemmas)),
          (t.frameRate = m.number(e.frameRate)),
          (t.gatekeeper = m.number(e.gatekeeper)),
          (t.geoWhitelist = m.stringArray(e.geoWhitelist)),
          (t.gfyID = m.string(e.gfyId)),
          (t.gfyName = m.string(e.gfyName)),
          (t.gfyNumber = m.number(e.gfyNumber)),
          (t.gfySlug = m.string(e.gfySlug)),
          (t.gif100px = m.string(e.gif100px)),
          (t.gifSize = m.number(e.gifSize)),
          (t.gifURL = m.string(e.gifUrl)),
          (t.hasAudio = m.boolean(e.hasAudio)),
          (t.hasTransparency = m.boolean(e.hasTransparency)),
          (t.height = m.number(e.height)),
          (t.languageCategories = m.stringArray(e.languageCategories)),
          (t.languageText = m.string(e.languageText)),
          (t.likes = m.number(e.likes)),
          (t.max1mbGif = m.string(e.max1mbGif)),
          (t.max2mbGif = m.string(e.max2mbGif)),
          (t.max5mbGif = m.string(e.max5mbGif)),
          (t.md5 = m.string(e.md5)),
          (t.miniPosterURL = m.string(e.miniPosterUrl)),
          (t.miniURL = m.string(e.miniUrl)),
          (t.mobilePosterURL = m.string(e.mobilePosterUrl)),
          (t.mobileURL = m.string(e.mobileUrl)),
          (t.mp4Size = m.number(e.mp4Size)),
          (t.mp4URL = m.string(e.mp4Url)),
          (t.nsfw = m.number(e.nsfw)),
          (t.numFrames = m.number(e.numFrames)),
          (t.posterURL = m.string(e.posterUrl)),
          (t.published = m.boolean(e.published)),
          (t.rating = m.string(e.rating)),
          (t.source = m.number(e.source)),
          (t.tags = m.stringArray(e.tags)),
          (t.thumb100PosterURL = m.string(e.thumb100PosterUrl)),
          (t.title = m.string(e.title)),
          (t.userData = this.userDataFromJSON(e.userData)),
          (t.userDisplayName = m.string(e.userDisplayName)),
          (t.userName = m.string(e.userName)),
          (t.userProfileImageURL = m.string(e.userProfileImageUrl)),
          (t.views = m.number(e.views)),
          (t.webmSize = m.number(e.webmSize)),
          (t.webmURL = m.string(e.webmUrl)),
          (t.webpURL = m.string(e.webpUrl)),
          (t.width = m.number(e.width)),
          t
        )
      }
      static contentURLsFromJSON(e) {
        const t = {}
        return m.isObject(e)
          ? (Object.getOwnPropertyNames(e).forEach((i) => {
              const s = e[i]
              m.isObject(s) &&
                (t[i] = {
                  height: m.number(s.width),
                  size: m.number(s.size),
                  url: m.string(s.url),
                  width: m.number(s.width)
                })
            }),
            t)
          : t
      }
      static userDataFromJSON(e) {
        if (m.isObject(e))
          return {
            followers: m.number(e.followers),
            following: m.number(e.following),
            name: m.string(e.name),
            profileImageURL: m.string(e.profileImageUrl),
            profileURL: m.string(e.profileUrl),
            subscription: m.number(e.subscription),
            url: m.string(e.url),
            username: m.string(e.username),
            verified: m.boolean(e.verified),
            views: m.number(e.views)
          }
      }
    }
    const b = ''
    var f, v
    ;(function (e) {
      ;(e['Get'] = 'GET'), (e['Post'] = 'POST')
    })(f || (f = {}))
    class w {
      static async do(e, t, i) {
        const s = b + '/api/gfycat',
          r = await fetch(s, {
            body: JSON.stringify({
              method: e,
              path: t,
              query: Object.fromEntries(i.entries())
            }),
            credentials: 'omit',
            headers: {'Content-Type': 'application/json'},
            method: f.Post
          })
        if (!r.ok) throw new Error('Gfycat: network request failed')
        const n = r.headers.get('Content-Type'),
          o = 'application/json'
        if (n !== o)
          throw new Error(
            `Gfycat: expected header "Content-Type" to be "${o}", got "${n}"`
          )
        return r.json()
      }
      static async getGfyItem(e) {
        const t = await this.do(f.Get, '/v1/gfycats/' + e, new Map())
        return m.isObject(t) ? g.fromJSON(t.gfyItem) : new g()
      }
    }
    class y {
      constructor(e) {
        ;(this.sources = []), (this.videoPosterURL = ''), (this.type = e)
      }
    }
    class _ {
      constructor() {
        ;(this.height = 0),
          (this.mimeType = ''),
          (this.url = ''),
          (this.width = 0)
      }
    }
    ;(function (e) {
      ;(e['Audio'] = 'audio'),
        (e['Image'] = 'image'),
        (e['Text'] = 'text'),
        (e['Video'] = 'video')
    })(v || (v = {}))
    var S = v
    class R {
      static detect(e) {
        const t = new URL(e)
        return /\.jpe?g$/i.test(t.pathname)
          ? R.IMAGE_JPEG
          : /\.png$/i.test(t.pathname)
          ? R.IMAGE_PNG
          : ''
      }
    }
    ;(R.IMAGE_JPEG = 'image/jpeg'),
      (R.IMAGE_PNG = 'image/png'),
      (R.VIDEO_MP4 = 'video/mp4')
    const T = new RegExp(
        /^https?:\/\/gfycat\.com(?:\/gifs\/detail)?\/([a-z0-9]+)/i
      ),
      k = new RegExp(/\.(?:jpeg|jpg|png)$/i),
      L = new RegExp(/^https?:\/\/i\.imgur\.com\/(.+)$/i)
    class P {
      constructor() {
        ;(this.commentCount = 0),
          (this.commentsURL = ''),
          (this.dateCreated = new Date(0)),
          (this.forumName = ''),
          (this.forumURL = {}),
          (this.id = ''),
          (this.isPinned = !1),
          (this.mediaFiles = []),
          (this.ranDiscoverMediaFiles = !1),
          (this.title = ''),
          (this.url = ''),
          (this.username = ''),
          (this.userURL = '')
      }
      async discoverMediaFiles() {
        if (this.ranDiscoverMediaFiles) return Promise.resolve()
        if (
          ((this.ranDiscoverMediaFiles = !0),
          this.hint instanceof U && this.hint.isSelf)
        )
          return Promise.resolve()
        const e = T.exec(this.url)
        if (e && e[1]) {
          try {
            const t = await w.getGfyItem(e[1]),
              i = new y(S.Video)
            if (((i.videoPosterURL = t.posterURL), 'mp4' in t.contentURLs)) {
              const e = t.contentURLs['mp4'],
                s = new _()
              ;(s.height = e.height),
                (s.mimeType = P.getMimeType(e.url)),
                (s.url = e.url),
                (s.width = e.width),
                i.sources.push(s)
            } else if (t.mp4URL) {
              const e = new _()
              ;(e.height = t.height),
                (e.mimeType = P.getMimeType(t.mp4URL)),
                (e.url = t.mp4URL),
                (e.width = t.width),
                i.sources.push(e)
            }
            if ('webm' in t.contentURLs) {
              const e = t.contentURLs['webm'],
                s = new _()
              ;(s.height = e.height),
                (s.mimeType = P.getMimeType(e.url)),
                (s.url = e.url),
                (s.width = e.width),
                i.sources.push(s)
            } else if (t.webmURL) {
              const e = new _()
              ;(e.height = t.height),
                (e.mimeType = P.getMimeType(t.webmURL)),
                (e.url = t.webmURL),
                (e.width = t.width),
                i.sources.push(e)
            }
            i.sources.length > 0 && this.mediaFiles.push(i)
          } catch (r) {
            a(r)
          }
          return Promise.resolve()
        }
        if (this.hint instanceof U) {
          var t, i
          if (this.hint.media.redditVideo) {
            const e = new y(S.Video)
            e.videoPosterURL =
              this.hint.preview && this.hint.preview.images.length > 0
                ? this.hint.preview.images[0].source.url
                : ''
            const t = new _()
            return (
              (t.height = this.hint.media.redditVideo.height),
              (t.mimeType = R.VIDEO_MP4),
              (t.url = this.hint.media.redditVideo.fallbackURL),
              (t.width = this.hint.media.redditVideo.width),
              e.sources.push(t),
              void this.mediaFiles.push(e)
            )
          }
          if (
            null !== (t = this.hint.preview) &&
            void 0 !== t &&
            t.redditVideoPreview
          ) {
            const e = new y(S.Video)
            e.videoPosterURL =
              this.hint.preview.images.length > 0
                ? this.hint.preview.images[0].source.url
                : ''
            const t = new _()
            return (
              (t.height = this.hint.preview.redditVideoPreview.height),
              (t.mimeType = R.VIDEO_MP4),
              (t.url = this.hint.preview.redditVideoPreview.fallbackURL),
              (t.width = this.hint.preview.redditVideoPreview.width),
              e.sources.push(t),
              void this.mediaFiles.push(e)
            )
          }
          if (
            (null === (i = this.hint.preview) ||
              void 0 === i ||
              i.images.forEach((e) => {
                if ('mp4' in e.variants) {
                  const t = new y(S.Video)
                  t.videoPosterURL = e.source.url
                  const i = [
                    e.variants.mp4.source,
                    ...e.variants.mp4.resolutions
                  ]
                  i.forEach((e) => {
                    const i = new _()
                    ;(i.height = e.height),
                      (i.mimeType = R.VIDEO_MP4),
                      (i.url = e.url),
                      (i.width = e.width),
                      t.sources.push(i)
                  }),
                    this.mediaFiles.push(t)
                } else {
                  const t = new y(S.Image),
                    i = [e.source, ...e.resolutions]
                  i.forEach((e) => {
                    const i = new _()
                    ;(i.height = e.height),
                      (i.mimeType = R.detect(e.url)),
                      (i.url = e.url),
                      (i.width = e.width),
                      t.sources.push(i)
                  }),
                    this.mediaFiles.push(t)
                }
              }),
            this.mediaFiles.length > 0)
          )
            return Promise.resolve()
        }
        const s = L.exec(this.url)
        if (
          (s && s[1] && (this.url = 'https://i.imgur.com/' + s[1]),
          k.test(this.url))
        ) {
          const e = new y(S.Image),
            t = new _()
          ;(t.mimeType = R.detect(this.url)),
            (t.url = this.url),
            e.sources.push(t),
            this.mediaFiles.push(e)
        }
        return Promise.resolve()
      }
      static getMimeType(e) {
        return /\.mp4$/i.test(e)
          ? 'video/mp4'
          : /\.gif$/i.test(e)
          ? 'image/gif'
          : /\.jpe?g$/i.test(e)
          ? 'image/jpeg'
          : /\.webm$/i.test(e)
          ? 'video/webm'
          : ''
      }
    }
    var N
    ;(function (e) {
      ;(e['About'] = 'About'),
        (e['Feedback'] = 'Feedback'),
        (e['NotFound'] = 'NotFound'),
        (e['Reddit'] = 'Reddit'),
        (e['RedditAuth'] = 'RedditAuth'),
        (e['RedditSearch'] = 'RedditSearch'),
        (e['RedditSubreddits'] = 'RedditSubreddits'),
        (e['RedditThread'] = 'RedditThread'),
        (e['RedditUser'] = 'RedditUser')
    })(N || (N = {}))
    var C,
      O = N
    class x {
      static subredditsPosts(e) {
        var t, i, s
        return {
          name: O.RedditSubreddits,
          query: {
            after: e.after || void 0,
            before: e.before || void 0,
            count:
              (null === (t = e.count) || void 0 === t
                ? void 0
                : t.toString(10)) || void 0,
            limit:
              (null === (i = e.limit) || void 0 === i
                ? void 0
                : i.toString(10)) || void 0,
            r:
              (null === (s = e.subredditNames) || void 0 === s
                ? void 0
                : s.join(',')) || void 0,
            sort: e.sort || void 0,
            t: e.timeRange || void 0
          }
        }
      }
    }
    class U {
      constructor(e) {
        if (
          ((this.archived = !1),
          (this.author = ''),
          (this.authorFullname = ''),
          (this.clicked = !1),
          (this.created = 0),
          (this.createdUTC = 0),
          (this.domain = ''),
          (this.downs = 0),
          (this.edited = !1),
          (this.hidden = !1),
          (this.isMeta = !1),
          (this.isOriginalContent = !1),
          (this.isSelf = !1),
          (this.isVideo = !1),
          (this.media = {}),
          (this.name = ''),
          (this.numComments = 0),
          (this.over18 = !1),
          (this.permalink = ''),
          (this.pinned = !1),
          (this.score = 0),
          (this.stickied = !1),
          (this.subreddit = ''),
          (this.subredditID = ''),
          (this.subredditNamePrefixed = ''),
          (this.subredditSubscribers = 0),
          (this.subredditType = ''),
          (this.title = ''),
          (this.ups = 0),
          (this.url = ''),
          (this.visited = !1),
          !e)
        )
          throw new Error('Link: invalid id')
        this.id = e
      }
      toPost() {
        const e = new P()
        return (
          (e.commentsURL = 'https://www.reddit.com' + this.permalink),
          (e.commentCount = this.numComments),
          (e.dateCreated = new Date(1e3 * this.createdUTC)),
          (e.forumName = this.subredditNamePrefixed),
          (e.forumURL = x.subredditsPosts({subredditNames: [this.subreddit]})),
          (e.hint = this),
          (e.id = this.id),
          (e.isPinned = this.pinned || this.stickied),
          (e.title = this.title),
          (e.url = this.url),
          (e.username = this.author),
          (e.userURL = `https://www.reddit.com/user/${this.author}/posts`),
          e
        )
      }
      static fromJSON(e) {
        if (!m.isObject(e)) throw new Error('Link: invalid input "$(input)"')
        const t = new U(m.string(e.id))
        return (
          (t.archived = m.boolean(e.archived)),
          (t.author = m.string(e.author)),
          (t.authorFullname = m.string(e.author_fullname)),
          (t.clicked = m.boolean(e.clicked)),
          (t.created = m.number(e.created)),
          (t.createdUTC = m.number(e.created_utc)),
          (t.domain = m.string(e.domain)),
          (t.downs = m.number(e.downs)),
          (t.edited = m.boolean(e.edited)),
          (t.hidden = m.boolean(e.hidden)),
          (t.isMeta = m.boolean(e.is_meta)),
          (t.isOriginalContent = m.boolean(e.is_original_content)),
          (t.isSelf = m.boolean(e.is_self)),
          (t.isVideo = m.boolean(e.is_video)),
          (t.name = m.string(e.name)),
          (t.numComments = m.number(e.num_comments)),
          (t.over18 = m.boolean(e.over_18)),
          (t.permalink = m.string(e.permalink)),
          (t.pinned = m.boolean(e.pinned)),
          (t.preview = U.previewFromJSON(e.preview)),
          (t.score = m.number(e.score)),
          (t.stickied = m.boolean(e.stickied)),
          (t.subreddit = m.string(e.subreddit)),
          (t.subredditID = m.string(e.subreddit_id)),
          (t.subredditNamePrefixed = m.string(e.subreddit_name_prefixed)),
          (t.subredditSubscribers = m.number(e.subreddit_subscribers)),
          (t.subredditType = m.string(e.subreddit_type)),
          (t.title = m.string(e.title)),
          (t.ups = m.number(e.ups)),
          (t.url = m.string(e.url)),
          (t.visited = m.boolean(e.visited)),
          m.isObject(e.media) &&
            e.media.reddit_video &&
            (t.media.redditVideo = this.videoFromJSON(e.media.reddit_video)),
          t
        )
      }
      static previewFromJSON(e) {
        const t = {enabled: !1, images: []}
        return m.isObject(e)
          ? ((t.enabled = m.boolean(e.enabled)),
            (t.images = Array.isArray(e.images)
              ? e.images.map((e) => U.imageFromJSON(e))
              : []),
            (t.redditVideoPreview = this.videoFromJSON(e.reddit_video_preview)),
            t)
          : t
      }
      static imageFromJSON(e) {
        const t = {
          id: '',
          resolutions: [],
          source: {height: 0, url: '', width: 0},
          variants: {}
        }
        return m.isObject(e)
          ? ((t.id = m.string(e.id)),
            (t.resolutions = U.resolutionsFromJSON(e.resolutions)),
            (t.source = U.sourceFromJSON(e.source)),
            m.isObject(e.variants) &&
              Object.entries(e.variants).forEach(([e, i]) => {
                m.isObject(i) &&
                  (t.variants[e] = {
                    resolutions: U.resolutionsFromJSON(i.resolutions),
                    source: U.sourceFromJSON(i.source)
                  })
              }),
            t)
          : t
      }
      static resolutionsFromJSON(e) {
        return Array.isArray(e) ? e.map((e) => U.sourceFromJSON(e)) : []
      }
      static sourceFromJSON(e) {
        const t = {height: 0, url: '', width: 0}
        return m.isObject(e)
          ? ((t.height = m.number(e.height)),
            (t.url = m.string(e.url)),
            (t.width = m.number(e.width)),
            t)
          : t
      }
      static videoFromJSON(e) {
        if (m.isObject(e))
          return {
            dashURL: m.string(e.dash_url),
            duration: m.number(e.duration),
            fallbackURL: m.string(e.fallback_url),
            height: m.number(e.height),
            hlsURL: m.string(e.hls_url),
            isGIF: m.boolean(e.is_gif),
            scrubberMediaURL: m.string(e.scrubber_media_url),
            transcodingStatus: m.string(e.transcoding_status),
            width: m.number(e.width)
          }
      }
    }
    class A {
      constructor(e) {
        if (
          ((this.accountsActiveIsFuzzed = !1),
          (this.advertiserCategory = ''),
          (this.allOriginalContent = !1),
          (this.allowDiscovery = !1),
          (this.allowImages = !1),
          (this.allowVideoGifs = !1),
          (this.allowVideos = !1),
          (this.bannerBackgroundColor = ''),
          (this.bannerBackgroundImage = ''),
          (this.bannerImg = ''),
          (this.bannerSize = [800, 240]),
          (this.canAssignLinkFlair = !1),
          (this.canAssignUserFlair = !1),
          (this.collapseDeletedComments = !1),
          (this.commentScoreHideMins = 0),
          (this.communityIcon = ''),
          (this.contentCategory = ''),
          (this.created = 0),
          (this.createdUTC = 0),
          (this.description = ''),
          (this.descriptionHTML = ''),
          (this.disableContributorRequests = !1),
          (this.displayName = ''),
          (this.displayNamePrefixed = ''),
          (this.emojisEnabled = !1),
          (this.freeFormReports = !1),
          (this.hasMenuWidget = !1),
          (this.headerImg = ''),
          (this.headerSize = [91, 70]),
          (this.headerTitle = ''),
          (this.hideAds = !1),
          (this.iconImg = ''),
          (this.iconSize = [256, 256]),
          (this.id = ''),
          (this.keyColor = ''),
          (this.lang = ''),
          (this.linkFlairEnabled = !1),
          (this.linkFlairPosition = ''),
          (this.mobileBannerImage = ''),
          (this.name = ''),
          (this.originalContentTagEnabled = !1),
          (this.over18 = !1),
          (this.primaryColor = ''),
          (this.publicDescription = ''),
          (this.publicDescriptionHTML = ''),
          (this.publicTraffic = !1),
          (this.quarantine = !1),
          (this.restrictCommenting = !1),
          (this.restrictPosting = !1),
          (this.showMedia = !1),
          (this.showMediaPreview = !1),
          (this.spoilersEnabled = !1),
          (this.submissionType = ''),
          (this.submitText = ''),
          (this.submitTextHTML = ''),
          (this.subredditType = ''),
          (this.subscribers = 0),
          (this.title = ''),
          (this.url = ''),
          (this.userFlairEnabledInSR = !1),
          (this.userFlairPosition = ''),
          (this.userFlairType = ''),
          (this.userSRThemeEnabled = !1),
          (this.videostreamLinksCount = 0),
          (this.whitelistStatus = ''),
          (this.wikiEnabled = !1),
          (this.wls = 0),
          !e)
        )
          throw new Error('Subreddit: invalid id')
        this.id = e
      }
      static fromJSON(e) {
        if (!m.isObject(e)) throw new Error(`Subreddit: invalid input "${e}"`)
        const t = new A(m.string(e.id))
        return (
          (t.accountsActiveIsFuzzed = m.boolean(e.accounts_active_is_fuzzed)),
          (t.advertiserCategory = m.string(e.advertiser_category)),
          (t.allOriginalContent = m.boolean(e.all_original_content)),
          (t.allowDiscovery = m.boolean(e.allow_discovery)),
          (t.allowImages = m.boolean(e.allow_images)),
          (t.allowVideoGifs = m.boolean(e.allow_videogifs)),
          (t.allowVideos = m.boolean(e.allow_videos)),
          (t.bannerBackgroundColor = m.string(e.banner_background_color)),
          (t.bannerBackgroundImage = m.string(e.banner_background_image)),
          (t.bannerImg = m.string(e.banner_img)),
          (t.bannerSize = m.numberArray(e.banner_size)),
          (t.canAssignLinkFlair = m.boolean(e.can_assign_link_flair)),
          (t.canAssignUserFlair = m.boolean(e.can_assign_user_flair)),
          (t.collapseDeletedComments = m.boolean(e.collapse_deleted_comments)),
          (t.commentScoreHideMins = m.number(e.comment_score_hide_mins)),
          (t.communityIcon = m.string(e.community_icon)),
          (t.contentCategory = m.string(e.content_category)),
          (t.created = m.number(e.created)),
          (t.createdUTC = m.number(e.created_utc)),
          (t.description = m.string(e.description)),
          (t.descriptionHTML = m.string(e.description_html)),
          (t.disableContributorRequests = m.boolean(
            e.disable_contributor_requests
          )),
          (t.displayName = m.string(e.display_name)),
          (t.displayNamePrefixed = m.string(e.display_name_prefixed)),
          (t.emojisEnabled = m.boolean(e.emojis_enabled)),
          (t.freeFormReports = m.boolean(e.free_form_reports)),
          (t.hasMenuWidget = m.boolean(e.has_menu_widget)),
          (t.headerImg = m.string(e.header_img)),
          (t.headerSize = m.numberArray(e.header_size)),
          (t.headerTitle = m.string(e.header_title)),
          (t.hideAds = m.boolean(e.hide_ads)),
          (t.iconImg = m.string(e.icon_img)),
          (t.iconSize = m.numberArray(e.icon_size)),
          (t.keyColor = m.string(e.key_color)),
          (t.lang = m.string(e.lang)),
          (t.linkFlairEnabled = m.boolean(e.link_flair_enabled)),
          (t.linkFlairPosition = m.string(e.link_flair_position)),
          (t.mobileBannerImage = m.string(e.mobile_banner_image)),
          (t.name = m.string(e.name)),
          (t.originalContentTagEnabled = m.boolean(
            e.original_content_tag_enabled
          )),
          (t.over18 = m.boolean(e.over18)),
          (t.primaryColor = m.string(e.primary_color)),
          (t.publicDescription = m.string(e.public_description)),
          (t.publicDescriptionHTML = m.string(e.public_description_html)),
          (t.publicTraffic = m.boolean(e.public_traffic)),
          (t.quarantine = m.boolean(e.quarantine)),
          (t.restrictCommenting = m.boolean(e.restrict_commenting)),
          (t.restrictPosting = m.boolean(e.restrict_posting)),
          (t.showMedia = m.boolean(e.show_media)),
          (t.showMediaPreview = m.boolean(e.show_media_preview)),
          (t.spoilersEnabled = m.boolean(e.spoilers_enabled)),
          (t.submissionType = m.string(e.submission_type)),
          (t.submitText = m.string(e.submit_text)),
          (t.submitTextHTML = m.string(e.submit_text_html)),
          (t.subredditType = m.string(e.subreddit_type)),
          (t.subscribers = m.number(e.subscribers)),
          (t.title = m.string(e.title)),
          (t.url = m.string(e.url)),
          (t.userFlairEnabledInSR = m.boolean(e.user_flair_enabled_in_sr)),
          (t.userFlairPosition = m.string(e.user_flair_position)),
          (t.userFlairType = m.string(e.user_flair_type)),
          (t.userSRThemeEnabled = m.boolean(e.user_sr_theme_enabled)),
          (t.videostreamLinksCount = m.number(e.videostream_links_count)),
          (t.whitelistStatus = m.string(e.whitelist_status)),
          (t.wikiEnabled = m.boolean(e.wiki_enabled)),
          (t.wls = m.number(e.wls)),
          t
        )
      }
    }
    ;(function (e) {
      ;(e['Account'] = 't2'),
        (e['Award'] = 't6'),
        (e['Comment'] = 't1'),
        (e['Link'] = 't3'),
        (e['Message'] = 't4'),
        (e['Subreddit'] = 't5')
    })(C || (C = {}))
    var F = C
    class I {
      constructor() {
        ;(this.after = ''),
          (this.before = ''),
          (this.children = []),
          (this.dist = 0),
          (this.modhash = '')
      }
      static fromJSON(e) {
        if (!m.isObject(e) || 'Listing' !== e.kind)
          throw new Error('Listing: invalid input: ' + e)
        const t = new I(),
          i = m.isObject(e.data) ? e.data : {}
        return (
          (t.after = m.string(i.after)),
          (t.before = m.string(i.before)),
          (t.dist = m.number(i.dist)),
          (t.modhash = m.string(i.modhash)),
          m.array(i.children).forEach((e) => {
            if (m.isObject(e))
              switch (e.kind) {
                case F.Link: {
                  const i = U.fromJSON(e.data)
                  t.children.push(i)
                  break
                }
                case F.Subreddit: {
                  const i = A.fromJSON(e.data)
                  t.children.push(i)
                  break
                }
              }
          }),
          t
        )
      }
    }
    class E {
      static getItem(e) {
        const t = localStorage.getItem(e)
        return null === t ? '' : JSON.parse(t)
      }
      static setItem(e, t) {
        localStorage.setItem(e, JSON.stringify(t))
      }
    }
    var j = i('2b0e')
    const M = () =>
      new j['default']({
        data() {
          return {
            focusSearchField: !1,
            pageTitle: '',
            redditAuth: {accessToken: '', scope: [], tokenType: ''}
          }
        },
        computed: {
          userIsSignedIn() {
            return (
              '' !== this.redditAuth.accessToken &&
              this.redditAuth.scope.length > 0 &&
              '' !== this.redditAuth.tokenType
            )
          }
        },
        created() {
          ;(this.redditAuth.accessToken = m.string(
            E.getItem('reddit.auth.accessToken')
          )),
            (this.redditAuth.scope = m.stringArray(
              E.getItem('reddit.auth.scope')
            )),
            (this.redditAuth.tokenType = m.string(
              E.getItem('reddit.auth.tokenType')
            ))
        },
        watch: {
          redditAuth: {
            deep: !0,
            handler() {
              E.setItem('reddit.auth.accessToken', this.redditAuth.accessToken),
                E.setItem('reddit.auth.scope', this.redditAuth.scope),
                E.setItem('reddit.auth.tokenType', this.redditAuth.tokenType)
            }
          }
        },
        methods: {
          signIn(e) {
            ;(this.redditAuth.accessToken = e.accessToken),
              (this.redditAuth.scope = e.scope),
              (this.redditAuth.tokenType = e.tokenType)
          },
          signOut() {
            ;(this.redditAuth.accessToken = ''),
              (this.redditAuth.scope = []),
              (this.redditAuth.tokenType = '')
          }
        }
      })
    var $,
      q = M()
    const B = '',
      D = new Error('reddit: unauthorized')
    function z(e) {
      return m.isObject(e) && 401 === e.error && 'Unauthorized' === e.message
    }
    class V {
      static getAuthURL(e, t, i, s) {
        const r = new URL('https://www.reddit.com/api/v1/authorize')
        return (
          r.searchParams.set('client_id', e),
          r.searchParams.set('redirect_uri', t),
          r.searchParams.set('response_type', 'token'),
          r.searchParams.set('scope', i.join(' ')),
          r.searchParams.set('state', s),
          r
        )
      }
      static async do(e, t, i, s = {}) {
        i.has('raw_json') || i.set('raw_json', ['1'])
        const r = {'Content-Type': 'application/json'}
        q.userIsSignedIn &&
          (r['Authorization'] =
            q.redditAuth.tokenType + ' ' + q.redditAuth.accessToken)
        const n = await fetch(B + '/api/reddit', {
          body: JSON.stringify({
            host: r['Authorization'] ? 'oauth.reddit.com' : 'www.reddit.com',
            method: e,
            path: t,
            query: Object.fromEntries(i.entries())
          }),
          credentials: 'omit',
          headers: r,
          method: 'POST',
          signal: s.abortSignal
        })
        if (!n.ok) throw new Error('API: network request failed')
        const o = n.headers.get('Content-Type'),
          a = 'application/json; charset=UTF-8'
        if (o !== a)
          throw new Error(
            `API: expected header "Content-Type" to be "${a}", got "${o}"`
          )
        const d = await n.json()
        if (z(d)) throw (q.signOut(), D)
        return d
      }
      static async getSubredditPosts(
        e,
        t,
        i,
        s,
        r,
        n,
        o = this.defaultLimit,
        a = {}
      ) {
        let d = e.length > 0 ? '/r/' + e.join('+') : ''
        r && (d += '/' + r)
        const u = await this.do(
          'GET',
          d + '.json',
          new Map([
            ['after', [t]],
            ['before', [i]],
            ['count', [s.toString(10)]],
            ['limit', [o.toString(10)]],
            ['t', [n]]
          ]),
          {abortSignal: a.abortSignal}
        )
        return I.fromJSON(u)
      }
      static async getSubreddits(e, t, i, s, r = this.defaultLimit, n = {}) {
        const o = await this.do(
          'GET',
          `/subreddits/${s}.json`,
          new Map([
            ['after', [e]],
            ['before', [t]],
            ['count', [i.toString(10)]],
            ['limit', [r.toString(10)]],
            ['show', []],
            ['sr_detail', []]
          ]),
          {abortSignal: n.abortSignal}
        )
        return I.fromJSON(o)
      }
      static async getUserPosts(e, t, i, s, r, n, o = {}) {
        const a = await this.do(
          'GET',
          `/user/${e}/submitted/.json`,
          new Map([
            ['after', [t]],
            ['before', [i]],
            ['count', [s.toString(10)]],
            ['sort', [r]],
            ['t', [n]]
          ]),
          {abortSignal: o.abortSignal}
        )
        return I.fromJSON(a)
      }
      static async search(e, t, i, s, r = this.defaultLimit, n = {}) {
        const o = new Map([
          ['after', [t]],
          ['count', [i.toString(10)]],
          ['limit', [r.toString(10)]],
          ['q', [e]],
          ['show', ['all']],
          ['type', ['sr']],
          ['include_over_18', ['true']]
        ])
        s && o.set('t', [s])
        const a = await this.do('GET', '/search/.json', o, {
          abortSignal: n.abortSignal
        })
        return I.fromJSON(a)
      }
      static async searchSubreddit(e, t, i, s, r = this.defaultLimit, n = {}) {
        const o = await this.do(
          'GET',
          '/subreddits/search/.json',
          new Map([
            ['after', [t]],
            ['count', [i.toString(10)]],
            ['limit', [r.toString(10)]],
            ['q', [e]],
            ['include_over_18', ['true']],
            ['sort', [s]]
          ]),
          {abortSignal: n.abortSignal}
        )
        return I.fromJSON(o)
      }
    }
    V.defaultLimit =
      Number.parseInt(null !== ($ = '25') && void 0 !== $ ? $ : '', 10) || 25
    var J = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i('transition', {attrs: {name: 'sidebar'}}, [
          i(
            'div',
            {
              directives: [
                {
                  name: 'show',
                  rawName: 'v-show',
                  value: e.showSidebar,
                  expression: 'showSidebar'
                }
              ],
              attrs: {id: 'sidebar__overlay'},
              on: {
                click: function (t) {
                  return t.target !== t.currentTarget ? null : e.$emit('close')
                }
              }
            },
            [
              i('div', {attrs: {id: 'sidebar'}}, [
                i(
                  'div',
                  {attrs: {id: 'sidebar__header'}},
                  [
                    i(
                      'router-link',
                      {attrs: {id: 'sidebar__home-link', to: '/'}},
                      [e._v('popular.pics')]
                    ),
                    i(
                      'button',
                      {
                        attrs: {id: 'sidebar__close-button'},
                        on: {
                          click: function (t) {
                            return e.$emit('close')
                          }
                        }
                      },
                      [i('font-awesome-icon', {attrs: {icon: e.faTimes}})],
                      1
                    )
                  ],
                  1
                ),
                i(
                  'div',
                  {attrs: {id: 'sidebar__scrollable'}},
                  [
                    i('SidebarSearch', {attrs: {id: 'sidebar__search'}}),
                    i(
                      'div',
                      {attrs: {id: 'sidebar__footer'}},
                      [
                        i(
                          'router-link',
                          {
                            staticClass: 'sidebar__footer-item',
                            attrs: {to: e.aboutURL}
                          },
                          [e._v(e._s(e.t('components.sidebar.aboutLink.text')))]
                        )
                      ],
                      1
                    )
                  ],
                  1
                )
              ])
            ]
          )
        ])
      },
      G = [],
      H = i('a6f4'),
      W = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i(
          'div',
          [
            i(
              'form',
              {
                staticStyle: {padding: '1.2rem 1.2rem 0'},
                attrs: {autocomplete: 'off'},
                on: {
                  submit: function (t) {
                    return t.preventDefault(), e.onSearch(t)
                  }
                }
              },
              [
                i('p-search-input', {
                  attrs: {
                    focus: e.focusSearchField,
                    placeholder: e.t(
                      'components.sidebarSearch.searchInput.placeholder'
                    )
                  },
                  model: {
                    value: e.form.searchQuery,
                    callback: function (t) {
                      e.$set(
                        e.form,
                        'searchQuery',
                        'string' === typeof t ? t.trim() : t
                      )
                    },
                    expression: 'form.searchQuery'
                  }
                })
              ],
              1
            ),
            i(
              'transition',
              {attrs: {name: 'sidebar-search__loading-transition'}},
              [
                i(
                  'div',
                  {
                    directives: [
                      {
                        name: 'show',
                        rawName: 'v-show',
                        value: e.isLoading,
                        expression: 'isLoading'
                      }
                    ],
                    staticClass: 'sidebar-search__loading-indicator'
                  },
                  [
                    i('p-loading-indicator', {
                      attrs: {size: '2.5rem', strokeWidth: '0.3rem'}
                    })
                  ],
                  1
                )
              ]
            ),
            i(
              'transition-group',
              {attrs: {name: 'sidebar-search__list-transition', tag: 'div'}},
              e._l(e.subreddits, function (t) {
                return i(
                  'div',
                  {key: t.id, staticClass: 'sidebar-search__list-item'},
                  [
                    i(
                      'span',
                      {
                        staticClass: 'sidebar-search__tag',
                        class: {'sidebar-search__tag--hidden': !t.over18}
                      },
                      [e._v('18+')]
                    ),
                    i('router-link', {attrs: {to: e.url(t.displayName)}}, [
                      e._v(e._s(t.displayNamePrefixed))
                    ])
                  ],
                  1
                )
              }),
              0
            )
          ],
          1
        )
      },
      Q = []
    function Y(e) {
      return e instanceof DOMException && 'AbortError' === e.name
    }
    var Z = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i('div', {
          staticClass: 'p-loading-indicator',
          style: e.style,
          attrs: {'aria-busy': 'true', 'aria-live': 'polite', role: 'alert'}
        })
      },
      K = [],
      X = Object(H['c'])({
        props: {
          size: {default: '5rem', type: String},
          strokeWidth: {default: '0.4rem', type: String}
        },
        setup(e) {
          const t = Object(H['a'])(() => ({
            borderWidth: e.strokeWidth,
            height: e.size,
            width: e.size
          }))
          return {style: t}
        }
      }),
      ee = X,
      te = (i('2174'), i('2877')),
      ie = Object(te['a'])(ee, Z, K, !1, null, null, null),
      se = ie.exports,
      re = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i(
          'div',
          {staticClass: 'p-search-input'},
          [
            i('font-awesome-icon', {
              staticClass: 'p-search-input__search-icon',
              attrs: {icon: e.faSearch}
            }),
            i('input', {
              ref: 'input',
              staticClass: 'p-search-input__input',
              attrs: {
                autocapitalize: 'none',
                placeholder: e.placeholder,
                type: 'text'
              },
              domProps: {value: e.value},
              on: {
                input: function (t) {
                  return e.$emit('input', t.target.value)
                }
              }
            }),
            i(
              'div',
              {
                directives: [
                  {
                    name: 'show',
                    rawName: 'v-show',
                    value: e.loading,
                    expression: 'loading'
                  }
                ],
                staticClass: 'p-search-input__loading'
              },
              [
                i('p-loading-indicator', {
                  directives: [
                    {
                      name: 'show',
                      rawName: 'v-show',
                      value: !0,
                      expression: 'true'
                    }
                  ],
                  attrs: {size: '2rem', strokeWidth: '0.3rem'}
                })
              ],
              1
            ),
            e.value
              ? i('font-awesome-icon', {
                  staticClass: 'p-search-input__cancel-icon',
                  attrs: {
                    'aria-hidden': 'false',
                    'aria-label': e.t('components.psearchinput.button.clear'),
                    icon: e.faTimes,
                    role: 'button'
                  },
                  on: {
                    click: function (t) {
                      return e.$emit('input', '')
                    }
                  }
                })
              : e._e()
          ],
          1
        )
      },
      ne = [],
      oe = Object(H['c'])({
        components: {PLoadingIndicator: se},
        props: {
          focus: {default: !1, type: Boolean},
          loading: {default: !1, type: Boolean},
          placeholder: {default: '', type: String},
          value: {default: '', type: String}
        },
        setup(e) {
          const t = Object(H['d'])()
          return (
            Object(H['f'])(() => {
              t.value instanceof HTMLInputElement &&
                (e.focus ? t.value.focus() : t.value.blur())
            }),
            {faSearch: o['b'], faTimes: o['d'], input: t, t: h}
          )
        }
      }),
      ae = oe,
      de = (i('ffd5'), Object(te['a'])(ae, re, ne, !1, null, null, null)),
      ue = de.exports
    let le = new AbortController()
    var ce = j['default'].extend({
        components: {PLoadingIndicator: se, PSearchInput: ue},
        data() {
          return {
            form: {searchQuery: ''},
            isLoading: !1,
            subreddits: [],
            timeoutID: 0
          }
        },
        computed: {
          focusSearchField() {
            return q.focusSearchField
          }
        },
        watch: {
          'form.searchQuery'() {
            clearTimeout(this.timeoutID),
              (this.timeoutID = window.setTimeout(this.onSearch, 300))
          }
        },
        methods: {
          async onSearch() {
            if (
              (le.abort(),
              (le = new AbortController()),
              (this.isLoading = !0),
              (this.subreddits = []),
              this.form.searchQuery)
            )
              try {
                const e = await V.searchSubreddit(
                  this.form.searchQuery,
                  '',
                  0,
                  'relevance',
                  100,
                  {abortSignal: le.signal}
                )
                e.children.forEach((e) => {
                  e instanceof A && this.subreddits.push(e)
                }),
                  (this.isLoading = !1)
              } catch (e) {
                Y(e) || (a(e), (this.isLoading = !1))
              }
            else this.isLoading = !1
          },
          url(e) {
            return x.subredditsPosts({subredditNames: [e]})
          },
          t: h
        }
      }),
      he = ce,
      me = (i('3bc3'), Object(te['a'])(he, W, Q, !1, null, null, null)),
      pe = me.exports,
      ge = Object(H['c'])({
        components: {SidebarSearch: pe},
        props: {showSidebar: {required: !0, type: Boolean}},
        setup(e) {
          return (
            Object(H['e'])(
              () => e.showSidebar,
              () => {
                e.showSidebar || (q.focusSearchField = !1)
              }
            ),
            {aboutURL: {name: O.About}, faTimes: o['d'], t: h}
          )
        }
      }),
      be = ge,
      fe = (i('f203'), Object(te['a'])(be, J, G, !1, null, null, null)),
      ve = fe.exports,
      we = j['default'].extend({
        components: {Sidebar: ve},
        props: {showSignInSignOutLink: {default: !1, type: Boolean}},
        data() {
          return {
            isEmbedded: window.top.location !== window.self.location,
            showSidebar: !1
          }
        },
        created() {
          try {
            if (this.isEmbedded)
              return void (window.top.location = window.self.location)
          } catch {}
          this.startAnalytics(),
            q.$watch(
              'pageTitle',
              (e) => {
                document.title = [e, 'popular.pics', h('documentTitle.suffix')]
                  .filter((e) => e)
                  .join(' ãƒ» ')
              },
              {immediate: !0}
            )
        },
        computed: {
          bodyStyle() {
            return this.isEmbedded ? {overflow: 'hidden'} : void 0
          },
          faBars: () => o['a'],
          faSearch: () => o['b'],
          faUserCircle: () => o['e'],
          userIconLabel: () =>
            q.userIsSignedIn ? 'Sign out' : 'Sign in with Reddit'
        },
        methods: {
          getRedirectURL() {
            return window.self.location.href
          },
          onUserIconClick() {
            q.userIsSignedIn
              ? this.signOutFromReddit()
              : this.signInWithReddit()
          },
          signInWithReddit() {
            var e, t
            window.location.assign(
              V.getAuthURL(
                null !== (e = 'zYqAs2QdZSFQfw') && void 0 !== e ? e : '',
                null !== (t = '') && void 0 !== t ? t : '',
                ['history', 'mysubreddits', 'read'],
                '123'
              ).toString()
            )
          },
          signOutFromReddit() {
            q.signOut()
          },
          showSearch() {
            ;(this.showSidebar = !0), (q.focusSearchField = !0)
          },
          startAnalytics() {
            const e = 'UA-44086983-2'
            if ('popular.pics' !== window.location.hostname || !e) return
            const t = document.createElement('script')
            ;(t.async = !0),
              (t.src = 'https://www.googletagmanager.com/gtag/js?id=' + e),
              document.head.append(t)
            const i = document.createElement('script')
            i.append(
              'window.dataLayer=window.dataLayer||[];',
              'function gtag(){dataLayer.push(arguments)}',
              'gtag("js",new Date());',
              `gtag("config","${e}");`
            ),
              document.head.append(i)
          },
          t: h
        }
      }),
      ye = we,
      _e =
        (i('afc3'),
        i('249d'),
        i('446c'),
        i('f194'),
        i('efb7'),
        Object(te['a'])(ye, r, n, !1, null, null, null)),
      Se = _e.exports,
      Re = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i(
          'form',
          {
            attrs: {id: 'about'},
            on: {
              submit: function (t) {
                return t.preventDefault(), e.onSubmit(t)
              }
            }
          },
          [
            i('div', {staticClass: 'about__heading'}, [
              e._v(' ' + e._s(e.t('views.about.heading.about')) + ' ')
            ]),
            e._m(0),
            e._m(1),
            i(
              'div',
              {
                staticClass: 'about__heading',
                staticStyle: {'margin-top': '2.7rem'}
              },
              [e._v(' ' + e._s(e.t('views.about.heading.contact')) + ' ')]
            ),
            i('input', {
              directives: [
                {
                  name: 'model',
                  rawName: 'v-model.trim',
                  value: e.form.eMailAddress,
                  expression: 'form.eMailAddress',
                  modifiers: {trim: !0}
                }
              ],
              staticClass: 'input',
              staticStyle: {'margin-top': '1.2rem'},
              attrs: {
                placeholder: e.t('views.about.emailInput.placeholder'),
                type: 'email'
              },
              domProps: {value: e.form.eMailAddress},
              on: {
                input: function (t) {
                  t.target.composing ||
                    e.$set(e.form, 'eMailAddress', t.target.value.trim())
                },
                blur: function (t) {
                  return e.$forceUpdate()
                }
              }
            }),
            i('textarea', {
              directives: [
                {
                  name: 'model',
                  rawName: 'v-model.trim',
                  value: e.form.message,
                  expression: 'form.message',
                  modifiers: {trim: !0}
                }
              ],
              staticClass: 'input',
              staticStyle: {'margin-top': '1.2rem', 'min-height': '9rem'},
              attrs: {
                placeholder: e.t('views.about.messageInput.placeholder'),
                required: ''
              },
              domProps: {value: e.form.message},
              on: {
                input: function (t) {
                  t.target.composing ||
                    e.$set(e.form, 'message', t.target.value.trim())
                },
                blur: function (t) {
                  return e.$forceUpdate()
                }
              }
            }),
            i(
              'p-button',
              {
                staticStyle: {'margin-top': '1.2rem'},
                attrs: {
                  disabled: e.isSubmitting,
                  loading: e.isSubmitting,
                  type: 'submit'
                }
              },
              [e._v(e._s(e.t('views.about.submitButton.label')))]
            )
          ],
          1
        )
      },
      Te = [
        function () {
          var e = this,
            t = e.$createElement,
            i = e._self._c || t
          return i('div', {staticStyle: {'margin-top': '2.7rem'}}, [
            i('h3', [e._v('What is popular.pics?')]),
            i('p', [
              e._v('popular.pics is a '),
              i('b', [e._v('client for Reddit')]),
              e._v(' designed for viewing images and videos.')
            ])
          ])
        },
        function () {
          var e = this,
            t = e.$createElement,
            i = e._self._c || t
          return i('div', {staticStyle: {'margin-top': '2.7rem'}}, [
            i('h3', [e._v('How can I remove posts?')]),
            i('p', [
              e._v(
                'Posts are retrieved from Reddit and displayed with Redditâ€™s permission (see '
              ),
              i(
                'a',
                {
                  attrs: {
                    href: 'https://www.reddit.com/wiki/api-terms',
                    rel: 'nofollow noopener'
                  }
                },
                [e._v('Reddit API Terms of Use')]
              ),
              e._v(', section 2.d.: '),
              i('q', [
                e._v(
                  'Reddit grants You a [â€¦] license to copy and display the User Content using the Reddit API through your application, website, or service to end users'
                )
              ]),
              e._v(').')
            ]),
            i('p', [
              e._v(
                'To remove a post, follow its â€œCommentsâ€ link to Reddit and contact the moderators there. When the post is removed from Reddit, it automatically disappears from popular.pics.'
              )
            ])
          ])
        }
      ],
      ke = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i(
          'button',
          {staticClass: 'p-button', attrs: {disabled: e.disabled}},
          [
            i('p-loading-indicator', {
              directives: [
                {
                  name: 'show',
                  rawName: 'v-show',
                  value: e.loading,
                  expression: 'loading'
                }
              ],
              attrs: {size: '1.7rem', strokeWidth: '0.25rem'}
            }),
            e.loading ? e._e() : e._t('default')
          ],
          2
        )
      },
      Le = [],
      Pe = Object(H['c'])({
        components: {PLoadingIndicator: se},
        props: {
          disabled: {default: !1, type: Boolean},
          loading: {default: !1, type: Boolean}
        }
      }),
      Ne = Pe,
      Ce = (i('d716'), Object(te['a'])(Ne, ke, Le, !1, null, null, null)),
      Oe = Ce.exports,
      xe = Object(H['c'])({
        components: {PButton: Oe},
        setup() {
          q.pageTitle = h('views.about.pageTitle')
          const e = Object(H['d'])({eMailAddress: '', message: ''}),
            t = Object(H['d'])(!1),
            i = 'https://europe-west1-popular-pics.cloudfunctions.net/contact'
          try {
            fetch(i)
          } catch {}
          function s() {
            ;(e.value.eMailAddress = ''), (e.value.message = '')
          }
          async function r() {
            if (!t.value) {
              t.value = !0
              try {
                await fetch(i, {
                  body: JSON.stringify({
                    eMailAddress: e.value.eMailAddress,
                    message: e.value.message
                  }),
                  method: 'POST'
                }),
                  alert(h('views.about.submission.success')),
                  s()
              } catch (r) {
                a(r), alert(h('views.about.submission.error'))
              } finally {
                t.value = !1
              }
            }
          }
          return {form: e, isSubmitting: t, onSubmit: r, t: h}
        }
      }),
      Ue = xe,
      Ae = (i('1c26'), Object(te['a'])(Ue, Re, Te, !1, null, null, null)),
      Fe = Ae.exports,
      Ie = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i('div')
      },
      Ee = [],
      je = Object(H['c'])({
        setup() {
          Qt.replace(
            x.subredditsPosts({
              subredditNames: [
                'CityPorn',
                'CozyPlaces',
                'EarthPorn',
                'ExposurePorn',
                'MostBeautiful',
                'wallpapers'
              ]
            })
          )
        }
      }),
      Me = je,
      $e = Object(te['a'])(Me, Ie, Ee, !1, null, null, null),
      qe = $e.exports,
      Be = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i('h1', {staticClass: 'not-found'}, [e._v('Not found')])
      },
      De = [],
      ze = Object(H['c'])({
        setup() {
          q.pageTitle = h('views.notFound.pageTitle')
        }
      }),
      Ve = ze,
      Je = (i('de7e'), Object(te['a'])(Ve, Be, De, !1, null, null, null)),
      Ge = Je.exports,
      He = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i('div')
      },
      We = [],
      Qe = j['default'].extend({
        props: {
          accessToken: {required: !0, type: String},
          expiresIn: {required: !0, type: Number},
          scope: {required: !0, type: Array},
          state: {required: !0, type: String},
          tokenType: {required: !0, type: String}
        },
        created() {
          q.signIn({
            accessToken: this.accessToken,
            scope: this.scope,
            tokenType: this.tokenType
          }),
            this.$router.push('/')
        }
      }),
      Ye = Qe,
      Ze = Object(te['a'])(Ye, He, We, !1, null, null, null),
      Ke = Ze.exports,
      Xe = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i('div', {attrs: {id: 'RedditSubredditsView'}}, [
          i(
            'header',
            {attrs: {id: 'RedditSubredditsView__header'}},
            [
              i(
                'router-link',
                {
                  staticStyle: {margin: '1.2rem 1.2rem 0 0'},
                  attrs: {
                    id: 'RedditSubredditsView__heading',
                    to: e.urlGoToFirstPage,
                    title: e.headingTooltip
                  }
                },
                [e._v(e._s(e.headingText))]
              ),
              i(
                'div',
                [
                  i('p-select', {
                    staticStyle: {margin: '1.2rem 1.2rem 0 0'},
                    attrs: {options: e.sortOptions},
                    on: {input: e.onSortChange},
                    model: {
                      value: e.sort,
                      callback: function (t) {
                        e.sort = t
                      },
                      expression: 'sort'
                    }
                  }),
                  i('p-select', {
                    directives: [
                      {
                        name: 'show',
                        rawName: 'v-show',
                        value: e.showTimeRange,
                        expression: 'showTimeRange'
                      }
                    ],
                    staticStyle: {'margin-top': '1.2rem'},
                    attrs: {options: e.timeRangeOptions},
                    on: {input: e.onTimeRangeChange},
                    model: {
                      value: e.timeRange,
                      callback: function (t) {
                        e.timeRange = t
                      },
                      expression: 'timeRange'
                    }
                  })
                ],
                1
              )
            ],
            1
          ),
          i(
            'div',
            [
              i('Posts', {
                staticStyle: {'margin-top': '1.5rem'},
                attrs: {
                  isLoading: e.isLoading,
                  posts: e.posts,
                  showForumLink: e.isMultiReddit,
                  showMoreButton: e.showMoreButton,
                  showUsername: !0
                },
                on: {'reached-scroll-end': e.onReachedScrollEnd}
              }),
              i(
                'div',
                {
                  directives: [
                    {
                      name: 'show',
                      rawName: 'v-show',
                      value: e.error,
                      expression: 'error'
                    }
                  ],
                  staticClass: 'RedditSubredditsView__error',
                  staticStyle: {margin: '1.2rem', 'text-align': 'center'}
                },
                [e._v('A problem occurred â€“ Try again')]
              )
            ],
            1
          )
        ])
      },
      et = [],
      tt = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i('div', [
          i(
            'div',
            {ref: 'root', staticClass: 'posts'},
            e._l(e.columns, function (t, s) {
              return i(
                'div',
                {key: s, staticClass: 'posts__column'},
                e._l(t, function (t) {
                  return i('Post', {
                    key: t.id,
                    staticClass: 'posts__post',
                    attrs: {
                      'load-media': !0,
                      post: t,
                      'show-forum-link': e.showForumLink,
                      'show-username': e.showUsername
                    },
                    on: {'loaded-media': e.distributePosts}
                  })
                }),
                1
              )
            }),
            0
          ),
          i(
            'div',
            {
              directives: [
                {
                  name: 'show',
                  rawName: 'v-show',
                  value: e.isLoading,
                  expression: 'isLoading'
                }
              ],
              staticClass: 'posts__loading'
            },
            [i('p-loading-indicator')],
            1
          ),
          i(
            'div',
            {
              directives: [
                {
                  name: 'show',
                  rawName: 'v-show',
                  value: e.showMoreButton,
                  expression: 'showMoreButton'
                }
              ],
              staticClass: 'posts__more'
            },
            [
              i(
                'button',
                {staticClass: 'button', on: {click: e.emitReachedScrollEnd}},
                [
                  e._v(
                    ' ' + e._s(e.t('components.posts.moreButton.label')) + ' '
                  )
                ]
              )
            ]
          )
        ])
      },
      it = [],
      st = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i(
          'div',
          {staticClass: 'post'},
          [
            e._t('default', [
              e._l(e.post.mediaFiles, function (t, s) {
                return i('MediaFileViewer', {
                  key: s,
                  attrs: {load: e.loadMedia, 'media-file': t},
                  on: {loaded: e.emitLoadedMedia}
                })
              }),
              i(
                'a',
                {
                  staticClass: 'post__title',
                  attrs: {href: e.post.url, target: '_blank'}
                },
                [
                  e.post.isPinned
                    ? i('font-awesome-icon', {
                        staticClass: 'post__icon-pin',
                        attrs: {icon: e.faThumbtack}
                      })
                    : e._e(),
                  e._v(e._s(e.post.title) + ' ')
                ],
                1
              ),
              i(
                'div',
                {staticClass: 'post__meta'},
                [
                  e.showForumLink
                    ? i(
                        'router-link',
                        {
                          staticClass: 'post__meta-item',
                          attrs: {to: e.post.forumURL}
                        },
                        [e._v(e._s(e.post.forumName))]
                      )
                    : e._e(),
                  i('span', {staticClass: 'post__meta-item'}, [
                    e._v(e._s(e.formatTime(e.post.dateCreated)))
                  ]),
                  e.showUsername
                    ? i(
                        'router-link',
                        {
                          staticClass: 'post__meta-item',
                          attrs: {
                            to: {
                              name: e.RouteName.RedditUser,
                              params: {username: e.post.username}
                            }
                          }
                        },
                        [e._v('u/' + e._s(e.post.username))]
                      )
                    : e._e(),
                  i(
                    'a',
                    {
                      staticClass: 'post__meta-item',
                      attrs: {href: e.post.commentsURL, target: '_blank'}
                    },
                    [
                      e._v(
                        e._s(
                          e.t(
                            'components.post.commentsLink',
                            e.post.commentCount
                          )
                        )
                      )
                    ]
                  )
                ],
                1
              )
            ])
          ],
          2
        )
      },
      rt = []
    const nt = 1e3,
      ot = 60 * nt,
      at = 60 * ot,
      dt = 24 * at,
      ut = 7 * dt,
      lt = [
        h('time.months.short.january'),
        h('time.months.short.february'),
        h('time.months.short.march'),
        h('time.months.short.april'),
        h('time.months.short.may'),
        h('time.months.short.june'),
        h('time.months.short.july'),
        h('time.months.short.august'),
        h('time.months.short.september'),
        h('time.months.short.october'),
        h('time.months.short.november'),
        h('time.months.short.december')
      ]
    function ct(e) {
      const t = new Date(),
        i = t.getTime() - e.getTime()
      if (i >= 0) {
        if (i < ot) return Math.floor(i / nt) + 's ago'
        if (i < at) return Math.floor(i / ot) + 'm ago'
        if (i < dt) return Math.floor(i / at) + 'h ago'
        if (i < ut) return Math.floor(i / dt) + 'd ago'
      }
      const s = e.getDate(),
        r = e.getMonth(),
        n = e.getFullYear()
      return t.getFullYear() === n ? `${lt[r]} ${s}` : `${lt[r]} ${s}, ${n}`
    }
    var ht,
      mt = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i(
          'div',
          {staticClass: 'MediaFileViewer'},
          [
            e._t('default', [
              e.load && e.isImage
                ? i('a', {attrs: {href: e.linkURL, target: '_blank'}}, [
                    i(
                      'picture',
                      [
                        e._l(e.pictureSources, function (e) {
                          return i('source', {
                            key: e.mimeType,
                            attrs: {srcset: e.srcset, type: e.mimeType}
                          })
                        }),
                        i('img', {
                          staticClass: 'MediaFileViewer__image',
                          attrs: {
                            height: e.fallbackImageHeight,
                            loading: e.loadingMode,
                            src: e.fallbackImageURL,
                            width: e.fallbackImageWidth
                          },
                          on: {error: e.emitLoaded, load: e.emitLoaded}
                        })
                      ],
                      2
                    )
                  ])
                : e._e(),
              e.load && e.isVideo
                ? i(
                    'video',
                    {
                      staticClass: 'MediaFileViewer__video',
                      attrs: {
                        controls: '',
                        loop: '',
                        poster: e.mediaFile.videoPosterURL,
                        preload: 'none'
                      }
                    },
                    e._l(e.mediaFile.sources, function (e, t) {
                      return i('source', {
                        key: t,
                        attrs: {src: e.url, type: e.mimeType}
                      })
                    }),
                    0
                  )
                : e._e(),
              i(
                'div',
                {
                  directives: [
                    {
                      name: 'show',
                      rawName: 'v-show',
                      value: !e.load,
                      expression: '!load'
                    }
                  ],
                  staticClass: 'MediaFileViewer__loading-indicator'
                },
                [e._v('Loading')]
              )
            ])
          ],
          2
        )
      },
      pt = [],
      gt =
        (i('13d5'),
        j['default'].extend({
          props: {
            load: {required: !0, type: Boolean},
            mediaFile: {required: !0, type: y}
          },
          computed: {
            fallbackImageHeight() {
              return this.mediaFile.sources.length > 0
                ? this.mediaFile.sources[this.mediaFile.sources.length - 1]
                    .height
                : 0
            },
            fallbackImageURL() {
              return this.mediaFile.sources.length > 0
                ? this.mediaFile.sources[this.mediaFile.sources.length - 1].url
                : ''
            },
            fallbackImageWidth() {
              return this.mediaFile.sources.length > 0
                ? this.mediaFile.sources[this.mediaFile.sources.length - 1]
                    .width
                : 0
            },
            isImage() {
              return this.mediaFile.type === S.Image
            },
            isVideo() {
              return this.mediaFile.type === S.Video
            },
            linkURL() {
              if (0 !== this.mediaFile.sources.length)
                return this.mediaFile.sources.reduce((e, t) =>
                  t.width > e.width ? t : e
                ).url
            },
            loadingMode() {
              return -1 === navigator.userAgent.toLowerCase().indexOf('firefox')
                ? 'lazy'
                : void 0
            },
            pictureSources() {
              const e = new Map()
              return (
                this.mediaFile.sources
                  .slice()
                  .sort((e, t) =>
                    e.width < t.width ? -1 : e.width > t.width ? 1 : 0
                  )
                  .forEach((t) => {
                    if (t.width > 1080) return
                    const i = e.get(t.mimeType) || {
                      mimeType: t.mimeType,
                      srcset: ''
                    }
                    i.srcset && (i.srcset += ', '),
                      (i.srcset += `${t.url} ${t.width}w`),
                      e.set(t.mimeType, i)
                  }),
                e.values()
              )
            }
          },
          watch: {
            load: {
              handler() {
                this.load &&
                  (this.isVideo
                    ? setTimeout(this.emitLoaded, 50)
                    : this.isImage || this.emitLoaded())
              },
              immediate: !0
            }
          },
          methods: {
            emitLoaded() {
              this.$emit('loaded')
            }
          }
        })),
      bt = gt,
      ft = (i('f250'), Object(te['a'])(bt, mt, pt, !1, null, null, null)),
      vt = ft.exports,
      wt = Object(H['c'])({
        components: {MediaFileViewer: vt},
        props: {
          loadMedia: {required: !1, type: Boolean},
          post: {required: !0, type: P},
          showForumLink: {required: !1, type: Boolean},
          showUsername: {required: !1, type: Boolean}
        },
        setup({post: e}, {emit: t}) {
          function i() {
            t('loaded-media')
          }
          return (
            e.mediaFiles.length || i(),
            {
              emitLoadedMedia: i,
              faThumbtack: o['c'],
              formatTime: ct,
              RouteName: O,
              t: h
            }
          )
        }
      }),
      yt = wt,
      _t = (i('bef4'), Object(te['a'])(yt, st, rt, !1, null, null, null)),
      St = _t.exports,
      Rt = j['default'].extend({
        components: {PLoadingIndicator: se, Post: St},
        props: {
          isLoading: {required: !0, type: Boolean},
          posts: {required: !0, type: Array},
          showForumLink: {required: !0, type: Boolean},
          showMoreButton: {required: !0, type: Boolean},
          showUsername: {required: !0, type: Boolean}
        },
        data() {
          return {
            columnCount: 0,
            columns: [],
            distributedPosts: new Map(),
            isDistributingPosts: !1,
            timeoutID: 0
          }
        },
        computed: {
          maxColumnWidth() {
            var e
            return (
              Number.parseInt(
                null !== (e = '470') && void 0 !== e ? e : '',
                10
              ) || 540
            )
          }
        },
        watch: {
          posts: {
            handler() {
              0 === this.posts.length &&
                ((this.columns = this.columns.map(() => [])),
                this.distributedPosts.clear()),
                this.distributePosts()
            }
          }
        },
        mounted() {
          this.updateLayout(),
            window.addEventListener('resize', this.updateLayout),
            window.addEventListener('scroll', this.onScroll)
        },
        beforeDestroy() {
          window.removeEventListener('resize', this.updateLayout),
            window.removeEventListener('scroll', this.onScroll)
        },
        methods: {
          distributePosts() {
            this.isDistributingPosts ||
              this.posts
                .filter((e) => !this.distributedPosts.has(e.id))
                .slice(0, 1)
                .forEach(async (e) => {
                  ;(this.isDistributingPosts = !0),
                    await e.discoverMediaFiles(),
                    this.distributedPosts.set(e.id, e)
                  const t = this.$refs.root
                  if (!(t instanceof Element)) return
                  let i = 1 / 0,
                    s = 1 / 0
                  for (let r = 0; r < t.children.length; r++) {
                    const e = t.children[r].getBoundingClientRect().height
                    i > e && ((i = e), (s = r))
                  }
                  s !== 1 / 0 && this.columns[s].push(e),
                    (this.isDistributingPosts = !1)
                })
          },
          onScroll() {
            this.reachedScrollEnd(window) && this.emitReachedScrollEnd()
          },
          emitReachedScrollEnd() {
            this.$emit('reached-scroll-end')
          },
          reachedScrollEnd(e) {
            const t = this.$refs.root
            return (
              !(t instanceof HTMLElement) ||
              !e ||
              (!(
                e instanceof HTMLElement &&
                t.offsetHeight > e.offsetHeight + e.scrollTop + 1e3
              ) &&
                !(
                  e instanceof Window &&
                  t.offsetHeight > e.innerHeight + e.scrollY + 1e3
                ))
            )
          },
          updateLayout() {
            clearTimeout(this.timeoutID),
              (this.timeoutID = window.setTimeout(() => {
                const e = this.$refs.root
                if (!(e instanceof Element)) return
                const t = e.getBoundingClientRect(),
                  i =
                    t.width > 540 ? Math.ceil(t.width / this.maxColumnWidth) : 1
                i !== this.columnCount &&
                  ((this.columnCount = i),
                  (this.columns = [...Array(i)].map(() => [])),
                  this.distributedPosts.clear(),
                  this.distributePosts())
              }, 100))
          },
          t: h
        }
      }),
      Tt = Rt,
      kt = (i('992c'), Object(te['a'])(Tt, tt, it, !1, null, null, null)),
      Lt = kt.exports,
      Pt = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i(
          'select',
          {
            domProps: {value: e.value},
            on: {
              input: function (t) {
                return e.$emit('input', t.target.value)
              }
            }
          },
          e._l(e.options, function (t, s) {
            return i('option', {key: s, domProps: {value: t.value}}, [
              e._v(e._s(t.label))
            ])
          }),
          0
        )
      },
      Nt = [],
      Ct = j['default'].extend({
        props: {
          options: {default: [], type: Array},
          value: {default: '', type: String}
        }
      }),
      Ot = Ct,
      xt = Object(te['a'])(Ot, Pt, Nt, !1, null, null, null),
      Ut = xt.exports
    ;(function (e) {
      ;(e['Confidence'] = 'confidence'),
        (e['Controversial'] = 'controversial'),
        (e['Hot'] = 'hot'),
        (e['New'] = 'new'),
        (e['Old'] = 'old'),
        (e['QA'] = 'qa'),
        (e['Rising'] = 'rising'),
        (e['Top'] = 'top')
    })(ht || (ht = {}))
    var At,
      Ft = ht
    ;(function (e) {
      ;(e['All'] = 'all'),
        (e['Day'] = 'day'),
        (e['Hour'] = 'hour'),
        (e['Month'] = 'month'),
        (e['Week'] = 'week'),
        (e['Year'] = 'year')
    })(At || (At = {}))
    var It = At,
      Et = j['default'].extend({
        components: {Posts: Lt, PSelect: Ut},
        props: {
          after: {required: !0, type: String},
          before: {required: !0, type: String},
          count: {
            required: !0,
            type: Number,
            validator: (e) => !Number.isNaN(e)
          },
          initialSort: {type: String},
          initialTimeRange: {type: String},
          limit: {required: !0, type: Number},
          subredditNames: {required: !0, type: Array}
        },
        data() {
          return {
            error: null,
            isLoading: !1,
            nextAfter: '',
            nextBefore: '',
            posts: [],
            prevLimit: 0,
            prevSort: '',
            prevSubredditNames: [],
            prevTimeRange: '',
            showSortOrders: !1,
            sort: this.initialSort,
            timeRange: this.initialTimeRange
          }
        },
        computed: {
          isMultiReddit() {
            return (
              1 !== this.subredditNames.length ||
              'all' === this.subredditNames[0] ||
              'popular' === this.subredditNames[0]
            )
          },
          pageTitle() {
            return this.subredditNames.length > 0
              ? 'Posts from r/' + this.subredditNames.join(', ')
              : 'Posts from ' + h('reddit.heading.frontpage')
          },
          showMoreButton() {
            return Boolean(!this.isLoading && !this.error && this.nextAfter)
          },
          showTimeRange() {
            return [Ft.Controversial, Ft.Top].includes(this.sort)
          },
          sortOptions() {
            return [
              {value: Ft.Hot, label: 'Hot'},
              {value: Ft.New, label: 'New'},
              {value: Ft.Top, label: 'Top'},
              {value: Ft.Rising, label: 'Rising'},
              {value: Ft.Controversial, label: 'Controversial'}
            ]
          },
          subredditNamesSet() {
            return new Set(this.subredditNames.map((e) => e.toLowerCase()))
          },
          timeRangeOptions() {
            return [
              {value: It.Hour, label: h('reddit.timeRange.hour')},
              {value: It.Day, label: h('reddit.timeRange.day')},
              {value: It.Week, label: h('reddit.timeRange.week')},
              {value: It.Month, label: h('reddit.timeRange.month')},
              {value: It.Year, label: h('reddit.timeRange.year')},
              {value: It.All, label: h('reddit.timeRange.all')}
            ]
          },
          headingText() {
            return this.subredditNames.length > 1
              ? h('reddit.heading.multireddit')
              : 1 === this.subredditNames.length
              ? 'r/' + this.subredditNames[0]
              : h('reddit.heading.frontpage')
          },
          headingTooltip() {
            return this.subredditNames.length > 1 ? q.pageTitle : void 0
          },
          urlGoToFirstPage() {
            return x.subredditsPosts({subredditNames: this.subredditNames})
          },
          urlNextPage() {
            if (!this.nextAfter) return
            const e = this.before ? -1 : 25
            return x.subredditsPosts({
              after: this.nextAfter,
              count: this.count + e,
              sort: this.sort,
              subredditNames: this.subredditNames
            })
          },
          urlPrevPage() {
            if (!this.nextBefore) return
            const e = this.before ? -25 : 1
            return x.subredditsPosts({
              before: this.nextBefore,
              count: this.count + e,
              sort: this.sort,
              subredditNames: this.subredditNames
            })
          }
        },
        watch: {
          $route: {
            handler() {
              ;(this.sort = this.initialSort || Ft.Hot),
                (this.timeRange = this.initialTimeRange || It.Month)
              const e =
                this.limit !== this.prevLimit ||
                this.sort !== this.prevSort ||
                this.subredditNames.length !== this.prevSubredditNames.length ||
                !this.subredditNames.every((e) =>
                  this.prevSubredditNames.includes(e)
                ) ||
                this.timeRange !== this.prevTimeRange
              this.getSubredditPosts(
                this.subredditNames,
                this.after,
                this.before,
                this.count,
                this.sort,
                this.timeRange,
                e
              ),
                (this.prevLimit = this.limit),
                (this.prevSort = this.sort),
                (this.prevSubredditNames = this.subredditNames),
                (this.prevTimeRange = this.timeRange)
            },
            immediate: !0
          },
          pageTitle: {
            handler() {
              q.pageTitle = this.pageTitle
            },
            immediate: !0
          }
        },
        methods: {
          async getSubredditPosts(e, t, i, s, r, n, o) {
            if (!this.isLoading) {
              ;(this.isLoading = !0),
                (this.error = null),
                (this.nextAfter = ''),
                (this.nextBefore = ''),
                o && (this.posts = []),
                (this.showSortOrders = !1)
              try {
                const o = await V.getSubredditPosts(e, t, i, s, r, n)
                ;(this.nextAfter = o.after), (this.nextBefore = o.before)
                for (let e = 0, t = o.children.length; e < t; e++) {
                  const t = o.children[e]
                  if (
                    !(t instanceof U) ||
                    (this.subredditNamesSet.size > 0 &&
                      !this.subredditNamesSet.has('all') &&
                      !this.subredditNamesSet.has('popular') &&
                      !this.subredditNamesSet.has(t.subreddit.toLowerCase()))
                  )
                    continue
                  const i = t.toPost()
                  this.posts.push(i)
                }
              } catch (d) {
                a(d), (this.error = d)
              } finally {
                this.isLoading = !1
              }
            }
          },
          onReachedScrollEnd() {
            this.nextAfter &&
              this.getSubredditPosts(
                this.subredditNames,
                this.nextAfter,
                '',
                this.count + 25,
                this.sort,
                this.timeRange,
                !1
              )
          },
          onSortChange() {
            this.$router.push(
              x.subredditsPosts({
                sort: this.sort !== Ft.Hot ? this.sort : void 0,
                subredditNames: this.subredditNames,
                timeRange: [Ft.Controversial, Ft.Top].includes(this.sort)
                  ? this.timeRange
                  : void 0
              })
            )
          },
          onTimeRangeChange() {
            this.onSortChange()
          }
        }
      }),
      jt = Et,
      Mt = (i('f15f'), Object(te['a'])(jt, Xe, et, !1, null, null, null)),
      $t = Mt.exports,
      qt = function () {
        var e = this,
          t = e.$createElement,
          i = e._self._c || t
        return i('div', {attrs: {id: 'RedditUsersView'}}, [
          i(
            'header',
            {attrs: {id: 'RedditUsersView__header'}},
            [
              i(
                'router-link',
                {
                  staticStyle: {margin: '1.2rem 1.2rem 0 0'},
                  attrs: {id: 'RedditUsersView__heading', to: e.urlUser}
                },
                [e._v('u/' + e._s(e.username))]
              ),
              i(
                'div',
                [
                  i('p-select', {
                    staticStyle: {margin: '1.2rem 1.2rem 0 0'},
                    attrs: {options: e.sortOptions},
                    on: {input: e.onSortChange},
                    model: {
                      value: e.sort,
                      callback: function (t) {
                        e.sort = t
                      },
                      expression: 'sort'
                    }
                  }),
                  i('p-select', {
                    directives: [
                      {
                        name: 'show',
                        rawName: 'v-show',
                        value: e.showTimeRange,
                        expression: 'showTimeRange'
                      }
                    ],
                    staticStyle: {'margin-top': '1.2rem'},
                    attrs: {options: e.timeRangeOptions},
                    on: {input: e.onTimeRangeChange},
                    model: {
                      value: e.timeRange,
                      callback: function (t) {
                        e.timeRange = t
                      },
                      expression: 'timeRange'
                    }
                  })
                ],
                1
              )
            ],
            1
          ),
          i(
            'div',
            [
              i('Posts', {
                staticStyle: {'margin-top': '1.5rem'},
                attrs: {
                  isLoading: e.isLoading,
                  posts: e.posts,
                  showForumLink: !0,
                  showMoreButton: e.showMoreButton,
                  showUsername: !1
                },
                on: {'reached-scroll-end': e.onReachedScrollEnd}
              }),
              i(
                'div',
                {
                  directives: [
                    {
                      name: 'show',
                      rawName: 'v-show',
                      value: e.error,
                      expression: 'error'
                    }
                  ],
                  staticClass: 'RedditUsersView__error',
                  staticStyle: {margin: '1.2rem', 'text-align': 'center'}
                },
                [e._v('A problem occurred â€“ Try again')]
              )
            ],
            1
          )
        ])
      },
      Bt = []
    const Dt = new Set(['sallymd7'])
    var zt = j['default'].extend({
        components: {Posts: Lt, PSelect: Ut},
        props: {
          after: {default: '', type: String},
          before: {default: '', type: String},
          count: {default: 0, type: Number},
          initialSort: {required: !0, type: String},
          initialTimeRange: {type: String},
          username: {default: '', type: String}
        },
        data() {
          return {
            error: null,
            isLoading: !1,
            nextAfter: '',
            nextBefore: '',
            posts: [],
            sort: this.initialSort,
            timeRange: this.initialTimeRange,
            prevSort: '',
            prevTimeRange: '',
            prevUsername: ''
          }
        },
        computed: {
          pageTitle() {
            return 'Posts by u/' + this.username
          },
          showMoreButton() {
            return Boolean(!this.isLoading && this.nextAfter)
          },
          showTimeRange() {
            return [Ft.Controversial, Ft.Top].includes(this.sort)
          },
          sortOptions() {
            return [
              {value: Ft.New, label: 'New'},
              {value: Ft.Hot, label: 'Hot'},
              {value: Ft.Top, label: 'Top'},
              {value: Ft.Controversial, label: 'Controversial'}
            ]
          },
          timeRangeOptions() {
            return [
              {value: It.Hour, label: h('reddit.timeRange.hour')},
              {value: It.Day, label: h('reddit.timeRange.day')},
              {value: It.Week, label: h('reddit.timeRange.week')},
              {value: It.Month, label: h('reddit.timeRange.month')},
              {value: It.Year, label: h('reddit.timeRange.year')},
              {value: It.All, label: h('reddit.timeRange.all')}
            ]
          },
          urlUser() {
            return {name: O.RedditUser, params: {username: this.username}}
          }
        },
        watch: {
          $route: {
            handler() {
              ;(this.sort = this.initialSort || Ft.New),
                (this.timeRange = this.initialTimeRange || It.All)
              const e =
                this.sort !== this.prevSort ||
                this.timeRange !== this.prevTimeRange ||
                this.username !== this.prevUsername
              this.getUserPosts(
                this.username,
                this.after,
                this.before,
                this.count,
                this.sort,
                this.timeRange,
                e
              ),
                (this.prevSort = this.sort),
                (this.prevTimeRange = this.timeRange),
                (this.prevUsername = this.username)
            },
            immediate: !0
          },
          pageTitle: {
            handler() {
              q.pageTitle = this.pageTitle
            },
            immediate: !0
          }
        },
        methods: {
          async getUserPosts(e, t, i, s, r, n, o) {
            if (!this.isLoading) {
              ;(this.isLoading = !0),
                (this.error = null),
                (this.nextAfter = ''),
                (this.nextBefore = ''),
                o && (this.posts = [])
              try {
                if (Dt.has(e))
                  throw new Error(`content of user ${e} is blocked`)
                const o = await V.getUserPosts(e, t, i, s, r, n)
                ;(this.nextAfter = o.after), (this.nextBefore = o.before)
                for (let e = 0, t = o.children.length; e < t; e++) {
                  const t = o.children[e]
                  if (!(t instanceof U)) continue
                  const i = t.toPost()
                  this.posts.push(i)
                }
              } catch (d) {
                a(d), (this.error = d)
              } finally {
                this.isLoading = !1
              }
            }
          },
          onReachedScrollEnd() {
            this.nextAfter &&
              this.getUserPosts(
                this.username,
                this.nextAfter,
                '',
                this.count + 25,
                this.sort,
                this.timeRange,
                !1
              )
          },
          onSortChange() {
            this.$router.push({
              name: O.RedditUser,
              query: {
                sort: this.sort,
                t: [Ft.Controversial, Ft.Top].includes(this.sort)
                  ? this.timeRange
                  : void 0
              }
            })
          },
          onTimeRangeChange() {
            this.$router.push({
              name: O.RedditUser,
              query: {sort: this.sort, t: this.timeRange}
            })
          }
        }
      }),
      Vt = zt,
      Jt = (i('c561'), Object(te['a'])(Vt, qt, Bt, !1, null, null, null)),
      Gt = Jt.exports,
      Ht = i('8c4f')
    const Wt = [
      {path: '/', component: qe},
      {path: '/about', name: O.About, component: Fe},
      {path: '/feedback', name: O.Feedback, redirect: {name: O.About}},
      {
        path: '/reddit/auth',
        name: O.RedditAuth,
        component: Ke,
        props: (e) => {
          const t = new Map()
          return (
            e.hash
              .substr(1)
              .split('&')
              .map((e) => e.split('=', 2))
              .forEach(([e, i]) => t.set(e, i)),
            {
              accessToken: m.string(t.get('access_token')),
              expiresIn: m.number(t.get('expires_in')),
              scope: m.string(t.get('scope')).split('+'),
              state: m.string(t.get('state')),
              tokenType: m.string(t.get('token_type'))
            }
          )
        }
      },
      {
        path: '/reddit/subreddits/posts',
        name: O.RedditSubreddits,
        component: $t,
        props: (e) => ({
          after: m.string(e.query.after),
          before: m.string(e.query.before),
          count: m.number(e.query.count),
          initialSort: m.string(e.query.sort),
          initialTimeRange: m.string(e.query.t),
          limit: m.number(e.query.limit),
          subredditNames: m
            .string(e.query.r)
            .split(',')
            .filter((e) => e.length > 0)
        })
      },
      {
        path: '/reddit/u/:username',
        name: O.RedditUser,
        component: Gt,
        props: (e) => ({
          after: m.string(e.query.after),
          before: m.string(e.query.before),
          count: m.number(e.query.count),
          initialSort: m.string(e.query.sort),
          initialTimeRange: m.string(e.query.t),
          username: e.params.username
        })
      },
      {
        path: '/r/:subredditNames/:sort(controversial|hot|new|rising|top)?',
        redirect: (e) =>
          x.subredditsPosts({
            sort: e.params.sort,
            subredditNames: e.params.subredditNames.split('+')
          })
      },
      {
        path: '/reddit.com/:sort(|controversial|hot|new|rising|top)?',
        redirect: (e) =>
          x.subredditsPosts({
            sort: e.params.sort,
            subredditNames: e.params.subredditNames.split('+')
          })
      },
      {
        path:
          '/reddit.com/r/:subredditNames/:sort(|controversial|hot|new|rising|top)?',
        redirect: (e) =>
          x.subredditsPosts({
            sort: e.params.sort,
            subredditNames: e.params.subredditNames.split('+')
          })
      },
      {path: '/reddit.com/u/:username', redirect: {name: O.RedditUser}},
      {path: '/reddit.com/user/:username', redirect: {name: O.RedditUser}},
      {path: '*', name: O.NotFound, component: Ge}
    ]
    var Qt = new Ht['a']({
      base: '/',
      mode: 'history',
      routes: Wt,
      scrollBehavior(e, t, i) {
        return (
          i ||
          (e.hash
            ? {selector: e.hash}
            : e.name === t.name
            ? void 0
            : {x: 0, y: 0})
        )
      }
    })
    j['default'].component('font-awesome-icon', s['a']),
      j['default'].use(H['b']),
      j['default'].use(Ht['a']),
      (j['default'].config.productionTip = !1),
      new j['default']({render: (e) => e(Se), router: Qt}).$mount('#app')
  },
  d1ff: function (e, t, i) {},
  d716: function (e, t, i) {
    'use strict'
    i('2a03')
  },
  dd6a: function (e, t, i) {},
  de7e: function (e, t, i) {
    'use strict'
    i('fe78')
  },
  efb7: function (e, t, i) {
    'use strict'
    i('c6f0')
  },
  f15f: function (e, t, i) {
    'use strict'
    i('dd6a')
  },
  f194: function (e, t, i) {
    'use strict'
    i('d1ff')
  },
  f203: function (e, t, i) {
    'use strict'
    i('9741')
  },
  f250: function (e, t, i) {
    'use strict'
    i('70a6')
  },
  fe78: function (e, t, i) {},
  ffd5: function (e, t, i) {
    'use strict'
    i('6ca3')
  }
})
