// Darveniza's Tropical Fruit - shared field app engine
// Talks directly to Airtable's REST API (not the Airtable web interface),
// so nothing here ever bounces you through airtable.com login/redirect screens.

const APP = (function () {
  "use strict";

  // ---- Config -------------------------------------------------------
  const API_KEY = "patER9qoNWV9sFFdI.958d9ece0f6f1609deeb9ca0018b0ab93ae71e5c25ffbe16db5134f331611935";
  const BASE_ID = "appqwWfRyJQ72H6On";
  const PIN = "1420"; // change this to whatever you like - it's just a light deterrent, not real security

  const TABLES = {
    blocks: "tblPtis0PoNhW6EFI",
    products: "tblZQVUE24XXAUcFo",
    mobs: "tbls7P3GrWwu001NQ",
    animalRegister: "tblL9fuObMGVM9FfY",
    fertLog: "tblX2YvofwaRW5n0k",
    chemicalShed: "tblRYJSLq9NMVXNl1",
    sprayLog: "tblTK4cWnasGXKNP5",
    jobs: "tblQe7C5Ko4N50WG9",
    treatmentsLog: "tblLnTLhX08wr9ACD",
    rotationLog: "tblSnMM0eD0dOEwKW",
    consignmentLines: "tblu1v8XTJhpaHu7g",
    bagging: "tblvXHNWiPZ9aPrhJ",
    picking: "tblvbMWSexFa9K1O3"
  };

  const API_ROOT = "https://api.airtable.com/v0/" + BASE_ID + "/";

  // ---- PIN gate -------------------------------------------------------
  function checkPin() {
    if (sessionStorage.getItem("dtf_pin_ok") === "1") return true;
    const entered = prompt("Enter PIN to open Darveniza's Tropical Fruit farm app:");
    if (entered === PIN) {
      sessionStorage.setItem("dtf_pin_ok", "1");
      return true;
    }
    document.body.innerHTML = '<div style="font-family:sans-serif;padding:40px;text-align:center;color:#900">Wrong PIN. <a href="javascript:location.reload()">Try again</a></div>';
    return false;
  }

  // ---- Airtable REST helpers -------------------------------------------------------
  async function apiFetch(path, options) {
    options = options || {};
    options.headers = Object.assign(
      { "Authorization": "Bearer " + API_KEY, "Content-Type": "application/json" },
      options.headers || {}
    );
    const res = await fetch(API_ROOT + path, options);
    if (!res.ok) {
      const body = await res.text();
      throw new Error("Airtable API error " + res.status + ": " + body);
    }
    return res.json();
  }

  // List ALL records from a table (paginating automatically), optional query params object.
  async function list(tableId, params) {
    params = params || {};
    let all = [];
    let offset = null;
    do {
      const qp = Object.assign({}, params);
      if (offset) qp.offset = offset;
      const pairs = [];
      Object.keys(qp).forEach(k => {
        const v = qp[k];
        if (Array.isArray(v)) {
          v.forEach(item => pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(item)));
        } else {
          pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
      });
      const qs = pairs.join("&");
      const data = await apiFetch(tableId + (qs ? "?" + qs : ""));
      all = all.concat(data.records);
      offset = data.offset || null;
    } while (offset);
    return all;
  }

  async function createRecords(tableId, records) {
    // records: array of {fields: {...}}
    return apiFetch(tableId, { method: "POST", body: JSON.stringify({ records, typecast: true }) });
  }

  async function updateRecords(tableId, records) {
    // records: array of {id, fields: {...}}
    return apiFetch(tableId, { method: "PATCH", body: JSON.stringify({ records, typecast: true }) });
  }

  // ---- Small UI helpers -------------------------------------------------------
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "text") e.textContent = v;
      else if (k === "html") e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    (children || []).forEach(c => e.appendChild(c));
    return e;
  }

  function toast(msg, isError) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);" +
      "background:" + (isError ? "#c62828" : "#1b3a2b") + ";color:#fff;padding:12px 20px;border-radius:10px;" +
      "font-family:-apple-system,sans-serif;font-size:14px;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,.3);max-width:85vw;text-align:center;";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  return { checkPin, list, createRecords, updateRecords, TABLES, el, toast, todayISO };
})();
