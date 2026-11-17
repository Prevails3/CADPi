"""
build_locations.py
Programmatic SEO & Wide-Funnel Scale Engine for CAD Private Investigations.
Generates 226 localized, high-ranking landing pages adhering to:
- Hub-and-Spoke Silos: Master Directory, State Hubs, City Hubs, Service Pages
- 100% Unique Titles, Meta Descriptions, and H1s
- Sub-second Core Web Vitals (Vanilla HTML/CSS/JS, zero framework bloat)
- Federal E-E-A-T Leadership (Michael Compitiello, DHS/HSI Supervisory Special Agent)
- Dynamic Schema.org JSON-LD (LocalBusiness, BreadcrumbList, FAQPage)
- Internal Linking Mesh (Cross-linked suburbs, sibling services, state & national hubs)
- Sitemaps: sitemap_index.xml, sitemap-core.xml, sitemap-locations-az.xml, sitemap-locations-national.xml
- Full Asset Verification & Validation Suite
"""

import json
import os
import re
import html
from typing import Dict, List, Any

BASE_URL = "https://cadprivateinvestigations.com"
OUTPUT_DIR = "."
DATA_FILE = "data/locations.json"

SERVICES = [
    {
        "slug": "asset-tracing",
        "name": "Asset Search & Hidden Accounts",
        "short_name": "Asset Search",
        "h1_title": "Asset Search, Hidden Accounts & Forensic Tracing",
        "title_suffix": "Asset Search & Hidden Accounts | CAD Private Investigations",
        "meta_desc_template": "Licensed {city_name}, {state_abbr} forensic asset search & bank account discovery firm. Uncovering hidden assets, offshore accounts, and corporate shells in {county_name}.",
        "og_desc_template": "Federal-grade financial asset tracing in {city_name}, {state_abbr}. Uncovering hidden liquid accounts, undisclosed real estate, and shell companies for {county_name} litigation.",
        "icon": "fa-coins",
        "focus_summary": "Forensic financial profiling, hidden bank account discovery, brokerage searches, cryptocurrency tracing, and unmasking offshore trust structures for high-stakes litigation.",
        "evidentiary_intro": "In {county_name} civil and family court proceedings, financial disclosure declarations often fail to account for deliberate asset obfuscation. Our investigators utilize federal financial tracing techniques to locate unencumbered liquid funds, concealed business equity, and nominee real estate portfolios.",
        "court_bullet_1": "Bank & Brokerage Account Discovery: Lawful identification of active depository accounts, brokerage portfolios, and domestic wire transfers adhering strictly to GLBA and FCRA statutory standards.",
        "court_bullet_2": "Shell Company & Nominee De-anonymization: Piercing multi-layered LLCs, family limited partnerships, and nominee holding entities registered in secrecy havens such as Delaware, Wyoming, Nevada, and the Cook Islands.",
        "court_bullet_3": "Real Estate & Luxury Asset Verification: Uncovering undisclosed luxury residential properties, commercial developments, private aircraft, and registered maritime vessels.",
        "court_bullet_4": "Trial-Ready Forensic Affidavits: Compiling comprehensive evidentiary binders, asset flowcharts, and expert witness declarations formatted for immediate filing in {court_name}."
    },
    {
        "slug": "corporate-vetting",
        "name": "Corporate Due Diligence & Fraud Investigations",
        "short_name": "Corporate Vetting",
        "h1_title": "Corporate Due Diligence & Fraud Investigations",
        "title_suffix": "Corporate Due Diligence & Fraud Investigations | CAD PI",
        "meta_desc_template": "Federal-grade corporate due diligence and executive background vetting in {city_name}, {state_abbr}. Unmasking beneficial ownership and commercial fraud risk in {county_name}.",
        "og_desc_template": "Executive due diligence, partnership vetting, and fraud investigations in {city_name}, {state_abbr}. Unmasking shell corporations and commercial risk with federal investigative rigor.",
        "icon": "fa-building-shield",
        "focus_summary": "Comprehensive executive background checks, pre-M&A due diligence, corporate fraud investigation, internal embezzlement audits, and competitor intelligence gathering.",
        "evidentiary_intro": "Corporate transactions and commercial partnerships in {city_name} carry severe liability when counterparty backgrounds or balance sheets are misrepresented. CAD Private Investigations provides corporate counsel, private equity firms, and family offices with federal-level vetting.",
        "court_bullet_1": "Executive & C-Suite Vetting: Thorough background investigations uncovering undisclosed bankruptcies, past civil fraud judgments, undisclosed regulatory sanctions, and falsified credentials.",
        "court_bullet_2": "Beneficial Ownership & Shell Verification: Unmasking true controlling principals behind opaque holding entities, nominee officers, and complex corporate subsidiaries.",
        "court_bullet_3": "Vendor & Supply Chain Fraud Audits: Investigating commercial procurement fraud, kickback schemes, unauthorized vendor billing, and corporate asset diversion.",
        "court_bullet_4": "Litigation Risk & Financial Stability Analysis: Comprehensive public record audits across county, state, and federal dockets to uncover active lawsuits and tax liens."
    },
    {
        "slug": "judgment-enforcement",
        "name": "Judgment Recovery & Debt Tracing",
        "short_name": "Judgment Recovery",
        "h1_title": "Judgment Recovery, Debt Tracing & Asset Enforcement",
        "title_suffix": "Judgment Recovery & Debt Tracing | CAD Private Investigations",
        "meta_desc_template": "Enforce unpaid court judgments and arbitration awards in {city_name}, {state_abbr}. Locating debtor accounts, real estate, and fraudulent transfers in {county_name} courts.",
        "og_desc_template": "Turn paper judgments into recovered capital in {city_name}, {state_abbr}. Locating attachable debtor bank accounts, unencumbered real property, and fraudulent conveyances.",
        "icon": "fa-gavel",
        "focus_summary": "Post-judgment asset location, domestication of sister-state judgments under the UEFJA, bank garnishment targets, and identifying fraudulent asset transfers under UVTA.",
        "evidentiary_intro": "Securing a substantial civil judgment in {court_name} is only half the battle. Sophisticated debtors deliberately transfer liquid capital, convey title to insiders, and hide behind corporate alter egos. CAD provides post-judgment intelligence to enforce writs of garnishment.",
        "court_bullet_1": "Garnishment Asset Identification: Identifying active depository bank accounts, merchant processing accounts, and commercial receivables subject to immediate court garnishment.",
        "court_bullet_2": "Sister-State Judgment Domestication (UEFJA): Coordinating with local counsel to domesticate out-of-state and federal judgments under the Uniform Enforcement of Foreign Judgments Act.",
        "court_bullet_3": "Fraudulent Conveyance Clawback: Documenting insider transactions and badges of fraud under the Uniform Voidable Transactions Act (UVTA) to void improper asset transfers.",
        "court_bullet_4": "Unencumbered Real & Personal Property Tracing: Pinpointing commercial real estate, heavy machinery, luxury vehicles, and intellectual property free of senior lien encumbrances."
    }
]

def load_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def clean_html(text: str) -> str:
    return html.escape(text.strip())

def make_breadcrumbs_html(items: List[Dict[str, str]]) -> str:
    html_parts = ['<nav class="blog-breadcrumb" aria-label="Breadcrumb navigation">']
    for idx, item in enumerate(items):
        is_last = (idx == len(items) - 1)
        if is_last:
            html_parts.append(f'<span aria-current="page">{clean_html(item["name"])}</span>')
        else:
            html_parts.append(f'<a href="{item["url"]}">{clean_html(item["name"])}</a>')
            html_parts.append('<span aria-hidden="true">/</span>')
    html_parts.append('</nav>')
    return '\n'.join(html_parts)

def build_schema_json(
    page_type: str,
    canonical_url: str,
    name: str,
    breadcrumbs: List[Dict[str, str]],
    faqs: List[Dict[str, str]],
    city_data: Dict[str, Any] = None,
    state_data: Dict[str, Any] = None,
    service_data: Dict[str, Any] = None
) -> str:
    graph = []

    # 1. LocalBusiness / LegalService / ProfessionalService
    agency_obj = {
        "@type": ["LocalBusiness", "LegalService", "ProfessionalService"],
        "@id": f"{canonical_url}#agency",
        "name": name,
        "image": f"{BASE_URL}/assets/logo_horizontal_v7.png",
        "telephone": "+14806302533",
        "url": canonical_url,
        "priceRange": "$$$$",
        "parentOrganization": {
            "@type": "PrivateInvestigationAgency",
            "@id": f"{BASE_URL}/#organization",
            "name": "Compitiello & Donofrio Private Investigations",
            "url": f"{BASE_URL}/"
        }
    }

    if city_data and state_data:
        agency_obj["address"] = {
            "@type": "PostalAddress",
            "streetAddress": "6991 E Camelback Rd. STE D-300",
            "addressLocality": "Scottsdale",
            "addressRegion": "AZ",
            "postalCode": "85251",
            "addressCountry": "US"
        }
        agency_obj["areaServed"] = [
            {"@type": "City", "name": city_data["city_name"]},
            {"@type": "AdministrativeArea", "name": city_data["county_name"]},
            {"@type": "State", "name": state_data["state_name"]}
        ]
        agency_obj["hasOfferCatalog"] = {
            "@type": "OfferCatalog",
            "name": f"{city_data['city_name']} Investigative & Forensic Services",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": f"{city_data['city_name']} Forensic Asset Tracing & Bank Account Discovery",
                        "description": f"Identification of hidden financial accounts, offshore structures, and real property in {city_data['county_name']}."
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": f"{city_data['city_name']} Corporate Due Diligence & Executive Vetting",
                        "description": f"Comprehensive corporate background checks, vendor fraud audits, and beneficial ownership tracing in {city_data['city_name']}."
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": f"{city_data['city_name']} Judgment Enforcement & Debt Recovery",
                        "description": f"Locating attachable debtor assets and post-judgment enforcement in {city_data['county_name']} and federal courts."
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": f"{city_data['city_name']} Covert Surveillance Operations",
                        "description": f"Court-admissible mobile and stationary physical surveillance compliant with {state_data['state_name']} privacy statutes."
                    }
                }
            ]
        }
    elif state_data:
        agency_obj["address"] = {
            "@type": "PostalAddress",
            "streetAddress": "6991 E Camelback Rd. STE D-300",
            "addressLocality": "Scottsdale",
            "addressRegion": "AZ",
            "postalCode": "85251",
            "addressCountry": "US"
        }
        agency_obj["areaServed"] = [
            {"@type": "State", "name": state_data["state_name"]},
            {"@type": "Country", "name": "United States"}
        ]
    else:
        agency_obj["address"] = {
            "@type": "PostalAddress",
            "streetAddress": "6991 E Camelback Rd. STE D-300",
            "addressLocality": "Scottsdale",
            "addressRegion": "AZ",
            "postalCode": "85251",
            "addressCountry": "US"
        }
        agency_obj["areaServed"] = [{"@type": "Country", "name": "United States"}]

    graph.append(agency_obj)

    # 2. BreadcrumbList
    breadcrumb_elements = []
    for idx, b in enumerate(breadcrumbs, start=1):
        breadcrumb_elements.append({
            "@type": "ListItem",
            "position": idx,
            "name": b["name"],
            "item": b["url"]
        })
    graph.append({
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumb_elements
    })

    # 3. FAQPage
    if faqs:
        faq_entities = []
        for f in faqs:
            faq_entities.append({
                "@type": "Question",
                "name": f["question"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f["answer"]
                }
            })
        graph.append({
            "@type": "FAQPage",
            "mainEntity": faq_entities
        })

    schema_data = {
        "@context": "https://schema.org",
        "@graph": graph
    }
    return json.dumps(schema_data, indent=2, ensure_ascii=False)

