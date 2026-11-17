// AI Compliance Inspection Agent (Service 2) - Frontend Application

const PRESETS = {
  investment: {
    id: "doc-invest-jane-001",
    type: "INVESTMENT_AGREEMENT",
    text: `Investment Agreement for Jane Smith (SSN: 987-65-4321, Account #AC-99120).

We guarantee Jane Smith an 18% annual return on investment without any market risk.

All funds are managed according to the firm's growth portfolio guidelines.`
  },
  brochure: {
    id: "doc-brochure-apex-002",
    type: "BROCHURE",
    text: `Welcome to Apex Wealth Advisors.

We are recognized as the safest investment firm in the region with the best investment options.

Our proprietary methodology is approved by the sec and endorsed by finra for wealth preservation.`
  },
  newsletter: {
    id: "doc-news-nov-003",
    type: "NEWSLETTER",
    text: `Apex Monthly Wealth Digest — Special Client Advisory.

Under our newly deployed algorithm, clients will definitely profit and profit is certain across all cycles.

Investors can withdraw anytime without restriction with instant liquidity guaranteed.`
  },
  clean: {
    id: "doc-clean-sample-004",
    type: "GENERAL",
    text: `This agreement outlines the general advisory framework between the firm and client.

Investments are subject to market fluctuations, and past performance is no guarantee of future returns.

All fees and advisory costs are disclosed in Schedule A attached hereto.`
  }
};

let currentFindings = [];
let originalDocumentText = "";

document.addEventListener("DOMContentLoaded", () => {
  initHealthAndRules();
  initEventListeners();
  loadPreset("investment");
});

function initHealthAndRules() {
  fetch("/health")
    .then(r => r.json())
    .then(data => {
      const providerText = document.getElementById("provider-text");
      providerText.textContent = `${data.provider} (${data.model_id})`;
    })
    .catch(() => {
      document.getElementById("provider-text").textContent = "Backend Offline";
      document.querySelector(".status-dot").style.backgroundColor = "#ef4444";
    });

  fetch("/rules")
    .then(r => r.json())
    .then(rules => {
      document.getElementById("rule-count-badge").textContent = rules.length;
      renderRulesTable(rules);
    })
    .catch(err => {
      console.error("Failed to fetch rules:", err);
    });
}

