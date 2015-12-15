/*! scripts/antispam/threatmetrix.js */
(function(c, d, b, a) {
    a.TMX = d.View.extend({
        el: "body",
        initialize: function(e) {
            this.options = e || {};
            this.url = e.url || false;
            this.form_key = c("#tumblr_form_key")
                .attr("content");
            if (!this.url) {
                return
            }
        },
        template: b.template('<iframe id="tmx_safe" class="tmx_safe" height="0" width="0" src="<%- this.url %>?f=<%- this.form_key %>" style="border: 0; visibility: hidden; height: 0; width: 0; position: absolute; left: -10000px;"></iframe>'),
        render: function() {
            if (!this.rendered) {
                this.rendered = true;
                this.$el.append(this.template())
            }
            return this
        },
        rendered: false
    })
})(jQuery, Backbone, _, Tumblr);
/*! scripts/antispam/client_profiling.js */
(function(c, d, b, a) {
    a.CLP = d.View.extend({
        el: "body",
        initialize: function(e) {
            this.options = e || {};
            this.url = e.url || false;
            this.form_key = c("#tumblr_form_key")
                .attr("content")
        },
        template: b.template('<iframe id="clp" class="clp" height="0" width="0" src="<%- this.url %>/?f=<%- this.form_key %>" style="border: 0; visibility: hidden; height: 0; width: 0; position: absolute; left: -10000px;"></iframe>'),
        render: function() {
            if (!this.rendered) {
                this.rendered = true;
                this.$el.append(this.template())
            }
            return this
        },
        rendered: false
    })
})(jQuery, Backbone, _, Tumblr);
/*! scripts/email_checker.js */
(function(c, b) {
    var a = {
        dictionary: [],
        maxTransforms: 1,
        costMultiplier: 1,
        damerauLevenshteinDist: function(m, l, h) {
            if (typeof(m) !== "string" || typeof(l) !== "string") {
                return false
            }
            if (typeof(h) != "number") {
                h = 99
            }
            var g = 0,
                e = 0,
                d = 0,
                o = m.length,
                n = l.length;
            if (o === 0 || n === 0) {
                return (Math.abs(o - n) <= h) ? Math.max(o, n) : false
            }
            if (o < n) {
                var f;
                f = o;
                o = n;
                n = f;
                f = m;
                m = l;
                l = f
            }
            var k = [];
            for (g = 0; g <= o; g++) {
                k[g] = [];
                k[g][0] = g
            }
            for (e = 0; e <= n; e++) {
                k[0][e] = e
            }
            for (g = 1; g <= o; g++) {
                for (e = 1; e <= n; e++) {
                    if (m[g - 1] == l[e - 1]) {
                        d = 0
                    } else {
                        d = 1
                    }
                    k[g][e] = Math.min(k[g - 1][e] + 1, k[g][e - 1] + 1, k[g - 1][e - 1] + d);
                    if (g == 1 || e == 1) {
                        continue
                    }
                    if (m[g - 1] == l[e - 2] && m[g - 2] == l[e - 1]) {
                        k[g][e] = Math.min(k[g][e], k[g - 2][e - 2] + d)
                    }
                }
            }
            return (k[o][n] <= h) ? k[o][n] : false
        },
        returnFunc: function(d, e) {
            return d.name
        },
        suggest: function(e) {
            var d = [],
                i = 0,
                h = this.damerauLevenshteinDist,
                g = this.maxTransforms,
                f = this.returnFunc;
            c.each(this.dictionary, function(j, k) {
                if ((i = h(e, k.name, g)) !== false) {
                    d.push({
                        name: k.name,
                        dist: i,
                        cost: k.cost
                    })
                }
            });
            if (d.length) {
                return c.map(d.sort(this.sortByFunc), this.returnFunc)
            } else {
                return []
            }
        },
        sortByFunc: function(e, d) {
            var g = e.dist + e.cost * this.costMultiplier;
            var f = d.dist + d.cost * this.costMultiplier;
            return g - f
        },
        initialized: false,
        init: function(g, d) {
            if (!(g instanceof Array)) {
                return false
            }
            var f = [];
            var e;
            c.each(g, function(h, j) {
                var i = typeof(j);
                if (i === "object") {
                    f.push(j)
                } else {
                    if (i === "string") {
                        f.push({
                            name: j,
                            cost: 0
                        })
                    }
                }
            });
            this.dictionary = f;
            if (typeof(d) == "object") {
                for (e in d) {
                    if (d.hasOwnProperty(e) && this.hasOwnProperty(e)) {
                        this[e] = d[e]
                    }
                }
            }
            this.initialized = true;
            return this
        }
    };
    b.SpellChecker = a
})(jQuery, Tumblr);
/*! scripts/spin.js */
(function(i, k, a) {
    var e = ["webkit", "Moz", "ms", "O"];
    var p = {};
    var o;

    function g(q, t) {
        var r = k.createElement(q || "div");
        var s;
        for (s in t) {
            r[s] = t[s]
        }
        return r
    }

    function h(r) {
        for (var q = 1, s = arguments.length; q < s; q++) {
            r.appendChild(arguments[q])
        }
        return r
    }
    var j = function() {
        var q = g("style");
        h(k.getElementsByTagName("head")[0], q);
        return q.sheet || q.styleSheet
    }();

    function c(u, q, v, y) {
        var r = ["opacity", q, ~~(u * 100), v, y].join("-");
        var s = 0.01 + v / y * 100;
        var x = Math.max(1 - (1 - u) / q * (100 - s), u);
        var w = o.substring(0, o.indexOf("Animation"))
            .toLowerCase();
        var t = w && "-" + w + "-" || "";
        if (!p[r]) {
            j.insertRule("@" + t + "keyframes " + r + "{0%{opacity:" + x + "}" + s + "%{opacity:" + u + "}" + (s + 0.01) + "%{opacity:1}" + (s + q) % 100 + "%{opacity:" + u + "}100%{opacity:" + x + "}}", 0);
            p[r] = 1
        }
        return r
    }

    function n(u, v) {
        var t = u.style;
        var q;
        var r;
        if (t[v] !== a) {
            return v
        }
        v = v.charAt(0)
            .toUpperCase() + v.slice(1);
        for (r = 0; r < e.length; r++) {
            q = e[r] + v;
            if (t[q] !== a) {
                return q
            }
        }
    }

    function f(q, s) {
        for (var r in s) {
            q.style[n(q, r) || r] = s[r]
        }
        return q
    }

    function m(s) {
        for (var q = 1; q < arguments.length; q++) {
            var r = arguments[q];
            for (var t in r) {
                if (s[t] === a) {
                    s[t] = r[t]
                }
            }
        }
        return s
    }

    function l(q) {
        var r = {
            x: q.offsetLeft,
            y: q.offsetTop
        };
        while ((q = q.offsetParent)) {
            r.x += q.offsetLeft;
            r.y += q.offsetTop
        }
        return r
    }
    var d = {
        lines: 12,
        length: 7,
        width: 5,
        radius: 10,
        color: "#000",
        speed: 1,
        trail: 100,
        opacity: 1 / 4,
        fps: 20,
        zIndex: 2000000000,
        className: "spinner",
        top: "auto",
        left: "auto"
    };
    var b = function b(q) {
        if (!this.spin) {
            return new b(q)
        }
        this.opts = m(q || {}, b.defaults, d)
    };
    b.defaults = {};
    b.prototype = {
        spin: function(x) {
            this.stop();
            var B = this;
            var q = B.opts;
            var r = B.el = f(g(0, {
                className: q.className
            }), {
                position: "relative",
                zIndex: q.zIndex
            });
            var A = q.radius + q.length + q.width;
            var C;
            var z;
            if (x) {
                x.insertBefore(r, x.firstChild || null);
                z = l(x);
                C = l(r);
                f(r, {
                    left: (q.left == "auto" ? z.x - C.x + (x.offsetWidth >> 1) : q.left + A) + "px",
                    top: (q.top == "auto" ? z.y - C.y + (x.offsetHeight >> 1) : q.top + A) + "px"
                })
            }
            r.setAttribute("aria-role", "progressbar");
            B.lines(r, B.opts);
            if (!o) {
                var u = 0;
                var s = q.fps;
                var w = s / q.speed;
                var v = (1 - q.opacity) / (w * q.trail / 100);
                var y = w / q.lines;
                ! function t() {
                    u++;
                    for (var D = q.lines; D; D--) {
                        var E = Math.max(1 - (u + D * y) % w * v, q.opacity);
                        B.opacity(r, q.lines - D, E, q)
                    }
                    B.timeout = B.el && setTimeout(t, ~~(1000 / s))
                }()
            }
            return B
        },
        stop: function() {
            var q = this.el;
            if (q) {
                clearTimeout(this.timeout);
                if (q.parentNode) {
                    q.parentNode.removeChild(q)
                }
                this.el = a
            }
            return this
        },
        lines: function(s, u) {
            var r = 0;
            var q;

            function t(v, w) {
                return f(g(), {
                    position: "absolute",
                    width: (u.length + u.width) + "px",
                    height: u.width + "px",
                    background: v,
                    boxShadow: w,
                    transformOrigin: "left",
                    transform: "rotate(" + ~~(360 / u.lines * r) + "deg) translate(" + u.radius + "px,0)",
                    borderRadius: (u.width >> 1) + "px"
                })
            }
            for (; r < u.lines; r++) {
                q = f(g(), {
                    position: "absolute",
                    top: 1 + ~(u.width / 2) + "px",
                    transform: u.hwaccel ? "translate3d(0,0,0)" : "",
                    opacity: u.opacity,
                    animation: o && c(u.opacity, u.trail, r, u.lines) + " " + 1 / u.speed + "s linear infinite"
                });
                if (u.shadow) {
                    h(q, f(t("#000", "0 0 4px #000"), {
                        top: 2 + "px"
                    }))
                }
                h(s, h(q, t(u.color, "0 0 1px rgba(0,0,0,.1)")))
            }
            return s
        },
        opacity: function(r, q, s) {
            if (q < r.childNodes.length) {
                r.childNodes[q].style.opacity = s
            }
        }
    };
    ! function() {
        var r = f(g("group"), {
            behavior: "url(#default#VML)"
        });
        var q;
        if (!n(r, "transform") && r.adj) {
            for (q = 4; q--;) {
                j.addRule(["group", "roundrect", "fill", "stroke"][q], "behavior:url(#default#VML)")
            }
            b.prototype.lines = function(v, u) {
                var t = u.length + u.width;
                var B = 2 * t;

                function A() {
                    return f(g("group", {
                        coordsize: B + " " + B,
                        coordorigin: -t + " " + -t
                    }), {
                        width: B,
                        height: B
                    })
                }
                var w = -(u.width + u.length) * 2 + "px";
                var z = f(A(), {
                    position: "absolute",
                    top: w,
                    left: w
                });
                var y;

                function x(C, s, D) {
                    h(z, h(f(A(), {
                        rotation: 360 / u.lines * C + "deg",
                        left: ~~s
                    }), h(f(g("roundrect", {
                        arcsize: 1
                    }), {
                        width: t,
                        height: u.width,
                        left: u.radius,
                        top: -u.width >> 1,
                        filter: D
                    }), g("fill", {
                        color: u.color,
                        opacity: u.opacity
                    }), g("stroke", {
                        opacity: 0
                    }))))
                }
                if (u.shadow) {
                    for (y = 1; y <= u.lines; y++) {
                        x(y, -2, "progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)")
                    }
                }
                for (y = 1; y <= u.lines; y++) {
                    x(y)
                }
                return h(v, z)
            };
            b.prototype.opacity = function(t, s, v, u) {
                var w = t.firstChild;
                u = u.shadow && u.lines || 0;
                if (w && s + u < w.childNodes.length) {
                    w = w.childNodes[s + u];
                    w = w && w.firstChild;
                    w = w && w.firstChild;
                    if (w) {
                        w.opacity = v
                    }
                }
            }
        } else {
            o = n(r, "animation")
        }
    }();
    i.Spinner = b
})(window, document);
/*! scripts/illustrated_loader.js */
(function(c, b) {
    var a = Backbone.View.extend({
        el: "body",
        initialize: function() {
            this.frame_width = 100;
            this.frame_count = 98;
            this.frame_rate = 12;
            this.freeze_frames = [1, 7, 20, 29, 38, 47, 70, 88];
            this.current_frame = this.freeze_frames[Math.floor(Math.random() * this.freeze_frames.length)] - 1;
            this.is_animating = false;
            this.animation = false;
            this.animation_time = false;
            this.determine_animation_method();
            this.$loader = this.create_loader()
        },
        create_loader: function() {
            return c('<div id="illustrated_loader" class="illustrated_loader over_glass" />')
        },
        attach_loader: function() {
            if (!c("#illustrated_loader")
                .length) {
                this.$el.append(this.$loader)
            }
        },
        determine_animation_method: function() {
            (function() {
                var e = 0;
                var f = ["ms", "moz", "webkit", "o"];
                for (var d = 0; d < f.length && !window.requestAnimationFrame; ++d) {
                    window.requestAnimationFrame = window[f[d] + "RequestAnimationFrame"];
                    window.cancelAnimationFrame = window[f[d] + "CancelAnimationFrame"] || window[f[d] + "CancelRequestAnimationFrame"]
                }
                if (!window.requestAnimationFrame) {
                    window.requestAnimationFrame = function(k, h) {
                        var g = new Date()
                            .getTime();
                        var i = Math.max(0, 16 - (g - e));
                        var j = window.setTimeout(function() {
                            k(g + i)
                        }, i);
                        e = g + i;
                        return j
                    }
                }
                if (!window.cancelAnimationFrame) {
                    window.cancelAnimationFrame = function(g) {
                        clearTimeout(g)
                    }
                }
            }());
            this.animation_method = (requestAnimationFrame) ? "requestAnimationFrame" : "interval"
        },
        start_animation: function() {
            this.attach_loader();
            this.current_frame = (this.current_frame) ? this.current_frame : 0;
            this.set_frame();
            if (this.animation_method == "interval") {
                if (this.is_animating) {
                    return
                }
                this.animation = setInterval(_.bind(function() {
                    this.next_frame()
                }, this), 1000 / this.frame_rate)
            } else {
                var d = new Date()
                    .getTime(),
                    e = d - (this.animation_time || d);
                this.animation_time = d;
                setTimeout(_.bind(function() {
                    this.animation = requestAnimationFrame(_.bind(this.start_animation, this));
                    this.next_frame()
                }, this), 1000 / this.frame_rate)
            }
            this.is_animating = true
        },
        stop_animation: function() {
            if (this.animation_method == "interval") {
                clearInterval(this.animation)
            } else {
                cancelAnimationFrame(this.animation)
            }
            this.is_animating = false
        },
        next_frame: function() {
            this.current_frame++;
            if (_.contains(this.freeze_frames, this.current_frame)) {
                this.stop_animation();
                setTimeout(_.bind(this.start_animation, this), 500);
                return
            }
            if (this.frame_wait >= this.frame_rate) {
                this.frame_wait = 0
            }
            if (this.current_frame >= this.frame_count) {
                this.current_frame = 0
            }
            this.set_frame()
        },
        set_frame: function() {
            this.$loader.css({
                "background-position": "-" + (this.current_frame * this.frame_width) + "px 0px"
            })
        }
    });
    b.IllustratedLoader = a
})(jQuery, Tumblr);
/*! scripts/recaptcha.js */
(typeof Tumblr !== "undefined") || (Tumblr = {});
(function(b, a) {
    var c = Backbone.View.extend({
        initialize: function(f) {
            this.options = f || {};
            if (window.Recaptcha) {
                return
            }
            var e = document.createElement("script");
            e.src = "//www.google.com/recaptcha/api/js/recaptcha_ajax.js";
            e.onload = _.bind(this.setup_captcha, this);
            var d = document.getElementsByTagName("script")[0];
            d.parentNode.insertBefore(e, d)
        },
        setup_captcha: function() {
            this.$captcha_input = b("#recaptcha_response_field");
            this.$captcha_controls = b(".captcha_control");
            this.$captcha_controls.on("click.recaptcha", _.bind(_.throttle(function(e) {
                var d = b(e.target);
                if (d.hasClass("audio")) {
                    this.audio()
                }
                if (d.hasClass("visual")) {
                    this.visual()
                }
                if (d.hasClass("refresh")) {
                    this.refresh()
                }
            }, 1000), this));
            this.captcha_callback = this.options.callback || function() {};
            this.captcha_callback()
        },
        audio: function() {
            window.Recaptcha.switch_type("audio");
            this.update_placeholder()
        },
        visual: function() {
            window.Recaptcha.switch_type("image");
            this.update_placeholder()
        },
        refresh: function() {
            window.Recaptcha.reload()
        },
        update_placeholder: function() {
            var d = (window.Recaptcha.type === "image") ? this.$captcha_input.data("placeholder-visual") : this.$captcha_input.data("placeholder-audio");
            this.$captcha_input.attr({
                placeholder: d
            })
        }
    });
    Tumblr.Recaptcha = c
})(jQuery, Tumblr);
/*! scripts/nocaptcha.js */
(typeof Tumblr !== "undefined") || (Tumblr = {});
(function(d, b) {
    var c = Backbone.View.extend({
        initialize: function(g) {
            this.options = g || {};
            var f = document.createElement("script");
            f.src = "//www.google.com/recaptcha/api.js?render=explicit&onload=onNocaptchaCallback";
            window.onNocaptchaCallback = _.bind(this.setup_captcha, this);
            var e = document.getElementsByTagName("script")[0];
            e.parentNode.insertBefore(f, e)
        },
        setup_captcha: function() {
            window.grecaptcha.render(this.options.target || "g-recaptcha", {
                callback: this.options.callback || function() {},
                theme: this.options.theme || "light",
                type: this.options.type || "image",
                sitekey: this.options.sitekey || d(".g-recaptcha")
                    .data("sitekey")
            });
            if (Tumblr.Events) {
                Tumblr.Events.on("abouttumblr:change", function(e) {
                    if (e === 0 || e === 5) {
                        window.grecaptcha.reset()
                    }
                })
            }
        },
        refresh: function() {
            window.grecaptcha.reset()
        },
    });
    var a;
    Tumblr.NoCaptcha = function(e) {
        if (!a) {
            a = new c(e)
        }
        return a
    }
})(jQuery, Tumblr);
/*! scripts/tfa_code.js */
(function(d, c, e, b) {
    var a = e.View.extend({
        initialize: function(f) {
            this.options = f || {}
        },
        resend_token_sms: function(f, g) {
            var h = d("#tfa_sms_resend");
            h.addClass("animate");
            d.ajax({
                    url: "/svc/tfa/resend_token_sms",
                    data: {
                        email: f,
                        tfa_form_key: g.val()
                    },
                    with_form_key: true,
                    dataType: "json",
                    type: "POST"
                })
                .done(function(i) {
                    g.val(i.tfa_form_key)
                })
                .fail(function() {})
                .always(function() {
                    h.removeClass("animate")
                })
        }
    });
    Tumblr.TFACode = a
})(jQuery, _, Backbone, Tumblr);
/*! scripts/registration/username_suggester.js */
(function(c, d, b, a) {
    a.UsernameSuggester = d.View.extend({
        el: "body",
        defaults: {
            username_input: "#signup_username"
        },
        events: {
            "click #suggested_usernames .popover_menu_item": "handle_click"
        },
        initialize: function(e) {
            this.options = e || {};
            this.options = b.extend(this.defaults, this.options)
        },
        handle_click: function(f) {
            c(this.options.username_input)
                .val(f.target.innerHTML)
                .focus();
            c("#used_suggestion")
                .val(1);
            c("#used_auto_suggestion")
                .val(0);
            c("#suggested_usernames_container")
                .addClass("hidden")
        }
    })
})(jQuery, Backbone, _, Tumblr);
/*! scripts/tumblr.js */
(typeof Tumblr !== "undefined") || (Tumblr = {});
/*! scripts/registration/registration_form.js */
Tumblr.RegistrationForm = (function(G) {
    var J, ae, C, v, r, q, m, c, w, X, aa, k, u = false,
        g = [],
        T, E, S, b, V, t, A, B, K, p, ab, h;
    var z = (document.location.protocol === "https:"),
        I = "";
    c = [{
        name: "gmail.com",
        cost: 0,
        share: 30.2102985741
    }, {
        name: "yahoo.com",
        cost: 0,
        share: 26.013029172
    }, {
        name: "hotmail.com",
        cost: 1,
        share: 18.1002246857
    }, {
        name: "aol.com",
        cost: 6,
        share: 3.03687405106
    }, {
        name: "live.com",
        cost: 9,
        share: 2.06294942827
    }, {
        name: "hotmail.co.uk",
        cost: 10,
        share: 1.95604539045
    }, {
        name: "aim.com",
        cost: 10,
        share: 1.89339378918
    }, {
        name: "mail.com",
        cost: 17,
        share: 1.2102985741
    }, {
        name: "ymail.com",
        cost: 18,
        share: 1.0549753888
    }, {
        name: "msn.com",
        cost: 32,
        share: 0.609550330148
    }];

    function d(af) {
        m.current_view = af;
        G("body")
            .addClass("show_form")
            .addClass(af);
        loading_next_page = true;
        j(af);
        if (Tumblr.PlaceHolders) {
            Tumblr.PlaceHolders.init()
        }
        A.track_event("update_view", af)
    }

    function W(af) {
        reset_form = (af === undefined) ? true : false;
        af = af || "show_form signup_account signup_birthday signup_register signup_login signup_waiting slow_motion now";
        G.each(af.split(/\s+/), function(ag, ah) {
            G("body")
                .removeClass(ah)
        });
        if (G("#signup_button_signup")
            .length) {
            G("#signup_button_signup")
                .removeClass("shallow")
                .addClass("other_blue")
        }
        loading_next_page = false;
        m.current_view = null;
        v = null;
        if (reset_form) {
            n()
        }
        if (reset_form) {
            A.track_event("reset_view")
        }
    }

    function j(ag) {
        var ah = G("#" + ag),
            al, aj, ai;
        G("#signup_forms_submit")
            .removeClass("changed");
        v = G("#" + ag + " input");
        q.attr("action", q.attr("data-secure-ajax-action"));
        l();
        ac();
        if (Y(ag)) {
            O();
            q.attr("action", q.attr("data-secure-action"));
            v = G('#signup_account input:not("#signup_username")');
            if (G("#signup_button_signup")
                .length) {
                G("#signup_button_signup")
                    .addClass("shallow")
                    .removeClass("other_blue")
            }
            if (m.errors) {
                f(m.errors);
                m.errors = null
            }
            if (G("body")
                .hasClass("has_login_captcha")) {
                ab(function() {
                    Tumblr.NoCaptcha({
                        target: "g-recaptcha",
                        sitekey: G(".g-recaptcha")
                            .data("sitekey")
                    })
                }, function() {
                    s(function() {
                        window.Recaptcha.create(G("#recaptcha_public_key")
                            .val(), "recaptcha_widget", {
                                theme: "custom",
                                custom_theme_widget: "recaptcha_widget",
                                callback: function() {
                                    window.Recaptcha.focus_response_field;
                                    G("#signup_forms_panel")
                                        .css("display", "none");
                                    G("#signup_forms_panel")
                                        .css("display", "block")
                                }
                            })
                    })
                });
                Tumblr.Events.trigger("loginregister:captchaShown");
                G("#signup_password")
                    .focus();
                G("#signup_username")
                    .prop("tabindex", "-1")
            } else {
                if (G("body")
                    .hasClass("has_login_tfa")) {
                    G("#tfa_response_field")
                        .focus();
                    G("#tfa_sms_resend")
                        .click(function(an) {
                            an.preventDefault();
                            ad()
                        })
                } else {
                    if (!G("body")
                        .hasClass("mobile_splash_active")) {
                        G("#signup_email")
                            .focus()
                    }
                }
            }
        }
        if (ag == "signup_account") {
            if (!G("body")
                .hasClass("mobile_splash_active")) {
                G("#signup_email")
                    .focus()
            }
            if (t) {
                if (!V) {
                    V = new Tumblr.PasswordStrengthMeter()
                } else {
                    V.update()
                }
            }
            ah.keydown(function(an) {
                al = G(an.target);
                if (al.hasClass("signup_username")) {
                    G("#used_suggestion")
                        .val(0);
                    G("#used_auto_suggestion")
                        .val(0)
                }
            });
            if (Tumblr.Flags.bool("show_random_username_suggestions")) {
                var ak = JSON.parse(G("#random_username_suggestions")
                    .val());
                if (ak) {
                    G("#signup_username")
                        .on("focus", function() {
                            if (!G(this)
                                .val()) {
                                o(ak, Tumblr.Flags.bool("autopopulate_username_suggestion"))
                            }
                        });
                    G(".signup_username")
                        .on("keyup", function() {
                            G(".signup_username_checkmark")
                                .toggle(ak.indexOf(G(this)
                                    .val()) > -1)
                        })
                }
            }
        }
        if (ag == "signup_birthday") {
            setTimeout(function() {
                G("#signup_age")
                    .focus()
            }, 500);
            U(G("#signup_age"));
            ah.keyup(function(an) {
                al = G(an.target);
                if (al.hasClass("signup_age")) {
                    U(al)
                }
            });
            ah.keydown(function(an) {
                al = G(an.target);
                if (al.hasClass("signup_age")) {
                    U(al)
                }
            });
            ah.keypress(function(an) {
                al = G(an.target);
                if (al.hasClass("signup_age")) {
                    U(al)
                }
            })
        }
        if (ag == "signup_register") {
            ab(function() {
                Tumblr.NoCaptcha({
                    target: "g-recaptcha",
                    sitekey: G(".g-recaptcha")
                        .data("sitekey"),
                    callback: F
                })
            }, function() {
                s(function() {
                    window.Recaptcha.create(G("#recaptcha_public_key")
                        .val(), "recaptcha_widget", {
                            theme: "custom",
                            custom_theme_widget: "recaptcha_widget",
                            callback: function() {
                                window.Recaptcha.focus_response_field;
                                G("#signup_forms_panel")
                                    .css("display", "none");
                                G("#signup_forms_panel")
                                    .css("display", "block")
                            }
                        });
                    Tumblr.Events.trigger("loginregister:captchaShown")
                });
                ah.keyup(function() {
                    G("#signup_forms_submit")
                        .addClass("changed")
                })
            })
        }
        if (ag == "signup_waiting") {
            if (B) {
                var af = new Tumblr.IllustratedLoader();
                af.start_animation()
            } else {
                var am = new Spinner(m.spinner_opts)
                    .spin();
                G("#signup_waiting")
                    .append(G(am.el))
            }
            if (G("#failed_redirect_link")
                .length) {
                G("#failed_redirect_link")
                    .addClass("show")
            }
            G(window)
                .off("keydown keyup keypress")
        }
    }

    function ad() {
        if (!p) {
            p = new Tumblr.TFACode()
        }
        p.resend_token_sms(G("#signup_email")
            .val(), G("#tfa_form_key"))
    }

    function ac() {
        G("#" + m.current_view + " input")
            .each(function(af) {
                G(this)
                    .removeAttr("disabled")
            })
    }

    function l() {
        G("#signup_form .form_row input")
            .each(function(af) {
                G(this)
                    .attr("disabled", "disabled")
            })
    }

    function O() {
        G("#signup_form .form_row input")
            .each(function(af) {
                G(this)
                    .removeAttr("disabled")
            })
    }

    function L() {
        l();
        ac()
    }

    function U(af) {
        label = G("label[for='" + af.attr("id") + "']");
        slug = label.children()
            .first();
        slug.text(af.val());
        if (af.val() === "") {
            af.addClass("is_empty");
            label.addClass("is_empty")
        } else {
            af.removeClass("is_empty");
            label.removeClass("is_empty")
        }
    }

    function o(aj, af) {
        var ak = G("#suggested_usernames"),
            an = G("#suggested_usernames_container"),
            am = G("#suggested_usernames_container .username_note"),
            ag = G("#suggested_usernames_container .popover_inner"),
            ai = aj.length;
        af = af || false;
        if (af === true) {
            G(".signup_username")
                .val(aj[0]);
            G(".signup_username_checkmark")
                .show();
            G("#used_auto_suggestion")
                .val(1)
        }
        ak.html("");
        for (var ah = 0; ah < ai; ah++) {
            var al = G("<li></li>");
            al.attr("class", "popover_menu_item");
            al.html(aj[ah]);
            ak.append(al)
        }
        an.removeClass("hidden");
        J = new Tumblr.Popover({
            el: "#suggested_usernames_container",
            direction: "left",
            skip_glass: true
        });
        J.show();
        new Tumblr.UsernameSuggester();
        G("#seen_suggestion")[0].value++
    }

    function Z(ak) {
        var ag = G("#signup_form_errors"),
            aj = ak.length,
            af, ah;
        ag.html("");
        for (ah = aj - 1; ah >= 0; ah--) {
            af = G("<li></li>");
            af.attr("class", "error");
            af.html(ak[ah]);
            ag.append(af);
            var ai = ak[ah].replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, "");
            A.track_event("error", ai)
        }
    }

    function f(ag) {
        if (ag && ag.length) {
            Z(ag);
            G("#signup_forms")
                .addClass("has_errors")
        }
        ab(function() {
            if (window.grecaptcha) {
                window.grecaptcha.reset();
                Tumblr.Events.trigger("loginregister:captchaShown")
            }
        }, function() {
            if (window.Recaptcha) {
                window.Recaptcha.reload();
                Tumblr.Events.trigger("loginregister:captchaShown")
            }
        });
        if (!E) {
            G("#signup_forms_container")
                .addClass("shake")
                .addClass("animated")
        }
        var af = setTimeout(function() {
            G("#signup_forms_container")
                .removeClass("shake")
        }, 500)
    }

    function n() {
        G("#signup_form")[0].reset();
        if (Tumblr.Placeholders) {
            Tumblr.PlaceHolders.init()
        }
        R()
    }

    function R() {
        G("#signup_forms_container")
            .removeClass("shake");
        G("#signup_forms")
            .removeClass("has_errors")
    }

    function y() {
        var ag = v.length,
            aj = [],
            ai, ah, af;
        for (af = ag - 1; af >= 0; af--) {
            ai = v[af];
            if ((ai.value === "" || (ai.type == "checkbox" && ai.checked === false)) && G(ai)
                .attr("data-required")) {
                switch (ai.id) {
                    case "signup_email":
                        ah = P(["Don't forget your email address!", "You forgot to enter your email address!"]);
                        break;
                    case "signup_password":
                        ah = P(["Don't forget your password!", "You forgot to enter your password!"]);
                        break;
                    case "signup_username":
                        ah = P(["Don't forget your username!", "You forgot to enter your username!"]);
                        break;
                    case "signup_age":
                        ah = P(["Don't forget to tell us your age!", "You forgot to tell us your age."]);
                        break;
                    case "signup_tos":
                        ah = P(["One more thing &ndash; please accept our Terms!", "You must accept Tumblr's terms before proceeding."]);
                        break;
                    case "recaptcha_response_field":
                        ah = P(["Don't forget to fill out the Captcha!", "Please fill out the Captcha."]);
                        break;
                    default:
                        ah = P(["There was an error. Please try again.", "Oops. There was an error. Try again."])
                }
                aj.push(__(ah))
            }
        }
        if (aj.length) {
            f(aj);
            return false
        }
        return true
    }

    function N(ao) {
        if (Y(m.current_view)) {
            return true
        }
        ao = G(ao);
        var aq = [],
            ah = ao.val(),
            af;
        if (ah !== "") {
            if (ao.attr("id") == "signup_email" && !ah.match(/\@ymail.com$/i)) {
                var aj, an, al, ap, ar, ag;
                Tumblr.SpellChecker.init(c, {
                    costMultiplier: 0.05
                });
                al = (an = ah.match(/[^@]+$/)) ? an[0] : "";
                if (!/\@/.test(ah)) {
                    af = "That's not a valid email address. Please try again."
                } else {
                    if (ah.toLowerCase()
                        .indexOf("@tumblr.com") != -1) {
                        af = P(["That email address is already in use. Please try again.", "That email address is already associated with another account."])
                    } else {
                        if (!u && (aj = Tumblr.SpellChecker.suggest(al))
                            .length) {
                            ar = ah.split("@")[0] + "@" + aj[0];
                            if (ar != ah) {
                                ag = __("Oops. Did you mean %1$s ?");
                                email_placeholder = "%1$s";
                                ap = '<a href="#" id="signup_email_suggestion">' + ar + "</a>";
                                af = ag.replace(email_placeholder, ap, "g");
                                u = true
                            }
                        }
                    }
                }
            }
            if (ao.attr("id") == "signup_password") {
                if (G.trim(ah) == "") {
                    af = "Don't forget your password!"
                }
                if (V && V.block_registration_step) {
                    af = V.block_registration_step
                }
            }
            if (ao.attr("id") == "signup_username") {
                if (ah.length > 0 && ah.indexOf("-", ah.length - 1) === ah.length - 1) {
                    af = "Can't do dashes at the start or end. Middles only."
                }
                if (ah.lastIndexOf("-", 0) === 0) {
                    af = "Can't do dashes at the start or end. Middles only."
                }
                if (ah.toLowerCase()
                    .indexOf("tumblr") != -1) {
                    af = "Rule #14: You can't put Tumblr in your username."
                }
            }
            if (ao.attr("id") == "signup_age") {
                var ak = parseInt(ah);
                var am = new String(ak);
                var ai = ah.replace(/^\s+|\s+$/g, "");
                if (!(am == ai)) {
                    af = "Please enter your age as a number only!"
                } else {
                    if (ak < 1) {
                        af = "Please enter a number!"
                    }
                }
            }
            if (af) {
                aq.push(__(af))
            }
        }
        if (aq.length) {
            f(aq);
            return false
        }
        R();
        return true
    }

    function D() {
        for (var af = v.length - 1; af >= 0; af--) {
            if (!N(v[af])) {
                return false
            }
        }
        return y()
    }

    function Q() {
        if (G(J)
            .length) {
            G("#suggested_usernames_container")
                .addClass("hidden");
            G(J)
                .hide()
        }
    }

    function F() {
        R();
        if (Y(m.current_view)) {
            q.submit();
            return true
        } else {
            if (m.current_view === "signup_account" && !q.find("#signup_username")
                .val()) {
                q.prop("action", q.attr("data-secure-action"));
                q.submit()
            } else {
                if (D()) {
                    Q();
                    O();
                    signup_form_data = q.serialize() + "&action=" + encodeURIComponent(m.current_view) + "&tracking_url=" + encodeURIComponent(aa) + "&tracking_version=" + encodeURIComponent(X);
                    G.ajax(q.attr("action"), {
                        type: "POST",
                        data: signup_form_data,
                        error: function(af, ai, ah) {
                            try {
                                af = JSON.parse(af.responseText)
                            } catch (ag) {
                                af = {}
                            }
                            if (af.redirect) {
                                A.track_event("error", "redirect");
                                window.location.replace(af.redirect)
                            } else {
                                f(af.errors);
                                if (af.usernames) {
                                    setTimeout(function() {
                                        if (!E) {
                                            o(af.usernames, Tumblr.Flags.bool("autopopulate_username_suggestion"))
                                        }
                                    }, 750)
                                }
                            }
                            if (m.current_view == "signup_register") {
                                A.track_event("fail", k)
                            }
                        },
                        success: function(af) {
                            if (af.signup_success) {
                                A.track_event("success", k);
                                Tumblr.Events.trigger("loginregister:flowComplete")
                            }
                            if (af.redirect) {
                                d("signup_waiting");
                                window.location.replace(af.redirect)
                            } else {
                                d(G("#" + m.current_view)
                                    .next()
                                    .attr("id"))
                            }
                        }
                    })
                }
            }
        }
    }

    function a(af) {
        if (af.length) {
            af.focus()
        }
    }

    function H(af) {
        if (G(af.target)
            .attr("id") == "signup_email_suggestion") {
            G("#signup_email")
                .val(G(af.target)
                    .html());
            G("#signup_password")
                .focus();
            R();
            af.preventDefault();
            af.stopPropagation()
        }
    }

    function x() {
        var af = document.activeElement,
            ag = (v) ? v.length - 1 : false;
        if (af && ag && v[ag]) {
            return (af.id == v[ag].id) ? true : false
        }
        return
    }

    function e() {
        if (G("body")
            .hasClass("signup_login")) {
            Tumblr.RegistrationForm.update_view("signup_login")
        } else {
            if (G("body")
                .hasClass("signup_account")) {
                Tumblr.RegistrationForm.update_view("signup_account")
            } else {
                if (G("body")
                    .hasClass("signup_waiting")) {
                    Tumblr.RegistrationForm.update_view("signup_waiting")
                }
            }
        }
    }

    function M() {
        var af = G("#signup_subhead"),
            ag = G("#signup_subhead_content"),
            ah;
        if (af.length == 0) {
            return
        }
        ah = af.width();
        if (ag.width() > ah) {
            af.addClass("medium");
            setTimeout(function() {
                if (ag.width() > ah) {
                    af.addClass("small")
                        .removeClass("medium");
                    setTimeout(function() {
                        if (ag.width() > ah) {
                            af.addClass("infinitesimal")
                                .removeClass("small")
                        }
                    }, 0)
                }
            }, 0)
        }
    }

    function i() {
        w = G(".like_button, .reblog_button, .everyone_i_follow, .my_posts, .send_to_signup")
    }

    function Y(af) {
        return (af === "signup_login")
    }

    function P(af) {
        if (!af.length) {
            return
        }
        var ah = af.length,
            ag = Math.floor(Math.random() * ah);
        return af[ag]
    }

    function s(af) {
        new Tumblr.Recaptcha({
            callback: af
        })
    }
    return {
        initialize: function(af) {
            af = af || {};
            B = af.use_illustrated_loader || false;
            I = G("#tumblr_form_key")
                .attr("content");
            ab = Tumblr.Flags("captcha_use_recaptcha2");
            T = document.body.className.match("is_login_register");
            T = (T && T.length) ? true : false;
            S = (G(document.body)
                .hasClass("is_tablet"));
            b = (G(document.body)
                .hasClass("is_mobile_handset"));
            E = (S || b);
            t = (G(document.body)
                .hasClass("show_password_strength"));
            q = G("#signup_form");
            r = G("#signup_forms_submit");
            ae = G(".signup_buttons .login_signup_button, #logo");
            C = G(".signup_view");
            signup_form_fields = G("#signup_form input");
            m = this;
            X = "modal";
            aa = document.location.pathname;
            k = "?url=" + aa + "&version=" + X;
            i();
            K = false;
            if (af.tmx_url && af.tmx_url.length && Tumblr.TMX) {
                K = new Tumblr.TMX({
                    url: af.tmx_url,
                })
            }
            h = false;
            if (af.clp_url && af.clp_url.length && Tumblr.CLP) {
                h = new Tumblr.CLP({
                    url: af.clp_url,
                })
            }
            A = new Tumblr.OnboardingBehaviors();
            G(document)
                .click(function(ai) {
                    var ah = G(ai.target);
                    var ag = ah.parents(w.selector);
                    if (ag.length) {
                        var aj = document.getElementById("signup_button_signup");
                        if (aj) {
                            aj.click()
                        }
                        ai.preventDefault();
                        ai.stopPropagation()
                    }
                });
            if (!T && q) {
                G(window)
                    .keydown(function(ag) {
                        g[ag.keyCode] = 1;
                        if (g[16]) {
                            G("body")
                                .addClass("slow_motion")
                        }
                        if (g[17] && g[18] && g[76]) {
                            G("body")
                                .removeClass("slow_motion");
                            d("signup_login");
                            g = [];
                            return false
                        }
                    });
                G(window)
                    .keyup(function(ag) {
                        g[ag.keyCode] = 0;
                        if (ag.keyCode == 16) {
                            G("body")
                                .removeClass("slow_motion")
                        }
                        if (ag.keyCode == 27) {
                            if (G("body")
                                .hasClass("lite")) {
                                return
                            }
                            if (G("body")
                                .hasClass("already_logged_in")) {
                                window.location = "/dashboard"
                            }
                        }
                    })
            }
            Tumblr.Events.on("MobileSplash:close", function() {
                a(G("#signup_email"))
            });
            if (q.length) {
                signup_form_fields.each(function(ag) {
                    G(this)
                        .on("change", _.partial(N, this));
                    G(this)
                        .on("blur", function() {
                            if (K && !K.rendered) {
                                K.render()
                            }
                            if (h && !h.rendered && m.current_view == "signup_account") {
                                h.render()
                            }
                            Tumblr.Events.trigger("loginregister:beginFlow")
                        })
                });
                q.on("keydown", function(ag) {
                    if (ag.keyCode == 9 && !ag.shiftKey) {
                        if (x()) {
                            ag.preventDefault();
                            ag.stopPropagation()
                        }
                    }
                    if (ag.keyCode == 13) {
                        ag.preventDefault();
                        ag.stopPropagation();
                        F()
                    }
                });
                G("#signup_form_errors")
                    .click(H);
                r.click(function() {
                    F()
                });
                G("#signup_forms_container")
                    .scroll(function(ag) {
                        G("#signup_forms_container")
                            .scrollLeft(0)
                    });
                e();
                if (m.errors) {
                    f(m.errors);
                    m.errors = null
                }
            }
            M()
        },
        update_send_to_signup_links: i,
        reset_view: function() {
            W()
        },
        update_view: function(af) {
            W();
            d(af)
        },
        current_view: null,
        spinner_opts: {
            lines: 16,
            length: 11,
            width: 4,
            radius: 17,
            color: "#fff",
            speed: 0.9,
            trail: 34,
            shadow: false,
            hwaccel: false,
            className: "signup_waiting_spinner spinner",
            zIndex: 2000000000,
            top: "50",
            left: "auto"
        }
    }
})(jQuery);
/*! scripts/registration/registration_behaviors.js */
(function(b, a) {
    var c = Backbone.View.extend({
        el: "body",
        events: {},
        initialize: function() {
            b("#signup_form input")
                .on("focus", _.bind(function(d) {
                    if (!this.tracking_events) {
                        this.start_tracking_events();
                        this.tracking_events = true
                    }
                }, this))
        },
        tracking_events: false,
        track_event: function(e, d) {
            if (_gaq) {
                _gaq.push(["_trackPageview", "/signup/" + e])
            }
        },
        start_tracking_events: function() {
            b("body")
                .on("click", _.bind(function(d) {
                    var e = d.currentTarget,
                        f = e.nodeName;
                    f += (e.id.length) ? "-" + e.id : "";
                    f += (e.className.length) ? "-" + e.className : "";
                    this.track_event("clicked", f)
                }, this));
            b(window)
                .on("keyup", _.bind(function(d) {
                    if (d.keyCode == 27) {
                        this.track_event("keypress", "esc")
                    }
                }, this))
        }
    });
    a.OnboardingBehaviors = c
})(jQuery, Tumblr);
/*! scripts/registration/registration.js */