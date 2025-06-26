class MoneroWebminer {
  constructor(wallet, options) {
    this.wallet = wallet;
    this.threads = options.threads || navigator.hardwareConcurrency || 2;
    this.username = options.username || "x";
    this.pass = options.pass || "x";
    this.workerBlob = null;
    this.workers = [];
    this.hashes = 0;
    this.job = null;
    this.rpc = "wss://randomx.moneroocean.stream";
    this.throttle = options.throttle || 0;
    this.hps = 0;
    this.found = 0;
    this.accepted = 0;
    this.isReady = false;

    this.init = this.init.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.emit = this.emit.bind(this);
    this.getHPS = this.getHPS.bind(this);
    this.getTotalHashes = this.getTotalHashes.bind(this);
    this.getAcceptedHashes = this.getAcceptedHashes.bind(this);

    this.events = {
      open: [],
      authed: [],
      close: [],
      error: [],
      job: [],
      found: [],
      accepted: [],
    };
  }

  async init() {
    this.socket = new WebSocket(this.rpc);
    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.workerBlob = await this.getWorkerBlob();

    setInterval(() => {
        this.hps = this.hashes;
        this.hashes = 0;
    }, 1000);
  }

  onOpen() {
    this.isReady = true;
    this.emit("open");
    this.send("auth");
  }

  onClose() {
    this.isReady = false;
    this.emit("close");
    this.stop();
  }

  onError(err) {
    this.emit("error", err);
  }

  onMessage(msg) {
    const data = JSON.parse(msg.data);
    switch (data.type) {
      case "auth_accepted":
        this.emit("authed", data.params);
        break;
      case "job":
        this.job = data.params;
        this.emit("job", data.params);
        break;
      case "hash_accepted":
        this.accepted = data.params.hashes;
        this.emit("accepted", data.params.hashes);
        break;
      case "banned":
        this.emit("error", {
          error: "banned"
        });
        break;
      case "error":
        this.emit("error", data.params);
        break;
      default:
        break;
    }
  }

  start() {
    this.init().then(() => {
      setTimeout(() => {
        for (let i = 0; i < this.threads; i++) {
          const worker = new Worker(this.workerBlob);
          worker.onmessage = (msg) => {
            const data = msg.data;
            switch (data.type) {
              case "submit":
                this.send("submit", data.params);
                break;
              case "hash":
                this.hashes += data.params.hashes;
                break;
              default:
                break;
            }
          };
          this.workers.push(worker);
        }

        const interval = setInterval(() => {
          if (this.job) {
            this.workers.forEach((worker) => {
              worker.postMessage({
                job: this.job,
                throttle: this.throttle
              });
            });
            clearInterval(interval);
          }
        }, 500);
      }, 1000);
    });
  }

  stop() {
    this.socket.close();
    this.workers.forEach((worker) => {
      worker.terminate();
    });
    this.workers = [];
  }

  send(type, params) {
    if (!this.isReady) {
      return;
    }
    const data = {
      type: type,
      params: params || {},
    };
    if (type === "auth") {
      data.params.user = this.wallet;
      data.params.pass = this.pass;
    }
    this.socket.send(JSON.stringify(data));
  }

  on(event, callback) {
    if (this.events[event]) {
      this.events[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => {
        callback(data);
      });
    }
  }

  getHPS() {
    return this.hps;
  }

  getTotalHashes() {
    return this.accepted;
  }

  getAcceptedHashes() {
    return this.accepted;
  }

  async getWorkerBlob() {
    const res = await fetch(
      "https://raw.githubusercontent.com/NajmAjmal/monero-webminer/main/src/worker.js"
    );
    const text = await res.text();
    return URL.createObjectURL(new Blob([text], {
      type: "application/javascript"
    }));
  }
}