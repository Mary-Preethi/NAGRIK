'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface QuoteItem {
  id: string;
  name: string;
  title: string;
  imageSrc: string;
  quote: string;
  accent: string;
}

const HISTORICAL_VOICES: QuoteItem[] = [
  {
    id: 'kalam',
    name: 'DR. A. P. J. ABDUL KALAM',
    title: '11th President of India · Aerospace Scientist & Visionary',
    imageSrc: '/images/leaders/kalam.jpg',
    quote: 'When ignited minds work and perform with indomitable spirit, prosperous, happy and safe India is assured.',
    accent: '#ea580c',
  },
  {
    id: 'ambedkar',
    name: 'DR. B. R. AMBEDKAR',
    title: 'Chief Architect of the Constitution of India',
    imageSrc: '/images/leaders/ambedkar.jpg',
    quote: 'Educate, Agitate, Organise. We are Indians, firstly and lastly.',
    accent: '#ea580c',
  },
  {
    id: 'bharathiyar',
    name: 'SUBRAMANIA BHARATI',
    title: 'Mahakavi Bharathiyar · Poet of Freedom & Social Awakening',
    imageSrc: '/images/leaders/bharathiyar.jpg',
    quote: 'If even a single citizen in this world is left without sustenance, we shall remake the universe.',
    accent: '#ea580c',
  },
  {
    id: 'bhagat_singh',
    name: 'BHAGAT SINGH',
    title: 'Freedom Fighter & Revolutionary Patriot',
    imageSrc: '/images/leaders/bhagat_singh.jpg',
    quote: 'They may kill me, but they cannot kill my ideas. They can crush my body, but not my spirit.',
    accent: '#ea580c',
  },
  {
    id: 'vivekananda',
    name: 'SWAMI VIVEKANANDA',
    title: 'Monk, Philosopher & Spiritual Leader',
    imageSrc: '/images/leaders/vivekananda.jpg',
    quote: 'Arise, awake, and stop not till the goal is reached.',
    accent: '#ea580c',
  },
  {
    id: 'tagore',
    name: 'RABINDRANATH TAGORE',
    title: 'Gurudev · Nobel Laureate & Polymath',
    imageSrc: '/images/leaders/tagore.jpg',
    quote: 'Where the mind is without fear and the head is held high; into that heaven of freedom, let my country awake.',
    accent: '#ea580c',
  },
  {
    id: 'savitribai',
    name: 'SAVITRIBAI PHULE',
    title: 'Pioneer of Women’s Education & Social Equality in India',
    imageSrc: '/images/leaders/savitribai.jpg',
    quote: 'Educate your mind and stand upright. Awake, arise, and educate to break the shackles of subjugation.',
    accent: '#ea580c',
  },
  {
    id: 'bose',
    name: 'NETAJI SUBHASH CHANDRA BOSE',
    title: 'Leader of the Indian National Army · Revolutionary Patriot',
    imageSrc: '/images/leaders/bose.jpg',
    quote: 'Freedom is not given, it is taken. One individual may die for an idea, but that idea will live in a thousand lives.',
    accent: '#ea580c',
  },
];

export default function StorytellingQuoteReel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HISTORICAL_VOICES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const current = HISTORICAL_VOICES[activeIndex];

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev === 0 ? HISTORICAL_VOICES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % HISTORICAL_VOICES.length);
  };

  return (
    <div
      style={{
        position: 'relative',
        maxWidth: '1020px',
        margin: '0 auto',
        padding: '0 3.5rem',
      }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Left Navigation Arrow Button */}
      <button
        onClick={handlePrev}
        className="carousel-nav-btn"
        style={{
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: '#FCFBF8',
          border: '1.5px solid #fed7aa',
          color: '#ea580c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.08)',
          cursor: 'pointer',
          zIndex: 10,
        }}
        aria-label="Previous quote"
      >
        <ChevronLeft size={22} />
      </button>

      {/* Right Navigation Arrow Button */}
      <button
        onClick={handleNext}
        className="carousel-nav-btn"
        style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: '#FCFBF8',
          border: '1.5px solid #fed7aa',
          color: '#ea580c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.08)',
          cursor: 'pointer',
          zIndex: 10,
        }}
        aria-label="Next quote"
      >
        <ChevronRight size={22} />
      </button>

      {/* Main Quote Card with Fixed Geometry */}
      <div
        style={{
          background: '#FCFBF8',
          borderRadius: '24px',
          border: '1.5px solid #fed7aa',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '270px 1fr',
          minHeight: '290px',
          height: '290px',
          position: 'relative',
        }}
      >
        {/* Subtle Decorative India Gate Monument Sketch Outline on Right */}
        <div
          style={{
            position: 'absolute',
            right: '25px',
            bottom: '0',
            opacity: 0.14,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <svg width="190" height="200" viewBox="0 0 100 100" fill="none" stroke="#0f172a" strokeWidth="1.2">
            <rect x="25" y="40" width="50" height="55" rx="2" />
            <path d="M40 95 V65 C40 55 60 55 60 65 V95" />
            <rect x="20" y="32" width="60" height="8" rx="1" />
            <path d="M30 32 L35 22 H65 L70 32" />
            <rect x="35" y="16" width="30" height="6" />
          </svg>
        </div>

        {/* Left: Fixed Image Frame for Leader Portrait */}
        <div
          style={{
            width: '270px',
            height: '290px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            position: 'relative',
            zIndex: 2,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '220px',
              height: '220px',
              minWidth: '220px',
              minHeight: '220px',
              maxWidth: '220px',
              maxHeight: '220px',
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#FCFBF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              key={`img-${current.id}`}
              src={current.imageSrc}
              alt={current.name}
              className="animate-portrait-entry"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Right: Quote Content with Fixed Internal Structure */}
        <div
          style={{
            height: '290px',
            padding: '2rem 3rem 2rem 1rem',
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Top Pill Badge */}
          <div style={{ marginBottom: '0.6rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#ea580c',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              <span>☼</span>
              <span>THE CONSTITUTIONAL & MORAL HORIZON</span>
            </span>
          </div>

          {/* Orange Quote Mark Icon */}
          <div style={{ color: '#ea580c', lineHeight: '1', marginBottom: '0.15rem' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', fontWeight: 900 }}>“</span>
          </div>

          {/* Quote Text Container with Fixed Height Allocation */}
          <div
            style={{
              minHeight: '76px',
              maxHeight: '76px',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.85rem',
            }}
          >
            <blockquote
              key={`quote-${current.id}`}
              className="animate-quote-entry"
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.25rem, 1.8vw, 1.55rem)',
                lineHeight: '1.4',
                fontStyle: 'italic',
                color: '#0f172a',
                fontWeight: 500,
              }}
            >
              {current.quote}”
            </blockquote>
          </div>

          {/* Leader Name & Designation */}
          <div key={`meta-${current.id}`} className="animate-quote-entry">
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#ea580c',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '0.15rem',
              }}
            >
              {current.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
              {current.title}
            </div>
          </div>
        </div>
      </div>

      {/* Dots Indicator (Directly below the card) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '1.5rem',
        }}
      >
        {HISTORICAL_VOICES.map((v, idx) => (
          <button
            key={v.id}
            onClick={() => {
              setIsAutoPlaying(false);
              setActiveIndex(idx);
            }}
            className="carousel-dot-btn"
            style={{
              width: activeIndex === idx ? '10px' : '8px',
              height: activeIndex === idx ? '10px' : '8px',
              borderRadius: '50%',
              background: activeIndex === idx ? '#ea580c' : '#cbd5e1',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