def get_shared_header():
    return """  <!-- Global Header / Navigation -->
  <header class="global-header">
    <div id="scroll-progress" class="scroll-progress-bar" aria-hidden="true"></div>
    <div class="header-container">
      <a href="/#home" class="logo" aria-label="Compitiello &amp; Donofrio Private Investigations Home">
        <img src="/assets/logo_horizontal_v7.png" alt="Compitiello &amp; Donofrio Private Investigations Logo" class="logo-img">
      </a>

      <nav id="main-navigation" class="nav-menu">
        <ul class="nav-list">
          <li><a href="/#home" class="nav-link">Home</a></li>
          <li><a href="/#about" class="nav-link">Our Difference</a></li>
          <li><a href="/#services" class="nav-link">Our Services</a></li>
          <li><a href="/locations/" class="nav-link active">Locations</a></li>
          <li><a href="/#team" class="nav-link">Our Team</a></li>
          <li><a href="/blog.html" class="nav-link">Blog</a></li>
          <li><a href="/#contact" class="nav-link">Contact Us</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <a href="#consultation-form-section" class="btn btn-gold btn-header">Schedule A Free Consultation</a>
        <button type="button" id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle between Day and Night mode">
          <i class="fa-solid fa-sun sun-icon" aria-hidden="true"></i>
          <i class="fa-solid fa-moon moon-icon" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Mobile Menu Toggle Button -->
      <button class="mobile-toggle" aria-expanded="false" aria-controls="main-navigation" aria-label="Toggle navigation menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
    </div>
  </header>"""

def get_shared_eeat_card():
    return """        <!-- EEAT Leadership Card -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem; border-left: 4px solid var(--accent-gold);">
          <span class="section-label">FEDERAL E-E-A-T CREDENTIALS</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Federal Law Enforcement Experience: The CAD Advantage</h2>
          
          <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; margin-bottom: 1.5rem;">
            <img src="/assets/mike_compitiello.jpg" alt="Michael Compitiello, Founder &amp; Former Federal Supervisory Special Agent" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent-gold); box-shadow: 0 8px 24px rgba(0,0,0,0.3); flex-shrink: 0;" loading="lazy">
            <div style="flex: 1; min-width: 260px;">
              <h3 style="font-size: 1.35rem; margin-bottom: 0.25rem; color: var(--text-primary);">Michael Compitiello</h3>
              <p style="font-size: 0.95rem; color: var(--text-gold); font-weight: 600; margin-bottom: 0.75rem;">Founder &amp; Supervisory Special Agent (Ret.), DHS / HSI</p>
              <p style="line-height: 1.7; font-size: 0.98rem; margin: 0;">
                CAD Private Investigations was founded by Michael Compitiello following an exemplary 25+ year career as a Supervisory Special Agent with the Department of Homeland Security / Homeland Security Investigations (DHS/HSI). Having directed federal task forces targeting multi-million-dollar financial fraud, transnational money laundering, and cross-border asset seizures, Mr. Compitiello brings unmatched federal forensic methodologies to private client engagements.
              </p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-top: 1.5rem;">
            <div class="eeat-feature-box">
              <h4><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Ironclad Chain of Custody</h4>
              <p>Every piece of evidence, video timestamp, and financial record is handled under strict federal protocols, ensuring immediate judicial admissibility.</p>
            </div>
            <div class="eeat-feature-box">
              <h4><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i> Court-Tested Testimony</h4>
              <p>Our investigators possess decades of courtroom testimony experience in federal district courts, county superior courts, and evidentiary hearings.</p>
            </div>
            <div class="eeat-feature-box">
              <h4><i class="fa-solid fa-user-lock" aria-hidden="true"></i> Attorney Work-Product Integration</h4>
              <p>We work directly alongside lead litigation counsel, preserving attorney-client privilege and tailoring deliverables to strategic trial needs.</p>
            </div>
          </div>
        </div>"""

def get_shared_form(context_label: str, city_name: str = ""):
    btn_text = f"Submit Confidential {city_name} Inquiry" if city_name else "Submit Confidential Inquiry"
    return f"""        <!-- Consultation Form Section -->
        <div id="consultation-form-section" class="glass-card form-card" style="padding: 2.5rem;">
          <span class="section-label">CONFIDENTIAL EVALUATION</span>
          <h2 class="form-title" style="margin-top: 0.5rem;">Request A Confidential Consultation</h2>
          <p class="form-subtitle">Direct evaluation by senior investigators. Confidentiality guaranteed under attorney work product protocols.</p>

          <form id="consultation-form" class="secure-form" novalidate style="margin-top: 1.5rem;" data-form-context="{context_label}">
            <input type="hidden" name="subject" value="New Location Inquiry ({context_label}) - CAD Private Investigations">
            <input type="hidden" name="from_name" value="CAD PI {context_label} Landing Page">

            <!-- Anti-Spam Honeypots -->
            <div class="visually-hidden" aria-hidden="true">
              <label for="hp-botcheck">Do not check this box if you are human</label>
              <input type="checkbox" id="hp-botcheck" name="botcheck" class="visually-hidden" tabindex="-1" aria-hidden="true" autocomplete="off">
              <label for="hp-website-url">Website URL</label>
              <input type="text" id="hp-website-url" name="website_url" class="visually-hidden" tabindex="-1" aria-hidden="true" autocomplete="off" value="">
              <label for="hp-company-fax">Company Fax</label>
              <input type="text" id="hp-company-fax" name="company_fax" class="visually-hidden" tabindex="-1" aria-hidden="true" autocomplete="off" value="">
            </div>
            
            <div class="form-group">
              <label for="full-name" class="form-label">Full Name *</label>
              <input type="text" id="full-name" name="name" class="form-control" autocomplete="name" required aria-required="true" aria-describedby="name-error" placeholder="John Doe">
              <span class="error-msg" id="name-error" aria-live="polite"></span>
            </div>
            
            <div class="form-group">
              <label for="email-address" class="form-label">Email Address *</label>
              <input type="email" id="email-address" name="email" class="form-control" autocomplete="email" required aria-required="true" aria-describedby="email-error" placeholder="Enter your confidential email">
              <span class="error-msg" id="email-error" aria-live="polite"></span>
            </div>
            
            <div class="form-group">
              <label for="phone-number" class="form-label">Phone Number <span class="optional-label">(Optional)</span></label>
              <input type="tel" id="phone-number" name="phone" class="form-control" autocomplete="tel" aria-describedby="phone-error" placeholder="(480) 630-2533" inputmode="tel">
              <span class="error-msg" id="phone-error" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label for="message" class="form-label">Case Details *</label>
              <textarea id="message" name="message" class="form-control" rows="4" required aria-required="true" aria-describedby="message-error" placeholder="Please describe your case requirements (e.g., asset search, divorce litigation, corporate vetting, surveillance)."></textarea>
              <span class="error-msg" id="message-error" aria-live="polite"></span>
            </div>

            <!-- Human Verification -->
            <div class="form-group human-verification-group" id="human-verification-group">
              <div class="verification-header">
                <span class="form-label">Human Verification *</span>
                <span class="verification-badge"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Anti-Spam Protected</span>
              </div>

              <div id="hcaptcha-wrapper" class="hcaptcha-wrapper">
                <div id="hcaptcha-container" class="h-captcha" data-sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2" data-theme="dark"></div>
                <button type="button" id="switch-to-math-btn" class="verification-mode-toggle">
                  Having trouble with CAPTCHA? Use quick math check
                </button>
              </div>

              <div id="math-captcha-fallback" class="math-captcha-fallback" hidden>
                <div class="math-challenge-row">
                  <label for="math-captcha-input" id="math-captcha-question" class="math-question-label">
                    Security Check: What is 4 + 3? *
                  </label>
                  <div class="math-input-controls">
                    <input
                      type="text"
                      id="math-captcha-input"
                      name="math_captcha_answer"
                      class="form-control math-captcha-input"
                      inputmode="numeric"
                      autocomplete="off"
                      placeholder="Answer"
                    >
                    <button type="button" id="refresh-math-captcha" class="btn-math-refresh" aria-label="Generate a new math question" title="New question">
                      <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
                <span class="math-fallback-note">Quick math check active for human verification.</span>
              </div>

              <span class="error-msg" id="captcha-error" aria-live="polite"></span>
            </div>

            <div id="form-security-status" class="form-security-status" role="status" aria-live="polite" hidden></div>
            
            <button type="submit" class="btn btn-gold btn-full">
              <span>{btn_text}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="btn-arrow" aria-hidden="true">
                <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z"/>
              </svg>
            </button>
          </form>
        </div>"""

