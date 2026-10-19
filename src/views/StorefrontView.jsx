import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  Flame,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Mail,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  CheckCircle,
  ShoppingBag,
  Star,
  Search,
  ShoppingCart,
  User,
  Truck,
  HelpCircle,
  Globe,
  DollarSign,
  ChevronDown,
  Layers,
  LayoutDashboard
} from 'lucide-react';

// Curated 10 products per section matching the user's marketplace screenshot exactly
const FLASH_DEALS = [
  {
    id: 'fd-1',
    title: 'Vibration Plate Exercise Machine With Resistance Bands',
    price: 149.99,
    orders: 252,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80',
    platform: 'eBay'
  },
  {
    id: 'fd-2',
    title: 'Back Hyperextension Bench Machine for Men/Women Workout',
    price: 200.00,
    orders: 194,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
    platform: 'eBay'
  },
  {
    id: 'fd-3',
    title: '4-in-1 Abdominal Machine Workout Adjustable Strength',
    price: 210.00,
    orders: 310,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    platform: 'eBay'
  },
  {
    id: 'fd-4',
    title: 'DIY Travel Cable Organizer Pouch Electronic Accessories Case',
    price: 6.95,
    orders: 542,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&auto=format&fit=crop&q=80',
    platform: 'eBay'
  },
  {
    id: 'fd-5',
    title: 'Braided USB-C to USB-C Woven Cable Fast Charging 60W',
    price: 11.80,
    orders: 890,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
    platform: 'eBay'
  },
  {
    id: 'fd-6',
    title: 'Anker Soundcore 2 Portable Wireless Bluetooth Speaker',
    price: 19.99,
    orders: 1204,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80',
    platform: 'Walmart'
  },
  {
    id: 'fd-7',
    title: "Men's Casual Button Down Short Sleeve Cuban Collar Shirt",
    price: 19.10,
    orders: 642,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80',
    platform: 'eBay'
  },
  {
    id: 'fd-8',
    title: "Men's Heavy Trial Boxer Briefs Woven Athletic Shorts 3-Pack",
    price: 25.00,
    orders: 418,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80',
    platform: 'eBay'
  },
  {
    id: 'fd-9',
    title: "COOFANDY Men Casual Elastic 7\" Gym Workout Athletic Shorts",
    price: 25.28,
    orders: 829,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80',
    platform: 'Temu'
  },
  {
    id: 'fd-10',
    title: 'F320 Excavator Long Arm Grapple Hydraulic Attachment Equipment',
    price: 17500.00,
    orders: 102,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&auto=format&fit=crop&q=80',
    platform: 'eBay'
  }
];

const BEST_SELLERS = [
  {
    id: 'bs-1',
    title: 'F320 Heavy Excavator Digging Arm 360 Degree Rotation',
    price: 6800.00,
    orders: 172,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    platform: 'Heavy Duty'
  },
  {
    id: 'bs-2',
    title: 'JTG-200 Medium Loader - Heavy Duty Farm Tractor Attachment',
    price: 3900.00,
    orders: 210,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    platform: 'Heavy Duty'
  },
  {
    id: 'bs-3',
    title: 'Wireless Earbuds TWS Bluetooth 5.3 Deep Bass Headset',
    price: 4.50,
    originalPrice: 5.60,
    tag: '-20%',
    orders: 2740,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    platform: 'Electronics'
  },
  {
    id: 'bs-4',
    title: 'COB Headlight Strip 500LM Wide Angle Headlamp Sensor',
    price: 1.35,
    originalPrice: 1.59,
    tag: '-15%',
    orders: 3180,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
    platform: 'Electronics'
  },
  {
    id: 'bs-5',
    title: 'Mini Drone with 4K Dual Camera Obstacle Avoidance Quadcopter',
    price: 48.00,
    tag: 'HOT',
    orders: 760,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80',
    platform: 'Optics'
  },
  {
    id: 'bs-6',
    title: 'TPU Ultra-Slim Matte Soft Phone Case for iPhone & Samsung',
    price: 2.50,
    orders: 1140,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&auto=format&fit=crop&q=80',
    platform: 'Accessories'
  },
  {
    id: 'bs-7',
    title: '10.1 Inch WiFi Smart Cloud Picture & Digital Photo Frame HD',
    price: 354.00,
    orders: 185,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
    platform: 'Smart Home'
  },
  {
    id: 'bs-8',
    title: 'Fast 3-in-1 Foldable Magnetic Wireless Charger Station Dock',
    price: 11.10,
    orders: 640,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
    platform: 'Electronics'
  },
  {
    id: 'bs-9',
    title: '2026 Smart Watch 1.83" HD Touch Display Bluetooth Call Fitness',
    price: 31.20,
    tag: 'NEW',
    orders: 420,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    platform: 'Wearables'
  },
  {
    id: 'bs-10',
    title: '800K Smart AR Glasses AI Vision Bone Conduction Audio',
    price: 79.24,
    orders: 385,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
    platform: 'Optics'
  }
];