function renderRulesTable(rules) {
  const tbody = document.getElementById("rules-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  rules.forEach(rule => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${escapeHtml(rule.rule_id)}</code></td>
      <td><span class="badge badge-${escapeHtml(rule.severity)}">${escapeHtml(rule.severity)}</span></td>
      <td>
        <strong>${escapeHtml(rule.title)}</strong><br>
        <span style="color:#94a3b8">${escapeHtml(rule.description)}</span>
      </td>
      <td><code>${escapeHtml((rule.document_types || []).join(", "))}</code></td>
    `;
    tbody.appendChild(tr);
  });
}

function initEventListeners() {
  // Preset buttons
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const presetKey = btn.getAttribute("data-preset");
      if (PRESETS[presetKey]) {
        loadPreset(presetKey);
      }
    });
  });

  // Textarea input counts
  const textarea = document.getElementById("document-text");
  textarea.addEventListener("input", updateInputCounts);

  // Analyze button
  const analyzeBtn = document.getElementById("btn-analyze");
  analyzeBtn.addEventListener("click", runInspection);

  // Tab switching
  const tabEditor = document.getElementById("tab-editor");
  const tabHighlighted = document.getElementById("tab-highlighted");
  const editorPane = document.getElementById("editor-container");
  const highlightPane = document.getElementById("highlighted-container");

  tabEditor.addEventListener("click", () => {
    tabEditor.classList.add("active");
    tabHighlighted.classList.remove("active");
    editorPane.classList.add("active");
    highlightPane.classList.remove("active");
  });

  tabHighlighted.addEventListener("click", () => {
    tabHighlighted.classList.add("active");
    tabEditor.classList.remove("active");
    highlightPane.classList.add("active");
    editorPane.classList.remove("active");
  });

  // Modal handlers
  const modal = document.getElementById("rules-modal");
  document.getElementById("btn-view-rules").addEventListener("click", () => {
    modal.style.display = "flex";
  });
  document.getElementById("btn-close-modal").addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Human review actions
  document.getElementById("btn-human-approve").addEventListener("click", () => handleHumanDecision("APPROVED"));
  document.getElementById("btn-human-reject").addEventListener("click", () => handleHumanDecision("REJECTED"));
}

function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;
  document.getElementById("doc-id-input").value = preset.id;
  document.getElementById("doc-type-select").value = preset.type;
  document.getElementById("document-text").value = preset.text;
  updateInputCounts();
  resetFindingsView();
}

function updateInputCounts() {
  const text = document.getElementById("document-text").value;
  document.getElementById("char-count").textContent = `${text.length} chars`;
  const sections = text.split("\n\n").filter(c => c.trim().length > 0);
  document.getElementById("para-count").textContent = `${sections.length} sections`;
}

function resetFindingsView() {
  currentFindings = [];
  document.getElementById("highlight-count").textContent = "0";
  document.getElementById("metrics-bar").style.display = "none";
  document.getElementById("findings-placeholder").style.display = "block";
  document.getElementById("findings-list").style.display = "none";
  document.getElementById("findings-list").innerHTML = "";
  document.getElementById("highlighted-view").innerHTML = '<p class="placeholder-text">Run inspection to view grounded character-offset highlights.</p>';
  document.getElementById("btn-human-approve").disabled = true;
  document.getElementById("btn-human-reject").disabled = true;
  document.getElementById("human-decision-banner").style.display = "none";
  document.getElementById("system-decision-badge").textContent = "PENDING_HUMAN_REVIEW";
  document.getElementById("system-decision-badge").className = "badge badge-pending";
}

async function runInspection() {
  const docId = document.getElementById("doc-id-input").value.trim() || "doc-unknown";
  const docType = document.getElementById("doc-type-select").value;
  const text = document.getElementById("document-text").value;

  if (!text.trim()) {
    alert("Please enter document text to analyze.");
    return;
  }

  originalDocumentText = text;
  const analyzeBtn = document.getElementById("btn-analyze");
  analyzeBtn.disabled = true;
  analyzeBtn.querySelector(".btn-text").textContent = "Inspecting...";

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_id: docId,
        document_type: docType,
        text: text
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    renderAnalysisResults(data, text);
  } catch (err) {
    alert(`Inspection failed: ${err.message}`);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.querySelector(".btn-text").textContent = "Run Compliance Inspection";
  }
}

function renderAnalysisResults(data, sourceText) {
  currentFindings = data.findings || [];

  // 1. Update Metrics Bar
  document.getElementById("metrics-bar").style.display = "flex";
  document.getElementById("metric-accepted").textContent = currentFindings.length;
  document.getElementById("metric-discarded").textContent = data.discarded_findings;
  document.getElementById("metric-cache").textContent = data.cache_hit ? "HIT" : "MISS";
  document.getElementById("highlight-count").textContent = currentFindings.length;

  // 2. Render Findings List
  const findingsList = document.getElementById("findings-list");
  const placeholder = document.getElementById("findings-placeholder");

  if (currentFindings.length === 0) {
    placeholder.style.display = "block";
    placeholder.innerHTML = `
      <div class="empty-icon" style="color:#10b981;">&#10004;</div>
      <p><strong style="color:#6ee7b7;">No Compliance Violations Detected</strong></p>
      <p class="hint">The document passed all applicable ${escapeHtml(data.document_type || '')} rules. 0 grounded violations found.</p>
    `;
    findingsList.style.display = "none";
  } else {
    placeholder.style.display = "none";
    findingsList.style.display = "flex";
    findingsList.innerHTML = "";

    currentFindings.forEach((finding, idx) => {
      const card = document.createElement("div");
      card.className = `finding-card ${finding.severity.toLowerCase()}`;
      card.setAttribute("data-finding-id", idx);
      card.innerHTML = `
        <div class="finding-card-header">
          <span class="rule-id-tag">${escapeHtml(finding.rule_id)}</span>
          <span class="badge badge-${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span>
        </div>
        <div class="rule-title-tag">${escapeHtml(finding.rule_title)}</div>
        <div class="passage-quote-box">"${escapeHtml(finding.passage)}"</div>
        <div class="finding-reason">${escapeHtml(finding.reason)}</div>
        <div class="finding-meta">
          <span>Offsets: [${finding.start}:${finding.end}]</span>
          <span>Verified Substring Grounding &#10004;</span>
        </div>
      `;

      card.addEventListener("click", () => {
        focusFinding(idx);
      });

      findingsList.appendChild(card);
    });
  }

  // 3. Render Grounded Highlights in Source Text
  renderHighlightedText(sourceText, currentFindings);

  // 4. Enable Human Decision buttons
  document.getElementById("btn-human-approve").disabled = false;
  document.getElementById("btn-human-reject").disabled = false;
  document.getElementById("human-decision-banner").style.display = "none";
  document.getElementById("system-decision-badge").textContent = data.decision || "PENDING_HUMAN_REVIEW";
  document.getElementById("system-decision-badge").className = "badge badge-pending";

  // Switch to highlighted view tab if findings exist
  if (currentFindings.length > 0) {
    document.getElementById("tab-highlighted").click();
  }
}

function renderHighlightedText(text, findings) {
  const container = document.getElementById("highlighted-view");
  if (!text) {
    container.innerHTML = '<p class="placeholder-text">No text available.</p>';
    return;
  }

  if (!findings || findings.length === 0) {
    container.textContent = text;
    return;
  }

  // Sort findings by start offset ascending
  const sorted = [...findings].map((f, index) => ({ ...f, index }))
    .sort((a, b) => a.start - b.start);

  let html = "";
  let cursor = 0;

  for (const f of sorted) {
    if (f.start < cursor) {
      // Overlapping finding fallback
      continue;
    }
    // Append text leading up to this finding
    if (f.start > cursor) {
      html += escapeHtml(text.slice(cursor, f.start));
    }
    // Append the highlighted mark
    const quoted = text.slice(f.start, f.end);
    html += `<mark class="compliance-highlight highlight-${escapeHtml(f.severity.toLowerCase())}" data-finding-id="${f.index}" title="${escapeHtml(f.rule_id)}: ${escapeHtml(f.rule_title)}">${escapeHtml(quoted)}</mark>`;
    cursor = f.end;
  }

  if (cursor < text.length) {
    html += escapeHtml(text.slice(cursor));
  }

  container.innerHTML = html;

  // Add click handlers on mark elements
  container.querySelectorAll("mark.compliance-highlight").forEach(mark => {
    mark.addEventListener("click", () => {
      const id = parseInt(mark.getAttribute("data-finding-id"), 10);
      focusFinding(id);
    });
  });
}

function focusFinding(idx) {
  // Highlight card
  document.querySelectorAll(".finding-card").forEach(c => c.classList.remove("active-finding"));
  const card = document.querySelector(`.finding-card[data-finding-id="${idx}"]`);
  if (card) {
    card.classList.add("active-finding");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Switch to highlighted tab if not active
  document.getElementById("tab-highlighted").click();

  // Highlight mark
  document.querySelectorAll("mark.compliance-highlight").forEach(m => m.classList.remove("focused-highlight"));
  const mark = document.querySelector(`mark.compliance-highlight[data-finding-id="${idx}"]`);
  if (mark) {
    mark.classList.add("focused-highlight");
    mark.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function handleHumanDecision(decision) {
  const notes = document.getElementById("officer-notes").value.trim();
  const banner = document.getElementById("human-decision-banner");
  const badge = document.getElementById("system-decision-badge");

  if (decision === "APPROVED") {
    banner.className = "decision-record-banner approved";
    banner.innerHTML = `<strong>Document Approved by Human Officer.</strong> Notes: "${escapeHtml(notes || 'No notes added')}"`;
    badge.textContent = "HUMAN_APPROVED";
    badge.className = "badge badge-low";
  } else {
    banner.className = "decision-record-banner rejected";
    banner.innerHTML = `<strong>Document Rejected by Human Officer.</strong> Notes: "${escapeHtml(notes || 'Flagged for compliance revision')}"`;
    badge.textContent = "HUMAN_REJECTED";
    badge.className = "badge badge-critical";
  }

  banner.style.display = "flex";
  document.getElementById("btn-human-approve").disabled = true;
  document.getElementById("btn-human-reject").disabled = true;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
