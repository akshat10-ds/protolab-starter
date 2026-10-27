"""Create local sample agreements and render their pages for the prototype.

Requires reportlab and pypdfium2. These are fictional document fixtures, not
production agreements. Re-run after changing their content to keep PDFs and
preview images in sync.
"""
import json
from pathlib import Path
from xml.sax.saxutils import escape

import pypdfium2 as pdfium
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public" / "template-previews"
DEST.mkdir(parents=True, exist_ok=True)

# Document typography is part of the PDF fixture, independent of application UI.
STYLES = {
    "eyebrow": ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=9,
                              leading=13, textColor=colors.HexColor("#555555"), spaceAfter=18),
    "title": ParagraphStyle("title", fontName="Times-Bold", fontSize=27,
                            leading=31, spaceAfter=14),
    "intro": ParagraphStyle("intro", fontName="Times-Roman", fontSize=11,
                            leading=16, spaceAfter=20),
    "heading": ParagraphStyle("heading", fontName="Helvetica-Bold", fontSize=10,
                              leading=14, spaceBefore=14, spaceAfter=7),
    "body": ParagraphStyle("body", fontName="Times-Roman", fontSize=10.5,
                           leading=15.5, spaceAfter=10, alignment=TA_LEFT),
}

DOCUMENTS = [
    {
        "slug": "non-disclosure-agreement", "title": "Partner Preview NDA",
        "eyebrow": "FIRST PIXEL STUDIO  /  LEGAL",
        "intro": "MUTUAL CONFIDENTIALITY AGREEMENT<br/><br/>Project: Partner product preview<br/>Effective date: [Date]<br/>Between: First Pixel Studio and [Company name]<br/>Prepared by: Akshat Mishra",
        "pages": [
            [
                ("1. Purpose", "The parties wish to evaluate a potential product collaboration. During the partner preview, each party may disclose confidential information. This agreement establishes the conditions under which that information may be shared and used."),
                ("2. Confidential information", "Confidential information includes business plans, product designs, technical specifications, pricing, financial information, customer information, and other non-public materials identified as confidential or reasonably understood to be confidential."),
                ("3. Obligations of the receiving party", "The receiving party will use the information only to evaluate the proposed relationship, protect it with reasonable care, and disclose it only to representatives who need access for that purpose and are subject to confidentiality obligations."),
                ("4. Exclusions", "These obligations do not apply to information that is publicly available, already known without restriction, independently developed, or lawfully received from another source without a confidentiality obligation."),
                ("5. Required disclosure", "If disclosure is required by law, the receiving party will give prompt notice where permitted and limit the disclosure to the information legally required."),
            ],
            [
                ("6. Term and return of information", "This agreement begins on the effective date and continues for two years. On written request, each party will return or destroy confidential materials, except copies required for legal or archival purposes. Confidentiality obligations continue for three years after disclosure."),
                ("7. No license or commitment", "All confidential information remains the property of the disclosing party. No intellectual property license is granted, and neither party is required to enter into a further agreement or transaction."),
                ("8. General terms", "Any changes must be agreed in writing. This agreement is the entire understanding between the parties concerning the confidential information described above. The parties will specify the governing law before using a final agreement."),
                ("Acknowledged and agreed", "For First Pixel Studio<br/><br/>Signature: ______________________________<br/>Name: [Authorized representative]<br/>Title: [Title]<br/>Date: [Date]<br/><br/>For [Company name]<br/><br/>Signature: ______________________________<br/>Name: [Authorized representative]<br/>Title: [Title]<br/>Date: [Date]"),
            ],
        ],
    },
    {
        "slug": "service-agreement", "title": "Design & Build Agreement",
        "eyebrow": "FIRST PIXEL STUDIO  /  PROFESSIONAL SERVICES",
        "intro": "MASTER SERVICES AGREEMENT<br/><br/>Project: Product design and launch<br/>Client: [Client company]<br/>Provider: First Pixel Studio<br/>Effective date: [Date]<br/>Prepared by: Akshat Mishra",
        "pages": [
            [
                ("1. Engagement", "The client engages the provider to deliver professional services described in an agreed statement of work. Each statement of work will identify the scope, deliverables, schedule, fees, and responsible contacts."),
                ("2. Scope of services", "Services include discovery, interface design, reusable components, implementation, and handoff. Work outside the agreed scope requires a written change order approved by both parties before additional services begin."),
                ("3. Responsibilities", "The provider will perform the services with reasonable skill and care. The client will provide timely access to the information, systems, personnel, and decisions reasonably needed to complete the work."),
                ("4. Fees and payment", "Fees and expenses will be set out in each statement of work. Invoices are payable within thirty days of receipt, subject to any good-faith dispute communicated promptly in writing. Expenses require prior approval."),
                ("5. Delivery and acceptance", "The provider will deliver completed work for review against the agreed acceptance criteria. The client will provide consolidated feedback within the review period specified in the statement of work."),
            ],
            [
                ("6. Intellectual property", "Each party retains its pre-existing intellectual property. Ownership and permitted use of project deliverables will be described in the statement of work, including any third-party materials or reusable provider tools."),
                ("7. Confidentiality", "Each party will protect confidential information received in connection with the services, use it only to perform this agreement, and restrict access to authorized personnel who need it for that purpose."),
                ("8. Term and termination", "This agreement continues until terminated in accordance with its terms. Either party may terminate a statement of work for a material breach that remains unresolved after written notice and a reasonable opportunity to cure."),
                ("9. Changes and communications", "The designated project contacts will coordinate delivery and document changes to scope, milestones, or fees. No change is effective until approved in writing by both parties."),
                ("10. General terms", "The parties are independent contractors. Any applicable limitations of liability, warranties, insurance, dispute resolution, and governing law must be reviewed and completed before executing a final agreement."),
                ("Agreement details", "Statement of work: AM-2026-001<br/>Client contact: [Name and email]<br/>Provider contact: Akshat Mishra<br/>Project start: [Date]<br/>Project end: [Date]"),
            ],
            [
                ("Schedule A - Statement of work", "Project: Product design and launch<br/><br/>Objectives: Align the product experience with the agreed business and user needs.<br/><br/>Deliverables: Discovery summary, interface designs, reusable components, implementation, and handoff notes.<br/><br/>Milestones: Initial concepts, review, implementation, and final handoff.<br/><br/>Fees: [Amount and billing schedule]<br/><br/>Acceptance criteria: [Describe how completion is confirmed]"),
                ("Authorized signatures", "For [Client company]<br/><br/>Signature: ______________________________<br/>Name: [Authorized representative]<br/>Title: [Title]<br/>Date: [Date]<br/><br/>For First Pixel Studio<br/><br/>Signature: ______________________________<br/>Name: [Authorized representative]<br/>Title: [Title]<br/>Date: [Date]"),
            ],
        ],
    },
    {
        "slug": "offer-letter", "title": "Design Team Offer Letter",
        "eyebrow": "FIRST PIXEL STUDIO  /  PEOPLE TEAM",
        "intro": "PRIVATE AND CONFIDENTIAL<br/><br/>Role: Product Designer<br/>Prepared by: Akshat Mishra<br/>[Date]<br/>[Candidate name]<br/><br/>Dear [Candidate first name],",
        "pages": [[
            ("Welcome to First Pixel Studio", "We are pleased to offer you the position of Product Designer, reporting to [Manager name]. Your anticipated start date is [Start date], and your primary work location will be [Location]. We look forward to the care and perspective you will bring, from early concepts to the final interaction."),
            ("Compensation and benefits", "Your base compensation will be [Amount] per [Pay period], payable in accordance with the company's regular payroll practices. Details of any applicable bonus, equity, benefits, and time-off programs will be provided separately for your review."),
            ("Next steps", "Please review this offer and the accompanying employment materials. Any conditions of the offer, employment terms, required policies, and applicable local provisions must be completed and reviewed before a final offer is issued."),
            ("Acceptance", "To indicate your acceptance, please sign and return this letter by [Response date]. If you have questions, contact [People team contact].<br/><br/>Sincerely,<br/>[Hiring manager name]<br/>[Title], First Pixel Studio<br/><br/>Candidate signature: ______________________________<br/>Printed name: [Candidate name]<br/>Date: [Date]"),
        ]],
    },
]