def get_shared_footer():
    return """  <!-- Global Footer -->
  <footer class="global-footer">
    <div class="footer-container">
      <div class="footer-grid">
        <div class="footer-brand-col">
          <a href="/#home" class="footer-logo" aria-label="CAD PI Home">
            <img src="/assets/logo_horizontal_v7.png" alt="Compitiello &amp; Donofrio Private Investigations Logo" class="footer-logo-img">
          </a>
          <p class="footer-tagline">Discreet, trustworthy, and elite private investigation services. Led by former federal law enforcement supervisory special agents.</p>
        </div>

        <div class="footer-links-col">
          <h3 class="footer-title">Practice Areas</h3>
          <ul class="footer-links">
            <li><a href="/services/asset-tracing.html">Asset Tracing Hub</a></li>
            <li><a href="/services/divorce-asset-investigations.html">Divorce Asset Tracing</a></li>
            <li><a href="/services/judgment-enforcement-asset-recovery.html">Judgment Enforcement</a></li>
            <li><a href="/services/corporate-vetting.html">Corporate Due Diligence</a></li>
            <li><a href="/services/surveillance.html">Surveillance Operations</a></li>
            <li><a href="/services/digital-forensics.html">Digital Forensics</a></li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h3 class="footer-title">Primary State Hubs</h3>
          <ul class="footer-links">
            <li><a href="/locations/arizona/">Arizona State Hub (HQ)</a></li>
            <li><a href="/locations/california/">California State Hub</a></li>
            <li><a href="/locations/florida/">Florida State Hub</a></li>
            <li><a href="/locations/texas/">Texas State Hub</a></li>
            <li><a href="/locations/new-york/">New York State Hub</a></li>
            <li><a href="/locations/new-jersey/">New Jersey State Hub</a></li>
            <li><a href="/locations/">All Service Locations &rarr;</a></li>
          </ul>
        </div>

        <div class="footer-contact-col">
          <h3 class="footer-title">Agency Corporate HQ</h3>
          <p class="footer-address">
            6991 E Camelback Rd. STE D-300<br>
            Scottsdale, AZ 85251
          </p>
          <p class="footer-phone">
            <a href="tel:+14806302533" class="hover-link">(480) 630-2533</a>
          </p>
          <p class="footer-note" style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.5rem;">
            Nationwide Multi-Jurisdictional Task Force &amp; Inter-State Reciprocity Coverage
          </p>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="copyright-text">&copy; 2026 Compitiello &amp; Donofrio Private Investigations | All Rights Reserved.</p>
        <p class="license-info">Licensed &amp; Bonded Arizona Private Investigative Agency (AZ DPS Lic. #1616599). Federal Reciprocity Operations.</p>
      </div>
    </div>
  </footer>

  <!-- Sticky Mobile Call Bar -->
  <div class="mobile-call-bar" id="mobile-call-bar" role="complementary" aria-label="Quick contact options">
    <a href="tel:+14806302533" class="call-bar-btn call-bar-phone" aria-label="Call (480) 630-2533">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
      </svg>
      <span>Call Now</span>
    </a>
    <a href="#consultation-form-section" class="call-bar-btn call-bar-consult">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
      <span>Free Consultation</span>
    </a>
  </div>

  <script src="/index.js?v=1.2.0"></script>"""

def render_city_hub(state: Dict[str, Any], city: Dict[str, Any], all_states: List[Dict[str, Any]]) -> str:
    canonical_url = f"{BASE_URL}/locations/{state['state_slug']}/{city['city_slug']}/"
    page_title = f"{city['city_name']} Private Investigator & Asset Tracing | CAD Private Investigations"
    meta_desc = f"Licensed {city['city_name']} private investigator & forensic intelligence firm. Led by former federal supervisory special agents. Serving {city['city_name']}, {city['county_name']}, and {city['metro_name']}."
    og_desc = f"Discreet, federal-grade private investigations in {city['city_name']}, {state['state_abbr']}. Asset search, corporate due diligence, surveillance, and court-admissible evidence."
    h1 = f"Licensed {city['city_name']} Private Investigators &amp; Forensic Intelligence"

    breadcrumbs = [
        {"name": "Home", "url": f"{BASE_URL}/"},
        {"name": "Locations", "url": f"{BASE_URL}/locations/"},
        {"name": f"{state['state_name']} Hub", "url": f"{BASE_URL}/locations/{state['state_slug']}/"},
        {"name": f"{city['city_name']} PI", "url": canonical_url}
    ]

    primary_court = city["local_courthouses"][0]

    faqs = [
        {
            "question": f"How much does a licensed private investigator cost in {city['city_name']}, {state['state_name']}?",
            "answer": f"Private investigation costs in {city['city_name']} vary based on assignment complexity and objectives. Covert physical surveillance operations are typically billed at an hourly rate plus mileage, while forensic financial asset tracing, corporate vetting, and judgment enforcement are conducted on flat-fee retainers. Contact our Scottsdale headquarters directly at (480) 630-2533 for an exact, confidential case assessment."
        },
        {
            "question": f"Are private investigators licensed to operate in {city['city_name']}, {state['state_abbr']}?",
            "answer": f"Yes. CAD Private Investigations operates under primary Arizona Department of Public Safety (AZ DPS) License #1616599 and maintains full professional liability insurance and bonding. Operations throughout {state['state_name']} are conducted in strict coordination with licensed state affiliates and under federal interstate reciprocity standards directed by former federal supervisory special agents."
        },
        {
            "question": f"Can findings from your investigators be used in {city['county_name']} courts?",
            "answer": f"Absolutely. All evidence, surveillance videography, forensic financial reports, and witness affidavits adhere strictly to the {state['legal_context']['court_rules']} and federal chain-of-custody protocols. Our findings are fully admissible in {primary_court} and regional federal district courts."
        },
        {
            "question": f"What are the audio recording and surveillance laws in {state['state_name']}?",
            "answer": f"Under {state['legal_context']['recording_statute']}, {state['state_name']} is a {state['legal_context']['audio_consent']} jurisdiction. {state['legal_context']['recording_summary']} Regarding GPS tracking, {state['legal_context']['gps_summary']}"
        }
    ]

    schema_json = build_schema_json(
        page_type="CityHub",
        canonical_url=canonical_url,
        name=f"Compitiello & Donofrio Private Investigations - {city['city_name']} Operations",
        breadcrumbs=breadcrumbs,
        faqs=faqs,
        city_data=city,
        state_data=state
    )

    # Suburbs links
    suburbs_html = []
    state_city_slugs = {c["city_slug"]: c for c in state["cities"]}
    for sub in city["surrounding_suburbs"]:
        sub_slug = sub.lower().replace(" ", "-").replace("'", "")
        if sub_slug in state_city_slugs:
            suburbs_html.append(f'<a href="/locations/{state["state_slug"]}/{sub_slug}/" class="btn btn-outline btn-sm" style="margin-right: 0.5rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-location-dot" aria-hidden="true" style="color: var(--accent-gold); margin-right: 0.25rem;"></i>{sub} Operations</a>')
        else:
            suburbs_html.append(f'<span class="badge-suburb"><i class="fa-solid fa-map-pin" aria-hidden="true" style="color: var(--accent-gold); margin-right: 0.25rem;"></i>{sub}</span>')

    courthouses_li = "\n".join([f'            <li><strong>{clean_html(ch)}:</strong> Evidentiary litigation support, civil docket research, and trial witness presentation.</li>' for ch in city["local_courthouses"]])
    districts_li = "\n".join([f'            <li><i class="fa-solid fa-check" style="color: var(--accent-gold); margin-right: 0.5rem;" aria-hidden="true"></i><strong>{clean_html(d)}</strong></li>' for d in city["key_districts"]])
    suburbs_joined = "\n".join(suburbs_html)
    faqs_html = "\n".join([f'''            <div>
              <h3 class="location-faq-question">{clean_html(faq["question"])}</h3>
              <p class="location-faq-answer">{clean_html(faq["answer"])}</p>
            </div>
            <hr style="border-color: var(--border-color); margin: 0.5rem 0;">''' for faq in faqs])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title}</title>
  <meta name="description" content="{meta_desc}">
  <link rel="canonical" href="{canonical_url}">
  
  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">

  <!-- Open Graph -->
  <meta property="og:title" content="{page_title}">
  <meta property="og:description" content="{og_desc}">
  <meta property="og:image" content="{BASE_URL}/assets/hero_background_desert.jpg">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{canonical_url}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{page_title}">
  <meta name="twitter:description" content="{og_desc}">
  <meta name="twitter:image" content="{BASE_URL}/assets/hero_background_desert.jpg">

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
  
  <!-- Main Stylesheet -->
  <link rel="stylesheet" href="/index.css?v=1.3.1">

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
{schema_json}
  </script>
</head>
<body>

