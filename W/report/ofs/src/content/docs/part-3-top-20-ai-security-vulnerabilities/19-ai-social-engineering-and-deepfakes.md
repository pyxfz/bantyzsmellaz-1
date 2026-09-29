---
title: "19. AI-Enabled Social Engineering and Deepfake Fraud"
description: "MITRE ATLAS AML.T0073 — live voice and face cloning that defeats authentication-by-recognition, and the channel-independence control that survives."
---

**Framework IDs:** MITRE ATLAS `AML.T0073` (Impersonation), `AML.T0052.000` (Spearphishing via LLM), `AML.T0016.002` (Generative AI) · ATT&CK T1656, T1566

## 19.1 Definition

Adversaries use generative models — not just to write phishing copy, but to synthesise a target's voice
and face *live, in a video call* — so that every channel an employee might use to "verify" a request is
attacker-controlled. **It defeats authentication-by-recognition rather than authentication-by-credential.**

## 19.2 Mechanism

Reconnaissance harvests minutes of public audio (conference talks, podcasts, LinkedIn video) and video. A
voice clone plus real-time face-swap is joined to a video-conference platform with a human operator behind
each persona. A pretext BEC email the employee *should* distrust is escalated to a multi-party "video
call" that supplies exactly the confidence signal the employee was told to demand. The goal is a
transaction approval, a credential reset or an MFA-fatigue call — **not a technical breach.**

## 19.3 Evidence

- **Arup, Hong Kong, January 2024 — US$25.6M (HK$200M).** A finance worker received an email purporting
  to be the UK CFO requesting a "confidential transaction," grew suspicious, and was then invited to a
  video conference. **Every other participant — the CFO plus several colleagues — was an AI recreation.**
  He made **15 transfers to 5 Hong Kong bank accounts**. **No malware, no breach; Arup's systems were
  never compromised.** Funds unrecovered. Arup's CIO Rob Greig called it *"technology enhanced social
  engineering."*
- **FBI IC3 2025 Internet Crime Report** (26th edition, April 2026) — AI recorded as a crime descriptor
  for the first time: **22,364 complaints, $893M in losses.** AI-enabled fraud grew **1,210%** versus
  195% for non-AI. BEC with a confirmed AI component exceeded **$30M**; AI-linked investment fraud $632M;
  employment fraud with deepfake video interviews approximately $13M. Total IC3 losses $20.877B; BEC
  overall 24,768 complaints and **$3.046B**. (Verified — see [§25](/part-3-top-20-ai-security-vulnerabilities/25-frameworks-sources-and-verification/).)
- **Marks & Spencer, April 2025** — the inverse vector: attackers posing as a staff member persuaded the
  TCS-operated IT helpdesk to release passwords (Scattered Spider). Approximately **£300M** profit impact.
- **Blocked cases, which prove the control works:** Ferrari CEO voice clone over WhatsApp (2024) — stopped
  by a challenge question. WPP voice clone plus video in Teams (2024) — stopped.
- **UK energy firm, 2019** — cloned parent-company CEO voice, approximately **US$243,000** wired. An early
  case with the same shape.
- **Guardio** — 76% of phishing sites now contain AI-generated content.

## 19.4 Mitigations (preventive)

1. **Mandatory out-of-band verification for any payment, credential or vendor-bank change** — callback to
   a number in the *internal directory*, never one supplied in the request or the call. Make it
   procedurally impossible to satisfy the check inside the same channel.
2. **Dual authorisation with geographic segregation** above a hard threshold (e.g. US$1M), plus a **24–48
   hour hold on bulk and first-time-beneficiary transfers** with auto-cancel absent independent
   confirmation. **Arup's 15 transactions each sat below single-transfer review thresholds** — this is
   precisely how the control must be set.
3. **Rotating verbal codeword or passphrase** for high-value verbal authorisation. The clone does not know
   it. Cheap, rarely implemented, high yield.
4. **Full email authentication at enforcement:** SPF, DKIM at 2048-bit keys, and **DMARC at `p=reject`**,
   plus MTA-STS and TLS-RPT. This robustly removes the spoof-domain stage of the pretext. It does **not**
   stop an attacker operating from a genuinely compromised mailbox.
5. **Retire voice and face as authentication factors.** Voice-KYC, voice approvals and biometric step-up
   must be treated as *hints*, not factors.
6. **Harden the helpdesk:** never disclose a password or MFA code to a caller claiming to be an employee.
   Require manager verification via a pre-registered channel, and require the caller to state a fact only
   the real employee knows.
7. **Reduce the target's harvestable material.** Coaching executives and finance staff to avoid public
   panels and conference talks in high-risk periods is a real, cheap, measurable reduction in attacker
   training data.
8. **Rehearse it.** Run deepfake-voice tabletop exercises against finance and executive-assistant staff
   quarterly. **Measure callback compliance, not training attendance.**

## 19.5 Controls that do **not** work — state this honestly to clients

- **"AI deepfake detection" is not a reliable control.** In-the-wild evaluations report **45–50% AUC drops**
  for state-of-the-art open-source detectors versus academic benchmarks (arXiv:2607.13234), because a
  detector trained against a fixed generative distribution is attacking a moving target. No single model
  consistently wins across datasets (arXiv:2507.05996). Real-time video is the least-analysed channel.
- **Human visual inspection fails** because the victim's task is operational, not forensic.
- **"I asked them an unscripted question"** is a broken control. Real-time clones answer coherently.
- **"We train staff to spot AI writing."** Grammatical tells have vanished — and the Arup employee *was*
  appropriately suspicious of the email and still lost the money.

## 19.6 Continuous monitoring

- **Telemetry:** email gateway authentication results (DMARC disposition, DKIM alignment), payment and
  treasury events (beneficiary, amount, velocity, geography), helpdesk ticket fields (caller identity,
  verification method used), IdP and MFA events.
- **Alert on two or more transfers to a new beneficiary by the same requester within 24 hours** — place an
  immediate, non-auto-reversible hold.
- **Alert on any helpdesk password or MFA disclosure where the verification channel was voice or video** —
  correlate with the M&S / Scattered Spider pattern.
- **Alert on a DMARC fail/reject volume spike from a single sending source,** and on a new look-alike
  domain registered within 30 days.
- **Alert on MFA fatigue patterns** — multiple denials followed by success from the same ASN.
- **Tools:** Proofpoint and Microsoft Defender for Cloud (DMARC and anti-phish), Abnormal Security or
  Hornetsecurity (BEC-specific mailbox-takeover and payment-change monitoring), Darktrace or Vectra
  (behavioural anomaly on treasury), recorded-call audio retention for post-incident forensics.
  **Detection of the media itself should be tier-2 analyst work, not an automated block.**

## 19.7 Frameworks mapping

ATLAS `AML.T0073`, `AML.T0052`, `AML.T0052.000`, `AML.T0016.002`, `AML.T0079`. ATT&CK T1656
(Impersonation), T1566 (Phishing). D3FEND: Identifier Activity Analysis, Homoglyph Detection, Inbound
Session Volume Analysis, User Behavior Analysis.

## 19.8 Residual risk

**High and irreducible.** Deepfake quality improves faster than detection. The durable control is
*channel independence* — and even that fails against a genuinely compromised executive mailbox. Accept
and fund the residual explicitly.
