import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  TrendingUp,
  Flame,
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
  Activity
} from 'lucide-react';

export default function StorefrontView() {
  const { tasks, setSelectedTask, setModalType, setCurrentView, setDashboardTab } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');

  // Filter tasks for sections
  const flashDeals = tasks.filter(t => t.category === 'Flash Deals');
  const bestSellers = tasks.filter(t => t.category === 'Best Sellers');
  const trending = tasks.filter(t => t.category === 'Trending Campaigns');
  const newArrivals = tasks.filter(t => t.category === 'New Arrivals');

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setModalType('task');
  };

  return (
    <div className="storefront-page animate-fade-in">
      {/* Category Pills Bar matching screenshot */}
      <div className="category-subnav">
        <div className="container subnav-container">
          {['All Categories', 'Heavy Machinery', 'Fitness & Sports', 'Electronics & Audio', 'Men\'s Fashion', 'Drones & Optics', 'Smart Home'].map((cat, idx) => (
            <button
              key={cat}
              className={`subnav-pill ${idx === 0 ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="container storefront-content">
        {/* HERO SECTION matching screenshot 1 */}
        <div className="hero-grid-section">
          {/* Main Hero Card */}
          <div className="hero-main-card">
            <div className="hero-content-wrap">
              <div className="hero-pill-badge">
                <Sparkles size={14} />
                <span>AI-Optimized</span>
              </div>
              <h1 className="hero-headline">
                Website Campaigns<br />
                <span className="hero-gradient-text">AI-Powered</span>
              </h1>
              <p className="hero-subtext">
                Discover & optimize top marketplace listings & e-commerce websites with intelligent automated solutions. Boost website visitors, engage shoppers, and track real-time task yield.
              </p>
              <div className="hero-action-buttons">
                <button
                  className="btn-hero-primary"
                  onClick={() => {
                    setCurrentView('dashboard');
                    setDashboardTab('home');
                  }}
                >
                  <span>Start Exploring</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  className="btn-hero-secondary"
                  onClick={() => {
                    setCurrentView('dashboard');
                    setDashboardTab('menu');
                  }}
                >
                  <span>VIP Tiers</span>
                </button>
              </div>
            </div>

            {/* Visual element in hero */}
            <div className="hero-floating-elements">
              <div className="floating-card c1">
                <span className="platform-tag-mini ebay">eBay</span>
                <span className="floating-rate">+4.0%</span>
              </div>
              <div className="floating-card c2">
                <span className="platform-tag-mini walmart">Walmart</span>
                <span className="floating-rate">+8.0%</span>
              </div>
              <div className="floating-card c3">
                <span className="platform-tag-mini temu">Temu</span>
                <span className="floating-rate">+12.0%</span>
              </div>
            </div>
          </div>

          {/* Right Side Cards */}
          <div className="hero-side-cards">
            {/* Become a Seller card */}
            <div className="side-card seller-card">
              <div className="side-card-top">
                <span className="side-badge">Website Merchant Portal</span>
                <h3>Become a Website Seller</h3>
                <p>Distribute products across high-traffic task pools with guaranteed website visitor engagement.</p>
              </div>
              <a
                href="#seller"
                className="side-card-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Website Merchant Onboarding: Please submit your store API or product feed to seller@devsynx.com');
                }}
              >
                <span>Learn More</span>
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Free Audit card */}
            <div className="side-card audit-card">
              <div className="side-card-top">
                <span className="side-badge blue">Website Diagnostics</span>
                <h3>Free Website Audit</h3>
                <p>Run a full algorithm scan to uncover website search positioning gaps and conversion velocity.</p>
              </div>
              <a
                href="#audit"
                className="side-card-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Free Website Audit: 100% complimentary campaign health report generated for your listings.');
                }}
              >
                <span>Request a Free Audit</span>
                <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* 1. FLASH DEALS SECTION matching Screenshot 1 */}
        <section className="catalog-section mt-8">
          <div className="section-header">
            <div className="section-title-wrap">
              <Zap size={20} color="#ff7200" />
              <h2>Flash Deals</h2>
            </div>
            <button
              className="view-more-link"
              onClick={() => {
                setCurrentView('dashboard');
                setDashboardTab('home');
              }}
            >
              <span>View All</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="product-cards-grid">
            {flashDeals.map((task) => (
              <ProductCard key={task.id} task={task} onSelect={handleTaskClick} />
            ))}
          </div>
        </section>

        {/* 2. BEST SELLERS SECTION matching Screenshot 1 */}
        <section className="catalog-section mt-8">
          <div className="section-header">
            <div className="section-title-wrap">
              <Flame size={20} color="#e53238" />
              <h2>Best Sellers</h2>
            </div>
            <button
              className="view-more-link"
              onClick={() => {
                setCurrentView('dashboard');
                setDashboardTab('home');
              }}
            >
              <span>View All</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="product-cards-grid">
            {bestSellers.map((task) => (
              <ProductCard key={task.id} task={task} onSelect={handleTaskClick} />
            ))}
          </div>
        </section>

        {/* 3. TRENDING CAMPAIGNS SECTION matching Screenshot 1 */}
        <section className="catalog-section mt-8">
          <div className="section-header">
            <div className="section-title-wrap">
              <TrendingUp size={20} color="#2563eb" />
              <h2>Trending Campaigns</h2>
            </div>
            <button
              className="view-more-link"
              onClick={() => {
                setCurrentView('dashboard');
                setDashboardTab('home');
              }}
            >
              <span>View All</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="product-cards-grid">
            {trending.map((task) => (
              <ProductCard key={task.id} task={task} onSelect={handleTaskClick} />
            ))}
          </div>
        </section>

        {/* 4. NEW ARRIVALS SECTION matching Screenshot 1 */}
        <section className="catalog-section mt-8">
          <div className="section-header">
            <div className="section-title-wrap">
              <Sparkles size={20} color="#0071dc" />
              <h2>New Arrivals</h2>
            </div>
            <button
              className="view-more-link"
              onClick={() => {
                setCurrentView('dashboard');
                setDashboardTab('home');
              }}
            >
              <span>View All</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="product-cards-grid">
            {newArrivals.map((task) => (
              <ProductCard key={task.id} task={task} onSelect={handleTaskClick} />
            ))}
          </div>
        </section>

        {/* ENTERPRISE SUPPORT & DOCUMENTATION CARD matching Screenshot 1 */}
        <div className="support-banner-card mt-10">
          <div className="support-card-header">
            <div className="support-brand-badge">
              <div className="support-logo-box">
                <ShieldCheck size={28} color="#ffffff" />
              </div>
              <div className="support-brand-text">
                <span className="brand-pill-yellow">SUPPORT</span>
                <h3>Enterprise Support & Documentation</h3>
              </div>
            </div>
            <p className="support-header-desc">
              Our specialized operations desk coordinates with global ad servers and TRON blockchain nodes to ensure seamless task execution and prompt payouts.
            </p>
          </div>

          <div className="support-channels-grid mt-6">
            <div className="support-col-card">
              <div className="channel-icon-pill tg">
                <MessageCircle size={22} />
              </div>
              <h4>Telegram Support</h4>
              <p>Direct priority channel with 24/7 operations and real-time announcements.</p>
              <a
                href="https://t.me/websynx_support"
                target="_blank"
                rel="noreferrer"
                className="channel-action-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Redirecting to official verified Telegram channel: @WebSynx_Support');
                }}
              >
                <span>Join Official Channel</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="support-col-card">
              <div className="channel-icon-pill mail">
                <Mail size={22} />
              </div>
              <h4>Email Escalations</h4>
              <p>Enterprise service desk with guaranteed &lt;2 hour SLA response times.</p>
              <a
                href="mailto:support@devsynx.com"
                className="channel-action-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Opening direct mail ticket to: support@devsynx.com');
                }}
              >
                <span>Open Priority Ticket</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="support-col-card">
              <div className="channel-icon-pill hub">
                <Headphones size={22} />
              </div>
              <h4>Resolution Hub</h4>
              <p>Transparent dispute management, balance auditing and compliance documentation.</p>
              <a
                href="#resolution"
                className="channel-action-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Opening Resolution Hub & Policy Center.');
                }}
              >
                <span>Visit Resolution Hub</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER matching Screenshot 1 */}
      <footer className="storefront-footer mt-12">
        <div className="container footer-container">
          <div className="footer-top-grid">
            <div className="footer-brand-col">
              <div className="footer-logo">
                <TrendingUp size={22} color="#2563eb" />
                <span className="footer-brand-name">Web<strong>Synx</strong></span>
              </div>
              <p className="footer-about">
                Decentralized website promotion marketplace empowering digital sellers and users with automated commission distribution and verifiable task integrity.
              </p>
              <div className="footer-compliance-note">
                <ShieldCheck size={14} />
                <span>Simulated website promotional task execution. TRC20 wallet ledger architecture.</span>
              </div>
            </div>

            <div className="footer-links-col">
              <h4>Platforms</h4>
              <ul>
                <li><a href="#ebay">eBay Website Campaigns</a></li>
                <li><a href="#walmart">Walmart Merchant Hub</a></li>
                <li><a href="#temu">Temu Top-Tier Tasks</a></li>
                <li><a href="#amazon">Shopify & Amazon Feeds</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Services</h4>
              <ul>
                <li><a href="#audit">AI Website Audit</a></li>
                <li><a href="#task-engine">Task Engine API</a></li>
                <li><a href="#trc20">USDT TRC20 Gateway</a></li>
                <li><a href="#vip">VIP Membership Club</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Resources</h4>
              <ul>
                <li><a href="#docs">Platform Documentation</a></li>
                <li><a href="#apk">Android APK Guide</a></li>
                <li><a href="#faq">Frequently Asked Questions</a></li>
                <li><a href="#security">Security Whitepaper</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Legal & AML</h4>
              <ul>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#kyc">AML / KYC Compliance</a></li>
                <li><a href="#disclaimer">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>© 2026 WebSynx. Engineered by DEVSYNX Private Limited. All rights reserved.</span>
            <div className="footer-badge-wrap">
              <span className="badge-tech">TRON TRC20</span>
              <span className="badge-tech">SSL 256-Bit</span>
              <span className="badge-tech">DEVSYNX Suite</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Reusable Product / Task Card matching Screenshot 1
function ProductCard({ task, onSelect }) {
  return (
    <div className="product-card" onClick={() => onSelect(task)}>
      <div className="product-img-box">
        <img src={task.image} alt={task.title} loading="lazy" />
        <span className={`platform-tag ${(task?.platform || 'ebay').toLowerCase()}`}>
          {task?.platform || 'eBay'}
        </span>
        {task?.tag && <span className="product-ribbon">{task.tag}</span>}
      </div>

      <div className="product-body">
        <h4 className="product-title" title={task?.title}>
          {task?.title}
        </h4>
        <div className="product-rating-row">
          <div className="stars-mini">
            {'★'.repeat(5)}
          </div>
          <span className="orders-count">{(task?.orders || 0).toLocaleString()} orders</span>
        </div>

        <div className="product-price-row">
          <div className="price-tag">
            <span className="price-val">${(Number(task?.price) || 0).toFixed(2)}</span>
          </div>
          <button className="product-action-btn" title="Start Task Rating">
            <Zap size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
