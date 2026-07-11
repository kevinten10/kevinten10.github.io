'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useI18n } from '@/providers/I18nProvider';
import SectionHeader from '@/components/ui/SectionHeader';

type Filter = 'all' | 'professional' | 'life';

const GALLERY_ITEMS = [
  // Professional
  { src: '/images/AI/492f185856e5c348ebf30d345c158d5f.jpg', alt: 'AI 技术集团分享现场', category: 'professional' as const, subcategory: 'AI' },
  { src: '/images/AI/f160727cd6cf8bbaa3c8d326b933e9b8.jpg', alt: 'AI 工程化实践演示', category: 'professional' as const, subcategory: 'AI' },
  { src: '/images/开源/73615586263df331e203145b3f51aab1.jpg', alt: 'Dapr 社区开源贡献截图', category: 'professional' as const, subcategory: '开源' },
  { src: '/images/演讲/bcb4c2ac2aea6e9a1e96722a744b3e38.png', alt: 'Reactive 技术分享演讲', category: 'professional' as const, subcategory: '演讲' },
  { src: '/images/演讲/da495398908dfd9a77bc8314d93e952e.png', alt: '技术团队内部分享交流', category: 'professional' as const, subcategory: '演讲' },
  { src: '/images/荣誉/2f6bdb18c917b5dc59d1e41681ad29d2.jpg', alt: 'Hackathon 金奖荣誉证书', category: 'professional' as const, subcategory: '荣誉' },
  { src: '/images/荣誉/beb61123bd66c408fa7a52abf2dd50f1.jpg', alt: '集团年度程果奖证明', category: 'professional' as const, subcategory: '荣誉' },
  { src: '/images/社区/8df44d799f41a50fefce9e09bdee1fa0.jpg', alt: '开源社区线下 Meetup', category: 'professional' as const, subcategory: '社区' },
  { src: '/images/社区/ecc064bdffd07e4d69e859d3520d7bf9.jpg', alt: '技术兴趣小组讨论', category: 'professional' as const, subcategory: '社区' },
  { src: '/images/社区/efafd736efcbb3323e3c3574843e9c0e.jpg', alt: '开发者社区聚会合影', category: 'professional' as const, subcategory: '社区' },
  { src: '/images/社区/f613513d2e40cf08031ef179c17ba8a2.jpg', alt: '开源项目社区活动', category: 'professional' as const, subcategory: '社区' },
  // Life
  { src: '/images/旅游/0174c0f80ef595d33b027b8eec84e1ef.jpg', alt: '旅途中的风景记录', category: 'life' as const, subcategory: '旅游' },
  { src: '/images/旅游/9f7787d40f3fa54ecafeabf98ebd9e00.jpg', alt: '自然风光摄影作品', category: 'life' as const, subcategory: '旅游' },
  { src: '/images/生活/25606e1f433a72da01775935bb07144d.jpg', alt: '日常生活精彩瞬间', category: 'life' as const, subcategory: '生活' },
  { src: '/images/生活/7a75083a198e8fdc998406c38f9a923b.jpg', alt: '休闲时光随拍', category: 'life' as const, subcategory: '生活' },
  { src: '/images/兴趣爱好/8068ac64f47e8b18b4244575079f8223.jpg', alt: 'ADV 摩托车骑行', category: 'life' as const, subcategory: '兴趣爱好' },
  { src: '/images/兴趣爱好/c368502ca2ec1ad401a902d168ad1b6c.jpg', alt: '3D 打印创作作品', category: 'life' as const, subcategory: '兴趣爱好' },
  { src: '/images/兴趣爱好/cd2c679400e85ceda65c4b77b1bca059.jpg', alt: 'DJ 音乐制作现场', category: 'life' as const, subcategory: '兴趣爱好' },
  { src: '/images/活动/237122cd20b4c56f44c046a1ee677d8a.jpg', alt: '团队户外拓展活动', category: 'life' as const, subcategory: '活动' },
  { src: '/images/活动/ba0ff03d1b18b561de7c676fac5f6739.jpg', alt: '公司年度团建合影', category: 'life' as const, subcategory: '活动' },
  { src: '/images/主持/1cdeed8cea8f6f699be8e38acc15661a.jpg', alt: '校友企业家协会主持', category: 'life' as const, subcategory: '主持' },
  { src: '/images/主持/5b8b288b76dfd804cc44f85b0979313e.jpg', alt: '大型活动主持现场', category: 'life' as const, subcategory: '主持' },
];

const FILTERS: { key: Filter; i18nKey: string; default: string }[] = [
  { key: 'all', i18nKey: 'gallery.all', default: '全部' },
  { key: 'professional', i18nKey: 'gallery.professional', default: '专业' },
  { key: 'life', i18nKey: 'gallery.life', default: '生活' },
];

export default function GallerySection() {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const filteredItems = activeFilter === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(item => item.category === activeFilter);

  const handleFilterClick = useCallback((filter: Filter) => {
    setActiveFilter(filter);
    setLightboxIdx(null);
  }, []);

  const openLightbox = useCallback((idx: number) => {
    setLightboxIdx(idx);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIdx(null);
  }, []);

  const navigateLightbox = useCallback((direction: 1 | -1) => {
    setLightboxIdx(prev => {
      if (prev === null) return null;
      const next = prev + direction;
      if (next < 0) return filteredItems.length - 1;
      if (next >= filteredItems.length) return 0;
      return next;
    });
  }, [filteredItems.length]);

  const lightboxItem = lightboxIdx !== null ? filteredItems[lightboxIdx] : null;

  return (
    <section className="section section-spacious gallery-section" id="gallery">
      <div className="container">
        <SectionHeader idx="09" title={t('gallery.title', '相册')} description={t('gallery.desc', '记录技术成长与生活点滴')} />

        <div className="gallery-filter">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`filter-btn${activeFilter === f.key ? ' active' : ''}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {t(f.i18nKey, f.default)}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {filteredItems.map((item, idx) => (
            <div
              key={item.src}
              className="gallery-item"
              data-category={item.category}
              data-subcategory={item.subcategory}
              onClick={() => openLightbox(idx)}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 280px"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div className="lightbox-overlay active" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">✕</button>
            <button className="lightbox-prev" onClick={() => navigateLightbox(-1)} aria-label="Previous">‹</button>
            <Image
              src={lightboxItem.src}
              alt={lightboxItem.alt}
              className="lightbox-image"
              width={1600}
              height={1200}
              sizes="90vw"
            />
            <button className="lightbox-next" onClick={() => navigateLightbox(1)} aria-label="Next">›</button>
          </div>
        </div>
      )}
    </section>
  );
}
