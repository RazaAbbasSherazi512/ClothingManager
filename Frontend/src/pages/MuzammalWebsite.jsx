import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const C = {
  blue: '#1e25b8',
  indigo: '#3228b2',
  purple: '#9e3898',
  magenta: '#be3d90',
  pillGrad: 'linear-gradient(90deg, #b83d92 0%, #6d34b2 55%, #2a27b5 100%)',
  cardGrad: 'linear-gradient(180deg, rgba(64, 34, 74, 0.72) 0%, rgba(145, 52, 138, 0.80) 52%, rgba(44, 42, 178, 0.92) 100%)',
  badgeGrad: 'linear-gradient(135deg, #be3d90 0%, #3228b2 100%)',
  heroGrad: 'linear-gradient(135deg, rgba(65, 76, 198, 0.88) 0%, rgba(139, 98, 186, 0.82) 50%, rgba(196, 122, 170, 0.84) 100%)',
  lightBg: '#f6f7fb',
};

const PROCESS_STEPS = [
  {
    num: '01',
    title: 'Knitting',
    img: '/images/factory-craft.jpg',
    desc: 'Our skilled knitters use state-of-the-art G8, G9 & 12-gauge machines to create the foundation of our products. They ensure:',
    bullets: [
      { icon: '⚙️', text: 'Precision 12G & G9 Flatbed Knitting.' },
      { icon: '🧵', text: 'Uniform Stitch Density & Softness.' },
      { icon: '📐', text: 'Accurate GSM & Fabric Recovery.' },
      { icon: '✔️', text: 'Zero-Defect Base Fabric Output.' },
    ],
  },
  {
    num: '02',
    title: 'Lab Testing',
    img: '/images/fabric-palette.jpg',
    desc: 'Our commitment to quality extends to rigorous yarn and fabric testing before bulk production begins. We focus on:',
    bullets: [
      { icon: '🔬', text: 'Shrinkage & Pilling Resistance Checks.' },
      { icon: '🎨', text: 'Colorfastness & Wash Durability.' },
      { icon: '⚖️', text: 'Tensile Strength & Elasticity Tests.' },
      { icon: '✔️', text: 'Verified Grade-A Yarn Batches.' },
    ],
  },
  {
    num: '03',
    title: 'Dyeing',
    img: '/images/fabric-palette.jpg',
    desc: 'We add vibrant colors to fabrics through a meticulous dyeing process that prioritizes quality and sustainability. Key aspects include:',
    bullets: [
      { icon: '💧', text: 'High-Quality Colorfast Dyes.' },
      { icon: '🌿', text: 'Eco-Friendly & Skin-Safe Practices.' },
      { icon: '🔄', text: 'Consistent Shade Application.' },
      { icon: '✔️', text: 'Rigorous Batch Color Testing.' },
    ],
  },
  {
    num: '04',
    title: 'Embroidery',
    img: '/images/hero-knitwear.jpg',
    desc: 'Our cutting and detailing process uses advanced machinery and skilled technicians to ensure minute precision. Key aspects include:',
    bullets: [
      { icon: '⚙️', text: 'State-of-the-Art Precision Machinery.' },
      { icon: '👷', text: 'Professionally Skilled Technicians.' },
      { icon: '🔍', text: 'Critical Quality Inspection Lens.' },
      { icon: '📊', text: 'Keen Thread Count & Pattern Grading.' },
    ],
  },
  {
    num: '05',
    title: 'Stitching',
    img: '/images/collection-knitwear.jpg',
    desc: 'Stitching is the art of bringing our fabrics together to create the final product. Our skilled artisans ensure:',
    bullets: [
      { icon: '🔍', text: 'Inspections: Gala, Pocket & Moda.' },
      { icon: '🧵', text: 'Overlock Safety & Kaj-Button Finish.' },
      { icon: '👍', text: 'Quality Assurance: Exact Sizing.' },
      { icon: '✔️', text: 'Final Approval: Ensuring Excellence.' },
    ],
  },
  {
    num: '06',
    title: 'Checking',
    img: '/images/factory-craft.jpg',
    desc: 'We thoroughly inspect each product before pressing and packaging to guarantee quality. Key aspects include:',
    bullets: [
      { icon: '🔍', text: 'Precise Tension for Optimal Fit.' },
      { icon: '🪡', text: 'Expert Rafo Mending & Finishing.' },
      { icon: '👍', text: 'Consistent Patterns and Designs.' },
      { icon: '✔️', text: 'Adherence to Export Safety Standards.' },
    ],
  },
  {
    num: '07',
    title: 'Packing',
    img: '/images/hero-knitwear.jpg',
    desc: 'Industrial steam pressing and lot-wise carton packing ensure every shipment arrives retail-ready. Key aspects include:',
    bullets: [
      { icon: '♨️', text: 'Industrial Steam Pressing Finish.' },
      { icon: '🏷️', text: 'Custom Brand Tags & Lot Barcodes.' },
      { icon: '📦', text: 'Moisture-Safe Bulk Carton Packing.' },
      { icon: '🚚', text: 'On-Time Wholesale & Export Dispatch.' },
    ],
  },
];

const PRODUCTS = [
  { id: 1, name: '12G-Plain Jersey', desc: 'Soft, smooth, and breathable 12-gauge knit.', tag: '12-Gauge', img: '/images/hero-knitwear.jpg' },
  { id: 2, name: '12G-Raiza Pullover', desc: 'Micro-textured warmth and lasting durability.', tag: 'Winter Line', img: '/images/collection-knitwear.jpg' },
  { id: 3, name: 'Short Jarsy Knit', desc: 'Stretchy and comfortable everyday jersey.', tag: 'G9 / G8', img: '/images/fabric-palette.jpg' },
  { id: 4, name: 'Tube + Doray Knit', desc: 'Soft, seamless tubular comfort and fit.', tag: 'Rib Series', img: '/images/hero-knitwear.jpg' },
  { id: 5, name: 'Belt Ribbed Knit', desc: 'Durable double-ribbed hem and cuff fit.', tag: 'Tailored', img: '/images/collection-knitwear.jpg' },
  { id: 6, name: 'Sando Knit Vests', desc: 'Lightweight, flexible, and breathable.', tag: 'All-Season', img: '/images/fabric-palette.jpg' },
  { id: 7, name: 'Knitted Fabric', desc: 'Super soft, stretchable, and cozy.', tag: 'Custom GSM', img: '/images/factory-craft.jpg' },
  { id: 8, name: 'Custom Export Lots', desc: 'Durable, private-label, and long-lasting.', tag: 'Bulk Supply', img: '/images/collection-knitwear.jpg' },
];