def footer(canvas, doc, total):
    canvas.setStrokeColor(colors.HexColor("#D6D6D6"))
    canvas.line(54, 45, 558, 45)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawString(54, 31, "SAMPLE AGREEMENT - PROTOTYPE USE ONLY - CRAFTED BY AKSHAT MISHRA")
    canvas.drawRightString(558, 31, f"{doc.page} / {total}")


manifest = []
for document in DOCUMENTS:
    slug = document["slug"]
    pdf_path = DEST / f"{slug}.pdf"
    total = len(document["pages"])
    story = []
    for index, sections in enumerate(document["pages"]):
        if index:
            story.append(PageBreak())
        story.append(Paragraph(document["eyebrow"], STYLES["eyebrow"]))
        story.append(Paragraph(escape(document["title"]), STYLES["title"]))
        if index == 0:
            story.append(Paragraph(document["intro"], STYLES["intro"]))
        else:
            story.append(Spacer(1, 5))
        for heading, text in sections:
            story.append(Paragraph(heading, STYLES["heading"]))
            story.append(Paragraph(text, STYLES["body"]))
    doc = SimpleDocTemplate(str(pdf_path), pagesize=(612, 792),
                            leftMargin=54, rightMargin=54, topMargin=48,
                            bottomMargin=65, title=document["title"],
                            author="Akshat Mishra - ProtoLab sample library")
    draw_footer = lambda canvas, current_doc, pages=total: footer(canvas, current_doc, pages)
    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)
    pdf = pdfium.PdfDocument(str(pdf_path))
    assert len(pdf) == total, f"Unexpected overflow in {slug}: {len(pdf)} pages"
    for page_number, page in enumerate(pdf):
        page.render(scale=1.5).to_pil().save(DEST / f"{slug}-{page_number + 1}.png", optimize=True)
    manifest.append({"slug": slug, "title": document["title"], "pageCount": total,
                     "pdf": f"/template-previews/{slug}.pdf",
                     "pages": [f"/template-previews/{slug}-{i + 1}.png" for i in range(total)]})

(DEST / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps(manifest, indent=2))