const TRENDING_CAMPAIGNS = [
  {
    id: 'tc-1',
    title: 'Commercial Drone 8K Professional Photography FPV Quadcopter',
    price: 90.53,
    tag: 'HOT',
    orders: 190,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-2',
    title: 'Backhoe Loader Tractor Unit Wheel Loader Arm Attachment',
    price: 395.75,
    orders: 84,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-3',
    title: 'Mini Crawler Dumper Heavy Load Track Transport Cart',
    price: 123.75,
    orders: 115,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-4',
    title: 'Q1.5 Earthmoving Machinery Machinery Front End Wheel Loader',
    price: 410.19,
    orders: 142,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-5',
    title: '6 Ton Large Crawler Hydraulic Rotary Excavator Tractor',
    price: 14250.00,
    orders: 68,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-6',
    title: 'Heavy Duty Crawler Mini Excavator Digger Construction Machine',
    price: 2096.97,
    orders: 230,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-7',
    title: 'Concrete & Farm Mixer Hydraulic Power Mini Digger System',
    price: 4148.11,
    orders: 175,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-8',
    title: 'AGT-Q23-220 Crawler Excavator Farm Orchard Compact Unit',
    price: 1217.58,
    orders: 312,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-9',
    title: '120-10 Excavator & Farm Digger Machine Engine Hydraulic',
    price: 10032.55,
    orders: 94,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  },
  {
    id: 'tc-10',
    title: 'Factory Direct 1 Ton Mini Excavator Crawler Farm Small Excavator',
    price: 1581.58,
    orders: 158,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    platform: 'Machinery'
  }
];

const NEW_ARRIVALS = [
  {
    id: 'na-1',
    title: 'Wheel Excavator Loader 4x4 Machine Multi Purpose Farm',
    price: 4280.40,
    orders: 140,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-2',
    title: 'Farm Equipment Mini Hydraulic Mini Excavator with CE',
    price: 1381.71,
    orders: 192,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-3',
    title: '2 Ton Diesel Forklift 3.0-4.5m Lift Construction Heavy Duty',
    price: 2900.01,
    orders: 168,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-4',
    title: 'Small Hydro Mini Backhoe Loader Hydraulic Arm Construction',
    price: 1821.75,
    orders: 245,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-5',
    title: 'New Hydraulic Farm Loader Arm Front End Tractor Attachment',
    price: 4012.81,
    orders: 120,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-6',
    title: 'Heavy Duty Wheel Mini Excavator Loader PTO Engine Industrial',
    price: 3367.58,
    orders: 185,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-7',
    title: 'CE/EPA Farm Mini Digger 10 15 18 Ton Crawler Electric Tractor',
    price: 7049.70,
    orders: 78,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-8',
    title: '18-35 Ton Heavy Duty Crawler Hydraulic Mini Excavator Tractor',
    price: 11446.28,
    orders: 64,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-9',
    title: 'Multi-Purpose Hydraulic Dig Excavator Construction Machine',
    price: 1406.34,
    orders: 210,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  },
  {
    id: 'na-10',
    title: 'Farm Tractor 4WD With Rotary Tiller Farm Trailer Accessories',
    price: 6648.96,
    orders: 110,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    platform: 'Equipment'
  }
];

