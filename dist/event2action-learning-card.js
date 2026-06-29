var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __reflectGet = Reflect.get;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __superGet = (cls, obj, key) => __reflectGet(__getProtoOf(cls), key, obj);
var _a;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1 = window, e$2 = t$1.ShadowRoot && (void 0 === t$1.ShadyCSS || t$1.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$3 = Symbol(), n$3 = /* @__PURE__ */ new WeakMap();
class o$3 {
  constructor(t2, e2, n2) {
    if (this._$cssResult$ = true, n2 !== s$3)
      throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t2, this.t = e2;
  }
  get styleSheet() {
    let t2 = this.o;
    const s2 = this.t;
    if (e$2 && void 0 === t2) {
      const e2 = void 0 !== s2 && 1 === s2.length;
      e2 && (t2 = n$3.get(s2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && n$3.set(s2, t2));
    }
    return t2;
  }
  toString() {
    return this.cssText;
  }
}
const r$2 = (t2) => new o$3("string" == typeof t2 ? t2 : t2 + "", void 0, s$3), i$1 = (t2, ...e2) => {
  const n2 = 1 === t2.length ? t2[0] : e2.reduce((e3, s2, n3) => e3 + ((t3) => {
    if (true === t3._$cssResult$)
      return t3.cssText;
    if ("number" == typeof t3)
      return t3;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s2) + t2[n3 + 1], t2[0]);
  return new o$3(n2, t2, s$3);
}, S$1 = (s2, n2) => {
  e$2 ? s2.adoptedStyleSheets = n2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet) : n2.forEach((e2) => {
    const n3 = document.createElement("style"), o2 = t$1.litNonce;
    void 0 !== o2 && n3.setAttribute("nonce", o2), n3.textContent = e2.cssText, s2.appendChild(n3);
  });
}, c$1 = e$2 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
  let e2 = "";
  for (const s2 of t3.cssRules)
    e2 += s2.cssText;
  return r$2(e2);
})(t2) : t2;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var s$2;
const e$1 = window, r$1 = e$1.trustedTypes, h$1 = r$1 ? r$1.emptyScript : "", o$2 = e$1.reactiveElementPolyfillSupport, n$2 = { toAttribute(t2, i2) {
  switch (i2) {
    case Boolean:
      t2 = t2 ? h$1 : null;
      break;
    case Object:
    case Array:
      t2 = null == t2 ? t2 : JSON.stringify(t2);
  }
  return t2;
}, fromAttribute(t2, i2) {
  let s2 = t2;
  switch (i2) {
    case Boolean:
      s2 = null !== t2;
      break;
    case Number:
      s2 = null === t2 ? null : Number(t2);
      break;
    case Object:
    case Array:
      try {
        s2 = JSON.parse(t2);
      } catch (t3) {
        s2 = null;
      }
  }
  return s2;
} }, a$1 = (t2, i2) => i2 !== t2 && (i2 == i2 || t2 == t2), l$2 = { attribute: true, type: String, converter: n$2, reflect: false, hasChanged: a$1 }, d$1 = "finalized";
class u$1 extends HTMLElement {
  constructor() {
    super(), this._$Ei = /* @__PURE__ */ new Map(), this.isUpdatePending = false, this.hasUpdated = false, this._$El = null, this._$Eu();
  }
  static addInitializer(t2) {
    var i2;
    this.finalize(), (null !== (i2 = this.h) && void 0 !== i2 ? i2 : this.h = []).push(t2);
  }
  static get observedAttributes() {
    this.finalize();
    const t2 = [];
    return this.elementProperties.forEach((i2, s2) => {
      const e2 = this._$Ep(s2, i2);
      void 0 !== e2 && (this._$Ev.set(e2, s2), t2.push(e2));
    }), t2;
  }
  static createProperty(t2, i2 = l$2) {
    if (i2.state && (i2.attribute = false), this.finalize(), this.elementProperties.set(t2, i2), !i2.noAccessor && !this.prototype.hasOwnProperty(t2)) {
      const s2 = "symbol" == typeof t2 ? Symbol() : "__" + t2, e2 = this.getPropertyDescriptor(t2, s2, i2);
      void 0 !== e2 && Object.defineProperty(this.prototype, t2, e2);
    }
  }
  static getPropertyDescriptor(t2, i2, s2) {
    return { get() {
      return this[i2];
    }, set(e2) {
      const r2 = this[t2];
      this[i2] = e2, this.requestUpdate(t2, r2, s2);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t2) {
    return this.elementProperties.get(t2) || l$2;
  }
  static finalize() {
    if (this.hasOwnProperty(d$1))
      return false;
    this[d$1] = true;
    const t2 = Object.getPrototypeOf(this);
    if (t2.finalize(), void 0 !== t2.h && (this.h = [...t2.h]), this.elementProperties = new Map(t2.elementProperties), this._$Ev = /* @__PURE__ */ new Map(), this.hasOwnProperty("properties")) {
      const t3 = this.properties, i2 = [...Object.getOwnPropertyNames(t3), ...Object.getOwnPropertySymbols(t3)];
      for (const s2 of i2)
        this.createProperty(s2, t3[s2]);
    }
    return this.elementStyles = this.finalizeStyles(this.styles), true;
  }
  static finalizeStyles(i2) {
    const s2 = [];
    if (Array.isArray(i2)) {
      const e2 = new Set(i2.flat(1 / 0).reverse());
      for (const i3 of e2)
        s2.unshift(c$1(i3));
    } else
      void 0 !== i2 && s2.push(c$1(i2));
    return s2;
  }
  static _$Ep(t2, i2) {
    const s2 = i2.attribute;
    return false === s2 ? void 0 : "string" == typeof s2 ? s2 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
  }
  _$Eu() {
    var t2;
    this._$E_ = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$Eg(), this.requestUpdate(), null === (t2 = this.constructor.h) || void 0 === t2 || t2.forEach((t3) => t3(this));
  }
  addController(t2) {
    var i2, s2;
    (null !== (i2 = this._$ES) && void 0 !== i2 ? i2 : this._$ES = []).push(t2), void 0 !== this.renderRoot && this.isConnected && (null === (s2 = t2.hostConnected) || void 0 === s2 || s2.call(t2));
  }
  removeController(t2) {
    var i2;
    null === (i2 = this._$ES) || void 0 === i2 || i2.splice(this._$ES.indexOf(t2) >>> 0, 1);
  }
  _$Eg() {
    this.constructor.elementProperties.forEach((t2, i2) => {
      this.hasOwnProperty(i2) && (this._$Ei.set(i2, this[i2]), delete this[i2]);
    });
  }
  createRenderRoot() {
    var t2;
    const s2 = null !== (t2 = this.shadowRoot) && void 0 !== t2 ? t2 : this.attachShadow(this.constructor.shadowRootOptions);
    return S$1(s2, this.constructor.elementStyles), s2;
  }
  connectedCallback() {
    var t2;
    void 0 === this.renderRoot && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), null === (t2 = this._$ES) || void 0 === t2 || t2.forEach((t3) => {
      var i2;
      return null === (i2 = t3.hostConnected) || void 0 === i2 ? void 0 : i2.call(t3);
    });
  }
  enableUpdating(t2) {
  }
  disconnectedCallback() {
    var t2;
    null === (t2 = this._$ES) || void 0 === t2 || t2.forEach((t3) => {
      var i2;
      return null === (i2 = t3.hostDisconnected) || void 0 === i2 ? void 0 : i2.call(t3);
    });
  }
  attributeChangedCallback(t2, i2, s2) {
    this._$AK(t2, s2);
  }
  _$EO(t2, i2, s2 = l$2) {
    var e2;
    const r2 = this.constructor._$Ep(t2, s2);
    if (void 0 !== r2 && true === s2.reflect) {
      const h2 = (void 0 !== (null === (e2 = s2.converter) || void 0 === e2 ? void 0 : e2.toAttribute) ? s2.converter : n$2).toAttribute(i2, s2.type);
      this._$El = t2, null == h2 ? this.removeAttribute(r2) : this.setAttribute(r2, h2), this._$El = null;
    }
  }
  _$AK(t2, i2) {
    var s2;
    const e2 = this.constructor, r2 = e2._$Ev.get(t2);
    if (void 0 !== r2 && this._$El !== r2) {
      const t3 = e2.getPropertyOptions(r2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== (null === (s2 = t3.converter) || void 0 === s2 ? void 0 : s2.fromAttribute) ? t3.converter : n$2;
      this._$El = r2, this[r2] = h2.fromAttribute(i2, t3.type), this._$El = null;
    }
  }
  requestUpdate(t2, i2, s2) {
    let e2 = true;
    void 0 !== t2 && (((s2 = s2 || this.constructor.getPropertyOptions(t2)).hasChanged || a$1)(this[t2], i2) ? (this._$AL.has(t2) || this._$AL.set(t2, i2), true === s2.reflect && this._$El !== t2 && (void 0 === this._$EC && (this._$EC = /* @__PURE__ */ new Map()), this._$EC.set(t2, s2))) : e2 = false), !this.isUpdatePending && e2 && (this._$E_ = this._$Ej());
  }
  async _$Ej() {
    this.isUpdatePending = true;
    try {
      await this._$E_;
    } catch (t3) {
      Promise.reject(t3);
    }
    const t2 = this.scheduleUpdate();
    return null != t2 && await t2, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var t2;
    if (!this.isUpdatePending)
      return;
    this.hasUpdated, this._$Ei && (this._$Ei.forEach((t3, i3) => this[i3] = t3), this._$Ei = void 0);
    let i2 = false;
    const s2 = this._$AL;
    try {
      i2 = this.shouldUpdate(s2), i2 ? (this.willUpdate(s2), null === (t2 = this._$ES) || void 0 === t2 || t2.forEach((t3) => {
        var i3;
        return null === (i3 = t3.hostUpdate) || void 0 === i3 ? void 0 : i3.call(t3);
      }), this.update(s2)) : this._$Ek();
    } catch (t3) {
      throw i2 = false, this._$Ek(), t3;
    }
    i2 && this._$AE(s2);
  }
  willUpdate(t2) {
  }
  _$AE(t2) {
    var i2;
    null === (i2 = this._$ES) || void 0 === i2 || i2.forEach((t3) => {
      var i3;
      return null === (i3 = t3.hostUpdated) || void 0 === i3 ? void 0 : i3.call(t3);
    }), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
  }
  _$Ek() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$E_;
  }
  shouldUpdate(t2) {
    return true;
  }
  update(t2) {
    void 0 !== this._$EC && (this._$EC.forEach((t3, i2) => this._$EO(i2, this[i2], t3)), this._$EC = void 0), this._$Ek();
  }
  updated(t2) {
  }
  firstUpdated(t2) {
  }
}
u$1[d$1] = true, u$1.elementProperties = /* @__PURE__ */ new Map(), u$1.elementStyles = [], u$1.shadowRootOptions = { mode: "open" }, null == o$2 || o$2({ ReactiveElement: u$1 }), (null !== (s$2 = e$1.reactiveElementVersions) && void 0 !== s$2 ? s$2 : e$1.reactiveElementVersions = []).push("1.6.3");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var t;
const i = window, s$1 = i.trustedTypes, e = s$1 ? s$1.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, o$1 = "$lit$", n$1 = `lit$${(Math.random() + "").slice(9)}$`, l$1 = "?" + n$1, h = `<${l$1}>`, r = document, u = () => r.createComment(""), d = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, c = Array.isArray, v = (t2) => c(t2) || "function" == typeof (null == t2 ? void 0 : t2[Symbol.iterator]), a = "[ 	\n\f\r]", f = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _ = /-->/g, m = />/g, p = RegExp(`>|${a}(?:([^\\s"'>=/]+)(${a}*=${a}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), g = /'/g, $ = /"/g, y = /^(?:script|style|textarea|title)$/i, w = (t2) => (i2, ...s2) => ({ _$litType$: t2, strings: i2, values: s2 }), x = w(1), T = Symbol.for("lit-noChange"), A = Symbol.for("lit-nothing"), E = /* @__PURE__ */ new WeakMap(), C = r.createTreeWalker(r, 129, null, false);
function P(t2, i2) {
  if (!Array.isArray(t2) || !t2.hasOwnProperty("raw"))
    throw Error("invalid template strings array");
  return void 0 !== e ? e.createHTML(i2) : i2;
}
const V = (t2, i2) => {
  const s2 = t2.length - 1, e2 = [];
  let l2, r2 = 2 === i2 ? "<svg>" : "", u2 = f;
  for (let i3 = 0; i3 < s2; i3++) {
    const s3 = t2[i3];
    let d2, c2, v2 = -1, a2 = 0;
    for (; a2 < s3.length && (u2.lastIndex = a2, c2 = u2.exec(s3), null !== c2); )
      a2 = u2.lastIndex, u2 === f ? "!--" === c2[1] ? u2 = _ : void 0 !== c2[1] ? u2 = m : void 0 !== c2[2] ? (y.test(c2[2]) && (l2 = RegExp("</" + c2[2], "g")), u2 = p) : void 0 !== c2[3] && (u2 = p) : u2 === p ? ">" === c2[0] ? (u2 = null != l2 ? l2 : f, v2 = -1) : void 0 === c2[1] ? v2 = -2 : (v2 = u2.lastIndex - c2[2].length, d2 = c2[1], u2 = void 0 === c2[3] ? p : '"' === c2[3] ? $ : g) : u2 === $ || u2 === g ? u2 = p : u2 === _ || u2 === m ? u2 = f : (u2 = p, l2 = void 0);
    const w2 = u2 === p && t2[i3 + 1].startsWith("/>") ? " " : "";
    r2 += u2 === f ? s3 + h : v2 >= 0 ? (e2.push(d2), s3.slice(0, v2) + o$1 + s3.slice(v2) + n$1 + w2) : s3 + n$1 + (-2 === v2 ? (e2.push(void 0), i3) : w2);
  }
  return [P(t2, r2 + (t2[s2] || "<?>") + (2 === i2 ? "</svg>" : "")), e2];
};
class N {
  constructor({ strings: t2, _$litType$: i2 }, e2) {
    let h2;
    this.parts = [];
    let r2 = 0, d2 = 0;
    const c2 = t2.length - 1, v2 = this.parts, [a2, f2] = V(t2, i2);
    if (this.el = N.createElement(a2, e2), C.currentNode = this.el.content, 2 === i2) {
      const t3 = this.el.content, i3 = t3.firstChild;
      i3.remove(), t3.append(...i3.childNodes);
    }
    for (; null !== (h2 = C.nextNode()) && v2.length < c2; ) {
      if (1 === h2.nodeType) {
        if (h2.hasAttributes()) {
          const t3 = [];
          for (const i3 of h2.getAttributeNames())
            if (i3.endsWith(o$1) || i3.startsWith(n$1)) {
              const s2 = f2[d2++];
              if (t3.push(i3), void 0 !== s2) {
                const t4 = h2.getAttribute(s2.toLowerCase() + o$1).split(n$1), i4 = /([.?@])?(.*)/.exec(s2);
                v2.push({ type: 1, index: r2, name: i4[2], strings: t4, ctor: "." === i4[1] ? H : "?" === i4[1] ? L : "@" === i4[1] ? z : k });
              } else
                v2.push({ type: 6, index: r2 });
            }
          for (const i3 of t3)
            h2.removeAttribute(i3);
        }
        if (y.test(h2.tagName)) {
          const t3 = h2.textContent.split(n$1), i3 = t3.length - 1;
          if (i3 > 0) {
            h2.textContent = s$1 ? s$1.emptyScript : "";
            for (let s2 = 0; s2 < i3; s2++)
              h2.append(t3[s2], u()), C.nextNode(), v2.push({ type: 2, index: ++r2 });
            h2.append(t3[i3], u());
          }
        }
      } else if (8 === h2.nodeType)
        if (h2.data === l$1)
          v2.push({ type: 2, index: r2 });
        else {
          let t3 = -1;
          for (; -1 !== (t3 = h2.data.indexOf(n$1, t3 + 1)); )
            v2.push({ type: 7, index: r2 }), t3 += n$1.length - 1;
        }
      r2++;
    }
  }
  static createElement(t2, i2) {
    const s2 = r.createElement("template");
    return s2.innerHTML = t2, s2;
  }
}
function S(t2, i2, s2 = t2, e2) {
  var o2, n2, l2, h2;
  if (i2 === T)
    return i2;
  let r2 = void 0 !== e2 ? null === (o2 = s2._$Co) || void 0 === o2 ? void 0 : o2[e2] : s2._$Cl;
  const u2 = d(i2) ? void 0 : i2._$litDirective$;
  return (null == r2 ? void 0 : r2.constructor) !== u2 && (null === (n2 = null == r2 ? void 0 : r2._$AO) || void 0 === n2 || n2.call(r2, false), void 0 === u2 ? r2 = void 0 : (r2 = new u2(t2), r2._$AT(t2, s2, e2)), void 0 !== e2 ? (null !== (l2 = (h2 = s2)._$Co) && void 0 !== l2 ? l2 : h2._$Co = [])[e2] = r2 : s2._$Cl = r2), void 0 !== r2 && (i2 = S(t2, r2._$AS(t2, i2.values), r2, e2)), i2;
}
class M {
  constructor(t2, i2) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i2;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    var i2;
    const { el: { content: s2 }, parts: e2 } = this._$AD, o2 = (null !== (i2 = null == t2 ? void 0 : t2.creationScope) && void 0 !== i2 ? i2 : r).importNode(s2, true);
    C.currentNode = o2;
    let n2 = C.nextNode(), l2 = 0, h2 = 0, u2 = e2[0];
    for (; void 0 !== u2; ) {
      if (l2 === u2.index) {
        let i3;
        2 === u2.type ? i3 = new R(n2, n2.nextSibling, this, t2) : 1 === u2.type ? i3 = new u2.ctor(n2, u2.name, u2.strings, this, t2) : 6 === u2.type && (i3 = new Z(n2, this, t2)), this._$AV.push(i3), u2 = e2[++h2];
      }
      l2 !== (null == u2 ? void 0 : u2.index) && (n2 = C.nextNode(), l2++);
    }
    return C.currentNode = r, o2;
  }
  v(t2) {
    let i2 = 0;
    for (const s2 of this._$AV)
      void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i2), i2 += s2.strings.length - 2) : s2._$AI(t2[i2])), i2++;
  }
}
class R {
  constructor(t2, i2, s2, e2) {
    var o2;
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i2, this._$AM = s2, this.options = e2, this._$Cp = null === (o2 = null == e2 ? void 0 : e2.isConnected) || void 0 === o2 || o2;
  }
  get _$AU() {
    var t2, i2;
    return null !== (i2 = null === (t2 = this._$AM) || void 0 === t2 ? void 0 : t2._$AU) && void 0 !== i2 ? i2 : this._$Cp;
  }
  get parentNode() {
    let t2 = this._$AA.parentNode;
    const i2 = this._$AM;
    return void 0 !== i2 && 11 === (null == t2 ? void 0 : t2.nodeType) && (t2 = i2.parentNode), t2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, i2 = this) {
    t2 = S(this, t2, i2), d(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== T && this._(t2) : void 0 !== t2._$litType$ ? this.g(t2) : void 0 !== t2.nodeType ? this.$(t2) : v(t2) ? this.T(t2) : this._(t2);
  }
  k(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  $(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.k(t2));
  }
  _(t2) {
    this._$AH !== A && d(this._$AH) ? this._$AA.nextSibling.data = t2 : this.$(r.createTextNode(t2)), this._$AH = t2;
  }
  g(t2) {
    var i2;
    const { values: s2, _$litType$: e2 } = t2, o2 = "number" == typeof e2 ? this._$AC(t2) : (void 0 === e2.el && (e2.el = N.createElement(P(e2.h, e2.h[0]), this.options)), e2);
    if ((null === (i2 = this._$AH) || void 0 === i2 ? void 0 : i2._$AD) === o2)
      this._$AH.v(s2);
    else {
      const t3 = new M(o2, this), i3 = t3.u(this.options);
      t3.v(s2), this.$(i3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let i2 = E.get(t2.strings);
    return void 0 === i2 && E.set(t2.strings, i2 = new N(t2)), i2;
  }
  T(t2) {
    c(this._$AH) || (this._$AH = [], this._$AR());
    const i2 = this._$AH;
    let s2, e2 = 0;
    for (const o2 of t2)
      e2 === i2.length ? i2.push(s2 = new R(this.k(u()), this.k(u()), this, this.options)) : s2 = i2[e2], s2._$AI(o2), e2++;
    e2 < i2.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i2.length = e2);
  }
  _$AR(t2 = this._$AA.nextSibling, i2) {
    var s2;
    for (null === (s2 = this._$AP) || void 0 === s2 || s2.call(this, false, true, i2); t2 && t2 !== this._$AB; ) {
      const i3 = t2.nextSibling;
      t2.remove(), t2 = i3;
    }
  }
  setConnected(t2) {
    var i2;
    void 0 === this._$AM && (this._$Cp = t2, null === (i2 = this._$AP) || void 0 === i2 || i2.call(this, t2));
  }
}
class k {
  constructor(t2, i2, s2, e2, o2) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i2, this._$AM = e2, this.options = o2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = A;
  }
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2, i2 = this, s2, e2) {
    const o2 = this.strings;
    let n2 = false;
    if (void 0 === o2)
      t2 = S(this, t2, i2, 0), n2 = !d(t2) || t2 !== this._$AH && t2 !== T, n2 && (this._$AH = t2);
    else {
      const e3 = t2;
      let l2, h2;
      for (t2 = o2[0], l2 = 0; l2 < o2.length - 1; l2++)
        h2 = S(this, e3[s2 + l2], i2, l2), h2 === T && (h2 = this._$AH[l2]), n2 || (n2 = !d(h2) || h2 !== this._$AH[l2]), h2 === A ? t2 = A : t2 !== A && (t2 += (null != h2 ? h2 : "") + o2[l2 + 1]), this._$AH[l2] = h2;
    }
    n2 && !e2 && this.j(t2);
  }
  j(t2) {
    t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, null != t2 ? t2 : "");
  }
}
class H extends k {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === A ? void 0 : t2;
  }
}
const I = s$1 ? s$1.emptyScript : "";
class L extends k {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    t2 && t2 !== A ? this.element.setAttribute(this.name, I) : this.element.removeAttribute(this.name);
  }
}
class z extends k {
  constructor(t2, i2, s2, e2, o2) {
    super(t2, i2, s2, e2, o2), this.type = 5;
  }
  _$AI(t2, i2 = this) {
    var s2;
    if ((t2 = null !== (s2 = S(this, t2, i2, 0)) && void 0 !== s2 ? s2 : A) === T)
      return;
    const e2 = this._$AH, o2 = t2 === A && e2 !== A || t2.capture !== e2.capture || t2.once !== e2.once || t2.passive !== e2.passive, n2 = t2 !== A && (e2 === A || o2);
    o2 && this.element.removeEventListener(this.name, this, e2), n2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    var i2, s2;
    "function" == typeof this._$AH ? this._$AH.call(null !== (s2 = null === (i2 = this.options) || void 0 === i2 ? void 0 : i2.host) && void 0 !== s2 ? s2 : this.element, t2) : this._$AH.handleEvent(t2);
  }
}
class Z {
  constructor(t2, i2, s2) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i2, this.options = s2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    S(this, t2);
  }
}
const B = i.litHtmlPolyfillSupport;
null == B || B(N, R), (null !== (t = i.litHtmlVersions) && void 0 !== t ? t : i.litHtmlVersions = []).push("2.8.0");
const D = (t2, i2, s2) => {
  var e2, o2;
  const n2 = null !== (e2 = null == s2 ? void 0 : s2.renderBefore) && void 0 !== e2 ? e2 : i2;
  let l2 = n2._$litPart$;
  if (void 0 === l2) {
    const t3 = null !== (o2 = null == s2 ? void 0 : s2.renderBefore) && void 0 !== o2 ? o2 : null;
    n2._$litPart$ = l2 = new R(i2.insertBefore(u(), t3), t3, void 0, null != s2 ? s2 : {});
  }
  return l2._$AI(t2), l2;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var l, o;
class s extends u$1 {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t2, e2;
    const i2 = super.createRenderRoot();
    return null !== (t2 = (e2 = this.renderOptions).renderBefore) && void 0 !== t2 || (e2.renderBefore = i2.firstChild), i2;
  }
  update(t2) {
    const i2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = D(i2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t2;
    super.connectedCallback(), null === (t2 = this._$Do) || void 0 === t2 || t2.setConnected(true);
  }
  disconnectedCallback() {
    var t2;
    super.disconnectedCallback(), null === (t2 = this._$Do) || void 0 === t2 || t2.setConnected(false);
  }
  render() {
    return T;
  }
}
s.finalized = true, s._$litElement$ = true, null === (l = globalThis.litElementHydrateSupport) || void 0 === l || l.call(globalThis, { LitElement: s });
const n = globalThis.litElementPolyfillSupport;
null == n || n({ LitElement: s });
(null !== (o = globalThis.litElementVersions) && void 0 !== o ? o : globalThis.litElementVersions = []).push("3.3.3");
class ConfirmModal extends s {
  constructor() {
    super();
    this.open = false;
    this.message = "Are you sure?";
    this.confirmLabel = "Yes";
    this.cancelLabel = "No";
  }
  connectedCallback() {
    super.connectedCallback();
    this._esc = (e2) => e2.key === "Escape" && this.open && this._cancel();
    window.addEventListener("keydown", this._esc);
  }
  disconnectedCallback() {
    window.removeEventListener("keydown", this._esc);
    super.disconnectedCallback();
  }
  render() {
    if (!this.open)
      return null;
    return x`
      <div class="overlay" @click=${this._cancel}></div>
      <div class="dialog">
        <div class="message">
          <slot>${this.message}</slot>
        </div>
        <div class="actions">
          ${this.cancelLabel ? x`
                <button class="cancel" @click=${this._cancel}>
                  ${this.cancelLabel}
                </button>
              ` : null}
          ${this.confirmLabel ? x`
                <button @click=${this._confirm}>
                  ${this.confirmLabel}
                </button>
              ` : null}
        </div>
      </div>
    `;
  }
  _confirm() {
    this._close(true);
  }
  _cancel() {
    this._close(false);
  }
  _close(result) {
    this.open = false;
    this.dispatchEvent(new CustomEvent("confirm-result", {
      detail: result,
      bubbles: true,
      composed: true
    }));
  }
}
__publicField(ConfirmModal, "properties", {
  open: { type: Boolean, reflect: true },
  message: { type: String, reflect: true },
  confirmLabel: { type: String },
  cancelLabel: { type: String }
});
__publicField(ConfirmModal, "styles", i$1`
    :host {
      position: fixed;
      inset: 0;
      z-index: 1000;
      pointer-events: none;
    }

    :host([open]) {
      pointer-events: auto;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
    }

    .dialog {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--ha-card-background, var(--card-background-color));
      color: var(--primary-text-color);
      padding: 16px;
      border-radius: 12px;
      min-width: 260px;
      box-shadow: var(--ha-card-box-shadow, 0 4px 16px rgba(0,0,0,.4));
    }
    .message {
      white-space: pre-line;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    button {
      background: none;
      border: none;
      color: var(--primary-color);
      font: inherit;
      padding: 6px 12px;
      cursor: pointer;
    }

    button.cancel {
      color: var(--secondary-text-color);
    }
  `);
customElements.define("confirm-modal", ConfirmModal);
function confirm(message = "Are you sure?", labels = {}) {
  return new Promise((resolve) => {
    var _a2, _b;
    const modal = document.createElement("confirm-modal");
    modal.message = message;
    modal.confirmLabel = (_a2 = labels.yes) != null ? _a2 : "Yes";
    modal.cancelLabel = (_b = labels.no) != null ? _b : "No";
    modal.open = true;
    const onResult = (ev) => {
      modal.removeEventListener("confirm-result", onResult);
      modal.remove();
      resolve(ev.detail === true);
    };
    modal.addEventListener("confirm-result", onResult);
    document.body.appendChild(modal);
  });
}
const BusyOverlayMixin = (superClass) => {
  var _a2, _b;
  return _b = class extends superClass {
    constructor() {
      super();
      this._busy = false;
      this._busyLabel = "Working\u2026";
    }
    setBusy(active, label) {
      this._busy = active;
      if (label !== void 0) {
        this._busyLabel = label;
      }
    }
    renderBusyOverlay() {
      if (!this._busy)
        return null;
      return x`
        <div class="busy-overlay">
          <div class="busy-panel">
            <ha-spinner indeterminate></ha-spinner>
            <div>${this._busyLabel}</div>
          </div>
        </div>
      `;
    }
  }, __publicField(_b, "properties", {
    _busy: { state: true },
    _busyLabel: { state: true }
  }), __publicField(_b, "styles", [
    (_a2 = superClass.styles) != null ? _a2 : [],
    i$1`
        .busy-overlay {
          position: absolute;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.20);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: all;
        }