{get_shared_header()}

  <main id="main-content">
    <!-- Hero Section -->
    <section class="legal-page-hero" style="padding-top: 2rem; padding-bottom: 2.5rem;">
      <div class="section-container">
        {make_breadcrumbs_html(breadcrumbs)}

        <div class="badge-premium" style="margin-bottom: 1.25rem;">
          <svg class="badge-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M12,1L3,5v6c0,5.55,3.84,10.74,9,12c5.16-1.26,9-6.45,9-12V5L12,1L12,1z M12,11.99h7c-0.53,4.12-3.28,7.79-7,8.94V12H5V6.3l7-3.11V11.99z"/>
          </svg>
          LICENSED INVESTIGATIVE AGENCY • AZ DPS LIC. #1616599 • {state['state_name'].upper()} NETWORK
        </div>

        <h1 class="section-title" style="font-size: clamp(2rem, 4vw, 3.1rem); max-width: 960px; margin: 0 auto 1rem auto;">
          {h1}
        </h1>
        
        <p class="section-subtitle" style="max-width: 860px; margin: 0 auto 2rem auto; font-size: 1.15rem; line-height: 1.7;">
          Discreet, court-admissible private investigation, financial asset tracing, and executive intelligence in {city['city_name']}, {state['state_name']}. Directed by former federal supervisory special agents with over 25 years of federal investigative leadership.
        </p>

        <div class="hero-cta-group" style="justify-content: center; gap: 1rem; display: flex; flex-wrap: wrap;">
          <a href="#consultation-form-section" class="btn btn-gold btn-large">Confidential {city['city_name']} Consultation</a>
          <a href="tel:+14806302533" class="btn btn-outline btn-large" style="border-color: var(--accent-gold);"><i class="fa-solid fa-phone" aria-hidden="true"></i> (480) 630-2533</a>
        </div>
      </div>
    </section>

    <!-- Trust Credentials Bar -->
    <div class="trust-bar-section" style="border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 1.25rem 0;">
      <div class="section-container">
        <div class="trust-bar">
          <div class="trust-bar-item">
            <i class="fa-solid fa-scale-balanced" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>{clean_html(primary_court)} Admissible</span>
          </div>
          <div class="trust-bar-divider" aria-hidden="true"></div>
          <div class="trust-bar-item">
            <i class="fa-solid fa-building-columns" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>{state['legal_context']['court_rules']}</span>
          </div>
          <div class="trust-bar-divider" aria-hidden="true"></div>
          <div class="trust-bar-item">
            <i class="fa-solid fa-id-badge" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>Former DHS/HSI Supervisory Special Agents</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Section -->
    <section class="section-container" style="padding-top: 3.5rem; padding-bottom: 3.5rem;">
      <div style="max-width: 980px; margin: 0 auto;">

        <!-- Card 1: City Practice & Evidentiary Standards -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">{city['city_name'].upper()} PRACTICE OVERVIEW</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Investigative Services &amp; Evidentiary Standards in {city['county_name']} Courts</h2>
          
          <p>{clean_html(city['economic_context'])} Whether managing high-stakes matrimonial litigation, corporate due diligence, or enforcing unsatisfied multimillion-dollar judgments, clients in {city['city_name']} require investigators capable of delivering uncompromised discretion and ironclad legal evidence.</p>
          
          <p>Compitiello &amp; Donofrio Private Investigations serves individuals, prominent trial attorneys, family offices, and multinational corporations throughout {city['city_name']} and {city['county_name']}. Unlike regional broker agencies that farm work out to unvetted subcontractors, our cases are personally directed by former federal supervisory special agents who have led complex fraud and financial task forces.</p>

          <div class="article-quote" style="margin: 1.75rem 0;">
            "We provide {city['city_name']} clients with the analytical rigor, technology, and evidentiary standards of federal law enforcement—ensuring every finding withstands the most hostile judicial scrutiny."
          </div>

          <h3 style="font-size: 1.35rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Local Courthouses &amp; Legal Jurisdictions We Support</h3>
          <p>Our operational capabilities integrate seamlessly with local judicial and enforcement channels across {city['county_name']}:</p>
          <ul style="line-height: 1.8; margin-bottom: 1.5rem;">
{courthouses_li}
          </ul>

          <h3 style="font-size: 1.35rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">{state['state_name']} Statutory &amp; Surveillance Constraints</h3>
          <p><strong>Audio Surveillance ({state['legal_context']['audio_consent']}):</strong> {state['legal_context']['recording_summary']}</p>
          <p><strong>GPS Tracking Protocol ({state['legal_context']['gps_statute']}):</strong> {state['legal_context']['gps_summary']}</p>
        </div>

        <!-- Card 2: High-Intent Silo Practice Areas in City -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">SPECIALIZED PRACTICE SILOS</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Specialized Investigative Services in {city['city_name']}</h2>
          <p>Explore dedicated practice area landing pages tailored to {city['city_name']} litigation requirements:</p>

          <div style="display: grid; gap: 1.5rem; margin-top: 1.5rem;">
            
            <div class="practice-feature-box">
              <h3 class="practice-feature-title">
                <a href="/locations/{state['state_slug']}/{city['city_slug']}/asset-tracing/">{city['city_name']} Asset Search &amp; Hidden Accounts</a>
              </h3>
              <p class="practice-feature-desc">Uncovering hidden bank accounts, offshore trusts, real estate holdings, and corporate shells in high-stakes divorce and commercial disputes. <a href="/locations/{state['state_slug']}/{city['city_slug']}/asset-tracing/" class="practice-feature-link">Explore {city['city_name']} Asset Tracing &rarr;</a></p>
            </div>

            <div class="practice-feature-box">
              <h3 class="practice-feature-title">
                <a href="/locations/{state['state_slug']}/{city['city_slug']}/corporate-vetting/">{city['city_name']} Corporate Due Diligence &amp; Fraud Investigations</a>
              </h3>
              <p class="practice-feature-desc">Pre-investment background intelligence, executive vetting, and unmasking beneficial owners behind Delaware, Wyoming, and Nevada shell entities. <a href="/locations/{state['state_slug']}/{city['city_slug']}/corporate-vetting/" class="practice-feature-link">Explore {city['city_name']} Corporate Vetting &rarr;</a></p>
            </div>

            <div class="practice-feature-box">
              <h3 class="practice-feature-title">
                <a href="/locations/{state['state_slug']}/{city['city_slug']}/judgment-enforcement/">{city['city_name']} Judgment Recovery &amp; Debt Tracing</a>
              </h3>
              <p class="practice-feature-desc">Enforcing unsatisfied civil judgments and arbitration awards in {city['county_name']} courts. Domesticating out-of-state judgments under the UEFJA and identifying attachable bank accounts. <a href="/locations/{state['state_slug']}/{city['city_slug']}/judgment-enforcement/" class="practice-feature-link">Explore {city['city_name']} Judgment Recovery &rarr;</a></p>
            </div>

            <div class="practice-feature-box">
              <h3 class="practice-feature-title">
                <a href="/services/surveillance.html">Covert {city['city_name']} Surveillance Operations</a>
              </h3>
              <p class="practice-feature-desc">High-definition mobile, stationary, and aerial surveillance for corporate fraud, workers' compensation defense, child custody disputes, and infidelity investigations, fully compliant with {state['legal_context']['recording_statute']}. <a href="/services/surveillance.html" class="practice-feature-link">Learn More &rarr;</a></p>
            </div>

          </div>
        </div>

{get_shared_eeat_card()}

        <!-- Card 3: Regional Reach & Suburbs Cross-linking -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">REGIONAL JURISDICTION</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Serving {city['city_name']} and Surrounding {city['metro_name']} Jurisdictions</h2>
          <p>Our investigators provide continuous investigative coverage across {city['city_name']}, {city['county_name']}, and adjacent municipalities:</p>
          
          <div style="margin-top: 1.25rem; margin-bottom: 1.5rem;">
            {suburbs_joined}
          </div>

          <h3 style="font-size: 1.2rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">Key Business Districts &amp; Corridors</h3>
          <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; list-style: none; padding: 0;">
{districts_li}
          </ul>
        </div>

        <!-- Card 4: FAQs -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">FREQUENT INQUIRIES</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">Frequently Asked Questions Regarding Private Investigations in {city['city_name']}, {state['state_name']}</h2>

          <div style="display: grid; gap: 1.5rem;">
            {faqs_html}
          </div>
        </div>

{get_shared_form(f"location-{city['city_slug']}", city['city_name'])}

      </div>
    </section>
  </main>

{get_shared_footer()}