const APPARELS = [
  {
    title: 'Mens',
    img: '/images/hero-knitwear.jpg',
    desc: "We make men's knitwear and hosiery from sustainable materials, stylishly and comfortably. Eco-friendly designs for casual and everyday wear.",
  },
  {
    title: 'Womens',
    img: '/images/collection-knitwear.jpg',
    desc: "Our women's apparel combines comfort with fashion-forward designs. Made from soft, breathable knitted fabrics, these pieces are perfect for any occasion.",
  },
  {
    title: 'Kids',
    img: '/images/fabric-palette.jpg',
    desc: "Our kids' clothing line is super comfortable, eco-friendly, durable, and playful — crafted with soft cotton blends perfect for active little ones.",
  },
];

const CERTIFICATIONS = [
  { code: 'ISO 9001', sub: 'Quality Management' },
  { code: 'OEKO-TEX®', sub: 'Standard 100' },
  { code: 'Global Recycled', sub: 'Standard' },
  { code: 'amfori BSCI', sub: 'Trade with Purpose' },
  { code: 'COTTON', sub: 'Made in Pakistan' },
  { code: 'ERP VERIFIED', sub: 'Lot Traceability' },
];

const BLOGS = [
  {
    id: 1,
    day: '09',
    month: 'Oct',
    category: 'Clothing',
    title: 'Go Green with Our Eco-Friendly Textiles: Stylish Options for Everyone',
    excerpt:
      'Everyone is concerned about the environment these days, so going green is not a fad but a way of life. And that is precisely what our company is all about.',
    fullText:
      'At Muzammal Hosiery, sustainability begins with selecting responsible cotton blends, minimizing cutting waste, and using skin-safe colorfast dyes that extend garment life season after season.',
    img: '/images/fabric-palette.jpg',
  },
  {
    id: 2,
    day: '15',
    month: 'Nov',
    category: 'Apparels',
    title: '12-Gauge vs G9 Knitting: Choosing the Right Jersey for Your Collection',
    excerpt:
      'Explore how gauge selection affects warmth, drape, and durability across 12G-Plain, 12G-Raiza, and Short Jarsy wholesale production lots.',
    fullText:
      'Our 12-gauge flatbed machines produce refined, lightweight winter jerseys ideal for modern retail brands, while our G9 machines craft warm, structured knits built for high-volume everyday wear.',
    img: '/images/collection-knitwear.jpg',
  },
  {
    id: 3,
    day: '20',
    month: 'Nov',
    category: 'Manufacturers',
    title: 'Inside Our 7-Stage Production Process & Digital Lot Accountability',
    excerpt:
      'At Muzammal Hosiery, we follow a meticulous 7-stage process from knitting to steam pressing — tracked end-to-end inside our Clothing Management ERP.',
    fullText:
      'Every lot number is tracked digitally across Knitting, Cutting, Stitching, Safety Overlock, Kaj-Button, Rafo Mending, and Pressing — ensuring transparent wages and on-time delivery.',
    img: '/images/factory-craft.jpg',
  },
];