        .busy-panel {
          background: var(--card-background-color);
          padding: 16px 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--ha-card-box-shadow);
        }
      `
  ]), _b;
};
function formatDateTime(hass, date = new Date()) {
  var _a2, _b, _c;
  const locale = (_c = (_b = (_a2 = hass == null ? void 0 : hass.locale) == null ? void 0 : _a2.language) != null ? _b : navigator.language) != null ? _c : "en-US";
  const d2 = date instanceof Date ? date : new Date(date);
  let out = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(d2);
  out = out.replace(/\b(Nov|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Dec)\b/g, "$1.");
  return out;
}
const ENTITY_DOMAIN_LIST = ["switch", "light", "cover", "script", "automation"];
const CUSTOM_COMMON_SERVICE_DATA_KEYS = {
  "*dimmer_control|script.turn_on": [
    { label: "light_entity", value: "light_entity", default: "" },
    { label: "steps", value: "steps", default: 5 },
    { label: "bounce_at_top", value: "bounce_at_top", default: false },
    { label: "min_val", value: "min_val", default: 0 },
    { label: "max_val", value: "max_val", default: 100 }
  ]
};
const PREFILL_SERVICE_DATA = {
  "*dimmer_control|script.turn_on": '{"light_entity":" ","steps":5,"bounce_at_top":false}'
};
const AUTO_UNBLOCK = true;
const DEFAULT_BLOCK_SECONDS = 60;
const LOG_LEVEL = 2;
const RUNTIME_MAPPING_SENSOR = "sensor.event2action_runtime_map";
const RUNTIME_MAPPING_TOPIC = "event2action/map";
const SESSION_BACKUP_SENSOR = "sensor.event2action_session_backup";
const SESSION_BACKUP_TOPIC = "event2action/session_backup";
const STEP_BACKUP_SENSOR = "sensor.event2action_step_backup";
const STEP_BACKUP_TOPIC = "event2action/step_backup";
const LASTEVENT_STORE = "input_text.event2action_last_event_store";
const BLOCKING_HELPER = "input_boolean.event2action_block_events";
let activeLogLevel = LOG_LEVEL;
function setLogLevel(level) {
  const nextLevel = Number(level);
  activeLogLevel = Number.isFinite(nextLevel) ? nextLevel : LOG_LEVEL;
}
const logger = {
  debug: (...args) => activeLogLevel >= 4 && console.log(...args),
  info: (...args) => activeLogLevel >= 3 && console.log(...args),
  warn: (...args) => activeLogLevel >= 2 && console.warn(...args),
  error: (...args) => activeLogLevel >= 1 && console.error(...args)
};
const e2aTheme = i$1`
  :host {
    /* ===== Spacing ===== */
    --e2a-gap: 12px;
    --e2a-gap-xxs: 4px;
    --e2a-gap-xs: 6px;
    --e2a-gap-sm: 10px;
    --e2a-gap-md: 12px;
    --e2a-gap-lg: 16px;
    --e2a-gap-xl: 24px;

    --e2a-row-margin: 12px;

    /* =====================
    * ACCENT / BRAND
    * ===================== */
    --e2a-accent: var(--accent-color);
    --e2a-accent-hover: color-mix(in srgb, var(--e2a-accent) 85%, black 15%);
    --e2a-accent-active: color-mix(in srgb, var(--e2a-accent) 70%, transparent);

    /* =====================
    * TEXT
    * ===================== */
    --e2a-text-primary: var(--primary-text-color);
    --e2a-text-secondary: var(--secondary-text-color);
    --e2a-text-muted: var(--disabled-text-color);

    /* =====================
    * BACKGROUNDS
    * ===================== */
    --e2a-bg-card: var(--card-background-color);
    --e2a-bg-primary: var(--primary-background-color);
    --e2a-bg-secondary: var(--secondary-background-color);

    /* =====================
    * HOVER / ACTIVE (HA-style overlays)
    * ===================== */
    --e2a-hover-bg: rgba(var(--rgb-primary-text-color), 0.04);
    --e2a-active-bg: rgba(var(--rgb-primary-text-color), 0.08);
    --e2a-focus-ring: rgba(var(--rgb-accent-color), 0.35);

    /* =====================
    * BORDERS / DIVIDERS
    * ===================== */
    --e2a-border: var(--divider-color);
    --e2a-border-hover: rgba(var(--rgb-primary-text-color), 0.2);
    --e2a-border-radius: 16px;

    /* =====================
    * STATES
    * ===================== */
    --e2a-success: var(--success-color);
    --e2a-warning: var(--warning-color);
    --e2a-error: var(--error-color);
    --e2a-info: var(--info-color);

    /* =====================
    * ICONS
    * ===================== */
    --e2a-icon: var(--icon-color);
    --e2a-icon-active: var(--icon-active-color);
    --e2a-icon-inactive: var(--icon-inactive-color);
  }