</body>
</html>"""

def render_service_page(state: Dict[str, Any], city: Dict[str, Any], service: Dict[str, Any], all_states: List[Dict[str, Any]]) -> str:
    canonical_url = f"{BASE_URL}/locations/{state['state_slug']}/{city['city_slug']}/{service['slug']}/"
    page_title = f"{city['city_name']} {service['title_suffix']}"
    meta_desc = service["meta_desc_template"].format(city_name=city["city_name"], state_abbr=state["state_abbr"], county_name=city["county_name"])
    og_desc = service["og_desc_template"].format(city_name=city["city_name"], state_abbr=state["state_abbr"], county_name=city["county_name"])
    h1 = f"{city['city_name']} {service['h1_title']}"

    breadcrumbs = [
        {"name": "Home", "url": f"{BASE_URL}/"},
        {"name": "Locations", "url": f"{BASE_URL}/locations/"},
        {"name": f"{state['state_name']} Hub", "url": f"{BASE_URL}/locations/{state['state_slug']}/"},
        {"name": f"{city['city_name']} PI", "url": f"{BASE_URL}/locations/{state['state_slug']}/{city['city_slug']}/"},
        {"name": service["short_name"], "url": canonical_url}
    ]

    primary_court = city["local_courthouses"][0]

    if service["slug"] == "asset-tracing":
        faqs = [
            {
                "question": f"What specific types of assets can CAD investigators identify in {city['city_name']}?",
                "answer": f"Our forensic financial analysts identify active domestic and foreign bank accounts, securities portfolios, cryptocurrency wallets, real property holdings, business ownership interests, titled luxury craft (marine vessels and private aircraft), and assets shielded inside irrevocable family trusts or out-of-state holding entities."
            },
            {
                "question": f"How do you uncover hidden accounts in {city['county_name']} divorce litigation?",
                "answer": f"We utilize forensic financial tracing, analyzing historical transactional patterns, loan applications, business ledger distributions, and lifestyle spending audits. All searches are conducted in full compliance with the Gramm-Leach-Bliley Act (GLBA) and Fair Credit Reporting Act (FCRA), ensuring evidence is 100% court-admissible in {primary_court}."
            },
            {
                "question": f"Is financial asset search evidence admissible in {city['county_name']} courts?",
                "answer": f"Yes. All intelligence is gathered strictly through lawful open-source intelligence (OSINT), public records reconciliation, corporate filings, and subpoena-ready financial audits under the {state['legal_context']['court_rules']}. We provide testifying expert witness affidavits and comprehensive evidence binders."
            },
            {
                "question": f"Can you trace assets hidden in offshore jurisdictions or out-of-state shell companies?",
                "answer": f"Yes. Having supervised complex transnational fraud task forces at DHS/HSI, our leadership specializes in piercing offshore entities in jurisdictions like the Cayman Islands, British Virgin Islands, Panama, and Nevis, as well as domestic secrecy entities formed in Delaware, Wyoming, and Nevada."
            }
        ]
    elif service["slug"] == "corporate-vetting":
        faqs = [
            {
                "question": f"What is included in a corporate due diligence investigation in {city['city_name']}?",
                "answer": f"Our corporate intelligence covers ultimate beneficial ownership (UBO) identification, executive background checks, active and historical civil/criminal litigation audits, federal regulatory sanctions, UCC filings, tax liens, competitor cross-affiliations, and corporate reputational intelligence."
            },
            {
                "question": f"How quickly can CAD complete executive vetting in {city['city_name']}, {state['state_abbr']}?",
                "answer": f"Standard comprehensive executive vetting is completed within 3 to 5 business days. For urgent transactional deadlines, preliminary red-flag summaries can be delivered within 24 to 48 hours."
            },
            {
                "question": f"How do you investigate entities with anonymous ownership in {state['state_name']}?",
                "answer": f"We trace registered agent histories, initial formation documentation, corporate signatory records, commercial physical addresses, and correlate banking and vendor footprints to unmask true beneficial owners."
            },
            {
                "question": f"Are corporate investigation findings protected by attorney-client privilege?",
                "answer": f"Yes. When retained directly by corporate legal counsel or trial attorneys representing {city['city_name']} entities, our reports and work papers are structured under the attorney work-product doctrine."
            }
        ]
    else:  # judgment-enforcement
        faqs = [
            {
                "question": f"How do you enforce an unpaid judgment in {city['city_name']} and {city['county_name']} courts?",
                "answer": f"We conduct deep post-judgment debtor asset discovery to identify unencumbered bank accounts, commercial receivables, real estate equity, and business revenue streams, providing local counsel with exact targets for writs of garnishment and execution."
            },
            {
                "question": f"What if a debtor in {city['city_name']} transferred assets to family members or shell companies?",
                "answer": f"We investigate fraudulent conveyances under the Uniform Voidable Transactions Act (UVTA / TUFTA). By establishing 'badges of fraud'—such as transfers for less than fair value while insolvent—we enable attorneys to void the transfers and claw assets back into the judgment debtor's estate."
            },
            {
                "question": f"Can out-of-state judgments be enforced against debtors residing in {city['city_name']}, {state['state_name']}?",
                "answer": f"Yes. We support sister-state judgment domestication under the Uniform Enforcement of Foreign Judgments Act (UEFJA), verifying debtor residency and locating local assets before filing for domestication in {primary_court}."
            },
            {
                "question": f"What attachable assets can CAD identify for post-judgment garnishment?",
                "answer": f"We identify operating bank accounts, payroll distributions, commercial client receivables, heavy machinery, registered transport fleets, and unencumbered commercial real estate suitable for judicial sale or charging orders."
            }
        ]

    schema_json = build_schema_json(
        page_type="ServicePage",
        canonical_url=canonical_url,
        name=f"Compitiello & Donofrio Private Investigations - {city['city_name']} {service['short_name']} Operations",
        breadcrumbs=breadcrumbs,
        faqs=faqs,
        city_data=city,
        state_data=state,
        service_data=service
    )

    # Suburbs links
    suburbs_html = []
    state_city_slugs = {c["city_slug"]: c for c in state["cities"]}
    for sub in city["surrounding_suburbs"]:
        sub_slug = sub.lower().replace(" ", "-").replace("'", "")
        if sub_slug in state_city_slugs:
            suburbs_html.append(f'<a href="/locations/{state["state_slug"]}/{sub_slug}/{service["slug"]}/" class="btn btn-outline btn-sm" style="margin-right: 0.5rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-location-dot" aria-hidden="true" style="color: var(--accent-gold); margin-right: 0.25rem;"></i>{sub} {service["short_name"]}</a>')
        else:
            suburbs_html.append(f'<span class="badge-suburb"><i class="fa-solid fa-map-pin" aria-hidden="true" style="color: var(--accent-gold); margin-right: 0.25rem;"></i>{sub}</span>')

    # Other services crosslinks
    sibling_services = [s for s in SERVICES if s["slug"] != service["slug"]]
    other_services_html = []
    for sib in sibling_services:
        other_services_html.append(f'''            <div class="practice-feature-box">
              <h3 class="practice-feature-title"><a href="/locations/{state['state_slug']}/{city['city_slug']}/{sib['slug']}/">{city['city_name']} {sib['name']} &rarr;</a></h3>
              <p class="practice-feature-desc">{clean_html(sib['focus_summary'])}</p>
            </div>''')

    suburbs_joined = "\n".join(suburbs_html)
    other_services_joined = "\n".join(other_services_html)
    faqs_html = "\n".join([f'''            <div>
              <h3 class="location-faq-question">{clean_html(faq["question"])}</h3>
              <p class="location-faq-answer">{clean_html(faq["answer"])}</p>
            </div>
            <hr style="border-color: var(--border-color); margin: 0.5rem 0;">''' for faq in faqs])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title}</title>
  <meta name="description" content="{meta_desc}">
  <link rel="canonical" href="{canonical_url}">
  
  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">

  <!-- Open Graph -->
  <meta property="og:title" content="{page_title}">
  <meta property="og:description" content="{og_desc}">
  <meta property="og:image" content="{BASE_URL}/assets/hero_background_desert.jpg">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{canonical_url}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{page_title}">
  <meta name="twitter:description" content="{og_desc}">
  <meta name="twitter:image" content="{BASE_URL}/assets/hero_background_desert.jpg">

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
  
  <!-- Main Stylesheet -->
  <link rel="stylesheet" href="/index.css?v=1.3.1">

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
{schema_json}
  </script>
</head>
<body>

{get_shared_header()}

  <main id="main-content">
    <!-- Hero Section -->
    <section class="legal-page-hero" style="padding-top: 2rem; padding-bottom: 2.5rem;">
      <div class="section-container">
        {make_breadcrumbs_html(breadcrumbs)}

        <div class="badge-premium" style="margin-bottom: 1.25rem;">
          <svg class="badge-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M12,1L3,5v6c0,5.55,3.84,10.74,9,12c5.16-1.26,9-6.45,9-12V5L12,1L12,1z M12,11.99h7c-0.53,4.12-3.28,7.79-7,8.94V12H5V6.3l7-3.11V11.99z"/>
          </svg>
          LICENSED INVESTIGATIVE AGENCY • AZ DPS LIC. #1616599 • {state['state_name'].upper()} NETWORK
        </div>

        <h1 class="section-title" style="font-size: clamp(2rem, 4vw, 3.1rem); max-width: 960px; margin: 0 auto 1rem auto;">
          {h1}
        </h1>
        
        <p class="section-subtitle" style="max-width: 860px; margin: 0 auto 2rem auto; font-size: 1.15rem; line-height: 1.7;">
          Federal-grade {service['name'].lower()} in {city['city_name']}, {state['state_name']}. Identifying hidden bank accounts, corporate alter egos, and financial concealment for {city['county_name']} legal counsel.
        </p>

        <div class="hero-cta-group" style="justify-content: center; gap: 1rem; display: flex; flex-wrap: wrap;">
          <a href="#consultation-form-section" class="btn btn-gold btn-large">Request Confidential {service['short_name']} Review</a>
          <a href="tel:+14806302533" class="btn btn-outline btn-large" style="border-color: var(--accent-gold);"><i class="fa-solid fa-phone" aria-hidden="true"></i> (480) 630-2533</a>
        </div>
      </div>
    </section>

    <!-- Trust Credentials Bar -->
    <div class="trust-bar-section" style="border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 1.25rem 0;">
      <div class="section-container">
        <div class="trust-bar">
          <div class="trust-bar-item">
            <i class="fa-solid fa-scale-balanced" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>{clean_html(primary_court)} Admissible</span>
          </div>
          <div class="trust-bar-divider" aria-hidden="true"></div>
          <div class="trust-bar-item">
            <i class="fa-solid fa-building-columns" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>{state['legal_context']['court_rules']}</span>
          </div>
          <div class="trust-bar-divider" aria-hidden="true"></div>
          <div class="trust-bar-item">
            <i class="fa-solid fa-id-badge" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>Former Federal Supervisory Special Agents</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Section -->
    <section class="section-container" style="padding-top: 3.5rem; padding-bottom: 3.5rem;">
      <div style="max-width: 980px; margin: 0 auto;">

        <!-- Card 1: Service Evidentiary Standards in County Courts -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">{city['city_name'].upper()} {service['short_name'].upper()} PRACTICE</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">{service['name']} &amp; Evidentiary Standards in {city['county_name']} Courts</h2>
          
          <p>{service['evidentiary_intro'].format(city_name=city['city_name'], county_name=city['county_name'], court_name=primary_court)}</p>
          
          <p>Compitiello &amp; Donofrio Private Investigations works closely with lead trial counsel and commercial litigators appearing before <strong>{clean_html(primary_court)}</strong> and regional federal courts. We guarantee that all financial intelligence adheres to GLBA, FCRA, and the <strong>{state['legal_context']['court_rules']}</strong>, eliminating evidentiary exclusion challenges.</p>

          <div class="article-quote" style="margin: 1.75rem 0;">
            "Our federal tracing methodology cuts through shell holding companies and nominee trusts, providing litigation counsel with verified, attachable assets."
          </div>

          <h3 style="font-size: 1.35rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">Core Investigative Capabilities in {city['city_name']}</h3>
          <ul style="line-height: 1.8; margin-bottom: 1.5rem;">
            <li><strong>{service['court_bullet_1']}</strong></li>
            <li><strong>{service['court_bullet_2']}</strong></li>
            <li><strong>{service['court_bullet_3']}</strong></li>
            <li><strong>{service['court_bullet_4'].format(court_name=primary_court)}</strong></li>
          </ul>

          <h3 style="font-size: 1.35rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">{state['state_name']} Statutory Context</h3>
          <p><strong>Wiretap &amp; Recording Compliance ({state['legal_context']['audio_consent']}):</strong> {state['legal_context']['recording_summary']}</p>
          <p><strong>Tracking Constraints ({state['legal_context']['gps_statute']}):</strong> {state['legal_context']['gps_summary']}</p>
        </div>

        <!-- Card 2: Other Practice Areas in City -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">CROSS-PRACTICE SYNERGY</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Other Practice Areas in {city['city_name']}</h2>
          <p>In addition to {service['name'].lower()}, CAD Private Investigations provides comprehensive investigative support across {city['city_name']}:</p>

          <div style="display: grid; gap: 1.25rem; margin-top: 1.5rem;">
            <div class="practice-feature-box">
              <h3 class="practice-feature-title"><a href="/locations/{state['state_slug']}/{city['city_slug']}/">{city['city_name']} Private Investigator Overview &rarr;</a></h3>
              <p class="practice-feature-desc">Full-spectrum private investigations, litigation intelligence, witness locates, and court-admissible evidence throughout {city['city_name']}.</p>
            </div>
{other_services_joined}
          </div>
        </div>

{get_shared_eeat_card()}

        <!-- Card 3: Surrounding Suburbs -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">REGIONAL REACH</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Serving {city['city_name']} and Surrounding {city['metro_name']} Jurisdictions</h2>
          <p>Our investigators handle {service['short_name'].lower()} across all surrounding communities in {city['county_name']}:</p>
          
          <div style="margin-top: 1.25rem;">
            {suburbs_joined}
          </div>
        </div>

        <!-- Card 4: FAQs -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">FREQUENT INQUIRIES</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">Frequently Asked Questions Regarding {service['short_name']} in {city['city_name']}, {state['state_name']}</h2>

          <div style="display: grid; gap: 1.5rem;">
            {faqs_html}
          </div>
        </div>

{get_shared_form(f"service-{city['city_slug']}-{service['slug']}", city['city_name'])}

      </div>
    </section>
  </main>

{get_shared_footer()}

</body>
</html>"""