export default function MuzammalWebsite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);
  const [processOffset, setProcessOffset] = useState(0);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [inquiry, setInquiry] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    product: '12G-Plain Jersey',
    quantity: '',
    message: '',
  });
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 360);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setOpenMenu(null);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openQuoteFor = (productName) => {
    setInquiry(prev => ({ ...prev, product: productName }));
    setInquirySent(false);
    scrollTo('contact');
  };

  const handleWhatsApp = () => {
    const text = [
      '*MUZAMMAL HOSIERY — WHOLESALE INQUIRY*',
      `Name: ${inquiry.name || 'Buyer'}`,
      inquiry.company ? `Company: ${inquiry.company}` : null,
      inquiry.phone ? `Phone: ${inquiry.phone}` : null,
      `Product: ${inquiry.product}`,
      inquiry.quantity ? `Quantity: ${inquiry.quantity} pcs` : null,
      inquiry.message ? `Message: ${inquiry.message}` : null,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Show 4 process cards at a time like screenshot #2, cycling through all 7
  const visibleProcessCards = Array.from({ length: 4 }, (_, i) => PROCESS_STEPS[(processOffset + i) % PROCESS_STEPS.length]);

  return (
    <div style={st.page} onClick={() => openMenu && setOpenMenu(null)}>
      {/* ── Floating White Pill Navbar (Exact Match to Screenshots 1–4) ── */}
      <div style={st.floatingNavWrap}>
        <header style={st.pillNavbar}>
          {/* Brand Logo with Colorful Rainbow-Style Arc */}
          <div style={st.logoWrap} onClick={() => scrollTo('home')}>
            <div style={st.logoArcWrap}>
              <div style={st.logoArc} />
              <div style={st.logoBrandSmall}>MUZAMMAL HOSIERY</div>
              <div style={st.logoSubSmall}>Pvt. Ltd.</div>
            </div>
          </div>

          {/* Center Links */}
          <nav style={st.navLinks} onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => scrollTo('home')} style={st.navLink}>Home</button>
            <button type="button" onClick={() => scrollTo('about')} style={st.navLink}>About Us</button>

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setOpenMenu(m => (m === 'apparels' ? null : 'apparels'))}
                style={st.navLink}
              >
                Apparels ⌄
              </button>
              {openMenu === 'apparels' && (
                <div style={st.dropdown}>
                  {['Mens', 'Womens', 'Kids'].map(cat => (
                    <button key={cat} type="button" onClick={() => scrollTo('apparels')} style={st.dropItem}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setOpenMenu(m => (m === 'products' ? null : 'products'))}
                style={st.navLink}
              >
                Knitwear ⌄
              </button>
              {openMenu === 'products' && (
                <div style={st.dropdown}>
                  {PRODUCTS.map(p => (
                    <button key={p.id} type="button" onClick={() => scrollTo('products')} style={st.dropItem}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={() => scrollTo('process')} style={st.navLink}>Our Process</button>
            <button type="button" onClick={() => scrollTo('certifications')} style={st.navLink}>Certifications</button>
            <button type="button" onClick={() => scrollTo('blogs')} style={st.navLink}>Blogs</button>
            <button type="button" onClick={() => scrollTo('contact')} style={st.navLink}>Contact</button>
          </nav>

          {/* Right Circle Icons + Download Catalogue Pill + ERP Login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              title={user ? 'Open ERP Dashboard' : 'Staff ERP Login'}
              style={st.circleIconBtn}
            >
              {user ? '📊' : '🔐'}
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              title="WhatsApp Muzammal Hosiery"
              style={st.circleIconBtn}
            >
              💬
            </button>
            <button
              type="button"
              onClick={() => setShowCatalogue(true)}
              style={st.downloadPillBtn}
            >
              Download Catalogue ⬇
            </button>
          </div>
        </header>
      </div>

      {/* ── 1. HERO SECTION (Exact Match to Screenshot 1) ── */}
      <section id="home" style={st.hero}>
        <img src="/images/hero-knitwear.jpg" alt="Muzammal Hosiery" style={st.heroBgImg} />
        <div style={st.heroOverlay} />

        {/* Subtle Centered Brand Watermark Arc (matching Screenshot 1) */}
        <div style={st.heroWatermark} aria-hidden="true">
          <div style={st.watermarkArc} />
          <div style={st.watermarkTitle}>MUZAMMAL HOSIERY</div>
          <div style={st.watermarkSub}>Knitwear &amp; Garments</div>
          <div style={st.watermarkUrl}>www.muzammalhosiery.com</div>
        </div>

        <div style={st.heroContent}>
          <h1 style={st.heroH1}>
            We Create Quality<br />Product Experiences
          </h1>
          <p style={st.heroSubtitle}>
            Welcome to Muzammal Hosiery — Your trusted textile partner. Where Color Meets Comfort.
            Your One-Stop Manufacturing House for Stylish 12-Gauge Jerseys, Knitwear &amp; Apparels!
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => scrollTo('products')} style={st.heroPillBtn}>
              Explore More →
            </button>
            <button
              type="button"
              onClick={() => scrollTo('process')}
              title="See Our Production Process"
              style={st.heroPlayBtn}
            >
              ▶
            </button>
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              style={st.heroErpOutline}
            >
              {user ? 'Open ERP Dashboard →' : 'Staff ERP Login →'}
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. CERTIFICATIONS STRIP (Exact Match to Screenshot 1 & 2) ── */}
      <section id="certifications" style={st.certSection}>
        <div style={st.container}>
          <h2 style={st.blueHeading}>Certifications</h2>
          <p style={st.centerSub}>
            Muzammal Hosiery is committed to maintaining the highest standards in the industry.
            Our certifications reflect our dedication to quality and excellence.
          </p>
          <div style={st.certRow}>
            {CERTIFICATIONS.map(cert => (
              <div key={cert.code} style={st.certItem}>
                <div style={st.certItemCode}>{cert.code}</div>
                <div style={st.certItemSub}>{cert.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PRODUCTION PROCESS SECTION (Exact Match to Screenshot 2) ── */}
      <section id="process" style={st.processSection}>
        <div style={st.container}>
          <h2 style={st.blueHeading}>Production Process Of Knitwear &amp; Hosiery</h2>
          <p style={st.centerSub}>
            At Muzammal Hosiery, we offer 12-gauge jerseys, ribbed knitwear, and stylish attires for all.
            Each piece is made from quality materials for comfort and lasting durability.
          </p>

          <div style={st.processCardsGrid}>
            {visibleProcessCards.map((step) => (
              <div key={step.num} style={st.processCard}>
                <img src={step.img} alt={step.title} style={st.processCardBg} />
                <div style={st.processCardOverlay} />

                <div style={st.processCardBody}>
                  <div style={st.stepCircle}>{step.num}</div>
                  <h3 style={st.processCardTitle}>{step.title}</h3>
                  <p style={st.processCardDesc}>{step.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {step.bullets.map(b => (
                      <div key={b.text} style={st.processBullet}>
                        <span style={{ fontSize: 13 }}>{b.icon}</span>
                        <span>{b.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Right Arrow Connector (Exact Match to Screenshot 2) */}
                <button
                  type="button"
                  onClick={() => setProcessOffset(o => (o + 1) % PROCESS_STEPS.length)}
                  title="Next Production Stage"
                  style={st.processConnectorBtn}
                >
                  →
                </button>
              </div>
            ))}
          </div>

          {/* Stage Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {PROCESS_STEPS.map((s, idx) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setProcessOffset(idx)}
                style={{
                  width: idx === processOffset ? 28 : 9,
                  height: 9,
                  borderRadius: 999,
                  border: 'none',
                  background: idx === processOffset ? C.pillGrad : '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. ABOUT MUZAMMAL HOSIERY + OUR VISION (Exact Match to Screenshot 3) ── */}
      <section id="about" style={st.aboutSection}>
        <div style={st.container}>
          <div style={st.aboutGrid}>
            {/* Left Photo with Blue Border + Overlapping Purple Experience Square */}
            <div style={st.aboutPhotoWrap}>
              <div style={st.aboutPhotoFrame}>
                <img src="/images/factory-craft.jpg" alt="Muzammal Hosiery Knitting Machines" style={st.aboutPhoto} />
              </div>
              <div style={st.expBox}>
                <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>15+</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 6, lineHeight: 1.35 }}>
                  Years of experience<br />in the industry
                </div>
              </div>
            </div>

            {/* Right Corporate Copy */}
            <div>
              <h2 style={{ ...st.blueHeading, textAlign: 'left', marginBottom: 14 }}>
                About Muzammal Hosiery
              </h2>
              <p style={st.aboutP}>
                <strong>Muzammal Hosiery</strong> is a leading knitwear and garment manufacturer in Pakistan.
                We pride ourselves on producing high-quality knitted jerseys, ribbed pullovers, sando vests,
                and everyday apparel for wholesale distributors, retail brands, and export partners. Our
                commitment to quality is unwavering, ensuring customer satisfaction with every order.
              </p>
              <p style={st.aboutP}>
                At Muzammal Hosiery, we believe in building exceptional experiences through quality products.
                Our journey begins with you!
              </p>

              <h3 style={{ fontSize: 22, fontWeight: 800, color: C.blue, margin: '22px 0 10px' }}>
                Our Vision
              </h3>
              <p style={st.aboutP}>
                To establish Muzammal Hosiery as the premier garments manufacturer producing international-standard
                quality knitwear with on-time delivery to customers. We believe in growing our clothing factory
                while never cutting corners on lasting quality.
              </p>

              <button
                type="button"
                onClick={() => scrollTo('products')}
                style={{ ...st.downloadPillBtn, marginTop: 10, padding: '11px 24px', fontSize: 14 }}
              >
                Explore More →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. BOOSTING PRODUCTIVITY & QUALITY BANNER (Exact Match to Screenshot 4) ── */}
      <section style={st.productivitySection}>
        <img src="/images/factory-craft.jpg" alt="Production Floor" style={st.prodBgImg} />
        <div style={st.prodOverlay} />

        <div style={st.prodContainer}>
          <div style={st.prodGrid}>
            <div style={{ paddingRight: 16 }}>
              <h2 style={st.prodTitle}>
                Boosting<br />Productivity &amp;<br />Quality
              </h2>
              <p style={st.prodSub}>
                Muzammal Hosiery&apos;s enthusiastic team strives to improve market productivity and enhance
                quality day by day!
              </p>
            </div>

            {[
              { num: '6', label: 'Departments', desc: 'Integrated units for knitting, cutting, stitching, overlock, rafo & QA.' },
              { num: '100+', label: 'Skilled Artisans', desc: 'Experienced workforce across shifts delivering quality at speed.' },
              { num: '12G & G9', label: 'Knitting Fleet', desc: 'Precision flatbed machinery with eco-friendly yarn processes.' },
              { num: '50,000+', label: 'Pieces / Season', desc: 'High-volume knitwear lots tracked digitally in our ERP.' },
            ].map(stat => (
              <div key={stat.label} style={st.prodStatCol}>
                <div style={st.prodStatNum}>{stat.num}</div>
                <div style={st.prodStatLabel}>{stat.label}</div>
                <div style={st.prodStatDesc}>{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. KNITWEAR & HOSIERY SHOWCASE (8 Cards) ── */}
      <section id="products" style={st.sectionWhite}>
        <div style={st.container}>
          <h2 style={st.blueHeading}>Knitwear &amp; Hosiery</h2>
          <p style={st.centerSub}>
            Our assortment of knitwear and hosiery is designed and manufactured with export quality.
            With refined fits, high-end yarn blends, and optimal comfort for year-round wear.
          </p>

          <div style={st.productGrid}>
            {PRODUCTS.map(p => (
              <div key={p.id} style={st.productCard}>
                <div style={st.productImgWrap}>
                  <img src={p.img} alt={p.name} style={st.productImg} />
                  <span style={st.productTag}>{p.tag}</span>
                </div>
                <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: C.blue, margin: '0 0 6px' }}>{p.name}</h3>
                  <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.55, margin: '0 0 14px', flex: 1 }}>{p.desc}</p>
                  <button type="button" onClick={() => openQuoteFor(p.name)} style={st.productLink}>
                    Request Quote →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. APPARELS SECTION (Mens | Womens | Kids) ── */}
      <section id="apparels" style={st.sectionLight}>
        <div style={st.container}>
          <h2 style={st.blueHeading}>Apparels</h2>
          <p style={st.centerSub}>
            Explore our men, women, and kids apparel collections made for comfort, style, and everyday use.
          </p>

          <div style={st.apparelGrid}>
            {APPARELS.map(a => (
              <div key={a.title} style={st.apparelCard}>
                <div style={st.apparelImgWrap}>
                  <img src={a.img} alt={a.title} style={st.apparelImg} />
                  <div style={st.apparelOverlay}>
                    <h3 style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', margin: 0 }}>{a.title}</h3>
                  </div>
                </div>
                <div style={{ padding: '20px 22px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: '0 0 18px', flex: 1 }}>{a.desc}</p>
                  <button
                    type="button"
                    onClick={() => openQuoteFor(`${a.title} Apparel Collection`)}
                    style={{ ...st.downloadPillBtn, width: '100%', padding: '10px 16px' }}
                  >
                    Explore {a.title} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. WHY CHOOSE US + CEO MESSAGE ── */}
      <section style={st.sectionWhite}>
        <div style={st.container}>
          <div style={st.ceoGrid}>
            <div style={st.ceoImgFrame}>
              <img src="/images/ceo-portrait.jpg" alt="CEO Muzammal Hosiery" style={st.ceoImg} />
            </div>
            <div>
              <div style={st.kicker}>WHY CHOOSE US • LEADERSHIP</div>
              <h2 style={{ ...st.blueHeading, textAlign: 'left', marginBottom: 10 }}>CEO Message</h2>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.purple, margin: '0 0 14px' }}>
                Quality You Can Count On
              </h3>
              <p style={st.aboutP}>
                “Our goal is to exceed your expectations with every fabric and knitted garment we offer. At
                <strong> Muzammal Hosiery</strong>, every lot is crafted by skilled artisans and tracked digitally
                from yarn bag to final steam-pressed dispatch — ensuring honest craftsmanship, fair wages, and
                unmatched value for our partners.”
              </p>
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.blue }}>Managing Director</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Muzammal Hosiery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. LEARN ABOUT OUR LATEST BLOGS ── */}
      <section id="blogs" style={st.sectionLight}>
        <div style={st.container}>
          <h2 style={st.blueHeading}>Learn about Our Latest Blogs</h2>
          <p style={st.centerSub}>
            At Muzammal Hosiery, we follow a meticulous process to ensure the highest quality in every product we deliver.
          </p>

          <div style={st.blogGrid}>
            {BLOGS.map(b => (
              <div key={b.id} style={st.blogCard}>
                <div style={st.blogImgWrap}>
                  <img src={b.img} alt={b.title} style={st.blogImg} />
                  <div style={st.blogDate}>
                    <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>{b.day}</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{b.month}</div>
                  </div>
                </div>
                <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.purple, textTransform: 'uppercase', marginBottom: 6 }}>
                    {b.category}
                  </span>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#14132a', lineHeight: 1.4, margin: '0 0 10px' }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, margin: '0 0 16px', flex: 1 }}>{b.excerpt}</p>
                  <button type="button" onClick={() => setSelectedBlog(b)} style={st.productLink}>
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. SUBSCRIBE & MESSAGE US BANNER ── */}
      <section id="contact" style={st.contactSection}>
        <div style={st.container}>
          <div style={st.newsletterBar}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', margin: '0 0 6px' }}>
                Subscribe to Our Newsletter
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, margin: 0 }}>
                Stay updated with Muzammal Hosiery&apos;s latest knitwear catalogs and wholesale releases.
              </p>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (newsletterEmail) setNewsletterDone(true);
              }}
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
            >
              {newsletterDone ? (
                <div style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '10px 18px', borderRadius: 999, fontWeight: 700, fontSize: 13.5 }}>
                  ✅ Subscribed! Thank you.
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email..."
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    style={st.newsletterInput}
                  />
                  <button type="submit" style={st.newsletterBtn}>Subscribe →</button>
                </>
              )}
            </form>
          </div>

          <div style={st.contactGrid}>
            <div style={{ color: '#ffffff' }}>
              <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 12px' }}>Message Us</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14.5, lineHeight: 1.7, marginBottom: 20 }}>
                Need bulk knitwear pricing, sample lots, or custom manufacturing? Send a message directly to
                <strong> Muzammal Hosiery</strong>.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={st.contactPill}>🏭 Muzammal Hosiery — Knitwear &amp; Garment Manufacturing</div>
                <div style={st.contactPill}>📦 Bulk Wholesale • Custom Sizing • Private Label</div>
                <div style={st.contactPill}>
                  🔐 Internal Staff?{' '}
                  <button
                    type="button"
                    onClick={() => navigate(user ? '/dashboard' : '/login')}
                    style={{ background: 'none', border: 'none', color: '#fde68a', fontWeight: 800, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  >
                    Open ERP Portal →
                  </button>
                </div>
              </div>
            </div>

            <div style={st.formCard}>
              {inquirySent ? (
                <div style={{ textAlign: 'center', padding: '20px 8px' }}>
                  <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
                  <h4 style={{ fontSize: 20, fontWeight: 800, color: C.blue, margin: '0 0 8px' }}>Inquiry Ready!</h4>
                  <p style={{ fontSize: 13.5, color: '#475569', marginBottom: 18 }}>
                    Thank you, <strong>{inquiry.name}</strong>. Send your inquiry on WhatsApp for an immediate reply.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button type="button" onClick={handleWhatsApp} style={st.whatsappBtn}>💬 Send on WhatsApp</button>
                    <button type="button" onClick={() => setInquirySent(false)} style={st.outlineBtn}>New Message</button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setInquirySent(true);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 11 }}
                >
                  <div style={st.formRow2}>
                    <input style={st.formInput} required placeholder="Your Name *" value={inquiry.name} onChange={e => setInquiry({ ...inquiry, name: e.target.value })} />
                    <input style={st.formInput} placeholder="Company / Shop" value={inquiry.company} onChange={e => setInquiry({ ...inquiry, company: e.target.value })} />
                  </div>
                  <div style={st.formRow2}>
                    <input style={st.formInput} required placeholder="Phone / WhatsApp *" value={inquiry.phone} onChange={e => setInquiry({ ...inquiry, phone: e.target.value })} />
                    <input style={st.formInput} type="email" placeholder="Email Address" value={inquiry.email} onChange={e => setInquiry({ ...inquiry, email: e.target.value })} />
                  </div>
                  <div style={st.formRow2}>
                    <select style={st.formInput} value={inquiry.product} onChange={e => setInquiry({ ...inquiry, product: e.target.value })}>
                      {PRODUCTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <input style={st.formInput} type="number" min="1" placeholder="Quantity (pcs)" value={inquiry.quantity} onChange={e => setInquiry({ ...inquiry, quantity: e.target.value })} />
                  </div>
                  <textarea style={{ ...st.formInput, minHeight: 74, resize: 'vertical' }} placeholder="Order requirements, sizes, colors..." value={inquiry.message} onChange={e => setInquiry({ ...inquiry, message: e.target.value })} />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="submit" style={{ ...st.downloadPillBtn, flex: 1, padding: '11px 18px', fontSize: 13.5 }}>Send Message →</button>
                    <button type="button" onClick={handleWhatsApp} style={st.whatsappBtn}>💬 WhatsApp</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. CORPORATE FOOTER ── */}
      <footer style={st.footer}>
        <div style={st.container}>
          <div style={st.footerGrid}>
            <div>
              <div style={st.logoArcWrap}>
                <div style={st.logoArc} />
                <div style={{ ...st.logoBrandSmall, color: '#ffffff' }}>MUZAMMAL HOSIERY</div>
                <div style={{ ...st.logoSubSmall, color: '#cbd5e1' }}>Pvt. Ltd.</div>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginTop: 12 }}>
                Where Color Meets Comfort — Vertically integrated knitwear and garment manufacturing house in Pakistan.
              </p>
            </div>

            <div>
              <h3 style={st.footerHead}>Links</h3>
              <div style={st.footerCol}>
                <button type="button" onClick={() => scrollTo('home')} style={st.footerLink}>Home</button>
                <button type="button" onClick={() => scrollTo('about')} style={st.footerLink}>About Us</button>
                <button type="button" onClick={() => scrollTo('apparels')} style={st.footerLink}>Apparels</button>
                <button type="button" onClick={() => scrollTo('products')} style={st.footerLink}>Knitwear &amp; Hosiery</button>
                <button type="button" onClick={() => scrollTo('process')} style={st.footerLink}>Our Process</button>
                <button type="button" onClick={() => scrollTo('blogs')} style={st.footerLink}>Blogs</button>
              </div>
            </div>

            <div>
              <h3 style={st.footerHead}>Get in touch</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
                <div><strong>Managing Director</strong> — Muzammal Hosiery</div>
                <div><strong>Wholesale &amp; Export Sales Desk</strong></div>
                <button
                  type="button"
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  style={{ ...st.footerLink, color: '#f0abfc', fontWeight: 700, marginTop: 4 }}
                >
                  🔐 {user ? 'Open ERP Dashboard →' : 'Staff & Admin ERP Login →'}
                </button>
              </div>
            </div>

            <div>
              <h3 style={st.footerHead}>Our Location</h3>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65, margin: '0 0 12px' }}>
                Muzammal Hosiery Manufacturing Unit<br />
                Garments &amp; Knitwear Industrial Area, Pakistan
              </p>
              <button type="button" onClick={() => setShowCatalogue(true)} style={st.downloadPillBtn}>
                Download Catalogue ⬇
              </button>
            </div>
          </div>

          <div style={st.footerBottom}>
            <span>Copyrights © {new Date().getFullYear()} Muzammal Hosiery | All Rights Reserved</span>
            <span>Powered by Muzammal Hosiery Clothing Management ERP</span>
          </div>
        </div>
      </footer>

      {/* ── Floating Scroll-to-Top White Circle Button (Exact Match to Screenshot 3 & 4) ── */}
      {showTopBtn && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to top"
          style={st.scrollTopBtn}
        >
          ↑
        </button>
      )}

      {/* ── Blog Reader Modal ── */}
      {selectedBlog && (
        <div style={st.modalOverlay} onClick={() => setSelectedBlog(null)}>
          <div style={st.modalCard} onClick={e => e.stopPropagation()}>
            <div style={st.modalHead}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fde68a', textTransform: 'uppercase' }}>
                  {selectedBlog.category} • {selectedBlog.day} {selectedBlog.month}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>{selectedBlog.title}</div>
              </div>
              <button type="button" onClick={() => setSelectedBlog(null)} style={st.modalClose}>✕</button>
            </div>
            <img src={selectedBlog.img} alt={selectedBlog.title} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '22px 24px', fontSize: 14.5, color: '#334155', lineHeight: 1.75 }}>{selectedBlog.fullText}</div>
            <div style={st.modalFoot}>
              <button type="button" onClick={() => setSelectedBlog(null)} style={st.downloadPillBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Catalogue Modal ── */}
      {showCatalogue && (
        <div style={st.modalOverlay} onClick={() => setShowCatalogue(false)}>
          <div style={st.modalCard} onClick={e => e.stopPropagation()}>
            <div style={st.modalHead}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>📥 Muzammal Hosiery — Product Catalogue</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 2 }}>
                  Knitwear, Hosiery &amp; Apparel Specifications ({new Date().getFullYear()})
                </div>
              </div>
              <button type="button" onClick={() => setShowCatalogue(false)} style={st.modalClose}>✕</button>
            </div>
            <div style={{ padding: '18px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.lightBg, textAlign: 'left' }}>
                    <th style={{ padding: 10, color: C.blue }}>Product</th>
                    <th style={{ padding: 10, color: C.blue }}>Specification</th>
                    <th style={{ padding: 10, color: C.blue }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCTS.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 10, fontWeight: 700, color: '#14132a' }}>{p.name}</td>
                      <td style={{ padding: 10, color: C.purple, fontWeight: 700 }}>{p.tag}</td>
                      <td style={{ padding: 10, color: '#475569' }}>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={st.modalFoot}>
              <button type="button" onClick={() => window.print()} style={st.downloadPillBtn}>🖨️ Print / Save PDF</button>
              <button type="button" onClick={() => { setShowCatalogue(false); scrollTo('contact'); }} style={st.whatsappBtn}>Request Quote</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const st = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    color: '#14132a',
    fontFamily: "'Segoe UI', Inter, system-ui, -apple-system, sans-serif",
    overflowX: 'hidden',
  },
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },

  // Floating White Pill Navbar (Exact Match to Screenshots 1-4)
  floatingNavWrap: {
    position: 'fixed',
    top: 14,
    left: 0,
    right: 0,
    zIndex: 200,
    padding: '0 16px',
    pointerEvents: 'none',
  },
  pillNavbar: {
    pointerEvents: 'auto',
    maxWidth: 1140,
    margin: '0 auto',
    background: '#ffffff',
    borderRadius: 999,
    padding: '8px 18px 8px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    boxShadow: '0 10px 32px rgba(30, 37, 184, 0.16)',
    border: '1px solid rgba(50, 40, 178, 0.08)',
    flexWrap: 'wrap',
  },
  logoWrap: { cursor: 'pointer', display: 'flex', alignItems: 'center' },
  logoArcWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 },
  logoArc: {
    width: 68,
    height: 16,
    borderRadius: '68px 68px 0 0',
    background: 'linear-gradient(90deg, #f97316 0%, #ef4444 25%, #be3d90 50%, #3228b2 75%, #06b6d4 100%)',
    marginBottom: 3,
  },
  logoBrandSmall: { fontSize: 9.5, fontWeight: 900, color: '#14132a', letterSpacing: '0.04em' },
  logoSubSmall: { fontSize: 8, fontWeight: 700, color: '#475569', marginTop: 1 },
  navLinks: { display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  navLink: {
    background: 'none',
    border: 'none',
    color: '#1e293b',
    fontSize: 13,
    fontWeight: 600,
    padding: '7px 9px',
    borderRadius: 999,
    cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    left: 0,
    minWidth: 195,
    background: '#ffffff',
    borderRadius: 14,
    padding: 6,
    boxShadow: '0 16px 36px rgba(30, 37, 184, 0.16)',
    border: '1px solid #e5e7eb',
    zIndex: 300,
    display: 'flex',
    flexDirection: 'column',
  },
  dropItem: {
    background: 'none',
    border: 'none',
    textAlign: 'left',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
    cursor: 'pointer',
  },
  circleIconBtn: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: 'none',
    background: C.badgeGrad,
    color: '#ffffff',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(50, 40, 178, 0.28)',
  },
  downloadPillBtn: {
    background: C.pillGrad,
    color: '#ffffff',
    border: 'none',
    borderRadius: 999,
    padding: '9px 18px',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(158, 56, 152, 0.32)',
    whiteSpace: 'nowrap',
  },
  outlineBtn: {
    background: '#ffffff',
    border: `1.5px solid ${C.indigo}`,
    color: C.indigo,
    borderRadius: 999,
    padding: '9px 18px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },

  // Hero (Exact Match to Screenshot 1)
  hero: {
    position: 'relative',
    minHeight: '88vh',
    display: 'flex',
    alignItems: 'center',
    padding: '130px 24px 80px',
    overflow: 'hidden',
    background: '#4b55c7',
  },
  heroBgImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.25,
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: C.heroGrad,
  },
  heroWatermark: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    opacity: 0.22,
    userSelect: 'none',
  },
  watermarkArc: {
    width: 340,
    height: 95,
    borderRadius: '340px 340px 0 0',
    background: 'linear-gradient(90deg, #f97316 0%, #ef4444 25%, #be3d90 50%, #3228b2 75%, #06b6d4 100%)',
    marginBottom: 14,
  },
  watermarkTitle: { fontSize: 'clamp(2rem, 5vw, 3.6rem)', fontWeight: 900, color: '#14132a', letterSpacing: '0.06em' },
  watermarkSub: { fontSize: 22, fontWeight: 700, color: '#14132a', marginTop: 4 },
  watermarkUrl: { fontSize: 20, fontWeight: 600, color: '#14132a', marginTop: 22, letterSpacing: '0.04em' },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 1140,
    width: '100%',
    margin: '0 auto',
  },
  heroH1: {
    fontSize: 'clamp(2.4rem, 5vw, 4rem)',
    fontWeight: 900,
    color: '#ffffff',
    lineHeight: 1.08,
    margin: '0 0 18px',
    letterSpacing: '-0.02em',
    textShadow: '0 4px 24px rgba(20, 19, 42, 0.2)',
  },
  heroSubtitle: {
    fontSize: 'clamp(0.98rem, 1.3vw, 1.15rem)',
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 590,
    lineHeight: 1.65,
    margin: '0 0 28px',
  },
  heroPillBtn: {
    background: C.pillGrad,
    color: '#ffffff',
    border: '1.5px solid rgba(255,255,255,0.35)',
    borderRadius: 999,
    padding: '11px 24px',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 22px rgba(50, 40, 178, 0.35)',
  },
  heroPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.45)',
    background: C.badgeGrad,
    color: '#ffffff',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 18px rgba(50, 40, 178, 0.3)',
  },
  heroErpOutline: {
    background: 'rgba(255,255,255,0.16)',
    color: '#ffffff',
    border: '1.5px solid rgba(255,255,255,0.45)',
    borderRadius: 999,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
  },

  // Headings
  blueHeading: {
    fontSize: 'clamp(1.75rem, 3vw, 2.35rem)',
    fontWeight: 900,
    color: C.blue,
    textAlign: 'center',
    margin: '0 0 12px',
    letterSpacing: '-0.015em',
  },
  centerSub: {
    fontSize: 14.5,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 680,
    margin: '0 auto 38px',
    lineHeight: 1.65,
  },
  kicker: {
    fontSize: 11.5,
    fontWeight: 800,
    color: C.purple,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Certifications
  certSection: { padding: '64px 0 56px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' },
  certRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
  },
  certItem: {
    background: C.lightBg,
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '18px 14px',
    textAlign: 'center',
  },
  certItemCode: { fontSize: 15, fontWeight: 900, color: C.blue },
  certItemSub: { fontSize: 11.5, color: '#64748b', marginTop: 4, fontWeight: 600 },

  // Production Process Cards (Exact Match to Screenshot 2)
  processSection: { padding: '78px 0', background: '#ffffff' },
  processCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
    gap: 22,
  },
  processCard: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'visible',
    minHeight: 375,
    boxShadow: '0 14px 32px rgba(44, 42, 178, 0.16)',
  },
  processCardBg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 18,
  },
  processCardOverlay: {
    position: 'absolute',
    inset: 0,
    background: C.cardGrad,
    borderRadius: 18,
  },
  processCardBody: {
    position: 'relative',
    zIndex: 2,
    padding: '24px 22px 26px',
    color: '#ffffff',
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: C.badgeGrad,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
  },
  processCardTitle: { fontSize: 22, fontWeight: 900, color: '#ffffff', margin: '0 0 10px' },
  processCardDesc: { fontSize: 12.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, margin: '0 0 16px' },
  processBullet: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12.5,
    fontWeight: 600,
    color: '#ffffff',
    lineHeight: 1.4,
  },
  processConnectorBtn: {
    position: 'absolute',
    right: -14,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 5,
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: '#ffffff',
    border: `2px solid ${C.purple}`,
    color: C.blue,
    fontWeight: 900,
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(30, 37, 184, 0.2)',
  },

  // About Section (Exact Match to Screenshot 3)
  aboutSection: { padding: '86px 0', background: C.lightBg },
  aboutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 48,
    alignItems: 'center',
  },
  aboutPhotoWrap: { position: 'relative', paddingBottom: 24, paddingLeft: 12 },
  aboutPhotoFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    border: `2px solid ${C.indigo}`,
    boxShadow: '0 18px 42px rgba(30, 37, 184, 0.14)',
  },
  aboutPhoto: { width: '100%', height: 390, objectFit: 'cover', display: 'block' },
  expBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    background: C.badgeGrad,
    color: '#ffffff',
    borderRadius: 16,
    padding: '20px 24px',
    minWidth: 165,
    boxShadow: '0 14px 32px rgba(50, 40, 178, 0.35)',
  },
  aboutP: { fontSize: 14.5, color: '#334155', lineHeight: 1.75, margin: '0 0 14px' },

  // Boosting Productivity & Quality Banner (Exact Match to Screenshot 4)
  productivitySection: {
    position: 'relative',
    padding: '88px 0',
    overflow: 'hidden',
    background: '#1c1b52',
  },
  prodBgImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.42,
  },
  prodOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(64, 42, 108, 0.72) 0%, rgba(30, 32, 140, 0.90) 100%)',
  },
  prodContainer: { position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  prodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
    gap: 24,
    alignItems: 'center',
  },
  prodTitle: { fontSize: 'clamp(1.85rem, 3vw, 2.5rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.15, margin: '0 0 12px' },
  prodSub: { fontSize: 13.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, margin: 0 },
  prodStatCol: {
    borderLeft: '1px solid rgba(255,255,255,0.25)',
    paddingLeft: 20,
  },
  prodStatNum: { fontSize: 30, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 },
  prodStatLabel: { fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginTop: 6, marginBottom: 8 },
  prodStatDesc: { fontSize: 12.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 },

  // Products & Apparels
  sectionWhite: { padding: '80px 0', background: '#ffffff' },
  sectionLight: { padding: '80px 0', background: C.lightBg },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 },
  productCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 16px rgba(30, 37, 184, 0.05)',
  },
  productImgWrap: { position: 'relative', height: 180, overflow: 'hidden' },
  productImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  productTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    background: C.pillGrad,
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: 999,
  },
  productLink: {
    alignSelf: 'flex-start',
    background: 'none',
    border: 'none',
    color: C.blue,
    fontWeight: 800,
    fontSize: 13.5,
    cursor: 'pointer',
    padding: 0,
  },
  apparelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 },
  apparelCard: {
    background: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    boxShadow: '0 8px 24px rgba(30, 37, 184, 0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  apparelImgWrap: { position: 'relative', height: 220, overflow: 'hidden' },
  apparelImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  apparelOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 35%, rgba(30, 37, 184, 0.82) 100%)',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '20px 22px',
  },

  // CEO
  ceoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 44,
    alignItems: 'center',
  },
  ceoImgFrame: {
    borderRadius: 20,
    overflow: 'hidden',
    border: `2px solid ${C.purple}`,
    boxShadow: '0 16px 38px rgba(30, 37, 184, 0.12)',
  },
  ceoImg: { width: '100%', height: 360, objectFit: 'cover', display: 'block' },

  // Blogs
  blogGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 },
  blogCard: {
    background: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 16px rgba(30, 37, 184, 0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  blogImgWrap: { position: 'relative', height: 195, overflow: 'hidden' },
  blogImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  blogDate: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    background: C.badgeGrad,
    color: '#ffffff',
    borderRadius: 10,
    padding: '7px 12px',
    textAlign: 'center',
  },

  // Contact
  contactSection: { background: C.pillGrad, padding: '74px 0' },
  newsletterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    paddingBottom: 38,
    marginBottom: 38,
    borderBottom: '1px solid rgba(255,255,255,0.22)',
  },
  newsletterInput: {
    padding: '11px 16px',
    borderRadius: 999,
    border: 'none',
    fontSize: 13.5,
    minWidth: 250,
    outline: 'none',
  },
  newsletterBtn: {
    padding: '11px 22px',
    borderRadius: 999,
    border: 'none',
    background: '#14132a',
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 36, alignItems: 'start' },
  contactPill: {
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 12,
    padding: '11px 16px',
    fontSize: 13.5,
    fontWeight: 600,
    color: '#ffffff',
  },
  formCard: { background: '#ffffff', borderRadius: 18, padding: 24, boxShadow: '0 20px 44px rgba(20,19,42,0.24)' },
  formRow2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 },
  formInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 9,
    border: '1px solid #cbd5e1',
    fontSize: 13.5,
    color: '#14132a',
    background: '#f8fafc',
    outline: 'none',
    fontFamily: 'inherit',
  },
  whatsappBtn: {
    padding: '10px 18px',
    borderRadius: 999,
    border: 'none',
    background: '#16a34a',
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 800,
    cursor: 'pointer',
  },

  // Footer
  footer: { background: '#111024', color: '#94a3b8', padding: '56px 0 26px' },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 30,
    paddingBottom: 32,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  footerHead: { fontSize: 15, fontWeight: 800, color: '#ffffff', margin: '0 0 14px' },
  footerCol: { display: 'flex', flexDirection: 'column', gap: 9 },
  footerLink: { background: 'none', border: 'none', color: '#cbd5e1', fontSize: 13, textAlign: 'left', padding: 0, cursor: 'pointer' },
  footerBottom: { paddingTop: 22, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 12.5 },

  // Scroll to top button
  scrollTopBtn: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 250,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#14132a',
    fontSize: 18,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(30, 37, 184, 0.2)',
  },

  // Modals
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(17, 16, 36, 0.72)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modalCard: { background: '#ffffff', borderRadius: 18, width: '100%', maxWidth: 660, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' },
  modalHead: { background: C.pillGrad, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalClose: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 14 },
  modalFoot: { padding: '14px 24px', borderTop: '1px solid #e5e7eb', background: C.lightBg, display: 'flex', gap: 10, justifyContent: 'flex-end' },
};