export default function StorefrontView() {
  const {
    user,
    isLoggedIn,
    setSelectedTask,
    setModalType,
    setCurrentView,
    setDashboardTab,
    supportSettings
  } = useApp();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(1);

  const subnavCategories = [
    'All',
    'Electronics',
    'Fashion & Apparel',
    'Home & Kitchen',
    'Health & Beauty',
    'Sports & Outdoors',
    'Mobile Accessories',
    'B2B Wholesale',
    'Top Brands',
    'Campaigns',
    'Flash Deals'
  ];

  const handleProductClick = (item) => {
    if (!isLoggedIn) {
      setModalType('auth');
      return;
    }
    setSelectedTask({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      platform: item.platform || 'eBay',
      category: 'Storefront',
      commissionRate: 4.0,
      description: item.title + '. High conversion verified promotional campaign item.'
    });
    setModalType('task');
  };

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setModalType('auth');
      return;
    }
    setCartCount(prev => prev + 1);
    alert(`Added "${item.title.substring(0, 30)}..." to Cart!`);
  };

  return (
    <div className="storefront-page seox-theme animate-fade-in">
      {/* 1. TOP UTILITY STRIP matching screenshot */}
      <div className="seox-top-strip">
        <div className="seox-container strip-inner">
          <div className="strip-left">
            <span className="strip-link" onClick={() => alert('Order Tracking: Enter your transaction code or task ID in your dashboard ledger.')}>
              <Truck size={12} />
              <span>Order Tracking</span>
            </span>
            <span className="strip-sep">•</span>
            <span className="strip-link" onClick={() => alert('Help Center: Visit documentation or reach out via Live Support.')}>
              <HelpCircle size={12} />
              <span>Help Center</span>
            </span>
            <span className="strip-sep">•</span>
            <span className="strip-link" onClick={() => {
              const widgetBtn = document.getElementById('support-chat-toggle-btn') || document.querySelector('.support-chat-launcher');
              if (widgetBtn) widgetBtn.click();
              else alert('Opening Live Chat Support desk...');
            }}>
              <MessageCircle size={12} />
              <span>Live Chat</span>
            </span>
          </div>

          <div className="strip-right">
            {isLoggedIn ? (
              <span
                className="strip-link font-semibold text-emerald-400"
                onClick={() => {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                }}
              >
                <User size={12} />
                <span>Hi, {user?.name || 'Partner'} (Dashboard)</span>
              </span>
            ) : (
              <span
                className="strip-link font-semibold"
                onClick={() => setModalType('auth')}
              >
                <User size={12} />
                <span>Sign in / Join</span>
              </span>
            )}
            <span className="strip-sep">•</span>
            <span className="strip-link">
              <DollarSign size={12} />
              <span>USD ($)</span>
            </span>
            <span className="strip-sep">•</span>
            <span className="strip-link">
              <Globe size={12} />
              <span>EN 🇺🇸</span>
            </span>
            <span className="strip-sep">•</span>
            <span
              className="strip-link cart-pill"
              onClick={() => {
                if (isLoggedIn) {
                  setCurrentView('dashboard');
                  setDashboardTab('records');
                } else {
                  setModalType('auth');
                }
              }}
            >
              <ShoppingCart size={12} />
              <span>Cart ({cartCount})</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER with Search & Glowing "Become a Seller" button */}
      <header className="seox-main-header">
        <div className="seox-container header-inner">
          {/* Logo matching screenshot */}
          <div
            className="seox-logo-group"
            onClick={() => {
              setCurrentView('storefront');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="seox-logo-icon">
              <Layers size={22} />
            </div>
            <div className="seox-logo-text">
              <span className="logo-title">Ecom<span style={{ color: '#38bdf8' }}>xstocks</span></span>
            </div>
          </div>

          {/* Search Bar with category dropdown & orange button */}
          <div className="seox-search-box">
            <div className="search-category-select">
              <span>All</span>
              <ChevronDown size={14} />
            </div>
            <input
              type="text"
              placeholder="Search products, brands, or merchant stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-field"
            />
            <button
              className="seox-search-submit-btn"
              onClick={() => {
                if (!searchQuery.trim()) return;
                alert(`Searching catalog for: "${searchQuery}"`);
              }}
            >
              <Search size={15} />
              <span>Search</span>
            </button>
          </div>

          {/* Right Action Icons & Glowing "Become a Seller" Button */}
          <div className="seox-header-actions">
            <button
              className="seox-action-btn"
              title="Cart Items"
              onClick={() => {
                if (isLoggedIn) {
                  setCurrentView('dashboard');
                  setDashboardTab('records');
                } else {
                  setModalType('auth');
                }
              }}
            >
              <div className="action-icon-badge-wrap">
                <ShoppingCart size={18} />
                <span className="cart-badge-count">{cartCount}</span>
              </div>
              <span className="action-btn-label">Cart</span>
            </button>

            {isLoggedIn ? (
              <button
                className="seox-action-btn"
                title="Account Dashboard"
                onClick={() => {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                }}
              >
                <LayoutDashboard size={18} />
                <span className="action-btn-label">Dashboard</span>
              </button>
            ) : (
              <button
                className="seox-action-btn"
                title="Sign in or Register"
                onClick={() => setModalType('auth')}
              >
                <User size={18} />
                <span className="action-btn-label">Account</span>
              </button>
            )}

            <button
              className="seox-action-btn"
              title="Customer Support"
              onClick={() => {
                const widgetBtn = document.getElementById('support-chat-toggle-btn') || document.querySelector('.support-chat-launcher');
                if (widgetBtn) widgetBtn.click();
                else alert('Connecting to Ecomxstocks Official Support...');
              }}
            >
              <Headphones size={18} />
              <span className="action-btn-label">Support</span>
            </button>

            {/* Glowing Orange "Become a Seller" Button matching screenshot */}
            <button
              className="seox-become-seller-btn"
              onClick={() => {
                if (isLoggedIn) {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setModalType('auth');
                }
              }}
              title={isLoggedIn ? "Access Seller Dashboard" : "Sign In or Register as a Seller"}
            >
              <ShoppingBag size={16} />
              <span className="seller-btn-text-desktop">Become a Seller</span>
              <span className="seller-btn-text-mobile">Seller</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. CATEGORY PILLS BAR matching screenshot */}
      <nav className="seox-category-nav">
        <div className="seox-container category-nav-inner">
          {subnavCategories.map((cat) => (
            <button
              key={cat}
              className={`category-nav-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* 4. HERO SECTION: Neon Flash Sale Banner + 2 Side Cards */}
      <div className="seox-container seox-hero-section">
        {/* Main Hero Banner in deep purple/neon violet */}
        <div className="hero-banner-neon">
          <div className="banner-content">
            <div className="flash-sale-badge">
              <Sparkles size={13} />
              <span>FLASH SALE</span>
            </div>
            <h1 className="banner-title">
              E-Commerce Growth<br />
              <span className="highlight-yellow">Top Merchant Campaigns</span>
            </h1>
            <p className="banner-desc">
              Discover high-yield promotional campaigns, product rating tasks, and merchant traffic boosts across top global marketplaces.
            </p>
            <div className="banner-action-row">
              <button
                className="btn-view-deals"
                onClick={() => {
                  const el = document.getElementById('flash-deals-anchor');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>View Deals</span>
                <ArrowRight size={15} />
              </button>
              {/* Carousel indicator dots */}
              <div className="carousel-dots">
                <span className="dot active"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Cards: Become a Seller & Free Audit */}
        <div className="hero-side-column">
          <div
            className="side-banner-card seller-glow"
            onClick={() => {
              if (isLoggedIn) {
                setCurrentView('dashboard');
                setDashboardTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setModalType('auth');
              }
            }}
          >
            <div className="card-top">
              <h3>Become a Seller</h3>
              <p>For operating a store - find marketplace opportunities for your brand.</p>
            </div>
            <div className="card-action-link orange">
              <span>{isLoggedIn ? 'Go to Dashboard' : 'Start Here'}</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div
            className="side-banner-card audit-glow"
            onClick={() => {
              alert('Free Store & Traffic Audit: Comprehensive merchant ranking and product scan scheduled. Reach out via Live Support.');
            }}
          >
            <div className="card-top">
              <h3>Store Audit</h3>
              <p>Get a comprehensive sales & traffic rank analysis for your merchant store.</p>
            </div>
            <div className="card-action-link blue">
              <span>Request Now</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOUR CATALOG SECTIONS: 10 Cards each (5 across x 2 rows) */}
      <div className="seox-container catalog-container" id="flash-deals-anchor">
        {/* Section 1: Flash Deals */}
        <section className="seox-catalog-block">
          <div className="catalog-block-header">
            <div className="header-title-group">
              <Zap size={20} className="icon-orange" />
              <h2>Flash Deals</h2>
            </div>
            <button
              className="view-all-link"
              onClick={() => {
                if (isLoggedIn) {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                } else {
                  setModalType('auth');
                }
              }}
            >
              <span>View All</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="seox-product-grid">
            {FLASH_DEALS.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onClick={() => handleProductClick(item)}
                onAddToCart={(e) => handleAddToCart(e, item)}
              />
            ))}
          </div>
        </section>

        {/* Section 2: Best Sellers */}
        <section className="seox-catalog-block">
          <div className="catalog-block-header">
            <div className="header-title-group">
              <Flame size={20} className="icon-red" />
              <h2>Best Sellers</h2>
            </div>
            <button
              className="view-all-link"
              onClick={() => {
                if (isLoggedIn) {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                } else {
                  setModalType('auth');
                }
              }}
            >
              <span>View All</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="seox-product-grid">
            {BEST_SELLERS.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onClick={() => handleProductClick(item)}
                onAddToCart={(e) => handleAddToCart(e, item)}
              />
            ))}
          </div>
        </section>

        {/* Section 3: Trending Campaigns */}
        <section className="seox-catalog-block">
          <div className="catalog-block-header">
            <div className="header-title-group">
              <TrendingUp size={20} className="icon-orange" />
              <h2>Trending Campaigns</h2>
            </div>
            <button
              className="view-all-link"
              onClick={() => {
                if (isLoggedIn) {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                } else {
                  setModalType('auth');
                }
              }}
            >
              <span>View All</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="seox-product-grid">
            {TRENDING_CAMPAIGNS.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onClick={() => handleProductClick(item)}
                onAddToCart={(e) => handleAddToCart(e, item)}
              />
            ))}
          </div>
        </section>

        {/* Section 4: New Arrivals */}
        <section className="seox-catalog-block">
          <div className="catalog-block-header">
            <div className="header-title-group">
              <Sparkles size={20} className="icon-orange" />
              <h2>New Arrivals</h2>
            </div>
            <button
              className="view-all-link"
              onClick={() => {
                if (isLoggedIn) {
                  setCurrentView('dashboard');
                  setDashboardTab('home');
                } else {
                  setModalType('auth');
                }
              }}
            >
              <span>View All</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="seox-product-grid">
            {NEW_ARRIVALS.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onClick={() => handleProductClick(item)}
                onAddToCart={(e) => handleAddToCart(e, item)}
              />
            ))}
          </div>
        </section>

        {/* 6. ENTERPRISE SUPPORT & DOCUMENTATION BANNER matching screenshot */}
        <div className="seox-enterprise-support-card">
          <div className="support-top-row">
            <div className="support-badge-box">
              <div className="support-badge-icon">
                <Layers size={22} />
                <span className="badge-seox-text">ECOMXSTOCKS</span>
              </div>
              <div className="support-badge-title-group">
                <span className="tag-yellow">SUPPORT</span>
                <h3>Enterprise Support & Documentation</h3>
              </div>
            </div>
            <p className="support-subheading">
              Our dedicated integration engineers and support staff are stationed around the clock to ensure your e-commerce operations run flawlessly.
            </p>
            <div className="support-meta-pills">
              <span className="status-pill">● 24/7 Available</span>
              <span className="status-pill">● Contact & Tickets</span>
            </div>
          </div>

          <div className="support-columns-trio">
            {/* Column 1: Technical Support */}
            <div className="support-column-card">
              <div className="col-icon-circle tg">
                <MessageCircle size={20} />
              </div>
              <h4>Technical Support</h4>
              <p>Chat with our engineers directly on Telegram</p>
              <a
                href={supportSettings?.telegram || 'https://t.me/ecomxstocks_support'}
                target="_blank"
                rel="noreferrer"
                className="col-link-arrow"
              >
                <span>Chat on Telegram</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Column 2: Email Operations */}
            <div className="support-column-card">
              <div className="col-icon-circle mail">
                <Mail size={20} />
              </div>
              <h4>Email Operations</h4>
              <p>Send us an email. Response time: 2-4 business days</p>
              <a
                href="mailto:support@ecomxstocks.com"
                className="col-link-arrow"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Email Desk: support@ecomxstocks.com - Response SLA: 2-4 hours.');
                }}
              >
                <span>Send Email</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Column 3: Knowledge Base */}
            <div className="support-column-card">
              <div className="col-icon-circle kb">
                <HelpCircle size={20} />
              </div>
              <h4>Knowledge Base</h4>
              <p>Browse API documentation and integration guides</p>
              <a
                href="#docs"
                className="col-link-arrow"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Knowledge Base: Accessing Ecomxstocks API Documentation & Partner Integration Specs.');
                }}
              >
                <span>Browse Docs</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 7. FOOTER matching screenshot */}
      <footer className="seox-footer">
        <div className="seox-container footer-inner">
          <div className="footer-cols-grid">
            {/* Brand Column */}
            <div className="footer-col-brand">
              <div className="footer-logo">
                <Layers size={20} />
                <span>Ecomxstocks</span>
              </div>
              <p className="footer-desc">
                Ecomxstocks is an Enterprise E-Commerce Traffic & Task Intelligence Platform. Optimize your product ranking, amplify merchant store visibility, and execute high-yield promotional campaigns.
              </p>
              <div className="footer-social-icons">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon-btn">𝕏</a>
                <a href={supportSettings?.telegramChannel || 'https://t.me/ecomxstocks_official'} target="_blank" rel="noreferrer" className="social-icon-btn">✈</a>
              </div>
            </div>

            {/* Features */}
            <div className="footer-col">
              <h4>Features</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#integrations">Integrations</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#api">API Docs</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#press">Press</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="footer-col">
              <h4>Resources</h4>
              <ul>
                <li><a href="#faq">FAQ</a></li>
                <li>
                  <a
                    href="#chat"
                    onClick={(e) => {
                      e.preventDefault();
                      const widgetBtn = document.getElementById('support-chat-toggle-btn') || document.querySelector('.support-chat-launcher');
                      if (widgetBtn) widgetBtn.click();
                    }}
                  >
                    Support Chat
                  </a>
                </li>
                <li><a href="#trust">Trust & Security</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#cookies">Cookie Policy</a></li>
                <li><a href="#disclaimer">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-row">
            <span>© 2026 Ecomxstocks. All rights reserved.</span>
            <div className="footer-bottom-links">
              {isLoggedIn ? (
                <span
                  className="auth-link"
                  onClick={() => {
                    setCurrentView('dashboard');
                    setDashboardTab('home');
                  }}
                >
                  My Dashboard
                </span>
              ) : (
                <span className="auth-link" onClick={() => setModalType('auth')}>
                  Sign In / Sign Up
                </span>
              )}
              <span className="sep">•</span>
              <a
                href={supportSettings?.telegramChannel || 'https://t.me/ecomxstocks_official'}
                target="_blank"
                rel="noreferrer"
                className="tg-link"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Single Product Card Component
function ProductCard({ item, onClick, onAddToCart }) {
  return (
    <div className="seox-card" onClick={onClick}>
      <div className="card-thumb-wrap">
        <img src={item.image} alt={item.title} loading="lazy" />
        {item.tag && <span className={`card-ribbon ${item.tag.toLowerCase()}`}>{item.tag}</span>}
      </div>

      <div className="card-info">
        <h4 className="card-title" title={item.title}>
          {item.title}
        </h4>
        <div className="card-rating">
          <div className="stars-gold">
            {'★'.repeat(item.rating || 5)}
          </div>
          <span className="orders-label">({item.orders || 100})</span>
        </div>
        <div className="card-footer-row">
          <div className="price-display">
            <span className="current-price">${(Number(item.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {item.originalPrice && (
              <span className="original-price">${(Number(item.originalPrice) || 0).toFixed(2)}</span>
            )}
          </div>
          <button
            className="cart-action-btn"
            title="Add to Cart"
            onClick={onAddToCart}
          >
            <ShoppingCart size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