`;
const e2aLayout = i$1`
  .row {
    margin-bottom: var(--e2a-gap-md);
  }

  .row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--e2a-gap-md);
    margin-bottom: var(--e2a-gap-md);
  }

  .row-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--e2a-gap-md);
    margin-bottom: var(--e2a-gap-md);
  }

  .row-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--e2a-gap, 12px);
    margin-bottom: var(--e2a-row-margin, 12px);
  }

  .row-1-3 {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: var(--e2a-gap, 12px);
    margin-bottom: var(--e2a-row-margin, 12px);
  }

  .row-1-2-1 {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: var(--e2a-gap, 12px);
    margin-bottom: var(--e2a-row-margin, 12px);
  }

  .buttons {
    display: flex;
    justify-content: space-between;
    gap: var(--e2a-gap-md);
    margin-top: var(--e2a-gap-lg);
  }

  .no_vert_margin {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  .hidden {
    display: none !important;
  }

  .flex_align {
    display: flex;
    align-items: center;
    gap: var(--e2a-gap, 12px);
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    .row-4 {
      grid-template-columns: repeat(2, 1fr);
    }

    .row-3 {
      grid-template-columns: 1fr 1fr;
    }

    .row-1-2-1 {
      grid-template-columns: 1fr;
    }

    .flex_align {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 480px) {
    .row-4,
    .row-3,
    .row-2 {
      grid-template-columns: 1fr;
    }

    .row-1-3 {
      grid-template-columns: 1fr;
    }

    .buttons {
      flex-direction: column;
    }

    .flex_align {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;
const e2aComponents = i$1`

  ha-textfield {
    --mdc-text-field-height: 36px;
  }

  ha-textfield::part(field) {
    border-radius: 12px !important;
  }

  ha-textfield::part(container) {
    padding-top: 0px;
    padding-bottom: 0px;
  }

  ha-textfield::part(label) {
    font-size: 0.85em;
  }

  ha-button.danger {
    --wa-color-brand-fill-loud: var(--e2a-accent);
    --wa-color-brand-border-loud: var(--e2a-accent);
    --button-color-fill-loud-hover:  var(--e2a-accent-hover);
    --wa-color-brand-on-loud: #fff;
  }
`;
const e2aStyles = i$1`

  .content {
    display: flex;
    flex-direction: column;
    column-gap: var(--e2a-gap);
    row-gap: var(--e2a-gap-xxs);
  }

  ha-textfield {
    --mdc-text-field-height: var(--e2a-gap-lg);
  }

  ha-textfield::part(field) {
    border-radius: var(--e2a-gap-md)  !important ;
  }

  ha-textfield::part(container) {
    padding-top: 0px;
    padding-bottom: 0px;
  }

  ha-textfield::part(label) {
    font-size: 0.85em;
  }

  .row {
    margin-bottom:var(--e2a-row-margin, 12px);
  }


  .buttons {
    display: flex;
    gap: var(--e2a-gap, 12px) ;
    margin-top: 16px;
  }
`;
class E2AEditor extends s {
  constructor() {
    super();
    this._baseline = null;
    this._working = null;
    this.existing = false;
    this.entityDomainList = ENTITY_DOMAIN_LIST;
    this.customCommonServiceDataKeys = CUSTOM_COMMON_SERVICE_DATA_KEYS;
    this.prefillServiceData = PREFILL_SERVICE_DATA;
    this._cachedEntities = null;
    this._entityCacheError = null;
    this._showEntitySelector = false;
    this._showCommonParamSelector = true;
    this._mergedServiceDataKeys = this._computeMergedServiceDataKeys();
    this._sdCursorStart = 0;
    this._sdCursorEnd = 0;
    this._boundRejectionHandler = this._handleUnhandledRejection.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("unhandledrejection", this._boundRejectionHandler);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("unhandledrejection", this._boundRejectionHandler);
  }
  async _fetchAndCacheEntities() {
    if (!this.hass || this._cachedEntities)
      return;
    const entityDomainList = Array.isArray(this.entityDomainList) && this.entityDomainList.length ? this.entityDomainList : ENTITY_DOMAIN_LIST;
    const timeout = new Promise(
      (_2, reject) => setTimeout(() => reject(new Error("Timeout")), 5e3)
    );
    const fetchEntities = (async () => {
      const entities = Object.keys(this.hass.states).filter((entity_id) => {
        const domain = entity_id.split(".")[0];
        return entityDomainList.includes(domain);
      });
      return entities;
    })();
    try {
      const entities = await Promise.race([fetchEntities, timeout]);
      this._cachedEntities = entities;
      this._entityCacheError = null;
      logger.info(`E2AEditor: Cached ${entities.length} entities from ${entityDomainList.length} domains`);
      this.requestUpdate();
    } catch (err) {
      if (err.message === "Timeout") {
        logger.error("Entity list fetch timed out after 5 seconds");
        this._entityCacheError = "Fetching of entity list from HomeAssistant failed - restart editor to retry";
      } else {
        logger.error("Failed to cache entities:", err);
        this._entityCacheError = "Failed to load entities - restart editor to retry";
      }
      this._cachedEntities = null;
      this.requestUpdate();
    }
  }
  _handleUnhandledRejection(event) {
    var _a2, _b, _c, _d, _e, _f, _g;
    if (((_b = (_a2 = event.reason) == null ? void 0 : _a2.error) == null ? void 0 : _b.code) === 3 && ((_d = (_c = event.reason) == null ? void 0 : _c.error) == null ? void 0 : _d.message) === "Connection lost") {
      logger.error("WebSocket connection lost. Ignoring to prevent page crash.");
      event.preventDefault();
      return;
    }
    if (((_e = event.reason) == null ? void 0 : _e.type) === "result" && ((_f = event.reason) == null ? void 0 : _f.success) === false && ((_g = event.reason) == null ? void 0 : _g.error)) {
      event.preventDefault();
      return;
    }
  }
  _renderSwitch(checked, disabled, onChange) {
    if (customElements.get("ha-switch")) {
      return x`
        <ha-switch
          .checked=${checked}
          ?disabled=${disabled}
          @change=${onChange}>
        </ha-switch>
      `;
    }
    return x`
      <input
        class="e2a-fallback-switch"
        type="checkbox"
        .checked=${checked}
        ?disabled=${disabled}
        @change=${onChange}
      />
    `;
  }
  updated(changedProps) {
    if (changedProps.has("draft")) {
      logger.debug("E2AEditor: draft changed, existing:", this.existing, "baseline exists:", !!this._baseline);
      if (!this._baseline) {
        logger.debug("E2AEditor: initializing baseline and working state from draft:", this.draft);
        this._baseline = structuredClone(this.draft);
        this._working = structuredClone(this.draft);
      }
    }
    if (changedProps.has("entityDomainList")) {
      this._cachedEntities = null;
      this._entityCacheError = null;
    }
    if (changedProps.has("customCommonServiceDataKeys")) {
      this._mergedServiceDataKeys = this._computeMergedServiceDataKeys();
    }
    if (changedProps.has("hass") && this.hass && !this._cachedEntities) {
      this._fetchAndCacheEntities();
    }
  }
  _isDirty() {
    return JSON.stringify(this._working) !== JSON.stringify(this._baseline);
  }
  _getUniqueValues(field) {
    if (!this.collection || !Array.isArray(this.collection)) {
      logger.debug(`_getUniqueValues(${field}): no collection`);
      return [];
    }
    const values = this.collection.map((item) => item[field]).filter((v2) => v2 && v2 !== "").filter((v2, i2, arr) => arr.indexOf(v2) === i2).sort();
    const result = values.map((v2) => ({ label: v2, value: v2 }));
    return result;
  }
  _computeMergedServiceDataKeys() {
    const keyTemplates = [
      {
        key: "*|light.turn_on",
        options: [
          { label: "brightness (0\u2013255)", value: "brightness", default: 128 },
          { label: "brightness_pct (0\u2013100)", value: "brightness_pct", default: 50 },
          { label: "rgb_color [R,G,B]", value: "rgb_color", default: [255, 255, 255] },
          { label: "color_temp (153\u2013500)", value: "color_temp", default: 300 },
          { label: "transition (seconds)", value: "transition", default: 1 }
        ]
      },
      {
        key: "*|light.toggle",
        options: [
          { label: "brightness (0\u2013255)", value: "brightness", default: 128 },
          { label: "brightness_pct (0\u2013100)", value: "brightness_pct", default: 50 },
          { label: "rgb_color [R,G,B]", value: "rgb_color", default: [255, 255, 255] },
          { label: "color_temp (153\u2013500)", value: "color_temp", default: 300 },
          { label: "transition (seconds)", value: "transition", default: 1 }
        ]
      },
      {
        key: "*|fan.turn_on",
        options: [
          { label: "percentage (0\u2013100)", value: "percentage", default: 50 },
          { label: "preset_mode (string)", value: "preset_mode", default: "auto" }
        ]
      },
      {
        key: "*|fan.set_percentage",
        options: [
          { label: "percentage (0\u2013100)", value: "percentage", default: 50 }
        ]
      },
      {
        key: "*|fan.increase_speed",
        options: [
          { label: "percentage_step (0\u2013100)", value: "percentage_step", default: 10 }
        ]
      },
      {
        key: "*|fan.decrease_speed",
        options: [
          { label: "percentage_step (0\u2013100)", value: "percentage_step", default: 10 }
        ]
      },
      {
        key: "*|fan.oscillate",
        options: [
          { label: "oscillating (true/false)", value: "oscillating", default: true }
        ]
      },
      {
        key: "*|fan.set_direction",
        options: [
          { label: "direction (forward/reverse)", value: "direction", default: "forward" }
        ]
      },
      {
        key: "*|cover.set_cover_position",
        options: [
          { label: "position (0\u2013100)", value: "position", default: 50 }
        ]
      },
      {
        key: "*|media_player.volume_set",
        options: [
          { label: "volume_level (0\u20131)", value: "volume_level", default: 0.5 }
        ]
      },
      {
        key: "*|media_player.media_seek",
        options: [
          { label: "seek_position (seconds)", value: "seek_position", default: 0 }
        ]
      },
      {
        key: "*|climate.set_temperature",
        options: [
          { label: "temperature (\xB0C)", value: "temperature", default: 21 },
          { label: "target_temp_low (\xB0C)", value: "target_temp_low", default: 19 },
          { label: "target_temp_high (\xB0C)", value: "target_temp_high", default: 23 }
        ]
      },
      {
        key: "*|climate.set_hvac_mode",
        options: [
          { label: "hvac_mode (heat/cool/auto/off)", value: "hvac_mode", default: "auto" }
        ]
      },
      {
        key: "*|climate.set_fan_mode",
        options: [
          { label: "fan_mode (string)", value: "fan_mode", default: "auto" }
        ]
      },
      {
        key: "*|script.turn_on",
        options: [
          { label: "variables (object)", value: "variables", default: {} }
        ]
      },
      {
        key: "*|scene.turn_on",
        options: [
          { label: "transition (seconds)", value: "transition", default: 1 }
        ]
      }
    ];
    if (this.customCommonServiceDataKeys && typeof this.customCommonServiceDataKeys === "object") {
      for (const customKey in this.customCommonServiceDataKeys) {
        if (Object.prototype.hasOwnProperty.call(this.customCommonServiceDataKeys, customKey)) {
          keyTemplates.push({
            key: customKey,
            options: this.customCommonServiceDataKeys[customKey]
          });
        }
      }
    }
    return keyTemplates;
  }
  _getCommonServiceDataKeys() {
    var _a2, _b, _c, _d;
    const entity = ((_a2 = this._working) == null ? void 0 : _a2.entity) || ((_b = this.draft) == null ? void 0 : _b.entity) || "";
    const service = ((_c = this._working) == null ? void 0 : _c.service) || ((_d = this.draft) == null ? void 0 : _d.service) || "";
    if (!service)
      return [];
    const searchKey = `${entity}|${service}`;
    function wildcardToRegex(pattern) {
      return new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
    }
    const matches = this._mergedServiceDataKeys.filter((t2) => wildcardToRegex(t2.key).test(searchKey));
    let options = [];
    for (const match of matches) {
      options = options.concat(match.options);
    }
    if (!options.some((o2) => o2.value === "{}")) {
      options.unshift({ label: "(clear)", value: "{}" });
    }
    return options;
  }
  _getPrefillServiceData(entity, service) {
    const searchKey = `${entity}|${service}`;
    function wildcardToRegex(pattern) {
      return new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
    }
    const prefillServiceData = this.prefillServiceData;
    if (prefillServiceData && typeof prefillServiceData === "object" && !Array.isArray(prefillServiceData)) {
      const keys = Object.keys(prefillServiceData);
      const matches = keys.filter((k2) => wildcardToRegex(k2).test(searchKey));
      if (matches.length === 0)
        return void 0;
      return prefillServiceData[matches[matches.length - 1]];
    }
    if (Array.isArray(prefillServiceData)) {
      for (const t2 of prefillServiceData) {
        const regex = wildcardToRegex(t2.key);
        logger.info(`[Prefill Debug] Pattern: ${t2.key}, Regex: ${regex}, SearchKey: ${searchKey}, Match: ${regex.test(searchKey)}`);
      }
      const matches = prefillServiceData.filter((t2) => wildcardToRegex(t2.key).test(searchKey));
      logger.info(`[Prefill Debug] Matches found: ${matches.length}`);
      if (matches.length === 0)
        return void 0;
      return matches[matches.length - 1].value;
    }
    logger.info(`[Prefill Debug] Direct lookup for key: ${searchKey}, Found: ${prefillServiceData == null ? void 0 : prefillServiceData[searchKey]}`);
    return prefillServiceData == null ? void 0 : prefillServiceData[searchKey];
  }
  async _resolveNativeInputElement(field) {
    var _a2, _b, _c;
    if (!field)
      return null;
    let ni = field.inputElement || field._inputElement;
    if (ni && typeof ni.then === "function") {
      try {
        ni = await ni;
      } catch {
        ni = null;
      }
    }
    if (ni)
      return ni;
    const nested = (_a2 = field.renderRoot) == null ? void 0 : _a2.querySelector("ha-textfield, mwc-textfield");
    if (nested) {
      let nni = nested.inputElement || nested._inputElement;
      if (nni && typeof nni.then === "function") {
        try {
          nni = await nni;
        } catch {
          nni = null;
        }
      }
      if (nni)
        return nni;
      return ((_b = nested.renderRoot) == null ? void 0 : _b.querySelector("textarea, input")) || null;
    }
    return ((_c = field.renderRoot) == null ? void 0 : _c.querySelector("textarea, input")) || null;
  }
  _clearServiceDataValidation() {
    var _a2, _b, _c, _d, _e;
    const serviceDataField = (_a2 = this.shadowRoot) == null ? void 0 : _a2.querySelector("#service-data-input");
    if (serviceDataField) {
      if ("invalid" in serviceDataField)
        serviceDataField.invalid = false;
      if ("validationMessage" in serviceDataField)
        serviceDataField.validationMessage = "";
      if ("helperPersistent" in serviceDataField)
        serviceDataField.helperPersistent = false;
      const nativeInput = serviceDataField.inputElement || serviceDataField._inputElement || ((_b = serviceDataField.renderRoot) == null ? void 0 : _b.querySelector("textarea, input"));
      (_c = nativeInput == null ? void 0 : nativeInput.setCustomValidity) == null ? void 0 : _c.call(nativeInput, "");
      (_d = nativeInput == null ? void 0 : nativeInput.reportValidity) == null ? void 0 : _d.call(nativeInput);
      (_e = serviceDataField.reportValidity) == null ? void 0 : _e.call(serviceDataField);
    }
  }
  _setServiceDataValidation(field, invalid, message = "") {
    var _a2, _b, _c, _d;
    if (!field)
      return;
    if ("invalid" in field)
      field.invalid = invalid;
    if ("validationMessage" in field)
      field.validationMessage = message;
    if ("helperPersistent" in field)
      field.helperPersistent = invalid;
    const nativeInput = field.inputElement || field._inputElement || ((_a2 = field.renderRoot) == null ? void 0 : _a2.querySelector("textarea, input"));
    (_b = nativeInput == null ? void 0 : nativeInput.setCustomValidity) == null ? void 0 : _b.call(nativeInput, message);
    (_c = field.reportValidity) == null ? void 0 : _c.call(field);
    (_d = nativeInput == null ? void 0 : nativeInput.reportValidity) == null ? void 0 : _d.call(nativeInput);
  }
  _change(field, value) {
    var _a2, _b, _c, _d;
    if (field === "entity") {
      const oldDomain = (_b = (_a2 = this._working) == null ? void 0 : _a2.entity) == null ? void 0 : _b.split(".")[0];
      const newDomain = value == null ? void 0 : value.split(".")[0];
      if (oldDomain && oldDomain !== newDomain && this._working.service) {
        this._working = { ...this._working, entity: value, service: "", service_data: {} };
        this.dispatchEvent(new CustomEvent("draft-changed", {
          detail: { field: "entity", value },
          bubbles: true,
          composed: true
        }));
        this.dispatchEvent(new CustomEvent("draft-changed", {
          detail: { field: "service", value: "" },
          bubbles: true,
          composed: true
        }));
        this.dispatchEvent(new CustomEvent("draft-changed", {
          detail: { field: "service_data", value: {} },
          bubbles: true,
          composed: true
        }));
        this.requestUpdate();
        setTimeout(() => this._clearServiceDataValidation(), 0);
        return;
      }
    }
    if (field === "service") {
      const entity = ((_c = this._working) == null ? void 0 : _c.entity) || ((_d = this.draft) == null ? void 0 : _d.entity) || "";
      const prefill = this._getPrefillServiceData(entity, value);
      let serviceData = {};
      if (prefill) {
        try {
          serviceData = JSON.parse(prefill);
        } catch (e2) {
          logger.error(`E2AEditor: Failed to parse prefill data for ${entity}|${value}`, e2);
        }
      }
      this._working = { ...this._working, service: value, service_data: serviceData };
      this.dispatchEvent(new CustomEvent("draft-changed", {
        detail: { field: "service", value },
        bubbles: true,
        composed: true
      }));
      this.dispatchEvent(new CustomEvent("draft-changed", {
        detail: { field: "service_data", value: serviceData },
        bubbles: true,
        composed: true
      }));
      this.requestUpdate();
      setTimeout(() => this._clearServiceDataValidation(), 0);
      return;
    }
    this._working[field] = value;
    this.dispatchEvent(new CustomEvent("draft-changed", {
      detail: { field, value },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }
  _addServiceDataKey(selection) {
    var _a2;
    if (!selection || selection === "{}") {
      this._change("service_data", {});
      setTimeout(() => this._clearServiceDataValidation(), 0);
      return;
    }
    const template = this._getCommonServiceDataKeys().find((k2) => k2.value === selection);
    if (template && template.default !== void 0) {
      const newData = { ...(_a2 = this.draft.service_data) != null ? _a2 : {}, [selection]: template.default };
      this._change("service_data", newData);
      setTimeout(() => this._clearServiceDataValidation(), 0);
    }
  }
  _onSave() {
    logger.info("Save clicked");
    this.dispatchEvent(
      new CustomEvent("save", {
        bubbles: true,
        composed: true
      })
    );
  }
  _onCancel() {
    logger.info("Cancel clicked");
    this.dispatchEvent(
      new CustomEvent("cancel", {
        bubbles: true,
        composed: true
      })
    );
  }
  _onDelete() {
    logger.info("Delete clicked");
    this.dispatchEvent(
      new CustomEvent("delete", {
        bubbles: true,
        composed: true
      })
    );
  }
  _smartInsertEntityId(value, selectionStart, selectionEnd, entityId) {
    if (selectionStart === selectionEnd) {
      let openQuote = value.lastIndexOf('"', selectionStart - 1);
      let closeQuote = value.indexOf('"', selectionStart);
      if (openQuote !== -1 && closeQuote !== -1 && openQuote < selectionStart && selectionStart <= closeQuote) {
        const before2 = value.slice(0, openQuote + 1);
        const after2 = value.slice(closeQuote);
        const newValue2 = before2 + entityId + after2;
        const newCursor = before2.length + entityId.length;
        return { newValue: newValue2, newCursor };
      }
    }
    const structural = /[\[\]\{\}:,]/g;
    let left = selectionStart - 1;
    let right = selectionEnd;
    while (left >= 0 && !structural.test(value[left]))
      left--;
    while (right < value.length && !structural.test(value[right]))
      right++;
    let before = value.slice(0, left + 1);
    let after = value.slice(right);
    let region = value.slice(left + 1, right);
    let trimmed = region.trim();
    let newRegion;
    if (/^".*"$/.test(trimmed)) {
      newRegion = '"' + entityId + '"';
    } else {
      newRegion = '"' + entityId + '"';
    }
    let newValue = before + " " + newRegion + " " + after;
    newValue = newValue.replace(/ +/g, " ");
    const cursor = (before + ' "' + entityId + '"').length;
    return {
      newValue,
      newCursor: cursor
    };
  }
  render() {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    if (!this.hass || !this.draft) {
      return x`<div>Loading... (hass: ${!!this.hass}, draft: ${!!this.draft})</div>`;
    }
    if (!this._working) {
      this._working = structuredClone(this.draft);
    }
    const entityDomainList = Array.isArray(this.entityDomainList) && this.entityDomainList.length ? this.entityDomainList : ENTITY_DOMAIN_LIST;
    return x`
        ${this._entityCacheError ? x`
          <div class="row">
            <ha-alert alert-type="warning">
              ${this._entityCacheError}
            </ha-alert>
          </div>
        ` : ""}
        <div class="row">
          <div class="row-4">
            <ha-selector
              .hass=${this.hass}
              .selector=${this._cachedEntities ? { entity: { include_entities: this._cachedEntities } } : { entity: { domain: entityDomainList } }}
              .value=${(_b = (_a2 = this._working) == null ? void 0 : _a2.entity) != null ? _b : ""}
              ?disabled=${this.disabled}
              @value-changed=${(e2) => this._change("entity", e2.detail.value)}
              .label=${"Entity*"}
            ></ha-selector>

            <ha-formfield label="Active">
              ${this._renderSwitch(
      (_d = (_c = this._working) == null ? void 0 : _c.active) != null ? _d : true,
      this.disabled,
      (e2) => this._change("active", e2.target.checked)
    )}
            </ha-formfield>
          </div>
          <div class="row-1-2-1">
            <ha-selector
              .hass=${this.hass}
              .label=${"Service"}
              .value=${(_f = (_e = this._working) == null ? void 0 : _e.service) != null ? _f : ""}
              .selector=${{
      select: {
        options: (() => {
          var _a3, _b2;
          const domain = (_b2 = (_a3 = this._working) == null ? void 0 : _a3.entity) == null ? void 0 : _b2.split(".")[0];
          if (!domain || !this.hass.services[domain])
            return [];
          const coreServices = ["turn_on", "turn_off", "toggle", "reload"];
          return Object.keys(this.hass.services[domain]).filter((s2) => domain !== "script" || coreServices.includes(s2)).map((s2) => `${domain}.${s2}`);
        })(),
        custom_value: true
      }
    }}
              ?disabled=${this.disabled}
              @value-changed=${(e2) => this._change("service", e2.detail.value)}
            ></ha-selector>
            <ha-input
              id="service-data-input"
              label="Service data (JSON, optional)"
              .value=${(() => {
      var _a3, _b2;
      try {
        return JSON.stringify((_b2 = (_a3 = this._working) == null ? void 0 : _a3.service_data) != null ? _b2 : {});
      } catch (e2) {
        logger.error("E2AEditor: Failed to stringify service_data", e2);
        return "{}";
      }
    })()}
              ?disabled=${this.disabled}
              @mouseup=${(e2) => {
      var _a3, _b2;
      const t2 = (_b2 = (_a3 = e2.composedPath) == null ? void 0 : _a3.call(e2)) == null ? void 0 : _b2[0];
      if ((t2 == null ? void 0 : t2.selectionStart) !== void 0) {
        this._sdCursorStart = t2.selectionStart;
        this._sdCursorEnd = t2.selectionEnd;
      }
    }}
              @keyup=${(e2) => {
      var _a3, _b2;
      const t2 = (_b2 = (_a3 = e2.composedPath) == null ? void 0 : _a3.call(e2)) == null ? void 0 : _b2[0];
      if ((t2 == null ? void 0 : t2.selectionStart) !== void 0) {
        this._sdCursorStart = t2.selectionStart;
        this._sdCursorEnd = t2.selectionEnd;
      }
    }}
              @input=${(e2) => {
      const val = e2.target.value;
      if (val.trim() === "" || val.trim() === '""') {
        this._change("service_data", {});
        e2.target.value = "";
        this._setServiceDataValidation(e2.target, false, "");
        return;
      }
      try {
        const parsed = JSON.parse(val);
        this._change("service_data", parsed);
        this._setServiceDataValidation(e2.target, false, "");
      } catch {
        this._setServiceDataValidation(e2.target, true, "Invalid JSON");
      }
    }}
            >
            </ha-input>
            ${this._getCommonServiceDataKeys().length > 1 && this._showCommonParamSelector ? x`
              <div style="display: flex; flex-direction: column; width: 100%;">
                <ha-selector
                  .hass=${this.hass}
                  .label=${"Add common parameter"}
                  .value=${""}
                  .required=${false}
                  .selector=${{
      select: {
        options: (() => {
          var _a3;
          const allowed = ["script.turn_on"];
          const currentService = (_a3 = this._working) == null ? void 0 : _a3.service;
          if (allowed.includes(currentService)) {
            return ["Select entity", ...this._getCommonServiceDataKeys().map((k2) => k2.label)];
          }
          return this._getCommonServiceDataKeys().map((k2) => k2.label);
        })(),
        custom_value: false,
        mode: "dropdown"
      }
    }}
                  ?disabled=${this.disabled}
                  @value-changed=${(e2) => {
      const label = e2.detail.value;
      if (label === "Select entity") {
        this._showEntitySelector = true;
      } else {
        const template = this._getCommonServiceDataKeys().find((k2) => k2.label === label);
        if (template && template.value) {
          this._addServiceDataKey(template.value);
        }
      }
      this._showCommonParamSelector = false;
      setTimeout(() => {
        this._showCommonParamSelector = true;
      }, 0);
    }}
                ></ha-selector>
                ${this._showEntitySelector ? x`
                  <div style="position: relative; margin-top: 8px; width: 100%;">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${"Select entity to add"}
                      .value=${""}
                      .required=${true}
                      style="width: 100%;"
                      .selector=${{
      entity: { domain: entityDomainList }
    }}
                      @value-changed=${(e2) => {
      var _a3, _b2, _c2;
      const raw = (_a3 = e2.detail) == null ? void 0 : _a3.value;
      const selected = typeof raw === "string" ? raw : (raw == null ? void 0 : raw.entity_id) || (raw == null ? void 0 : raw.value) || "";
      logger.debug("E2AEditor: entity picker value-changed", { raw, selected, cursor: this._sdCursorStart });
      if (selected) {
        const currentJson = (() => {
          var _a4, _b3;
          try {
            return JSON.stringify((_b3 = (_a4 = this._working) == null ? void 0 : _a4.service_data) != null ? _b3 : {});
          } catch {
            return "{}";
          }
        })();
        const { newValue } = this._smartInsertEntityId(currentJson, this._sdCursorStart, this._sdCursorEnd, selected);
        try {
          const parsed = JSON.parse(newValue);
          this._change("service_data", parsed);
        } catch {
          const currentData = { ...(_c2 = (_b2 = this._working) == null ? void 0 : _b2.service_data) != null ? _c2 : {} };
          currentData.entity_id = selected;
          this._change("service_data", currentData);
        }
        setTimeout(() => {
          this._showEntitySelector = false;
        }, 0);
      } else {
        this._showEntitySelector = false;
      }
    }}
                    ></ha-selector>
                    <button
                      @click=${() => {
      this._showEntitySelector = false;
      setTimeout(() => {
        var _a3;
        const selector = (_a3 = this.shadowRoot) == null ? void 0 : _a3.querySelector('ha-selector[label="Add common parameter"]');
        if (selector)
          selector.value = "";
      }, 100);
    }}
                      style="position: absolute; top: 4px; right: 4px; background: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.15); cursor: pointer; font-size: 16px; line-height: 24px; padding: 0; z-index: 10;"
                      title="Close"
                    >&#10005;</button>
                  </div>
                ` : ""}
              </div>
            ` : x`<div></div>`}
          </div>
        <div>Optional data:</div>
        <div class="row row-4">
          <ha-selector
            .hass=${this.hass}
            .label=${"Remote"}
            .value=${(_h = (_g = this._working) == null ? void 0 : _g.remote) != null ? _h : ""}
            .required=${false}
            .selector=${{
      select: {
        options: this._getUniqueValues("remote").map((i2) => i2.value),
        custom_value: true,
        mode: "dropdown"
      }
    }}
            ?disabled=${this.disabled}
            @value-changed=${(e2) => this._change("remote", e2.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .label=${"Type"}
            .value=${(_j = (_i = this._working) == null ? void 0 : _i.type) != null ? _j : ""}
            .required=${false}
            .selector=${{
      select: {
        options: this._getUniqueValues("type").map((i2) => i2.value),
        custom_value: true,
        mode: "dropdown"
      }
    }}
            ?disabled=${this.disabled}
            @value-changed=${(e2) => this._change("type", e2.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .label=${"Button"}
            .value=${(_l = (_k = this._working) == null ? void 0 : _k.button) != null ? _l : ""}
            .required=${false}
            .selector=${{
      select: {
        options: this._getUniqueValues("button").map((i2) => i2.value),
        custom_value: true,
        mode: "dropdown"
      }
    }}
            ?disabled=${this.disabled}
            @value-changed=${(e2) => this._change("button", e2.detail.value)}>
          </ha-selector>

          <ha-selector
            .hass=${this.hass}
            .label=${"Channel"}
            .value=${(_n = (_m = this._working) == null ? void 0 : _m.channel) != null ? _n : ""}
            .required=${false}
            .selector=${{
      select: {
        options: this._getUniqueValues("channel").map((i2) => i2.value),
        custom_value: true,
        mode: "dropdown"
      }
    }}
            ?disabled=${this.disabled}
            @value-changed=${(e2) => this._change("channel", e2.detail.value)}>
          </ha-selector>
        </div>

        <div class="row-4">
          <div class="buttons">
            <ha-button raised @click=${this._onSave} ?disabled=${!this._isDirty()}>Save</ha-button>
            <ha-button @click=${this._onCancel}>Cancel</ha-button>
            <ha-button class="danger" @click=${this._onDelete} ?disabled=${!this.existing}>Delete</ha-button>
          </div>
        </div>
      </div>
    `;
  }
}
__publicField(E2AEditor, "properties", {
  hass: { attribute: false },
  draft: { type: Object },
  collection: { type: Array },
  entityDomainList: { type: Array },
  customCommonServiceDataKeys: { type: Object },
  prefillServiceData: { type: Object },
  _baseline: { state: true },
  _working: { state: true },
  _cachedEntities: { state: true },
  _entityCacheError: { state: true },
  disabled: { type: Boolean },
  existing: { type: Boolean },
  _showEntitySelector: { state: true },
  _showCommonParamSelector: { state: true }
});
__publicField(E2AEditor, "styles", [
  e2aTheme,
  e2aComponents,
  e2aLayout,
  e2aStyles,
  i$1`
      .highlight {
        color: var(--primary-color);
      }
      .e2a-fallback-switch {
        width: 40px;
        height: 20px;
        accent-color: var(--primary-color);
      }
    `
]);
if (!customElements.get("e2a-editor")) {
  customElements.define("e2a-editor", E2AEditor);
}
const DEFAULT_CONFIG = {
  entity_domain_list: ENTITY_DOMAIN_LIST,
  custom_common_service_data_keys: CUSTOM_COMMON_SERVICE_DATA_KEYS,
  prefill_service_data: PREFILL_SERVICE_DATA,
  auto_unblock: AUTO_UNBLOCK,
  log_level: LOG_LEVEL
};
class Event2ActionLearningCardEditor extends s {
  constructor() {
    super();
    this.config = {};
    this._customCommonServiceDataKeysText = this._formatJson(DEFAULT_CONFIG.custom_common_service_data_keys);
    this._prefillServiceDataText = this._formatJson(DEFAULT_CONFIG.prefill_service_data);
    this._customCommonServiceDataKeysError = "";
    this._prefillServiceDataError = "";
  }
  setConfig(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config || {}
    };
    this._customCommonServiceDataKeysText = this._formatJson(this.config.custom_common_service_data_keys);
    this._prefillServiceDataText = this._formatJson(this.config.prefill_service_data);
  }
  _formatJson(value) {
    return JSON.stringify(value != null ? value : {}, null, 2);
  }
  _dispatchConfig(nextConfig) {
    this.config = nextConfig;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: nextConfig },
      bubbles: true,
      composed: true
    }));
  }
  _setConfigValue(key, value) {
    this._dispatchConfig({
      ...this.config,
      [key]: value
    });
  }
  _onDomainsChanged(event) {
    const domains = event.target.value.split(",").map((domain) => domain.trim()).filter(Boolean);
    this._setConfigValue("entity_domain_list", domains);
  }
  _onJsonChanged(key, textKey, errorKey, event) {
    const text = event.target.value;
    this[textKey] = text;
    try {
      const parsed = JSON.parse(text || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Expected a JSON object");
      }
      this[errorKey] = "";
      this._setConfigValue(key, parsed);
    } catch (error) {
      this[errorKey] = error.message;
    }
  }
  _renderSwitch(checked, onChange) {
    if (customElements.get("ha-switch")) {
      return x`
        <ha-switch
          .checked=${checked}
          @change=${onChange}>
        </ha-switch>
      `;
    }
    return x`
      <input
        type="checkbox"
        .checked=${checked}
        @change=${onChange}
      />
    `;
  }
  render() {
    var _a2;
    const config = {
      ...DEFAULT_CONFIG,
      ...this.config || {}
    };
    return x`
      <div class="editor">
        <label class="field">
          <span>Entity domains</span>
          <input
            type="text"
            .value=${(config.entity_domain_list || []).join(", ")}
            @change=${this._onDomainsChanged}
          />
          <small>Comma-separated domains shown by the target entity selector.</small>
        </label>

        <label class="field">
          <span>Custom common service data keys</span>
          <textarea
            rows="10"
            .value=${this._customCommonServiceDataKeysText}
            @input=${(event) => this._onJsonChanged(
      "custom_common_service_data_keys",
      "_customCommonServiceDataKeysText",
      "_customCommonServiceDataKeysError",
      event
    )}
          ></textarea>
          <small>JSON object keyed by entity/service patterns, for example <code>*dimmer_control|script.turn_on</code>.</small>
          ${this._customCommonServiceDataKeysError ? x`<div class="error">${this._customCommonServiceDataKeysError}</div>` : null}
        </label>

        <label class="field">
          <span>Prefill service data</span>
          <textarea
            rows="8"
            .value=${this._prefillServiceDataText}
            @input=${(event) => this._onJsonChanged(
      "prefill_service_data",
      "_prefillServiceDataText",
      "_prefillServiceDataError",
      event
    )}
          ></textarea>
          <small>JSON object keyed by entity/service patterns. Values are inserted into the service data field.</small>
          ${this._prefillServiceDataError ? x`<div class="error">${this._prefillServiceDataError}</div>` : null}
        </label>

        <div class="field switch-row">
          <span>
            <span>Auto unblock</span>
            <small>Unblock Event2Action automatically when leaving the card.</small>
          </span>
          ${this._renderSwitch(
      config.auto_unblock !== false,
      (event) => this._setConfigValue("auto_unblock", event.target.checked)
    )}
        </div>

        <label class="field">
          <span>Log level</span>
          <select
            .value=${String((_a2 = config.log_level) != null ? _a2 : LOG_LEVEL)}
            @change=${(event) => this._setConfigValue("log_level", Number(event.target.value))}
          >
            <option value="0">0 - off</option>
            <option value="1">1 - errors</option>
            <option value="2">2 - warnings</option>
            <option value="3">3 - info</option>
            <option value="4">4 - debug</option>
          </select>
        </label>
      </div>
    `;
  }
}
__publicField(Event2ActionLearningCardEditor, "properties", {
  hass: { attribute: false },
  config: { attribute: false },
  _customCommonServiceDataKeysText: { state: true },
  _prefillServiceDataText: { state: true },
  _customCommonServiceDataKeysError: { state: true },
  _prefillServiceDataError: { state: true }
});
__publicField(Event2ActionLearningCardEditor, "styles", i$1`
    .editor {
      display: grid;
      gap: 16px;
    }

    .field {
      display: grid;
      gap: 6px;
    }

    .field > span,
    .switch-row > span > span {
      font-weight: 500;
    }

    input,
    select,
    textarea {
      box-sizing: border-box;
      width: 100%;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
      font: inherit;
    }

    textarea {
      font-family: var(--code-font-family, monospace);
      resize: vertical;
    }

    small {
      color: var(--secondary-text-color);
      line-height: 1.35;
    }

    .switch-row {
      grid-template-columns: 1fr auto;
      align-items: center;
    }

    .error {
      color: var(--error-color);
      font-size: 12px;
    }
  `);
if (!customElements.get("event2action-learning-card-editor")) {
  customElements.define("event2action-learning-card-editor", Event2ActionLearningCardEditor);
}
const _E2ALearningCard = class extends BusyOverlayMixin(s) {
  constructor() {
    super();
    this._runtime_mapping_sensor = RUNTIME_MAPPING_SENSOR;
    this._runtime_mapping_topic = RUNTIME_MAPPING_TOPIC;
    this._session_backup_sensor = SESSION_BACKUP_SENSOR;
    this._session_backup_topic = SESSION_BACKUP_TOPIC;
    this._step_backup_sensor = STEP_BACKUP_SENSOR;
    this._step_backup_topic = STEP_BACKUP_TOPIC;
    this._lastevent_store = LASTEVENT_STORE;
    this._blocking_helper = BLOCKING_HELPER;
    this._blockSeconds = DEFAULT_BLOCK_SECONDS;
    this._entityDomainList = ENTITY_DOMAIN_LIST;
    this._customCommonServiceDataKeys = CUSTOM_COMMON_SERVICE_DATA_KEYS;
    this._prefillServiceData = PREFILL_SERVICE_DATA;
    this._autoUnblock = AUTO_UNBLOCK;
    this._logLevel = LOG_LEVEL;
    this._undoLabel = "Undo last session";
    this._undoHint = "Restores the mapping to the state before starting the last learning session.";
    this._busyLabel = "Working\u2026";
    this._lockedPcc = null;
    this._learningMode = false;
    this._lastHandledEventTs = null;
    this._editorStartedAt = null;
    this._prevStoreState = null;
    this._busy = false;
    this._undoDisabled = false;
    this._publishSeq = 0;
    this._resetLastEventData();
    this._blockCounter = 0;
    this._blockCounterInterval = null;
    this._savedBlockTime = null;
  }
  setConfig(config) {
    this.config = config || {};
    this._entityDomainList = this._normalizeStringList(
      this.config.entity_domain_list,
      ENTITY_DOMAIN_LIST
    );
    this._customCommonServiceDataKeys = this._normalizeObjectConfig(
      this.config.custom_common_service_data_keys,
      CUSTOM_COMMON_SERVICE_DATA_KEYS
    );
    this._prefillServiceData = this._normalizeObjectConfig(
      this.config.prefill_service_data,
      PREFILL_SERVICE_DATA
    );
    this._autoUnblock = this._normalizeBoolean(
      this.config.auto_unblock,
      AUTO_UNBLOCK
    );
    this._logLevel = this._normalizeNumber(
      this.config.log_level,
      LOG_LEVEL
    );
    setLogLevel(this._logLevel);
    const configuredBlockSeconds = this._normalizeNumber(
      this.config.default_block_seconds,
      null
    );
    if (configuredBlockSeconds !== null && configuredBlockSeconds > 0) {
      this._blockSeconds = configuredBlockSeconds;
    }
  }
  static getConfigElement() {
    return document.createElement("event2action-learning-card-editor");
  }
  static getStubConfig() {
    return {
      entity_domain_list: ENTITY_DOMAIN_LIST,
      custom_common_service_data_keys: CUSTOM_COMMON_SERVICE_DATA_KEYS,
      prefill_service_data: PREFILL_SERVICE_DATA,
      auto_unblock: AUTO_UNBLOCK,
      log_level: LOG_LEVEL
    };
  }
  _normalizeStringList(value, fallback) {
    if (Array.isArray(value)) {
      const entries = value.map((item) => String(item).trim()).filter(Boolean);
      return entries.length ? entries : fallback;
    }
    if (typeof value === "string") {
      const entries = value.split(",").map((item) => item.trim()).filter(Boolean);
      return entries.length ? entries : fallback;
    }
    return fallback;
  }
  _normalizeObjectConfig(value, fallback) {
    return value && typeof value === "object" ? value : fallback;
  }
  _normalizeBoolean(value, fallback) {
    if (typeof value === "boolean")
      return value;
    if (typeof value === "string") {
      if (value.toLowerCase() === "true")
        return true;
      if (value.toLowerCase() === "false")
        return false;
    }
    return fallback;
  }
  _normalizeNumber(value, fallback) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }
  _getRuntimeMappingEntity() {
    return this._runtime_mapping_sensor;
  }
  _getRuntimeMappingTopic() {
    return this._runtime_mapping_topic;
  }
  _getSessionBackupEntity() {
    return this._session_backup_sensor;
  }
  _getSessionBackupTopic() {
    return this._session_backup_topic;
  }
  _getStepBackupEntity() {
    return this._step_backup_sensor;
  }
  _getStepBackupTopic() {
    return this._step_backup_topic;
  }
  _getLastEventStoreEntity() {
    return this._lastevent_store;
  }
  _getBlockingHelperEntity() {
    return this._blocking_helper;
  }
  async connectedCallback() {
    super.connectedCallback();
    logger.debug("E2ALearningCard: connectedCallback called");
    this.setLastEventData();
    this._setSessionBackupHint();
    if (this._autoUnblock && this.hass) {
      try {
        const savedBlock = localStorage.getItem("e2a_block_time");
        logger.debug("E2ALearningCard: Restoring block time from localStorage:", savedBlock);
        if (savedBlock) {
          const seconds = parseInt(savedBlock, 10);
          if (seconds > 0) {
            this.blockEvents(seconds);
            logger.debug(`E2ALearningCard: Restored and re-blocked for ${seconds} seconds from localStorage`);
          }
          localStorage.removeItem("e2a_block_time");
        }
      } catch (e2) {
        logger.warn("E2ALearningCard: Failed to restore block time from localStorage", e2);
      }
    }
    const savedLearning = localStorage.getItem("e2a_learning_mode");
    if (savedLearning !== null) {
      this._learningMode = savedLearning === "true";
      logger.debug("E2ALearningCard: Restored learning mode from localStorage:", this._learningMode);
    }
    this._onBeforeUnload = () => {
      if (this._autoUnblock) {
        this.unBlockEvents();
        logger.debug("E2ALearningCard: unblocking due to page unload");
      }
    };
    window.addEventListener("beforeunload", this._onBeforeUnload);
    this._unhandledRejectionHandler = (event) => {
      var _a2, _b, _c, _d, _e, _f, _g, _h;
      if (((_b = (_a2 = event.reason) == null ? void 0 : _a2.error) == null ? void 0 : _b.code) === "not_found" && ((_c = event.reason) == null ? void 0 : _c.type) === "result" && !((_d = event.reason) == null ? void 0 : _d.success)) {
        event.preventDefault();
      } else if (((_f = (_e = event.reason) == null ? void 0 : _e.error) == null ? void 0 : _f.code) === 3 && ((_h = (_g = event.reason) == null ? void 0 : _g.error) == null ? void 0 : _h.message) === "Connection lost") {
        logger.warn("WebSocket connection lost. Ignoring to prevent page crash.");
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", this._unhandledRejectionHandler);
  }
  disconnectedCallback() {
    var _a2;
    super.disconnectedCallback();
    logger.debug("E2ALearningCard: disconnectedCallback called");
    if (this._unhandledRejectionHandler) {
      window.removeEventListener("unhandledrejection", this._unhandledRejectionHandler);
    }
    try {
      localStorage.setItem("e2a_learning_mode", this._learningMode ? "true" : "false");
      logger.debug("E2ALearningCard: Saved learning mode to localStorage:", this._learningMode);
    } catch (e2) {
      logger.warn("E2ALearningCard: Failed to save learning mode to localStorage", e2);
    }
    if (this._autoUnblock) {
      if (this.hass && ((_a2 = this.hass.states[this._getBlockingHelperEntity()]) == null ? void 0 : _a2.state) === "on") {
        try {
          localStorage.setItem("e2a_block_time", String(this._blockCounter));
        } catch (e2) {
          logger.warn("E2ALearningCard: Failed to save block time to localStorage", e2);
        }
      } else {
        try {
          localStorage.removeItem("e2a_block_time");
        } catch (e2) {
        }
      }
      this.unBlockEvents();
      logger.debug("E2ALearningCard: unblocking due to disconnect");
    }
    if (this._blockCounterInterval) {
      clearInterval(this._blockCounterInterval);
      this._blockCounterInterval = null;
    }
  }
  updated(changedProps) {
    if (changedProps.has("_learningMode")) {
      try {
        localStorage.setItem("e2a_learning_mode", this._learningMode ? "true" : "false");
        logger.debug("E2ALearningCard: Learning mode changed, saved to localStorage:", this._learningMode);
      } catch (e2) {
        logger.warn("E2ALearningCard: Failed to save learning mode to localStorage", e2);
      }
    }
    if (!changedProps.has("hass"))
      return;
    this._syncBlockSecondsFromRuntimeSettings();
    this.setLastEventData();
    if (!this._hasValidLastData)
      return;
    if (!this._learningMode)
      return;
    if (!!this._lockedPcc)
      return;
    if (this._lastTs <= this._lastHandledEventTs)
      return;
    this._start_EditMode(this._lastProto, this._lastCode, this._lastPressed);
  }
  setLastEventData() {
    var _a2;
    const store = this.hass.states[this._getLastEventStoreEntity()];
    const storeState = (_a2 = store == null ? void 0 : store.state) != null ? _a2 : null;
    if (storeState !== this._prevStoreState) {
      logger.info("E2ALearningCard: Detected change in RF event store");
      this._prevStoreState = storeState;
      if (!storeState || storeState === "unknown" || storeState === "unavailable") {
        this._resetLastEventData();
      } else {
        try {
          const data = JSON.parse(storeState);
          this._lastProto = data.proto;
          this._lastCode = data.code;
          this._lastPressed = data.pressed || "";
          this._lastTs = new Date(data.ts).getTime();
          this._hasValidLastData = this._lastProto != null && this._lastCode != null && this._lastTs != null;
          logger.debug("E2ALearningCard: last RF event =", this._lastProto, this._lastCode, this._lastPressed, this._lastTs);
        } catch (e2) {
          logger.error("E2ALearningCard: Failed to parse RF event store data", e2);
          this._resetLastEventData();
        }
      }
    }
  }
  _resetLastEventData() {
    this._hasValidLastData = false;
    this._lastProto = null;
    this._lastCode = null;
    this._lastPressed = null;
    this._lastTs = null;
  }
  _get_mapping_data(sensor_entity) {
    var _a2, _b;
    const stateObj = this.hass.states[sensor_entity];
    if (!stateObj) {
      logger.warn("E2ALearningCard: mapping state object not found");
      return { lastupdated: 0, map: [], settings: {} };
    }
    const lastupdated = stateObj.last_updated;
    const map = ((_a2 = stateObj.attributes) == null ? void 0 : _a2.map) || [];
    const settings = ((_b = stateObj.attributes) == null ? void 0 : _b.settings) || {};
    logger.debug("E2ALearningCard: fetched mapping data with", map.length, "entries", lastupdated);
    return { lastupdated, map, settings };
  }
  _getBlockSecondsFromSettings(settings) {
    const seconds = Number(settings == null ? void 0 : settings.block_seconds);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  }
  _syncBlockSecondsFromRuntimeSettings() {
    var _a2, _b, _c;
    const settings = (_c = (_b = (_a2 = this.hass) == null ? void 0 : _a2.states[this._getRuntimeMappingEntity()]) == null ? void 0 : _b.attributes) == null ? void 0 : _c.settings;
    const seconds = this._getBlockSecondsFromSettings(settings);
    if (seconds !== null && seconds !== this._blockSeconds) {
      this._blockSeconds = seconds;
    }
  }
  _getSettingsForPublish(sensor_entity, overrides = {}) {
    var _a2, _b;
    const existing = ((_b = (_a2 = this.hass.states[sensor_entity]) == null ? void 0 : _a2.attributes) == null ? void 0 : _b.settings) || {};
    const settings = {
      ...existing,
      ...overrides
    };
    if (this._getBlockSecondsFromSettings(settings) === null) {
      settings.block_seconds = this._blockSeconds || DEFAULT_BLOCK_SECONDS;
    }
    return settings;
  }
  _compare_mapping_states(sensor_entity1, sensor_entity2) {
    var _a2, _b, _c, _d;
    return JSON.stringify((_b = (_a2 = this.hass.states[sensor_entity1]) == null ? void 0 : _a2.attributes) == null ? void 0 : _b.map) === JSON.stringify((_d = (_c = this.hass.states[sensor_entity2]) == null ? void 0 : _c.attributes) == null ? void 0 : _d.map);
  }
  _isDirty() {
    return JSON.stringify(this._draft) !== JSON.stringify(this._original);
  }
  _hasValue(value) {
    if (value == null)
      return false;
    if (typeof value === "string")
      return value.trim() !== "";
    if (typeof value === "object")
      return Object.keys(value).length > 0;
    return true;
  }
  findMapping(map, proto, code) {
    if (!Array.isArray(map))
      return null;
    const p2 = String(proto);
    const c2 = String(code);
    return map.find(
      (e2) => String(e2.proto) === p2 && String(e2.code) === c2
    ) || null;
  }
  _setBusy(active, label) {
    this._busy = active;
    if (label !== void 0) {
      this._busyLabel = label;
    }
  }
  _setSessionBackupHint() {
    var _a2;
    const lastupdated = (_a2 = this.hass.states[this._getSessionBackupEntity()]) == null ? void 0 : _a2.last_updated;
    if (lastupdated) {
      if (this._compare_mapping_states(this._getSessionBackupEntity(), this._getRuntimeMappingEntity())) {
        this._undoDisabled = true;
        this._undoHint = "Mapping state matches the last session backup.";
      } else {
        this._undoDisabled = false;
        this._undoHint = "Restores the RF/Zigbee mapping to the state before starting the last learning session.\ndated " + formatDateTime(this.hass, new Date(lastupdated));
      }
    } else {
      this._undoDisabled = true;
      this._undoHint = "No session backup available to undo.";
    }
  }
  async _waitForSensorUpdate(entityId, sinceTs, timeoutMs = 5e3, intervalMs = 200) {
    logger.debug(`E2ALearningCard: waiting for ${entityId} to update since ${new Date(sinceTs).toISOString()}`);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const st = this.hass.states[entityId];
      if (!st)
        return false;
      const updated = new Date(st.last_updated).getTime();
      logger.debug(`E2ALearningCard: checking ${entityId}, last updated at ${new Date(updated).toISOString()}`);
      if (updated > sinceTs) {
        return true;
      }
      await new Promise((r2) => setTimeout(r2, intervalMs));
    }
    return false;
  }
  async _publish_map(sensor, topic, map, settings = null) {
    var _a2, _b;
    const publishStamp = `${Date.now()}-${++this._publishSeq}`;
    const payload = {
      state: `loaded_${publishStamp}`,
      settings: settings != null ? settings : this._getSettingsForPublish(sensor),
      map
    };
    logger.debug("E2ALearningCard: publishing payload to", topic, payload);
    const beforeTs = new Date((_b = (_a2 = this.hass.states[sensor]) == null ? void 0 : _a2.last_updated) != null ? _b : 0).getTime();
    try {
      await this.hass.callService("mqtt", "publish", {
        topic,
        payload: JSON.stringify(payload),
        retain: true
      });
    } catch (err) {
      logger.error("Failed to publish MQTT message:", err);
      throw new Error(`Connection lost while publishing to ${topic}. Please check your Home Assistant connection.`);
    }
    const ok = await this._waitForSensorUpdate(sensor, beforeTs);
    if (!ok) {
      throw new Error(sensor + " did not update (timeout)");
    }
    logger.info(sensor + " updated successfully");
  }
  async _createBackupIfNeeded(type, doDelete = false) {
    var _a2;
    if (type !== "step" && type !== "session") {
      throw new Error("Invalid backup type: " + type);
    }
    const backup_sensor = type === "step" ? this._getStepBackupEntity() : this._getSessionBackupEntity();
    const backup_topic = type === "step" ? this._getStepBackupTopic() : this._getSessionBackupTopic();
    const typeText = type === "step" ? "last save" : "last session";
    if (this._compare_mapping_states(backup_sensor, this._getRuntimeMappingEntity())) {
      return true;
    }
    logger.info("E2A: creating " + type + " backup");
    this._setBusy(true, "Creating " + type + " backup\u2026");
    const { map, settings } = this._get_mapping_data(this._getRuntimeMappingEntity());
    if (map.length === 0 || doDelete && map.length === 1) {
      logger.warn("E2A: current mapping is empty");
      const ok = await confirm("Current mapping is empty.\n\nDo you want to skip backup of empty mapping?", { yes: "Proceed", no: "Cancel" });
      this._setBusy(false);
      if (!ok)
        return true;
    }
    try {
      await this._publish_map(
        backup_sensor,
        backup_topic,
        map,
        settings
      );
      logger.info("E2A: " + type + " backup created");
      const lastupdated = (_a2 = this.hass.states[this._getRuntimeMappingEntity()]) == null ? void 0 : _a2.last_updated;
      this._undoDisabled = false;
      this._undoLabel = "Undo " + typeText;
      this._undoHint = "Restores the mapping to the state before the " + typeText + ", dated " + formatDateTime(this.hass, new Date(lastupdated));
      return true;
    } catch (err) {
      logger.error("E2A: failed to create " + type + " backup", err);
      const ok = await confirm(
        "Failed to create " + type + " backup.\nCheck Home Assistant logs for details." + (type === "step" ? "\nDo you want to proceed with saving the mapping anyway?" : ""),
        { yes: type === "step" ? "Proceed" : "Ok", no: type === "step" ? "Cancel" : "" }
      );
      this._setBusy(false);
      if (type === "step")
        return ok;
      return false;
    } finally {
      this._setBusy(false);
    }
  }
  _build_new_map(oldMap, newMap) {
    logger.debug("E2ALearningCard: Building new map", newMap, oldMap);
    const result = [];
    const seen = /* @__PURE__ */ new Set();
    const cleanedNewMap = newMap.map((entry) => {
      const cleaned = { ...entry };
      if (cleaned.temp)
        delete cleaned.temp;
      return cleaned;
    });
    for (let i2 = 0; i2 < oldMap.length; i2++) {
      const oldEntry = oldMap[i2];
      const oldKey = oldEntry.proto + ":" + oldEntry.code;
      let replaced = false;
      for (let j = 0; j < cleanedNewMap.length; j++) {
        const newEntry = cleanedNewMap[j];
        const newKey = newEntry.proto + ":" + newEntry.code;
        if (newKey === oldKey) {
          result.push(structuredClone(newEntry));
          seen.add(newKey);
          replaced = true;
          break;
        }
      }
      if (!replaced) {
        result.push(structuredClone(oldEntry));
      }
    }
    for (let j = 0; j < cleanedNewMap.length; j++) {
      const newEntry = cleanedNewMap[j];
      const newKey = newEntry.proto + ":" + newEntry.code;
      if (!seen.has(newKey)) {
        result.push(structuredClone(newEntry));
      }
    }
    return result;
  }
  _delete_from_map(oldMap, toDelete) {
    const result = [];
    const deleteKey = toDelete.proto + ":" + toDelete.code;
    for (let i2 = 0; i2 < oldMap.length; i2++) {
      const oldEntry = oldMap[i2];
      const oldKey = oldEntry.proto + ":" + oldEntry.code;
      if (oldKey !== deleteKey) {
        result.push(structuredClone(oldEntry));
      }
    }
    return result;
  }
  async toggleLearningMode(e2) {
    logger.info("E2ALearningCard: toggling learning mode to", e2.target.checked);
    if (!this.hass)
      return;
    this._undoDisabled = true;
    this._learningMode = e2.target.checked;
    this.dispatchEvent(new CustomEvent("learning-mode-changed"));
    if (this._learningMode) {
      this._lastHandledEventTs = this._lastTs;
      this._lockedPcc = null;
      this._undoDisabled = true;
      this._undoLabel = "Undo last save";
      this._undoHint = "No saved mapping changes yet in this learning session.";
      await this._createBackupIfNeeded("session");
    } else {
      this._lastHandledEventTs = 0;
      this._lockedPcc = null;
      this._undoLabel = "Undo last session";
      this._setSessionBackupHint();
    }
  }
  _start_EditMode(proto, code, pressed) {
    var _a2;
    logger.info("E2ALearningCard: starting editor for ", proto, code);
    this._lockedPcc = { proto, code };
    this._editorStartedAt = Date.now();
    const stateObj = this.hass.states[this._getRuntimeMappingEntity()];
    logger.debug("E2ALearningCard: map stateObj =", stateObj);
    if (!stateObj)
      return;
    const map = Array.isArray((_a2 = stateObj.attributes) == null ? void 0 : _a2.map) ? stateObj.attributes.map : [];
    const existing = this.findMapping(map, proto, code);
    const baseEntry = {
      ...this._lockedPcc,
      active: true,
      service: "",
      entity: "",
      service_data: {},
      remote: "",
      type: "",
      channel: "",
      button: pressed || "",
      temp: { pressed }
    };
    let originalEntry = structuredClone(existing != null ? existing : baseEntry);
    if ((!originalEntry.button || originalEntry.button === "") && pressed) {
      originalEntry.button = pressed;
      originalEntry.temp = { pressed };
    }
    this._original = originalEntry;
    this._draft = structuredClone(this._original);
  }
  _onDraftChanged(e2) {
    const { field, value } = e2.detail;
    this._draft = { ...this._draft, [field]: value };
  }
  async blockEvents(seconds) {
    logger.debug("E2ALearningCard: blockEvents called with", seconds);
    if (!this.hass || !seconds || seconds <= 0)
      return;
    logger.info(`E2ALearningCard: Blocking RF events for ${seconds} seconds`);
    this._blockCounter = seconds;
    if (this._blockCounterInterval)
      clearInterval(this._blockCounterInterval);
    this._blockCounterInterval = setInterval(() => {
      if (this._blockCounter > 0) {
        this._blockCounter--;
        this.requestUpdate();
      } else {
        clearInterval(this._blockCounterInterval);
        this._blockCounterInterval = null;
        this.requestUpdate();
      }
    }, 1e3);
    this.requestUpdate();
    try {
      await this.hass.callService("script", "temporary_toggle", {
        toggle: this._getBlockingHelperEntity(),
        seconds,
        status: "on"
      });
    } catch (err) {
      logger.error("Failed to block events:", err);
    }
  }
  async unBlockEvents() {
    logger.debug("E2ALearningCard: unBlockEvents called");
    if (!this.hass)
      return;
    try {
      await this.hass.callService("script", "temporary_toggle", {
        toggle: this._getBlockingHelperEntity(),
        status: "off",
        seconds: 0
      });
    } catch (err) {
      logger.error("Failed to unblock events:", err);
    }
    this._blockCounter = 0;
    if (this._blockCounterInterval) {
      clearInterval(this._blockCounterInterval);
      this._blockCounterInterval = null;
    }
    this.requestUpdate();
  }
  async _saveBlockSeconds(seconds) {
    const blockSeconds = Number(seconds);
    if (!Number.isFinite(blockSeconds) || blockSeconds <= 0)
      return;
    this._blockSeconds = blockSeconds;
    const { map, settings } = this._get_mapping_data(this._getRuntimeMappingEntity());
    try {
      await this._publish_map(
        this._getRuntimeMappingEntity(),
        this._getRuntimeMappingTopic(),
        map,
        {
          ...settings,
          block_seconds: blockSeconds
        }
      );
    } catch (err) {
      logger.error("E2A: failed to save block seconds", err);
      await confirm(
        "Failed to save block duration.\nCheck Home Assistant logs for details.",
        { yes: "Ok", no: "" }
      );
    }
  }
  async _onExportMap() {
    const { map } = this._get_mapping_data(this._getRuntimeMappingEntity());
    if (!map || map.length === 0) {
      await confirm("Current RF/Zigbee mapping is empty. Nothing to export.", { yes: "Ok", no: "" });
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `event2action_map_${timestamp}.json`;
    const json = JSON.stringify(map, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement("a");
    a2.href = url;
    a2.download = filename;
    a2.click();
    URL.revokeObjectURL(url);
  }
  async _onImportMap() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (e2) => {
      const file = e2.target.files[0];
      if (!file)
        return;
      try {
        const text = await file.text();
        const importedMap = JSON.parse(text);
        if (!Array.isArray(importedMap)) {
          await confirm("Invalid file format. Expected a JSON array.", { yes: "Ok", no: "" });
          return;
        }
        const ok = await confirm(
          `Import ${importedMap.length} mapping(s) from file?

This will replace the current mapping.`,
          { yes: "Import", no: "Cancel" }
        );
        if (!ok)
          return;
        const backupOk = await this._createBackupIfNeeded("session");
        if (!backupOk)
          return;
        this._setBusy(true, "Importing map\u2026");
        try {
          await this._publish_map(
            this._getRuntimeMappingEntity(),
            this._getRuntimeMappingTopic(),
            importedMap
          );
          await confirm("Map imported successfully.", { yes: "Ok", no: "" });
        } catch (err) {
          logger.error("E2A: failed to import map", err);
          await confirm(
            "Failed to import mapping.\nCheck Home Assistant logs for details.",
            { yes: "Ok", no: "" }
          );
        } finally {
          this._setBusy(false);
        }
      } catch (err) {
        logger.error("E2A: failed to read import file", err);
        await confirm("Failed to read file. Make sure it's a valid JSON file.", { yes: "Ok", no: "" });
      }
    };
    input.click();
  }
  async _onEditorCancel() {
    if (this._isDirty()) {
      const discard = await confirm("You have unsaved changes. Do you really want to discard them?", { yes: "Discard", no: "Keep editing" });
      if (!discard)
        return;
    }
    this._draft = structuredClone(this._original);
    this._lastHandledEventTs = this._lastTs;
    this._lockedPcc = null;
  }
  async _onEditorSave(e2) {
    if (!this._draft.entity || !this._draft.service) {
      const ok = await confirm("Entity and Service fields are required.\nDo you want to save this record anyway?", { yes: "Yes", no: "Cancel" });
      if (!ok)
        return;
    }
    this._saveMap(false);
  }
  async _onEditorDelete() {
    logger.info("E2ALearningCard: Deleting mapping for", this._lockedPcc);
    if (!this._lockedPcc)
      return;
    const confirmDelete = await confirm("Are you sure you want to delete this mapping?", { yes: "Delete", no: "Cancel" });
    if (!confirmDelete)
      return;
    logger.debug("E2ALearningCard: Deleting mapping for", this._lockedPcc);
    this._saveMap(true);
  }
  async _saveMap(doDelete = false) {
    var _a2;
    logger.info("E2ALearningCard: Saving edited mapping", doDelete);
    if (!this._lockedPcc)
      return;
    const stateObj = this.hass.states[this._getRuntimeMappingEntity()];
    if (!stateObj)
      return;
    const lastUpdated = new Date(stateObj.last_updated).getTime();
    if (lastUpdated > this._editorStartedAt) {
      const overwrite = await confirm("The RF mapping has changed since you started editing.\nSaving now will overwrite those changes.\n\nDo you want to proceed?", { yes: "Overwrite", no: "Cancel" });
      if (!overwrite)
        return;
    }
    const backupOk = await this._createBackupIfNeeded("step", doDelete);
    if (!backupOk)
      return;
    this._setBusy(true, doDelete ? "Deleting mapping\u2026" : "Saving mapping\u2026");
    const map = ((_a2 = stateObj.attributes) == null ? void 0 : _a2.map) || [];
    const newMap = doDelete ? this._delete_from_map(map, this._lockedPcc) : this._build_new_map(map, [this._draft]);
    logger.debug("E2ALearningCard: built new map with", newMap.length, "entries", newMap);
    try {
      await this._publish_map(
        this._getRuntimeMappingEntity(),
        this._getRuntimeMappingTopic(),
        newMap
      );
      logger.info("E2A: Change saved to mapping");
    } catch (err) {
      logger.error("E2A: failed to save mapping", err);
      await confirm(
        "Failed to save mapping.\nCheck Home Assistant logs for details.",
        { yes: "Ok", no: "" }
      );
    } finally {
      this._setBusy(false);
    }
    this._original = structuredClone(this._draft);
    this._lastHandledEventTs = this._lastTs;
    this._lockedPcc = null;
    this._undoDisabled = false;
  }
  async _onUndo() {
    var _a2, _b, _c, _d, _e, _f;
    logger.info("E2ALearningCard: Undoing");
    if (this._learningMode) {
      const lastupdated = (_a2 = this.hass.states[this._getStepBackupEntity()]) == null ? void 0 : _a2.last_updated;
      if (!lastupdated) {
        logger.warn("E2ALearningCard: no step backup available");
        this._setBusy(false);
        return;
      }
      const ok = await confirm("Are you sure you want to undo the last save operation?\nThis will restore the RF/Zigbee mapping to the state before the last save,\ndated " + formatDateTime(this.hass, new Date(lastupdated)), { yes: "Undo", no: "Cancel" });
      if (!ok)
        return;
      this._setBusy(true, "Undoing last save\u2026");
      try {
        await this._publish_map(
          this._getRuntimeMappingEntity(),
          this._getRuntimeMappingTopic(),
          ((_c = (_b = this.hass.states[this._getStepBackupEntity()]) == null ? void 0 : _b.attributes) == null ? void 0 : _c.map) || []
        );
        logger.info("E2ALearningCard: session undo completed");
        await confirm("Mapping before last save restored.", { yes: "Ok", no: "" });
        this._undoHint = "Last saving already undone.";
        this._undoDisabled = true;
      } catch (err) {
        logger.error("E2ALearningCard: failed to undo session", err);
        await confirm(
          "Failed to undo last save.\nCheck Home Assistant logs for details.",
          { yes: "Ok", no: "" }
        );
      } finally {
        this._setBusy(false);
      }
    } else {
      const lastupdated = (_d = this.hass.states[this._getSessionBackupEntity()]) == null ? void 0 : _d.last_updated;
      if (!lastupdated) {
        logger.warn("E2ALearningCard: no session backup available");
        return;
      }
      const ok = await confirm("Are you sure you want to undo the last learning session?\nThis will restore the RF/Zigbee mapping to the state before starting the last learning session,\ndated " + formatDateTime(this.hass, new Date(lastupdated)), { yes: "Undo", no: "Cancel" });
      if (!ok)
        return;
      this._setBusy(true, "Restoring session backup\u2026");
      try {
        await this._publish_map(
          this._getRuntimeMappingEntity(),
          this._getRuntimeMappingTopic(),
          ((_f = (_e = this.hass.states[this._getSessionBackupEntity()]) == null ? void 0 : _e.attributes) == null ? void 0 : _f.map) || []
        );
        logger.info("E2ALearningCard: session undo completed");
        await confirm("Mapping restored to state before last learning session.", { yes: "Ok", no: "" });
        this._setSessionBackupHint();
      } catch (err) {
        logger.error("E2ALearningCard: failed to undo session", err);
        await confirm(
          "Failed to undo session.\nCheck Home Assistant logs for details.",
          { yes: "Ok", no: "" }
        );
      } finally {
        this._setBusy(false);
      }
    }
  }
  _renderSwitch(checked, disabled, onChange) {
    if (customElements.get("ha-switch")) {
      return x`
        <ha-switch
          .checked=${checked}
          ?disabled=${disabled}
          @change=${onChange}>
        </ha-switch>
      `;
    }
    return x`
      <input
        class="e2a-fallback-switch"
        type="checkbox"
        .checked=${checked}
        ?disabled=${disabled}
        @change=${onChange}
      />
    `;
  }
  render() {
    var _a2, _b, _c;
    const mapSensor = this.hass.states[this._getRuntimeMappingEntity()];
    if (!this._hasValidLastData) {
      return x`
      <ha-card header="Event2Action Learning">
        <div class="content">
          <p>Waiting for event sensor data.</p>
        </div>
      </ha-card>
      ${this.renderBusyOverlay()}
    `;
    }
    const isEditing = !!this._lockedPcc;
    const displayProto = isEditing ? this._lockedPcc.proto : this._lastProto;
    const displayCode = isEditing ? this._lockedPcc.code : this._lastCode;
    const map = ((_a2 = mapSensor == null ? void 0 : mapSensor.attributes) == null ? void 0 : _a2.map) || [];
    const match = this.findMapping(map, displayProto, displayCode);
    const nonEditMatch = !isEditing && displayProto && displayCode ? match : null;
    const blocked = ((_b = this.hass.states[this._getBlockingHelperEntity()]) == null ? void 0 : _b.state) === "on";
    return x`
    <ha-card header="Event2Action Learning">
      <div class="content">

        <!-- Learning toggle -->
        <div class="row row-4">
          <div class="flex_align">
            ${this._renderSwitch(
      this._learningMode,
      isEditing,
      this.toggleLearningMode
    )}
            <span style="margin-left: 8px;">
              ${this._learningMode ? "Learning mode ON" : "Learning mode OFF"}
            </span>
          </div>
          <div class="flex_align">
            <ha-button
              title=${this._undoHint}
              ?disabled=${this._undoDisabled}
              @click=${this._onUndo}
            >
              ${this._undoLabel}
            </ha-button>
          </div>
          <div class="flex_align" style="background: var(--secondary-background-color); padding: 8px; border-radius: var(--e2a-border-radius);">
            <ha-button class=${blocked ? "danger" : ""}
              @click=${() => blocked ? this.unBlockEvents() : this.blockEvents(this._blockSeconds)}
              title=${blocked ? "Terminate event blocking" : "Temporarily block event2action automation from acting on incoming events"}>
              ${blocked ? `Unblock - ${this._blockCounter} sec` : "Block events"}
            </ha-button>
            <ha-input
              label="seconds"
              type="number"
              min="1"
              style="width: 100px;"
              .value=${String(this._blockSeconds)}
              @input=${(e2) => {
      this._blockSeconds = Number(e2.target.value);
    }}
              @change=${(e2) => this._saveBlockSeconds(e2.target.value)}
            ></ha-input>
          </div>
          <div class="flex_align" style="background: var(--secondary-background-color); padding: 8px; border-radius: var(--e2a-border-radius);">
            <ha-button
              @click=${this._onExportMap}
              title="Export current mapping to JSON file"
              ?disabled=${this._learningMode || isEditing}
            >
              Export Map
            </ha-button>
            <ha-button
              @click=${this._onImportMap}
              title="Import Mapping from JSON file"
              ?disabled=${this._learningMode || isEditing}
            >
              Import Map
            </ha-button>
          </div>
        </div>

        ${this._learningMode && !isEditing ? x`<p><em>Learning active – press a remote button.</em></p>` : null}

        <!-- ================= EDIT MODE ================= -->
        ${isEditing ? x`
          <p>
            <b>Editing mapping for:</b><br />
            Proto ${this._lockedPcc.proto},
            Code ${this._lockedPcc.code}
          </p>

          <e2a-editor
            .hass=${this.hass}
            .draft=${this._draft}
            .collection=${map}
            .entityDomainList=${this._entityDomainList}
            .customCommonServiceDataKeys=${this._customCommonServiceDataKeys}
            .prefillServiceData=${this._prefillServiceData}
            .existing=${!!match}
            .disabled=${false}
            @draft-changed=${this._onDraftChanged}
            @save=${this._onEditorSave}
            @cancel=${this._onEditorCancel}
            @delete=${this._onEditorDelete}>
          </e2a-editor>

          <hr />

          <p><b>Last incoming event</b></p>
          <ul>
            <li>Proto: ${this._lastProto}</li>
            <li>Code: ${this._lastCode}</li>
          </ul>
        ` : null}

        <!-- ================= VIEW MODE ================= -->
        ${!isEditing ? x`
          <b>Last event</b>
          <ul class="no_vert_margin" >
            <li>Proto: ${displayProto}</li>
            <li>Code: ${displayCode}</li>
          </ul>

          ${nonEditMatch ? x`
                <b>Action data for last event</b>
                <ul class="no_vert_margin">
                  <li>Entity: ${nonEditMatch.entity}</li>
                  <li>Service: ${nonEditMatch.service}</li>
                  <li class="item ${this._hasValue(nonEditMatch.service_data) ? "" : "hidden"}">Service Data:
                    <pre>${JSON.stringify((_c = nonEditMatch.service_data) != null ? _c : {}, null, 2)}</pre>
                  </li>
                  <li>Active: ${nonEditMatch.active ? "yes" : "no"}</li>
                  <li>Remote: ${nonEditMatch.remote}</li>
                  <li>Type: ${nonEditMatch.type}</li>
                  <li>Button: ${nonEditMatch.button}</li>
                  <li>Channel: ${nonEditMatch.channel}</li>
                </ul>
              ` : x`
                <p><b>Unmapped code</b></p>
                <p>This code is not assigned yet.</p>
              `}
        ` : null}
      </div>
    </ha-card>
    ${this.renderBusyOverlay()}
  `;
  }
};
let E2ALearningCard = _E2ALearningCard;
__publicField(E2ALearningCard, "properties", {
  hass: { attribute: false },
  config: { attribute: false },
  _lockedPcc: { state: true },
  _learningMode: { state: true },
  _draft: { state: true },
  _original: { state: true }
});
__publicField(E2ALearningCard, "styles", [
  (_a = __superGet(_E2ALearningCard, _E2ALearningCard, "styles")) != null ? _a : [],
  e2aTheme,
  e2aComponents,
  e2aLayout,
  e2aStyles,
  i$1`
    :host {
      position: relative;
      display: block;
      }
    .content {
      padding: 16px;
      li > pre {
        margin: 0;
      }
    }
    .e2a-fallback-switch {
      width: 40px;
      height: 20px;
      accent-color: var(--primary-color);
    }`
]);
if (!customElements.get("e2a-learning-card")) {
  customElements.define("e2a-learning-card", E2ALearningCard);
}
class Event2ActionLearningCard extends E2ALearningCard {
}
if (!customElements.get("event2action-learning-card")) {
  customElements.define("event2action-learning-card", Event2ActionLearningCard);
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: "event2action-learning-card",
  name: "Event2Action Learning Card",
  description: "Generic event learning and action mapping UI"
});