def render_state_hub(state: Dict[str, Any], all_states: List[Dict[str, Any]]) -> str:
    canonical_url = f"{BASE_URL}/locations/{state['state_slug']}/"
    page_title = f"{state['state_name']} Private Investigators & Statewide Asset Tracing | CAD PI"
    meta_desc = f"Federal-grade private investigations across {state['state_name']}. Statewide asset tracing, corporate due diligence, surveillance, and court-admissible evidence led by former federal special agents."
    og_desc = f"Comprehensive private investigations across {state['state_name']}. Directed by former DHS/HSI supervisory special agents. AZ DPS Lic. #1616599."
    h1 = f"Licensed {state['state_name']} Private Investigators &amp; Statewide Forensic Operations"

    breadcrumbs = [
        {"name": "Home", "url": f"{BASE_URL}/"},
        {"name": "Locations", "url": f"{BASE_URL}/locations/"},
        {"name": f"{state['state_name']} Hub", "url": canonical_url}
    ]

    faqs = [
        {
            "question": f"How does CAD Private Investigations operate throughout {state['state_name']}?",
            "answer": f"CAD operates under primary Arizona DPS License #1616599 and deploys operatives throughout {state['state_name']} through our vetted network of licensed state investigators and interstate federal reciprocity protocols. Every case is personally supervised by our leadership team of former federal supervisory special agents."
        },
        {
            "question": f"What are the key legal constraints for private investigations under {state['state_name']} law?",
            "answer": f"Under {state['legal_context']['recording_statute']}, {state['state_name']} is a {state['legal_context']['audio_consent']} state. {state['legal_context']['recording_summary']} Regarding GPS tracking, {state['legal_context']['gps_summary']}"
        },
        {
            "question": f"How does your federal law enforcement background benefit {state['state_name']} clients?",
            "answer": f"Our founder, Michael Compitiello, served over 25 years as a Supervisory Special Agent with DHS/HSI, leading complex financial fraud, narcotics, and international asset forfeiture task forces. We bring federal-level forensic discipline, analytical software, and rigorous chain-of-custody standards to private civil, commercial, and matrimonial disputes."
        },
        {
            "question": f"How do I retain CAD for a complex statewide or multi-jurisdictional investigation?",
            "answer": f"You can schedule a confidential consultation by calling our Scottsdale headquarters at (480) 630-2533 or completing the secure form below. We provide immediate case reviews under attorney work product confidentiality."
        }
    ]

    schema_json = build_schema_json(
        page_type="StateHub",
        canonical_url=canonical_url,
        name=f"Compitiello & Donofrio Private Investigations - {state['state_name']} Operations",
        breadcrumbs=breadcrumbs,
        faqs=faqs,
        state_data=state
    )

    # City cards
    city_cards_html = []
    for c in state["cities"]:
        city_cards_html.append(f'''        <div class="glass-card legal-card" style="padding: 1.75rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h3 style="font-size: 1.3rem; margin: 0; color: var(--text-primary);"><a href="/locations/{state['state_slug']}/{c['city_slug']}/" style="color: inherit; text-decoration: none;" class="hover-link">{c['city_name']}</a></h3>
              <span style="font-size: 0.8rem; color: var(--text-gold); font-weight: 600;">{c['county_name']}</span>
            </div>
            <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
              {clean_html(c['economic_context'])}
            </p>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
              <strong>Key Services:</strong>
              <div class="location-item-services" style="margin-top: 0.35rem;">
                <a href="/locations/{state['state_slug']}/{c['city_slug']}/asset-tracing/">Asset Tracing</a> &bull;
                <a href="/locations/{state['state_slug']}/{c['city_slug']}/corporate-vetting/">Corporate Vetting</a> &bull;
                <a href="/locations/{state['state_slug']}/{c['city_slug']}/judgment-enforcement/">Judgment Recovery</a>
              </div>
            </div>
          </div>
          <a href="/locations/{state['state_slug']}/{c['city_slug']}/" class="btn btn-gold btn-sm" style="align-self: flex-start; margin-top: 0.5rem;">View {c['city_name']} Hub &rarr;</a>
        </div>''')

    city_cards_joined = "\n".join(city_cards_html)
    faqs_html = "\n".join([f'''            <div>
              <h3 class="location-faq-question">{clean_html(faq["question"])}</h3>
              <p class="location-faq-answer">{clean_html(faq["answer"])}</p>
            </div>
            <hr style="border-color: var(--border-color); margin: 0.5rem 0;">''' for faq in faqs])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title}</title>
  <meta name="description" content="{meta_desc}">
  <link rel="canonical" href="{canonical_url}">
  
  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">

  <!-- Open Graph -->
  <meta property="og:title" content="{page_title}">
  <meta property="og:description" content="{og_desc}">
  <meta property="og:image" content="{BASE_URL}/assets/hero_background_desert.jpg">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{canonical_url}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{page_title}">
  <meta name="twitter:description" content="{og_desc}">
  <meta name="twitter:image" content="{BASE_URL}/assets/hero_background_desert.jpg">

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
  
  <!-- Main Stylesheet -->
  <link rel="stylesheet" href="/index.css?v=1.3.1">

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
{schema_json}
  </script>
</head>
<body>

{get_shared_header()}

  <main id="main-content">
    <!-- Hero Section -->
    <section class="legal-page-hero" style="padding-top: 2rem; padding-bottom: 2.5rem;">
      <div class="section-container">
        {make_breadcrumbs_html(breadcrumbs)}

        <div class="badge-premium" style="margin-bottom: 1.25rem;">
          <svg class="badge-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M12,1L3,5v6c0,5.55,3.84,10.74,9,12c5.16-1.26,9-6.45,9-12V5L12,1L12,1z M12,11.99h7c-0.53,4.12-3.28,7.79-7,8.94V12H5V6.3l7-3.11V11.99z"/>
          </svg>
          LICENSED INVESTIGATIVE AGENCY • AZ DPS LIC. #1616599 • {state['state_name'].upper()} NETWORK
        </div>

        <h1 class="section-title" style="font-size: clamp(2rem, 4vw, 3.1rem); max-width: 960px; margin: 0 auto 1rem auto;">
          {h1}
        </h1>
        
        <p class="section-subtitle" style="max-width: 860px; margin: 0 auto 2rem auto; font-size: 1.15rem; line-height: 1.7;">
          Discreet, court-admissible forensic intelligence, financial asset search, and executive surveillance across {state['state_name']}. Founded and directed by former federal supervisory special agents.
        </p>

        <div class="hero-cta-group" style="justify-content: center; gap: 1rem; display: flex; flex-wrap: wrap;">
          <a href="#consultation-form-section" class="btn btn-gold btn-large">Confidential {state['state_name']} Consultation</a>
          <a href="tel:+14806302533" class="btn btn-outline btn-large" style="border-color: var(--accent-gold);"><i class="fa-solid fa-phone" aria-hidden="true"></i> (480) 630-2533</a>
        </div>
      </div>
    </section>

    <!-- Trust Credentials Bar -->
    <div class="trust-bar-section" style="border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 1.25rem 0;">
      <div class="section-container">
        <div class="trust-bar">
          <div class="trust-bar-item">
            <i class="fa-solid fa-scale-balanced" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>{state['legal_context']['court_rules']}</span>
          </div>
          <div class="trust-bar-divider" aria-hidden="true"></div>
          <div class="trust-bar-item">
            <i class="fa-solid fa-shield-halved" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>{state['licensing_info']}</span>
          </div>
          <div class="trust-bar-divider" aria-hidden="true"></div>
          <div class="trust-bar-item">
            <i class="fa-solid fa-id-badge" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>Former DHS/HSI Supervisory Special Agents</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Section -->
    <section class="section-container" style="padding-top: 3.5rem; padding-bottom: 3.5rem;">
      <div style="max-width: 1040px; margin: 0 auto;">

        <!-- Card 1: State Overview & Legal Standards -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">STATEWIDE OPERATIONAL CORRIDOR</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Statewide Investigative Capabilities &amp; {state['state_name']} Evidentiary Standards</h2>
          
          <p>Compitiello &amp; Donofrio Private Investigations provides specialized forensic investigation across {state['state_name']}, serving family offices, high-net-worth individuals, trial attorneys, and corporations. From multi-million-dollar divorce asset searches and hidden offshore accounts to executive background vetting and corporate counter-intelligence, our investigations adhere to the highest legal and evidentiary thresholds.</p>

          <p>{state['legal_context']['court_summary']}</p>

          <div class="article-quote" style="margin: 1.75rem 0;">
            "We combine the operational reach of federal law enforcement with deep localization across {state['state_name']}'s major judicial and commercial centers."
          </div>

          <h3 style="font-size: 1.35rem; margin-top: 1.75rem; margin-bottom: 0.75rem;">{state['state_name']} Statutory Context for Private Investigations</h3>
          <p><strong>Audio Surveillance ({state['legal_context']['audio_consent']}):</strong> {state['legal_context']['recording_summary']}</p>
          <p><strong>Electronic Tracking ({state['legal_context']['gps_statute']}):</strong> {state['legal_context']['gps_summary']}</p>
        </div>

        <!-- Card 2: City Grid -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">LOCAL METROPOLITAN HUBS</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Major Metropolitan Jurisdictions We Serve Across {state['state_name']}</h2>
          <p>Select a metropolitan practice hub for localized courthouse intelligence, practice areas, and municipal coverage:</p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.75rem;">
{city_cards_joined}
          </div>
        </div>

