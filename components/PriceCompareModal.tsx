'use client';

interface Props {
  open: boolean;
  itemName: string;
  productName: string;
  onClose: () => void;
}

const SITES = [
  {
    name: '쿠팡',
    bg: 'bg-orange-500 hover:bg-orange-600',
    url: (q: string) => `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: '다나와',
    bg: 'bg-blue-500 hover:bg-blue-600',
    url: (q: string) => `https://search.danawa.com/dsearch.php?query=${encodeURIComponent(q)}`,
  },
  {
    name: '네이버쇼핑',
    bg: 'bg-green-500 hover:bg-green-600',
    url: (q: string) => `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(q)}`,
  },
];

export default function PriceCompareModal({ open, itemName, productName, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-80 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-1 text-xs text-pink-400 font-medium">{itemName}</div>
        <div className="mb-5 text-base font-bold text-gray-800">{productName}</div>

        <div className="flex flex-col gap-3">
          {SITES.map(site => (
            <a
              key={site.name}
              href={site.url(productName)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${site.bg} text-white text-center py-3 rounded-xl font-semibold transition-colors block`}
              onClick={onClose}
            >
              {site.name}에서 검색
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