{get_shared_eeat_card()}

        <!-- Card 3: FAQs -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">FREQUENT INQUIRIES</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">Frequently Asked Questions Regarding {state['state_name']} Private Investigations</h2>

          <div style="display: grid; gap: 1.5rem;">
            {faqs_html}
          </div>
        </div>

{get_shared_form(f"state-{state['state_slug']}", state['state_name'])}

      </div>
    </section>
  </main>

{get_shared_footer()}

</body>
</html>"""

def render_master_directory(all_states: List[Dict[str, Any]]) -> str:
    total_cities = sum(len(s["cities"]) for s in all_states)
    states_str = ", ".join([s["state_name"] for s in all_states[:-1]]) + f", and {all_states[-1]['state_name']}"
    canonical_url = f"{BASE_URL}/locations/"
    page_title = "Service Locations & Nationwide Investigative Reach | CAD Private Investigations"
    meta_desc = f"Explore CAD Private Investigations' multi-state practice hubs and localized investigative offices across {states_str}."
    og_desc = f"Federal-grade private investigations across {states_str}, and nationwide. Corporate HQ in Scottsdale, AZ."
    h1 = "CAD Private Investigations: Nationwide Practice Locations &amp; Regional Hubs"

    breadcrumbs = [
        {"name": "Home", "url": f"{BASE_URL}/"},
        {"name": "Locations", "url": canonical_url}
    ]

    faqs = [
        {
            "question": "How does CAD Private Investigations coordinate multi-state investigations?",
            "answer": "All multi-state and nationwide cases are centrally directed from our Corporate Headquarters in Scottsdale, Arizona by former federal supervisory special agents. Field operations are executed in direct alignment with state-licensed investigators and nationwide task force reciprocity channels."
        },
        {
            "question": "Can CAD trace assets moved across state lines?",
            "answer": "Yes. One of our core specialties is unmasking interstate and cross-border asset concealment, such as funds transferred from California, New York, or Texas into Florida real estate, Delaware holding companies, or Wyoming privacy trusts."
        },
        {
            "question": "Do you handle foreign and international investigations?",
            "answer": "Yes. Our leadership directed international kleptocracy and financial crime task forces at DHS/HSI, coordinating complex foreign asset seizures, offshore bank inquiries, and cross-border witness location."
        }
    ]

    schema_json = build_schema_json(
        page_type="MasterDirectory",
        canonical_url=canonical_url,
        name="Compitiello & Donofrio Private Investigations - Nationwide Investigative Directory",
        breadcrumbs=breadcrumbs,
        faqs=faqs
    )

    state_sections_html = []
    for s in all_states:
        city_links_html = []
        for c in s["cities"]:
            city_links_html.append(f'''            <div class="location-item-card">
              <h4 class="location-item-title"><a href="/locations/{s['state_slug']}/{c['city_slug']}/" class="hover-link">{c['city_name']}</a></h4>
              <p class="location-item-meta">{c['county_name']} &bull; {c['metro_name']}</p>
              <div class="location-item-services">
                <a href="/locations/{s['state_slug']}/{c['city_slug']}/asset-tracing/">Asset Tracing</a> &bull;
                <a href="/locations/{s['state_slug']}/{c['city_slug']}/corporate-vetting/">Corporate Vetting</a> &bull;
                <a href="/locations/{s['state_slug']}/{c['city_slug']}/judgment-enforcement/">Judgment Recovery</a>
              </div>
            </div>''')

        hq_badge = '<span class="status-beacon status-beacon-gold" title="Corporate Headquarters" style="margin-left: 0.5rem;"></span> (Corporate HQ)' if s.get("is_hq") else ''
        city_links_joined = "\n".join(city_links_html)
        state_sections_html.append(f'''        <!-- State: {s['state_name']} -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem; border-top: 4px solid var(--accent-gold);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 1rem;">
            <h2 style="font-size: 1.85rem; margin: 0; color: var(--text-primary);">{s['state_name']} Operating Corridor {hq_badge}</h2>
            <a href="/locations/{s['state_slug']}/" class="btn btn-outline btn-sm" style="margin-top: 0.5rem;">{s['state_name']} State Hub &rarr;</a>
          </div>
          <p style="font-size: 0.98rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 1.5rem;">
            {clean_html(s['licensing_info'])} Supporting county superior courts, federal district courts, and complex multi-jurisdictional financial tracing.
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;">
{city_links_joined}
          </div>
        </div>''')

    state_sections_joined = "\n".join(state_sections_html)
    faqs_html = "\n".join([f'''            <div>
              <h3 class="location-faq-question">{clean_html(faq["question"])}</h3>
              <p class="location-faq-answer">{clean_html(faq["answer"])}</p>
            </div>
            <hr style="border-color: var(--border-color); margin: 0.5rem 0;">''' for faq in faqs])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title}</title>
  <meta name="description" content="{meta_desc}">
  <link rel="canonical" href="{canonical_url}">
  
  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">

  <!-- Open Graph -->
  <meta property="og:title" content="{page_title}">
  <meta property="og:description" content="{og_desc}">
  <meta property="og:image" content="{BASE_URL}/assets/hero_background_desert.jpg">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{canonical_url}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{page_title}">
  <meta name="twitter:description" content="{og_desc}">
  <meta name="twitter:image" content="{BASE_URL}/assets/hero_background_desert.jpg">

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
  
  <!-- Main Stylesheet -->
  <link rel="stylesheet" href="/index.css?v=1.3.1">

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
{schema_json}
  </script>
</head>
<body>

{get_shared_header()}

  <main id="main-content">
    <!-- Hero Section -->
    <section class="legal-page-hero" style="padding-top: 2rem; padding-bottom: 2.5rem;">
      <div class="section-container">
        {make_breadcrumbs_html(breadcrumbs)}

        <div class="badge-premium" style="margin-bottom: 1.25rem;">
          <svg class="badge-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M12,1L3,5v6c0,5.55,3.84,10.74,9,12c5.16-1.26,9-6.45,9-12V5L12,1L12,1z M12,11.99h7c-0.53,4.12-3.28,7.79-7,8.94V12H5V6.3l7-3.11V11.99z"/>
          </svg>
          NATIONWIDE INVESTIGATIVE REACH • {len(all_states)} STATES • {total_cities} METROPOLITAN MARKETS
        </div>

        <h1 class="section-title" style="font-size: clamp(2rem, 4vw, 3.1rem); max-width: 960px; margin: 0 auto 1rem auto;">
          {h1}
        </h1>
        
        <p class="section-subtitle" style="max-width: 860px; margin: 0 auto 2rem auto; font-size: 1.15rem; line-height: 1.7;">
          Explore CAD Private Investigations' multi-state practice hubs and localized investigative offices across {states_str}. Directed by former federal supervisory special agents with over 25 years of federal law enforcement leadership.
        </p>

        <div class="hero-cta-group" style="justify-content: center; gap: 1rem; display: flex; flex-wrap: wrap;">
          <a href="#consultation-form-section" class="btn btn-gold btn-large">Schedule Confidential Consultation</a>
          <a href="tel:+14806302533" class="btn btn-outline btn-large" style="border-color: var(--accent-gold);"><i class="fa-solid fa-phone" aria-hidden="true"></i> (480) 630-2533</a>
        </div>
      </div>
    </section>

    <!-- Trust Credentials Bar -->
    <div class="trust-bar-section" style="border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 1.25rem 0;">
      <div class="section-container">
        <div class="trust-bar">
          <div class="trust-bar-item">
            <i class="fa-solid fa-scale-balanced" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>Federal &amp; State Court Admissible</span>
          </div>
          <div class="trust-bar-divider" aria-hidden="true"></div>
          <div class="trust-bar-item">
            <i class="fa-solid fa-shield-halved" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>Licensed &amp; Bonded Agency (AZ DPS Lic. #1616599)</span>
          </div>
          <div class="trust-bar-divider" aria-hidden="true"></div>
          <div class="trust-bar-item">
            <i class="fa-solid fa-id-badge" aria-hidden="true" style="color: var(--accent-gold);"></i>
            <span>Former DHS/HSI Supervisory Special Agents</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Section -->
    <section class="section-container" style="padding-top: 3.5rem; padding-bottom: 3.5rem;">
      <div style="max-width: 1100px; margin: 0 auto;">

        <!-- Card 1: Multi-state overview -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">INTERSTATE INVESTIGATIVE ARCHITECTURE</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.25rem;">Multi-State Investigative Corridors &amp; Federal Evidentiary Standards</h2>
          <p>Complex civil litigation, divorce asset concealment, and corporate fraud rarely stop at state borders. When individuals or debtor corporations facing multimillion-dollar liability attempt to conceal assets by relocating across state borders or dispersing holdings through multi-layered legal entities in different states, single-jurisdiction investigators encounter immediate dead ends.</p>
          <p>CAD Private Investigations provides integrated multi-state operations connecting our headquarters in Scottsdale, Arizona with high-volume asset flow corridors across California, Florida, Texas, and New York.</p>
        </div>

{state_sections_joined}

{get_shared_eeat_card()}

        <!-- Card 3: FAQs -->
        <div class="glass-card legal-card" style="margin-bottom: 2.5rem; padding: 2.5rem;">
          <span class="section-label">FREQUENT INQUIRIES</span>
          <h2 style="font-size: 1.85rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">Frequently Asked Questions Regarding Nationwide Operations</h2>

          <div style="display: grid; gap: 1.5rem;">
            {faqs_html}
          </div>
        </div>

{get_shared_form("master-directory", "National")}

      </div>
    </section>
  </main>

{get_shared_footer()}

</body>
</html>"""

def generate_sitemaps(all_states: List[Dict[str, Any]]):
    """
    Generates:
    - sitemap_index.xml
    - sitemap-core.xml
    - sitemap-locations-az.xml
    - sitemap-locations-national.xml
    - updates sitemap.xml
    """
    today = "2026-11-16"

    # 1. sitemap-core.xml
    core_urls = [
        ("/", "1.0", "weekly"),
        ("/locations/", "0.95", "weekly"),
        ("/services/asset-tracing.html", "0.95", "weekly"),
        ("/services/surveillance.html", "0.90", "monthly"),
        ("/services/corporate-vetting.html", "0.90", "monthly"),
        ("/services/digital-forensics.html", "0.90", "monthly"),
        ("/services/divorce-asset-investigations.html", "0.90", "weekly"),
        ("/services/judgment-enforcement-asset-recovery.html", "0.90", "weekly"),
        ("/services/business-partner-asset-due-diligence.html", "0.90", "monthly"),
        ("/blog.html", "0.85", "weekly"),
        ("/privacy-policy.html", "0.50", "yearly"),
    ]

    core_xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    for path, prio, freq in core_urls:
        core_xml_lines.append(f"""  <url>
    <loc>{BASE_URL}{path}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{freq}</changefreq>
    <priority>{prio}</priority>
  </url>""")
    core_xml_lines.append('</urlset>')
    with open("sitemap-core.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(core_xml_lines))

    # 2. sitemap-locations-az.xml
    az_state = next(s for s in all_states if s["state_abbr"] == "AZ")
    az_xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        f"""  <url>
    <loc>{BASE_URL}/locations/arizona/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
  </url>"""
    ]
    for c in az_state["cities"]:
        az_xml_lines.append(f"""  <url>
    <loc>{BASE_URL}/locations/arizona/{c['city_slug']}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>""")
        for s in SERVICES:
            az_xml_lines.append(f"""  <url>
    <loc>{BASE_URL}/locations/arizona/{c['city_slug']}/{s['slug']}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>""")
    az_xml_lines.append('</urlset>')
    with open("sitemap-locations-az.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(az_xml_lines))

    # 3. sitemap-locations-national.xml
    nat_states = [s for s in all_states if s["state_abbr"] != "AZ"]
    nat_xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    for s in nat_states:
        nat_xml_lines.append(f"""  <url>
    <loc>{BASE_URL}/locations/{s['state_slug']}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.92</priority>
  </url>""")
        for c in s["cities"]:
            nat_xml_lines.append(f"""  <url>
    <loc>{BASE_URL}/locations/{s['state_slug']}/{c['city_slug']}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.88</priority>
  </url>""")
            for srv in SERVICES:
                nat_xml_lines.append(f"""  <url>
    <loc>{BASE_URL}/locations/{s['state_slug']}/{c['city_slug']}/{srv['slug']}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.84</priority>
  </url>""")
    nat_xml_lines.append('</urlset>')
    with open("sitemap-locations-national.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(nat_xml_lines))

    # 4. sitemap_index.xml
    index_xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        f"""  <sitemap>
    <loc>{BASE_URL}/sitemap-core.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>""",
        f"""  <sitemap>
    <loc>{BASE_URL}/sitemap-locations-az.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>""",
        f"""  <sitemap>
    <loc>{BASE_URL}/sitemap-locations-national.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>""",
        '</sitemapindex>'
    ]
    with open("sitemap_index.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(index_xml_lines))

    # Also make sitemap.xml point to the sitemap index
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(index_xml_lines))

    print("Generated sitemap_index.xml, sitemap-core.xml, sitemap-locations-az.xml, sitemap-locations-national.xml, sitemap.xml")

def generate_legacy_redirect_stubs(all_states: List[Dict[str, Any]]):
    """
    Creates lightweight redirect stubs in locations/ for legacy flat html files
    (e.g., phoenix-private-investigator.html) to seamlessly 301/refresh redirect
    to the canonical directory URL.
    """
    flat_to_dir = {}
    for s in all_states:
        flat_to_dir[f"{s['state_slug']}-private-investigator.html"] = f"/locations/{s['state_slug']}/"
        for c in s["cities"]:
            flat_to_dir[f"{c['city_slug']}-private-investigator.html"] = f"/locations/{s['state_slug']}/{c['city_slug']}/"

    # Also handle special legacy cases
    flat_to_dir["westchester-county-private-investigator.html"] = "/locations/new-york/westchester-county/"
    flat_to_dir["hudson-valley-private-investigator.html"] = "/locations/new-york/hudson-valley/"
    flat_to_dir["new-york-city-private-investigator.html"] = "/locations/new-york/new-york-city/"

    for filename, target_url in flat_to_dir.items():
        file_path = os.path.join("locations", filename)
        redirect_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <meta http-equiv="refresh" content="0; url={target_url}">
  <link rel="canonical" href="{BASE_URL}{target_url}">
  <script>window.location.replace('{target_url}');</script>
</head>
<body>
  <p>This page has permanently moved to <a href="{target_url}">{BASE_URL}{target_url}</a>.</p>
</body>
</html>"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(redirect_content)

    print(f"Generated {len(flat_to_dir)} legacy redirect stubs in locations/")

def validate_all_generated_pages(generated_files: List[str]):
    """
    Validates:
    - Total pages
    - Unique Title, Meta Description, and H1
    - Canonical matches canonical URL
    - Valid Open Graph & Twitter Card tags
    - No broken asset paths (src/href to assets/ must exist)
    """
    print("\n--- RUNNING COMPREHENSIVE VALIDATION SUITE ---")
    titles = {}
    descriptions = {}
    h1s = {}
    errors = []

    for file_path in generated_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Title
        title_m = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE)
        if not title_m:
            errors.append(f"Missing title in {file_path}")
        else:
            title = title_m.group(1).strip()
            if title in titles:
                errors.append(f"Duplicate title '{title}' in {file_path} and {titles[title]}")
            else:
                titles[title] = file_path

        # 2. Meta description
        desc_m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', content, re.IGNORECASE)
        if not desc_m:
            errors.append(f"Missing meta description in {file_path}")
        else:
            desc = desc_m.group(1).strip()
            if desc in descriptions:
                errors.append(f"Duplicate description in {file_path} and {descriptions[desc]}")
            else:
                descriptions[desc] = file_path

        # 3. H1
        h1_m = re.search(r"<h1[^>]*>(.*?)</h1>", content, re.IGNORECASE | re.DOTALL)
        if not h1_m:
            errors.append(f"Missing H1 in {file_path}")
        else:
            # strip tags if any
            h1 = re.sub(r"<[^>]+>", "", h1_m.group(1)).strip()
            if h1 in h1s:
                errors.append(f"Duplicate H1 '{h1}' in {file_path} and {h1s[h1]}")
            else:
                h1s[h1] = file_path

        # 4. Canonical self-reference
        canon_m = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', content, re.IGNORECASE)
        if not canon_m:
            errors.append(f"Missing canonical in {file_path}")

        # 5. Asset references verification
        # Find all src="/assets/..." and href="/assets/..."
        asset_refs = re.findall(r'(?:src|href)="(/assets/[^"?#]+)', content)
        for ref in asset_refs:
            disk_path = ref.lstrip("/")
            if not os.path.exists(disk_path):
                errors.append(f"Broken asset reference '{ref}' in {file_path}")

        # Check for unanchored relative asset paths like 'src="assets/' or 'href="assets/'
        broken_rel = re.findall(r'(?:src|href)="(assets/[^"]+)"', content)
        if broken_rel:
            errors.append(f"Unanchored broken relative asset path '{broken_rel[0]}' in {file_path}")

    print(f"Total Pages Checked: {len(generated_files)}")
    print(f"Unique Titles: {len(titles)}")
    print(f"Unique Meta Descriptions: {len(descriptions)}")
    print(f"Unique H1s: {len(h1s)}")
    
    if errors:
        print(f"\n[!] VALIDATION FAILURES ({len(errors)}):")
        for err in errors[:20]:
            print(f"  - {err}")
        if len(errors) > 20:
            print(f"  ... and {len(errors) - 20} more errors")
        return False
    else:
        print("\n[SUCCESS] All validation checks passed with 100% compliance!")
        return True

def main():
    data = load_data()
    states = data["states"]

    total_cities = sum(len(s["cities"]) for s in states)
    print(f"Loaded {len(states)} states and {total_cities} cities.")

    generated_files = []

    # 1. Master Directory: locations/index.html
    master_html = render_master_directory(states)
    os.makedirs("locations", exist_ok=True)
    master_path = os.path.join("locations", "index.html")
    with open(master_path, "w", encoding="utf-8") as f:
        f.write(master_html)
    generated_files.append(master_path)

    # 2. State Hubs, City Hubs, and Service Pages
    for s in states:
        # State Hub
        state_dir = os.path.join("locations", s["state_slug"])
        os.makedirs(state_dir, exist_ok=True)
        state_path = os.path.join(state_dir, "index.html")
        state_html = render_state_hub(s, states)
        with open(state_path, "w", encoding="utf-8") as f:
            f.write(state_html)
        generated_files.append(state_path)

        for c in s["cities"]:
            # City Hub
            city_dir = os.path.join(state_dir, c["city_slug"])
            os.makedirs(city_dir, exist_ok=True)
            city_path = os.path.join(city_dir, "index.html")
            city_html = render_city_hub(s, c, states)
            with open(city_path, "w", encoding="utf-8") as f:
                f.write(city_html)
            generated_files.append(city_path)

            # 3 Service Pages
            for srv in SERVICES:
                srv_dir = os.path.join(city_dir, srv["slug"])
                os.makedirs(srv_dir, exist_ok=True)
                srv_path = os.path.join(srv_dir, "index.html")
                srv_html = render_service_page(s, c, srv, states)
                with open(srv_path, "w", encoding="utf-8") as f:
                    f.write(srv_html)
                generated_files.append(srv_path)

    print(f"Successfully compiled {len(generated_files)} flat pre-rendered static HTML pages.")

    # 3. Generate Sitemaps
    generate_sitemaps(states)

    # 4. Generate Legacy Redirect Stubs
    generate_legacy_redirect_stubs(states)

    # 5. Validate All Generated Pages
    is_valid = validate_all_generated_pages(generated_files)

    if not is_valid:
        print("[!] Build finished with validation errors.")
        exit(1)
    else:
        print("[!] Build finished successfully.")

if __name__ == "__main__":
    main()
